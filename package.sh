#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd)
cd "$SCRIPT_DIR"

VERSION=$(
  /usr/bin/sed -nE \
    's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' \
    manifest.json |
    /usr/bin/head -n 1
)
if [ -z "$VERSION" ]; then
  echo "Could not read the extension version from manifest.json." >&2
  exit 1
fi

OUTPUT_DIR="$SCRIPT_DIR/dist"
ARCHIVE="$OUTPUT_DIR/web-tldr-$VERSION.zip"

if [ ! -f package-files.txt ]; then
  echo "Missing package file list: package-files.txt" >&2
  exit 1
fi

set --
while IFS= read -r REQUIRED_PATH || [ -n "$REQUIRED_PATH" ]; do
  case "$REQUIRED_PATH" in
    ''|'#'*) continue ;;
  esac
  if [ ! -e "$REQUIRED_PATH" ]; then
    echo "Missing required package file: $REQUIRED_PATH" >&2
    exit 1
  fi
  set -- "$@" "$REQUIRED_PATH"
done < package-files.txt

/bin/mkdir -p "$OUTPUT_DIR"
/bin/rm -f "$ARCHIVE"
/usr/bin/zip -X -q -r "$ARCHIVE" "$@" \
  -x '*/.DS_Store' \
  '*/._*' \
  '*/.AppleDouble' \
  '*/.AppleDouble/*' \
  '*/.LSOverride' \
  '*/__MACOSX' \
  '*/__MACOSX/*'

echo "Created $ARCHIVE"
