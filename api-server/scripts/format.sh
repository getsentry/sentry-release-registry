#!/bin/bash

# Format Go code and check for issues
set -e

cd "$(dirname "$0")/.."

echo "🔧 Formatting Go code..."
go fmt ./...

echo "🔍 Running go vet..."
go vet ./...

echo "✅ Code formatting and static analysis complete!"

# Check if any files were changed
if [ -n "$(git diff --name-only)" ]; then
    echo ""
    echo "📝 The following files were formatted:"
    git diff --name-only
    echo ""
    echo "Please review the changes and commit them."
else
    echo "📋 No formatting changes needed."
fi