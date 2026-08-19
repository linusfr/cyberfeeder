#!/bin/sh

set -e

# Which browser engine to build for. Firefox is the default, so `npm run build`
# behaves exactly as before; `npm run build:chromium` builds the MV3 variant.
TARGET="${TARGET:-firefox}"
if [ "$TARGET" != "firefox" ] && [ "$TARGET" != "chromium" ]; then
    echo "unknown TARGET '$TARGET', expected 'firefox' or 'chromium'" >&2
    exit 1
fi
echo "Building Cyberfeeder for $TARGET"

npm run lint
npm run clean
mkdir -p "./app/js"
for CONFIG_FILE in "./rollup"/*.js; do
    TARGET="$TARGET" rollup --config $CONFIG_FILE --bundleConfigAsCjs
done

cp "./manifests/$TARGET.json" "./app/manifest.json"

# dnf install sass
rm -rf "./app/css/*"
mkdir -p "./app/css"
sass ./app-sass/:./app/css --no-source-map

# cargo install toml2json
rm -rf "./app/data"
mkdir -p "./app/data"
for FILE in "./data"/*; do
    if [[ -f "$FILE" ]]; then
        BASENAME="$(basename $FILE)"
        NAME="${BASENAME%.*}"
        node ./scripts/toml2json.js "$FILE" > "./app/data/$NAME.json"
    fi
done
