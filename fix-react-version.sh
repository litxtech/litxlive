#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Fixing React version for Expo SDK 54 compatibility..."

cd /home/user/rork-app

echo "📦 Removing node_modules and cache..."
rm -rf node_modules .expo .eas android ios || true

echo "📝 Downgrading React to 18.2.0..."
npm uninstall react react-dom @types/react
npm install react@18.2.0 react-dom@18.2.0 @types/react@~18.2.79 --save-exact

echo "🔄 Running expo install --fix to align all dependencies..."
npx expo install --fix

echo "✅ React version fixed! Installing dependencies..."
npm install

echo "🧹 Clearing Expo cache..."
npx expo start --clear || true

echo "✅ Done! Try running 'npm start' or 'npx expo start' now."
