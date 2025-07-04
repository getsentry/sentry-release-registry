package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"golang.org/x/mod/semver"
)

type PackageInfo struct {
	Name        string `json:"name"`
	Canonical   string `json:"canonical"`
	Version     string `json:"version"`
	PackageURL  string `json:"package_url,omitempty"`
	RepoURL     string `json:"repo_url,omitempty"`
	MainDocsURL string `json:"main_docs_url,omitempty"`
	CreatedAt   string `json:"created_at,omitempty"`
	SDKID       string `json:"sdk_id,omitempty"`
}

type VersionsResponse struct {
	Latest   *PackageInfo `json:"latest"`
	Versions []string     `json:"versions"`
}

type MarketingSlugResponse struct {
	Definition map[string]interface{} `json:"definition"`
	Target     interface{}            `json:"target"`
}

type StaticSiteGenerator struct {
	rootPath   string
	outputPath string
	cache      map[string]interface{}
	mu         sync.RWMutex
}

func NewStaticSiteGenerator(rootPath, outputPath string) *StaticSiteGenerator {
	return &StaticSiteGenerator{
		rootPath:   rootPath,
		outputPath: outputPath,
		cache:      make(map[string]interface{}),
	}
}

func (ssg *StaticSiteGenerator) loadPackage(canonical, version string) (*PackageInfo, error) {
	if !strings.Contains(canonical, ":") {
		return nil, fmt.Errorf("invalid canonical format")
	}

	parts := strings.SplitN(canonical, ":", 2)
	registry := parts[0]
	packagePath := strings.ReplaceAll(parts[1], ":", "/")

	filePath := filepath.Join(ssg.rootPath, "packages", registry, packagePath, version+".json")

	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	var pkg PackageInfo
	if err := json.Unmarshal(data, &pkg); err != nil {
		return nil, err
	}

	return &pkg, nil
}

func (ssg *StaticSiteGenerator) getPackageVersions(canonical string) ([]string, error) {
	if !strings.Contains(canonical, ":") {
		return nil, fmt.Errorf("invalid canonical format")
	}

	parts := strings.SplitN(canonical, ":", 2)
	registry := parts[0]
	packagePath := strings.ReplaceAll(parts[1], ":", "/")

	dirPath := filepath.Join(ssg.rootPath, "packages", registry, packagePath)

	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return nil, err
	}

	var versions []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".json") {
			version := strings.TrimSuffix(entry.Name(), ".json")
			if version != "latest" {
				versions = append(versions, version)
			}
		}
	}

	// Sort versions using semantic versioning
	sort.Slice(versions, func(i, j int) bool {
		return semver.Compare("v"+versions[i], "v"+versions[j]) < 0
	})

	return versions, nil
}

func (ssg *StaticSiteGenerator) iterPackages() ([]string, error) {
	packagesDir := filepath.Join(ssg.rootPath, "packages")
	var packages []string

	registries, err := os.ReadDir(packagesDir)
	if err != nil {
		return nil, err
	}

	for _, registry := range registries {
		if !registry.IsDir() {
			continue
		}

		registryPath := filepath.Join(packagesDir, registry.Name())
		items, err := os.ReadDir(registryPath)
		if err != nil {
			continue
		}

		for _, item := range items {
			if !item.IsDir() {
				continue
			}

			// Check if this is a namespace
			namespacePath := filepath.Join(registryPath, item.Name(), "__NAMESPACE__")
			if _, err := os.Stat(namespacePath); err == nil {
				// This is a namespace, iterate its contents
				namespaceItems, err := os.ReadDir(filepath.Join(registryPath, item.Name()))
				if err != nil {
					continue
				}

				for _, subItem := range namespaceItems {
					if subItem.Name() != "__NAMESPACE__" && subItem.IsDir() {
						packages = append(packages, fmt.Sprintf("%s:%s/%s", registry.Name(), item.Name(), subItem.Name()))
					}
				}
			} else {
				// Regular package
				packages = append(packages, fmt.Sprintf("%s:%s", registry.Name(), item.Name()))
			}
		}
	}

	return packages, nil
}

func (ssg *StaticSiteGenerator) getAllPackages() (map[string]*PackageInfo, error) {
	packages, err := ssg.iterPackages()
	if err != nil {
		return nil, err
	}

	result := make(map[string]*PackageInfo)
	for _, canonical := range packages {
		pkg, err := ssg.loadPackage(canonical, "latest")
		if err != nil {
			log.Printf("Warning: Could not load package %s: %v", canonical, err)
			continue
		}
		result[canonical] = pkg
	}

	return result, nil
}

