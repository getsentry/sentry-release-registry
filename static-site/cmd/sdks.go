package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
)

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

func (ssg *StaticSiteGenerator) generateSDKs() error {
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

	return nil
}