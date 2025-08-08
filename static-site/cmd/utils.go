package main

import (
	"os"
	"path/filepath"
	"time"
)

// getString safely extracts a string value from a map by key.
// Returns the string value if the key exists and the value is a string,
// otherwise returns an empty string.
func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}

// getFileModTime returns the modification time of a file.
// Returns zero time if the file doesn't exist.
func getFileModTime(filePath string) time.Time {
	info, err := os.Stat(filePath)
	if err != nil {
		return time.Time{}
	}
	return info.ModTime()
}

// isSourceNewer checks if any source file is newer than the target file.
// Returns true if any source file is newer or if target doesn't exist.
func isSourceNewer(targetPath string, sourcePaths ...string) bool {
	targetModTime := getFileModTime(targetPath)

	// If target doesn't exist, we need to build it
	if targetModTime.IsZero() {
		return true
	}

	// Check if any source file is newer than target
	for _, sourcePath := range sourcePaths {
		sourceModTime := getFileModTime(sourcePath)
		if !sourceModTime.IsZero() && sourceModTime.After(targetModTime) {
			return true
		}
	}

	return false
}

// isDirectoryNewer checks if any file in a directory is newer than the target file.
// Returns true if any file in the directory is newer or if target doesn't exist.
func isDirectoryNewer(targetPath, dirPath string) bool {
	targetModTime := getFileModTime(targetPath)

	// If target doesn't exist, we need to build it
	if targetModTime.IsZero() {
		return true
	}

	var newestSourceTime time.Time

	// Walk through all files in the directory
	err := filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // Skip files we can't access
		}

		if !info.IsDir() && info.ModTime().After(newestSourceTime) {
			newestSourceTime = info.ModTime()
		}

		return nil
	})

	if err != nil {
		return true // If we can't walk the directory, assume we need to rebuild
	}

	return newestSourceTime.After(targetModTime)
}
