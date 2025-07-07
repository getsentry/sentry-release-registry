package main

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
)

var outputPath = "./dist"

func ServeHTTP(w http.ResponseWriter, r *http.Request) {
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
		// Handle package endpoints: packages/npm:react/latest -> packages/npm/react/latest.json
		parts := strings.Split(path, "/")
		if len(parts) >= 3 {
			// URL decode the canonical part
			canonical, err := url.QueryUnescape(parts[1])
			if err != nil {
				canonical = parts[1] // fallback to non-decoded
			}
			version := parts[2]

			// Split canonical into registry and package name
			canonicalParts := strings.SplitN(canonical, ":", 2)
			if len(canonicalParts) == 2 {
				registry := canonicalParts[0]
				packageName := canonicalParts[1]

				if version == "versions" {
					filePath = fmt.Sprintf("packages/%s/%s/versions.json", registry, packageName)
				} else {
					filePath = fmt.Sprintf("packages/%s/%s/%s.json", registry, packageName, version)
				}
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
	} else if strings.HasPrefix(path, "apps/") && !strings.HasSuffix(path, ".json") {
		// Handle app endpoints: apps/sentry-cli/latest -> apps/sentry-cli/latest.json
		parts := strings.Split(path, "/")
		if len(parts) >= 3 {
			appID := parts[1]
			version := parts[2]
			filePath = fmt.Sprintf("apps/%s/%s.json", appID, version)
		}
	} else if strings.HasPrefix(path, "marketing-slugs/") && !strings.HasSuffix(path, ".json") {
		// Handle marketing slug endpoints: marketing-slugs/react -> marketing-slugs/react.json
		parts := strings.Split(path, "/")
		if len(parts) >= 2 {
			slug := parts[1]
			filePath = fmt.Sprintf("marketing-slugs/%s.json", slug)
		}
	} else if !strings.HasSuffix(path, ".json") {
		// Add .json extension for other endpoints
		filePath = path + ".json"
	} else {
		filePath = path
	}

	// Serve the file
	fullPath := filepath.Join(outputPath, filePath)

	data, err := os.ReadFile(fullPath)
	if err != nil {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	w.Write(data)
}

func main() {
	http.Handle("/", http.HandlerFunc(ServeHTTP))

	log.Printf("Serving from: %s", outputPath)
	log.Printf("Static site server running on port http://localhost:8080")

	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
