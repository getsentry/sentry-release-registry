package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"golang.org/x/mod/semver"
)

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

func (ssg *StaticSiteGenerator) generatePackages() error {
	log.Println("Generating packages...")
	packages, err := ssg.getAllPackages()
	if err != nil {
		return fmt.Errorf("failed to get all packages: %w", err)
	}
	if err := ssg.writeJSON("packages.json", packages); err != nil {
		return err
	}

	// Generate individual package endpoints
	for canonical := range packages {
		// Package version endpoint
		pkg, err := ssg.loadPackage(canonical, "latest")
		if err != nil {
			continue
		}

		// Split canonical into registry and package name
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
	}

	return nil
}