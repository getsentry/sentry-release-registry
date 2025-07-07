package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
)

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

func (ssg *StaticSiteGenerator) generateMarketingSlugs() error {
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

	return nil
}