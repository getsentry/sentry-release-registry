package main

import (
	"encoding/json"
	"os"
	"path/filepath"
)

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
	// Configuration options
	parallel   bool
	maxWorkers int
}

func NewStaticSiteGenerator(rootPath, outputPath string) *StaticSiteGenerator {
	return &StaticSiteGenerator{
		rootPath:   rootPath,
		outputPath: outputPath,
		cache:      make(map[string]interface{}),
		parallel:   true, // Default to parallel mode
		maxWorkers: 5,    // Default to 5 concurrent workers
	}
}

// SetParallel configures whether to run generation in parallel
func (ssg *StaticSiteGenerator) SetParallel(parallel bool) *StaticSiteGenerator {
	ssg.parallel = parallel
	return ssg
}

// SetMaxWorkers configures the maximum number of concurrent workers
func (ssg *StaticSiteGenerator) SetMaxWorkers(workers int) *StaticSiteGenerator {
	if workers > 0 {
		ssg.maxWorkers = workers
	}
	return ssg
}

func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
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