func (ssg *StaticSiteGenerator) getAllSDKs() (map[string]*PackageInfo, error) {
	sdksDir := filepath.Join(ssg.rootPath, "sdks")
	result := make(map[string]*PackageInfo)

	entries, err := os.ReadDir(sdksDir)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		latestPath := filepath.Join(sdksDir, entry.Name(), "latest.json")
		data, err := os.ReadFile(latestPath)
		if err != nil {
			log.Printf("Warning: Could not read SDK %s: %v", entry.Name(), err)
			continue
		}

		var sdkData map[string]interface{}
		if err := json.Unmarshal(data, &sdkData); err != nil {
			continue
		}

		canonical, ok := sdkData["canonical"].(string)
		if !ok {
			continue
		}

		pkg, err := ssg.loadPackage(canonical, "latest")
		if err != nil {
			log.Printf("Warning: Could not load SDK package %s: %v", canonical, err)
			continue
		}

		pkg.SDKID = entry.Name()
		result[entry.Name()] = pkg
	}

	return result, nil
}

func (ssg *StaticSiteGenerator) getAllApps() (map[string]interface{}, error) {
	appsDir := filepath.Join(ssg.rootPath, "apps")
	result := make(map[string]interface{})

	entries, err := os.ReadDir(appsDir)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		latestPath := filepath.Join(appsDir, entry.Name(), "latest.json")
		data, err := os.ReadFile(latestPath)
		if err != nil {
			continue
		}

		var appData map[string]interface{}
		if err := json.Unmarshal(data, &appData); err != nil {
			continue
		}

		result[entry.Name()] = appData
	}

	return result, nil
}

func (ssg *StaticSiteGenerator) getAWSLambdaLayers() (map[string]interface{}, error) {
	layersDir := filepath.Join(ssg.rootPath, "aws-lambda-layers")
	result := make(map[string]interface{})

	entries, err := os.ReadDir(layersDir)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		latestPath := filepath.Join(layersDir, entry.Name(), "latest.json")
		data, err := os.ReadFile(latestPath)
		if err != nil {
			continue
		}

		var layerData map[string]interface{}
		if err := json.Unmarshal(data, &layerData); err != nil {
			continue
		}

		canonical, ok := layerData["canonical"].(string)
		if ok {
			result[canonical] = layerData
		}
	}

	return result, nil
}

func (ssg *StaticSiteGenerator) getMarketingSlugs() (map[string]interface{}, error) {
	slugsPath := filepath.Join(ssg.rootPath, "misc", "marketing-slugs.json")
	data, err := os.ReadFile(slugsPath)
	if err != nil {
		return nil, err
	}

	var slugs map[string]interface{}
	if err := json.Unmarshal(data, &slugs); err != nil {
		return nil, err
	}

	return slugs, nil
}

func (ssg *StaticSiteGenerator) writeJSON(path string, data interface{}) error {
	outputPath := filepath.Join(ssg.outputPath, path)

	// Create directory if it doesn't exist
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return err
	}

	file, err := os.Create(outputPath)
	if err != nil {
		return err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	return encoder.Encode(data)
}

func (ssg *StaticSiteGenerator) Build() error {
	log.Println("Starting static site generation...")
	start := time.Now()

	// Clean output directory
	if err := os.RemoveAll(ssg.outputPath); err != nil {
		return err
	}
	if err := os.MkdirAll(ssg.outputPath, 0755); err != nil {
		return err
	}

	// Generate all packages summary
	log.Println("Generating packages...")
	packages, err := ssg.getAllPackages()
	if err != nil {
		return fmt.Errorf("failed to get all packages: %w", err)
	}
	if err := ssg.writeJSON("packages.json", packages); err != nil {
		return err
	}

	// Generate individual package endpoints
	packageCount := 0
	for canonical := range packages {
		// Package version endpoint
		pkg, err := ssg.loadPackage(canonical, "latest")
		if err != nil {
			continue
		}

		escapedCanonical := strings.ReplaceAll(canonical, ":", "__COLON__")
		escapedCanonical = strings.ReplaceAll(escapedCanonical, "/", "__SLASH__")

		if err := ssg.writeJSON(fmt.Sprintf("packages/%s/latest.json", escapedCanonical), pkg); err != nil {
			log.Printf("Warning: Failed to write package %s: %v", canonical, err)
			continue
		}

		// Package versions endpoint
		versions, err := ssg.getPackageVersions(canonical)
		if err != nil {
			continue
		}

		versionsResp := VersionsResponse{
			Latest:   pkg,
			Versions: versions,
		}
		if err := ssg.writeJSON(fmt.Sprintf("packages/%s/versions.json", escapedCanonical), versionsResp); err != nil {
			log.Printf("Warning: Failed to write package versions %s: %v", canonical, err)
			continue
		}

		packageCount++
	}

	// Generate SDKs
	log.Println("Generating SDKs...")
	sdks, err := ssg.getAllSDKs()
	if err != nil {
		return fmt.Errorf("failed to get all SDKs: %w", err)
	}
	if err := ssg.writeJSON("sdks.json", sdks); err != nil {
		return err
	}

	// Generate individual SDK endpoints
	for sdkID, pkg := range sdks {
		if err := ssg.writeJSON(fmt.Sprintf("sdks/%s/latest.json", sdkID), pkg); err != nil {
			log.Printf("Warning: Failed to write SDK %s: %v", sdkID, err)
			continue
		}

		versions, err := ssg.getPackageVersions(pkg.Canonical)
		if err != nil {
			continue
		}

		versionsResp := VersionsResponse{
			Latest:   pkg,
			Versions: versions,
		}
		if err := ssg.writeJSON(fmt.Sprintf("sdks/%s/versions.json", sdkID), versionsResp); err != nil {
			log.Printf("Warning: Failed to write SDK versions %s: %v", sdkID, err)
		}
	}

	// Generate apps
	log.Println("Generating apps...")
	apps, err := ssg.getAllApps()
	if err != nil {
		return fmt.Errorf("failed to get all apps: %w", err)
	}
	if err := ssg.writeJSON("apps.json", apps); err != nil {
		return err
	}

	// Generate AWS Lambda layers
	log.Println("Generating AWS Lambda layers...")
	layers, err := ssg.getAWSLambdaLayers()
	if err != nil {
		return fmt.Errorf("failed to get AWS Lambda layers: %w", err)
	}
	if err := ssg.writeJSON("aws-lambda-layers.json", layers); err != nil {
		return err
	}

	// Generate marketing slugs
	log.Println("Generating marketing slugs...")
	slugsData, err := ssg.getMarketingSlugs()
	if err != nil {
		return fmt.Errorf("failed to get marketing slugs: %w", err)
	}

	slugs := make([]string, 0, len(slugsData))
	for slug := range slugsData {
		slugs = append(slugs, slug)
	}
	sort.Strings(slugs)

	if err := ssg.writeJSON("marketing-slugs.json", map[string][]string{"slugs": slugs}); err != nil {
		return err
	}

	// Generate health check
	if err := ssg.writeJSON("healthz.json", map[string]string{"status": "ok"}); err != nil {
		return err
	}

	duration := time.Since(start)
	log.Printf("Static site generation completed in %v", duration)
	log.Printf("Generated %d packages, %d SDKs, %d apps, %d lambda layers",
		packageCount, len(sdks), len(apps), len(layers))

	return nil
}

