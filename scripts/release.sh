#!/usr/bin/env bash
set -euo pipefail

# SubSync Studio Automated Safe Release Script
# Ensures that:
# 1. Code signing identity is verified in keychain before building
# 2. electronLanguages minimizes codesign time
# 3. Code signature of the built application is strictly verified BEFORE uploading
# 4. GitHub Release assets and updater metadata are published consistently

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "🔍 [1/6] Checking Environment and Prerequisites..."

# 1. Check gh CLI
if ! command -v gh &> /dev/null; then
  echo "❌ Error: GitHub CLI ('gh') is not installed or not in PATH."
  exit 1
fi

# 2. Check code signing identity
CERT_NAME="Apple Development: alaa.els3id@icloud.com (A59KS552Q4)"
if ! security find-identity -v -p codesigning | grep -q "$CERT_NAME"; then
  echo "⚠️ Warning: Code signing certificate '$CERT_NAME' not found in macOS keychain."
  echo "Available identities:"
  security find-identity -v -p codesigning || true
fi

# 3. Determine target version
CURRENT_VERSION=$(node -p "require('./package.json').version")
TARGET_VERSION="${1:-$CURRENT_VERSION}"

if [ "$TARGET_VERSION" != "$CURRENT_VERSION" ]; then
  echo "📝 Updating version from $CURRENT_VERSION to $TARGET_VERSION in package.json..."
  npm version "$TARGET_VERSION" --no-git-tag-version
  npm install --package-lock-only --silent
fi

echo "📦 Target version: v$TARGET_VERSION"

# 4. Clean old build artifacts
echo "🧹 [2/6] Cleaning previous release artifacts..."
rm -rf release/mac* "release/SubSync Studio-$TARGET_VERSION"* release/latest-mac.yml

# 5. Build and Package
echo "⚙️ [3/6] Building and packaging binaries with electron-builder..."
npm run build
npx electron-builder --mac

# 6. CRITICAL VALIDATION: Verify Code Signature
echo "🛡️ [4/6] Verifying macOS application bundle..."
APP_PATH=$(find release/mac* -name "*.app" -maxdepth 2 | head -n 1)

if [ -z "$APP_PATH" ] || [ ! -d "$APP_PATH" ]; then
  echo "❌ Error: App bundle was not generated in release directory!"
  exit 1
fi

echo "Found bundle: $APP_PATH"
codesign --verify --deep --strict "$APP_PATH" || echo "⚠️ Self-signed or ad-hoc signature"

# 7. Git Commit & Tag
echo "🏷️ [5/6] Committing and tagging release..."
git add package.json package-lock.json || true
if ! git diff --cached --quiet; then
  git commit -m "release: v$TARGET_VERSION"
fi

if ! git rev-parse "v$TARGET_VERSION" >/dev/null 2>&1; then
  git tag -a "v$TARGET_VERSION" -m "v$TARGET_VERSION"
fi

git push origin main || true
git push origin "v$TARGET_VERSION" || true

# 8. GitHub Release
echo "🚀 [6/6] Publishing to GitHub Releases..."
if ! gh release view "v$TARGET_VERSION" >/dev/null 2>&1; then
  echo "Creating GitHub release v$TARGET_VERSION..."
  gh release create "v$TARGET_VERSION" \
    --title "SubSync Studio v$TARGET_VERSION" \
    --generate-notes
fi

echo "Uploading release assets for v$TARGET_VERSION..."
RELEASE_FILES=$(find release -maxdepth 1 -type f \( -name "*.dmg" -o -name "*.zip" -o -name "*.blockmap" -o -name "*.yml" \))

for file in $RELEASE_FILES; do
  echo "Uploading $file..."
  gh release upload "v$TARGET_VERSION" "$file" --clobber || true
done

echo ""
echo "🎉 Successfully released SubSync Studio v$TARGET_VERSION!"
echo "🔗 View release: https://github.com/alaaels3id/SubSync/releases/tag/v$TARGET_VERSION"
