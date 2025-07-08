package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/pmezard/go-difflib/difflib"
	"github.com/spf13/cobra"
)

// ANSI color codes
const (
	Reset  = "\033[0m"
	Red    = "\033[31m"
	Green  = "\033[32m"
	Yellow = "\033[33m"
	Blue   = "\033[34m"
	Purple = "\033[35m"
	Cyan   = "\033[36m"
	Gray   = "\033[37m"
	Bold   = "\033[1m"
)

var (
	endpoint string
	verbose  bool
)

var rootCmd = &cobra.Command{
	Use:   "endpoint-compare",
	Short: "Compare endpoints between release-registry and GCS",
	Long:  `Compare JSON responses from release-registry.services.sentry.io and storage.googleapis.com/release-registry-json-poc`,
	RunE:  runCompare,
}

func init() {
	rootCmd.Flags().StringVarP(&endpoint, "endpoint", "e", "", "Endpoint path to compare (required)")
	rootCmd.Flags().BoolVarP(&verbose, "verbose", "v", false, "Show detailed output")
	rootCmd.MarkFlagRequired("endpoint")
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

func runCompare(cmd *cobra.Command, args []string) error {
	endpoint = strings.TrimPrefix(endpoint, "/")

	sentryURL := fmt.Sprintf("https://release-registry.services.sentry.io/%s", endpoint)
	gcsURL := fmt.Sprintf("https://storage.googleapis.com/release-registry-json-poc/%s.json", endpoint)

	if verbose {
		fmt.Printf("Comparing:\n  Sentry: %s\n  GCS: %s\n\n", sentryURL, gcsURL)
	}

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	sentryData, err := fetchJSON(client, sentryURL)
	if err != nil {
		return fmt.Errorf("failed to fetch from Sentry: %w", err)
	}

	gcsData, err := fetchJSON(client, gcsURL)
	if err != nil {
		return fmt.Errorf("failed to fetch from GCS: %w", err)
	}

	sentryJSON, err := normalizeJSON(sentryData)
	if err != nil {
		return fmt.Errorf("failed to normalize Sentry JSON: %w", err)
	}

	gcsJSON, err := normalizeJSON(gcsData)
	if err != nil {
		return fmt.Errorf("failed to normalize GCS JSON: %w", err)
	}

	if sentryJSON == gcsJSON {
		fmt.Printf("%s✓ Endpoints match perfectly!%s\n", Green+Bold, Reset)
		return nil
	}

	fmt.Printf("%s✗ Endpoints differ%s\n\n", Red+Bold, Reset)

	// Show a simple summary first
	fmt.Printf("%sComparison Summary:%s\n", Bold, Reset)
	fmt.Printf("  %sSentry:%s %s\n", Blue, Reset, sentryURL)
	fmt.Printf("  %sGCS:%s    %s\n", Blue, Reset, gcsURL)
	fmt.Println()

	// Try to show a cleaner comparison
	sentryLines := strings.Split(sentryJSON, "\n")
	gcsLines := strings.Split(gcsJSON, "\n")

	fmt.Printf("%sDifferences:%s\n", Bold, Reset)
	fmt.Println(strings.Repeat("─", 60))

	// Find and show line-by-line differences
	maxLines := len(sentryLines)
	if len(gcsLines) > maxLines {
		maxLines = len(gcsLines)
	}

	diffCount := 0
	for i := 0; i < maxLines && diffCount < 20; i++ { // Limit to first 20 differences
		var sentryLine, gcsLine string

		if i < len(sentryLines) {
			sentryLine = sentryLines[i]
		}
		if i < len(gcsLines) {
			gcsLine = gcsLines[i]
		}

		if sentryLine != gcsLine {
			diffCount++
			fmt.Printf("%sLine %d:%s\n", Yellow, i+1, Reset)

			if sentryLine != "" {
				fmt.Printf("  %s- Sentry:%s %s\n", Red, Reset, sentryLine)
			}
			if gcsLine != "" {
				fmt.Printf("  %s+ GCS:%s    %s\n", Green, Reset, gcsLine)
			}
			fmt.Println()
		}
	}

	if diffCount >= 20 {
		fmt.Printf("%s... (showing first 20 differences)%s\n", Gray, Reset)
	}

	fmt.Printf("\n%sTotal differences found: %d%s\n", Bold, diffCount, Reset)

	if verbose {
		fmt.Printf("\n%sFull Diff (verbose):%s\n", Bold, Reset)
		fmt.Println(strings.Repeat("═", 60))

		diff := difflib.UnifiedDiff{
			A:        sentryLines,
			B:        gcsLines,
			FromFile: "sentry",
			ToFile:   "gcs",
			Context:  2,
		}

		diffText, err := difflib.GetUnifiedDiffString(diff)
		if err != nil {
			return fmt.Errorf("failed to generate diff: %w", err)
		}

		// Simple colorization for verbose mode
		lines := strings.Split(diffText, "\n")
		for _, line := range lines {
			if strings.HasPrefix(line, "+") && !strings.HasPrefix(line, "+++") {
				fmt.Printf("%s%s%s\n", Green, line, Reset)
			} else if strings.HasPrefix(line, "-") && !strings.HasPrefix(line, "---") {
				fmt.Printf("%s%s%s\n", Red, line, Reset)
			} else if strings.HasPrefix(line, "@") {
				fmt.Printf("%s%s%s\n", Cyan, line, Reset)
			} else if !strings.HasPrefix(line, "+++") && !strings.HasPrefix(line, "---") {
				fmt.Printf("%s%s%s\n", Gray, line, Reset)
			}
		}
	}

	return nil
}

func fetchJSON(client *http.Client, url string) ([]byte, error) {
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, resp.Status)
	}

	return io.ReadAll(resp.Body)
}

func normalizeJSON(data []byte) (string, error) {
	var v interface{}
	if err := json.Unmarshal(data, &v); err != nil {
		return "", err
	}

	normalized, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return "", err
	}

	return string(normalized), nil
}
