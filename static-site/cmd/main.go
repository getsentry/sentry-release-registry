package main

import (
	"log"
	"os"
	"sync"
	"time"
)

func (ssg *StaticSiteGenerator) Build() error {
	log.Println("Starting static site generation...")
	start := time.Now()

	// Clean output directory
	if err := os.RemoveAll(ssg.outputPath); err != nil {
		return err
	}
	if err := os.MkdirAll(ssg.outputPath, 0755); err != nil {
		return err
	}

	tasks := []func() error{
		ssg.generatePackages,
		ssg.generateSDKs,
		ssg.generateApps,
		ssg.generateAWSLambdaLayers,
		ssg.generateMarketingSlugs,
	}

	var wg sync.WaitGroup
	errChan := make(chan error, len(tasks))

	for _, task := range tasks {
		wg.Add(1)
		go func(fn func() error) {
			defer wg.Done()
			if err := fn(); err != nil {
				errChan <- err
			}
		}(task)
	}

	wg.Wait()
	close(errChan)

	for err := range errChan {
		if err != nil {
			return err
		}
	}

	duration := time.Since(start)
	log.Printf("Static site generation completed in %v", duration)

	return nil
}

func main() {
	rootPath := "../.."
	outputPath := "../dist"

	ssg := NewStaticSiteGenerator(rootPath, outputPath)

	if err := ssg.Build(); err != nil {
		log.Fatalf("Initial build failed: %v", err)
	}

	log.Printf("Static site generated in %s", outputPath)
}
