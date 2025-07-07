package main

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type StaticSiteGenerator struct {
	rootPath   string
	outputPath string
}

func NewStaticSiteGenerator(rootPath, outputPath string) *StaticSiteGenerator {
	return &StaticSiteGenerator{
		rootPath:   rootPath,
		outputPath: outputPath,
	}
}

func (ssg *StaticSiteGenerator) writeJSON(path string, data interface{}) error {
	outputPath := filepath.Join(ssg.outputPath, path)

	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return err
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	return os.WriteFile(outputPath, jsonData, 0644)
}
