package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"golang.org/x/mod/semver"
)

func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}

type PackageInfo struct {
	Name        string                 `json:"name,omitempty"`
	Canonical   string                 `json:"canonical"`
	Version     string                 `json:"version"`
	PackageURL  string                 `json:"package_url,omitempty"`
	RepoURL     string                 `json:"repo_url,omitempty"`
	MainDocsURL string                 `json:"main_docs_url,omitempty"`
	CreatedAt   string                 `json:"created_at,omitempty"`
	APIDocsURL  string                 `json:"api_docs_url,omitempty"`
	Categories  []string               `json:"categories,omitempty"`
	Features    map[string]interface{} `json:"features,omitempty"`
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

	var pkg map[string]interface{}
	if err := json.Unmarshal(data, &pkg); err != nil {
		return nil, err
	}

	// Convert map to PackageInfo struct
	result := &PackageInfo{
		Canonical:   getString(pkg, "canonical"),
		Version:     getString(pkg, "version"),
		Name:        getString(pkg, "name"),
		PackageURL:  getString(pkg, "package_url"),
		RepoURL:     getString(pkg, "repo_url"),
		MainDocsURL: getString(pkg, "main_docs_url"),
		CreatedAt:   getString(pkg, "created_at"),
		APIDocsURL:  getString(pkg, "api_docs_url"),
	}

	if categories, ok := pkg["categories"].([]interface{}); ok {
		result.Categories = make([]string, len(categories))
		for i, cat := range categories {
			if s, ok := cat.(string); ok {
				result.Categories[i] = s
			}
		}
	}

	if features, ok := pkg["features"].(map[string]interface{}); ok {
		result.Features = features
	}

	return result, nil
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

func (ssg *StaticSiteGenerator) getAllSDKs() (map[string]interface{}, error) {
	sdksDir := filepath.Join(ssg.rootPath, "sdks")
	result := make(map[string]interface{})

	entries, err := os.ReadDir(sdksDir)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		// Skip non-directory entries (symlinks are not considered directories by IsDir())
		// We need to check the file info of the symlink target
		entryPath := filepath.Join(sdksDir, entry.Name())
		fileInfo, err := os.Stat(entryPath)
		if err != nil {
			log.Printf("Warning: Could not stat SDK %s: %v", entry.Name(), err)
			continue
		}

		if !fileInfo.IsDir() {
			log.Printf("Warning: SDK %s is not a directory", entry.Name())
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

		// Load the package data as raw JSON
		parts := strings.SplitN(canonical, ":", 2)
		if len(parts) != 2 {
			continue
		}
		registry := parts[0]
		packagePath := strings.ReplaceAll(parts[1], ":", "/")

		pkgFilePath := filepath.Join(ssg.rootPath, "packages", registry, packagePath, "latest.json")
		pkgData, err := os.ReadFile(pkgFilePath)
		if err != nil {
			log.Printf("Warning: Could not load SDK package %s: %v", canonical, err)
			continue
		}

		var pkgJSON map[string]interface{}
		if err := json.Unmarshal(pkgData, &pkgJSON); err != nil {
			log.Printf("Warning: Could not parse SDK package %s: %v", canonical, err)
			continue
		}

		result[entry.Name()] = pkgJSON
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

func (ssg *StaticSiteGenerator) getAppVersions(appID string) ([]string, error) {
	appDir := filepath.Join(ssg.rootPath, "apps", appID)

	entries, err := os.ReadDir(appDir)
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

func (ssg *StaticSiteGenerator) loadApp(appID, version string) (map[string]interface{}, error) {
	appPath := filepath.Join(ssg.rootPath, "apps", appID, version+".json")

	data, err := os.ReadFile(appPath)
	if err != nil {
		return nil, err
	}

	var appData map[string]interface{}
	if err := json.Unmarshal(data, &appData); err != nil {
		return nil, err
	}

	return appData, nil
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

	// Marshal to compact JSON (no indentation)
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	return os.WriteFile(outputPath, jsonData, 0644)
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

		// Split canonical into registry and package name
		// e.g., "npm:@sentry/react" -> ["npm", "@sentry/react"]
		parts := strings.SplitN(canonical, ":", 2)
		if len(parts) != 2 {
			log.Printf("Warning: Invalid canonical format %s", canonical)
			continue
		}
		registry := parts[0]
		packageName := parts[1]

		// Create proper folder structure: packages/npm/@sentry/react/
		packagePath := fmt.Sprintf("packages/%s/%s", registry, packageName)

		if err := ssg.writeJSON(fmt.Sprintf("%s/latest.json", packagePath), pkg); err != nil {
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
		if err := ssg.writeJSON(fmt.Sprintf("%s/versions.json", packagePath), versionsResp); err != nil {
			log.Printf("Warning: Failed to write package versions %s: %v", canonical, err)
			continue
		}

		// Write individual version files for packages
		for _, version := range versions {
			versionPkg, err := ssg.loadPackage(canonical, version)
			if err != nil {
				log.Printf("Warning: Failed to load package version %s@%s: %v", canonical, version, err)
				continue
			}
			if err := ssg.writeJSON(fmt.Sprintf("%s/%s.json", packagePath, version), versionPkg); err != nil {
				log.Printf("Warning: Failed to write package version %s@%s: %v", canonical, version, err)
				continue
			}
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
	for sdkID, pkgData := range sdks {
		if err := ssg.writeJSON(fmt.Sprintf("sdks/%s/latest.json", sdkID), pkgData); err != nil {
			log.Printf("Warning: Failed to write SDK %s: %v", sdkID, err)
			continue
		}

		// Get canonical from package data to fetch versions
		pkgMap, ok := pkgData.(map[string]interface{})
		if !ok {
			continue
		}

		canonical, ok := pkgMap["canonical"].(string)
		if !ok {
			continue
		}

		versions, err := ssg.getPackageVersions(canonical)
		if err != nil {
			continue
		}

		// Convert to PackageInfo for the versions response
		pkg, err := ssg.loadPackage(canonical, "latest")
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

		// Write individual version files for SDKs
		for _, version := range versions {
			versionPkg, err := ssg.loadPackage(canonical, version)
			if err != nil {
				log.Printf("Warning: Failed to load SDK version %s@%s: %v", canonical, version, err)
				continue
			}
			if err := ssg.writeJSON(fmt.Sprintf("sdks/%s/%s.json", sdkID, version), versionPkg); err != nil {
				log.Printf("Warning: Failed to write SDK version %s@%s: %v", sdkID, version, err)
				continue
			}
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

	// Generate individual app endpoints
	for appID, appData := range apps {
		// Write latest version
		if err := ssg.writeJSON(fmt.Sprintf("apps/%s/latest.json", appID), appData); err != nil {
			log.Printf("Warning: Failed to write app %s: %v", appID, err)
			continue
		}

		// Get all versions for this app
		versions, err := ssg.getAppVersions(appID)
		if err != nil {
			log.Printf("Warning: Failed to get app versions %s: %v", appID, err)
			continue
		}

		// Write individual version files
		for _, version := range versions {
			versionData, err := ssg.loadApp(appID, version)
			if err != nil {
				log.Printf("Warning: Failed to load app version %s@%s: %v", appID, version, err)
				continue
			}
			if err := ssg.writeJSON(fmt.Sprintf("apps/%s/%s.json", appID, version), versionData); err != nil {
				log.Printf("Warning: Failed to write app version %s@%s: %v", appID, version, err)
				continue
			}
		}
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

	// Generate individual marketing slug endpoints
	for slug, definition := range slugsData {
		// Skip special keys like "createdAt"
		if slug == "createdAt" {
			continue
		}

		// The definition should be the actual slug data
		var slugResponse MarketingSlugResponse

		// Check if definition is a map
		if defMap, ok := definition.(map[string]interface{}); ok {
			slugResponse = MarketingSlugResponse{
				Definition: defMap,
				Target:     defMap["target"], // Extract target from definition
			}
		} else {
			// Skip if not a map (e.g., createdAt is a string)
			continue
		}

		if err := ssg.writeJSON(fmt.Sprintf("marketing-slugs/%s.json", slug), slugResponse); err != nil {
			log.Printf("Warning: Failed to write marketing slug %s: %v", slug, err)
			continue
		}
	}

	duration := time.Since(start)
	log.Printf("Static site generation completed in %v", duration)
	log.Printf("Generated %d packages, %d SDKs, %d apps, %d lambda layers",
		packageCount, len(sdks), len(apps), len(layers))

	return nil
}

func main() {
	rootPath := "../.."
	outputPath := "../dist"

	ssg := NewStaticSiteGenerator(rootPath, outputPath)

	if err := ssg.Build(); err != nil {
		log.Fatalf("Initial build failed: %v", err)
	}

	log.Printf("Static site generated in %s", outputPath)
}
