#!/bin/sh
set -e
mkdir -p "./tmp"
VERSION=$(npm list --json | jq -r ".version")
for JSON_PATH in ./manifests/*.json; do
    jq --arg v "$VERSION" '.version = $v' "$JSON_PATH" > "./tmp/manifest.json" && mv "./tmp/manifest.json" "$JSON_PATH"
    git add "$JSON_PATH"
done
git commit --amend --no-edit
echo "Version updated to $VERSION"