func (ssg *StaticSiteGenerator) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Add CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")

	// Map request path to file path
	path := strings.TrimPrefix(r.URL.Path, "/")
	if path == "" {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	// Special handling for healthz
	if path == "healthz" {
		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte("ok\n"))
		return
	}

	// Convert dynamic paths to static file paths
	var filePath string

	if strings.HasPrefix(path, "packages/") && !strings.HasSuffix(path, ".json") {
		// Handle package endpoints: packages/npm:react/latest -> packages/npm__COLON__react/latest.json
		parts := strings.Split(path, "/")
		if len(parts) >= 3 {
			canonical := parts[1]
			version := parts[2]

			escapedCanonical := strings.ReplaceAll(canonical, ":", "__COLON__")
			escapedCanonical = strings.ReplaceAll(escapedCanonical, "/", "__SLASH__")

			if version == "versions" {
				filePath = fmt.Sprintf("packages/%s/versions.json", escapedCanonical)
			} else {
				filePath = fmt.Sprintf("packages/%s/%s.json", escapedCanonical, version)
			}
		}
	} else if strings.HasPrefix(path, "sdks/") && !strings.HasSuffix(path, ".json") {
		// Handle SDK endpoints: sdks/react/latest -> sdks/react/latest.json
		parts := strings.Split(path, "/")
		if len(parts) >= 3 {
			sdkID := parts[1]
			version := parts[2]

			if version == "versions" {
				filePath = fmt.Sprintf("sdks/%s/versions.json", sdkID)
			} else {
				filePath = fmt.Sprintf("sdks/%s/%s.json", sdkID, version)
			}
		}
	} else if !strings.HasSuffix(path, ".json") {
		// Add .json extension for other endpoints
		filePath = path + ".json"
	} else {
		filePath = path
	}

	// Serve the file
	fullPath := filepath.Join(ssg.outputPath, filePath)

	data, err := os.ReadFile(fullPath)
	if err != nil {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	w.Write(data)
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Check if we should build or serve
	buildOnly := false
	if len(os.Args) > 1 && os.Args[1] == "build" {
		buildOnly = true
	}

	rootPath := ".."
	if len(os.Args) > 1 && os.Args[1] != "build" {
		rootPath = os.Args[1]
	} else if len(os.Args) > 2 {
		rootPath = os.Args[2]
	}

	outputPath := "./dist"
	if len(os.Args) > 2 && os.Args[1] != "build" {
		outputPath = os.Args[2]
	} else if len(os.Args) > 3 {
		outputPath = os.Args[3]
	}

	ssg := NewStaticSiteGenerator(rootPath, outputPath)

	if buildOnly {
		if err := ssg.Build(); err != nil {
			log.Fatalf("Build failed: %v", err)
		}
		return
	}

	// Build first
	if err := ssg.Build(); err != nil {
		log.Fatalf("Initial build failed: %v", err)
	}

	// Set up HTTP server using standard library
	http.Handle("/", ssg)

	log.Printf("Static site server starting on port %s", port)
	log.Printf("Serving from: %s", outputPath)

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
