package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
)

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

func (ssg *StaticSiteGenerator) generateAWSLambdaLayers() error {
	log.Println("Generating AWS Lambda layers...")
	layers, err := ssg.getAWSLambdaLayers()
	if err != nil {
		return fmt.Errorf("failed to get AWS Lambda layers: %w", err)
	}
	if err := ssg.writeJSON("aws-lambda-layers.json", layers); err != nil {
		return err
	}

	return nil
}