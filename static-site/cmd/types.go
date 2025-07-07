package main

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
