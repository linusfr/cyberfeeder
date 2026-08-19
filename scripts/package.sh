TARGET="${TARGET:-firefox}"
NAME="extension"
if [ "$TARGET" = "chromium" ]; then
    NAME="extension-chromium"
fi
mkdir -p ./build
cd app
zip -r "../build/$NAME.zip" ./*
