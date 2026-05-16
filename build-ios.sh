#!/bin/bash
set -e

APP_NAME="ArohaFresh-Delivery"
DESKTOP="$HOME/Desktop"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
XCODE_PROJECT="$PROJECT_DIR/ios/App/App.xcodeproj"
ARCHIVE_PATH="/tmp/ArohaDelivery.xcarchive"
EXPORT_PATH="/tmp/ArohaDeliveryIPA"
BUILD_KEYCHAIN="${AROHA_BUILD_KEYCHAIN:-$DESKTOP/aroha-build.keychain-db}"
# Set AROHA_KEYCHAIN_PASS in your shell profile or pass it when running this script.
# Example: AROHA_KEYCHAIN_PASS=yourpass bash build-ios.sh
KEYCHAIN_PASS="${AROHA_KEYCHAIN_PASS:?'AROHA_KEYCHAIN_PASS env var is required. Export it in your shell profile.'}"

echo "▶ Building Angular (production)..."
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 24 --silent
cd "$PROJECT_DIR"
npm run build -- --configuration production

echo "▶ Syncing to iOS..."
npx cap sync ios

echo "▶ Unlocking build keychain..."
security unlock-keychain -p "$KEYCHAIN_PASS" "$BUILD_KEYCHAIN"
security list-keychains -d user -s "$BUILD_KEYCHAIN" "$HOME/Library/Keychains/login.keychain-db"

echo "▶ Archiving..."
rm -rf "$ARCHIVE_PATH"
xcodebuild archive \
  -project "$XCODE_PROJECT" \
  -scheme App \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  OTHER_CODE_SIGN_FLAGS="--keychain $BUILD_KEYCHAIN" \
  2>&1 | grep -E "ARCHIVE|error:" | grep -v "note:\|deprecated" || true

echo "▶ Exporting IPA..."
rm -rf "$EXPORT_PATH"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist "$PROJECT_DIR/ExportOptions.plist" \
  2>&1 | grep -E "EXPORT|error:" | grep -v "note:\|deprecated" || true

IPA=$(find "$EXPORT_PATH" -name "*.ipa" | head -1)
cp "$IPA" "$DESKTOP/${APP_NAME}-appstore.ipa"

echo ""
echo "✅ Done!"
echo "   IPA → $DESKTOP/${APP_NAME}-appstore.ipa"
