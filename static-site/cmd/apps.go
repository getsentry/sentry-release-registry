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

func (ssg *StaticSiteGenerator) generateApps() error {
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

	return nil
}