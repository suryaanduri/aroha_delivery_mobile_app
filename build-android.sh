#!/bin/bash
set -e

APP_NAME="ArohaFresh-Delivery"
DESKTOP="$HOME/Desktop"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "▶ Building Angular (production)..."
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 24 --silent
cd "$PROJECT_DIR"
npm run build -- --configuration production

echo "▶ Syncing to Android..."
npx cap sync android

echo "▶ Building APK + AAB..."
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
cd "$PROJECT_DIR/android"
./gradlew assembleDebug bundleDebug --quiet

APK=$(find app/build/outputs/apk/debug -name "*.apk" | head -1)
AAB=$(find app/build/outputs/bundle/debug -name "*.aab" | head -1)

cp "$APK" "$DESKTOP/${APP_NAME}-debug.apk"
cp "$AAB" "$DESKTOP/${APP_NAME}-debug.aab"

echo ""
echo "✅ Done!"
echo "   APK → $DESKTOP/${APP_NAME}-debug.apk"
echo "   AAB → $DESKTOP/${APP_NAME}-debug.aab"
