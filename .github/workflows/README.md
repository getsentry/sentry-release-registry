# GitHub Actions Workflows

This directory contains CI/CD workflows for the release-registry project.

## `build-ssg.yml` - Static Site Generation

Generates and uploads the static site using the Go-based static site generator in the `api-server/` directory.

### Triggers
- **Push** to `main`/`master` branch when `api-server/` files change
- **Pull Requests** to `main`/`master` branch when `api-server/` files change

### Job: `generate` - Generate and Upload Static Site

The workflow performs the following steps:
- ✅ Sets up Go 1.22 with dependency caching
- ✅ Downloads and verifies Go module dependencies
- ✅ Builds the static site generator binary
- ✅ Generates the complete static site
- ✅ Validates generated JSON files and content structure
- ✅ Runs code quality checks (`go vet`, `go fmt`)
- ✅ Tests basic functionality with quick health check
- ✅ Uploads generated static site as artifact

### Artifacts

The workflow uploads:
- `static-site` - Complete generated static site (30-day retention)

### Content Validation

The workflow validates:
- **JSON Structure**: Verifies all endpoint files are valid JSON
- **Content Completeness**: Checks packages, apps, lambda layers, and marketing slugs
- **File Generation**: Ensures expected number of package directories created
- **Basic Functionality**: Quick health check to verify the generator works

### Generation Stats

The workflow reports:
- Total files generated
- Total size of generated content
- Number of packages, apps, lambda layers, and marketing slugs processed

### Usage

Add a build status badge to your README:

```markdown
![Build Status](https://github.com/getsentry/release-registry/workflows/Generate%20Static%20Site/badge.svg)
```

The generated static site is automatically uploaded as an artifact and can be downloaded for deployment or testing purposes.