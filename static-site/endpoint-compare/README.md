# Endpoint Compare Tool

Compare JSON responses between release-registry.services.sentry.io and storage.googleapis.com/release-registry-json-poc.

## Installation

```bash
cd endpoint-compare
go mod download
go build
```

## Usage

```bash
./endpoint-compare -e <endpoint>
```

### Examples

```bash
# Compare root-level files
./endpoint-compare -e packages.json
./endpoint-compare -e sdks.json
./endpoint-compare -e apps.json

# Compare package endpoints
./endpoint-compare -e "packages/npm/@sentry/browser/latest.json"
./endpoint-compare -e "packages/npm/@sentry/browser/versions.json"
./endpoint-compare -e "packages/pypi/sentry-sdk/latest.json"

# Compare SDK endpoints
./endpoint-compare -e "sdks/sentry.javascript.browser/latest.json"
./endpoint-compare -e "sdks/sentry.python/versions.json"

# Compare app endpoints
./endpoint-compare -e "apps/sentry-cli/latest.json"
./endpoint-compare -e "apps/craft/latest.json"

# Compare marketing slugs
./endpoint-compare -e "marketing-slugs/javascript.json"
./endpoint-compare -e "marketing-slugs/python.json"

# Verbose output
./endpoint-compare -v -e packages.json
```

## Flags

- `-e, --endpoint`: Endpoint path to compare (required)
- `-v, --verbose`: Show detailed output including URLs being compared

## Exit Codes

- 0: No differences found
- 1: Error occurred or differences found