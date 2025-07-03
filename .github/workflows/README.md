# GitHub Actions Workflows

This directory contains CI/CD workflows for the release-registry project.

## `build-ssg.yml` - Static Site Generator Build

Builds and tests the Go-based static site generator in the `api-server/` directory.

### Triggers
- **Push** to `main`/`master` branch when `api-server/` files change
- **Pull Requests** to `main`/`master` branch when `api-server/` files change

### Jobs

#### 1. `build` - Main Build and Test
- ✅ Sets up Go 1.22
- ✅ Downloads and verifies dependencies
- ✅ Builds the static site generator
- ✅ Tests static site generation (processes packages, SDKs, apps, etc.)
- ✅ Validates generated JSON files
- ✅ Tests HTTP server startup and API endpoints
- ✅ Builds optimized production binary
- ✅ Runs `go vet` for code quality
- ✅ Uploads build artifacts

#### 2. `build-matrix` - Cross-platform Builds
Builds binaries for multiple platforms:
- **Linux**: amd64, arm64
- **macOS (Darwin)**: amd64, arm64  
- **Windows**: amd64

#### 3. `docker-build` - Docker Integration
- ✅ Builds Docker image using `Dockerfile.new`
- ✅ Tests container startup and API endpoints
- ✅ Reports image size

### Artifacts

The workflow uploads several artifacts:
- `ssg-binaries` - Development and production binaries
- `generated-site` - Complete generated static site
- `ssg-{os}-{arch}` - Cross-platform binaries

### Performance Validation

The workflow validates:
- **Build Speed**: Complete build in <1 minute
- **Generation Speed**: Static site generation in <30 seconds
- **Content Quality**: Validates JSON structure and file counts
- **API Compatibility**: Tests actual HTTP endpoints
- **Docker Functionality**: End-to-end container testing

### Usage

Add a build status badge to your README:

```markdown
![Build Status](https://github.com/getsentry/release-registry/workflows/Build%20Static%20Site%20Generator/badge.svg)
```

The workflow automatically runs on every relevant change, ensuring the static site generator remains functional and performant.