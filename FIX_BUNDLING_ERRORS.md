# Fix Bundling Errors for Expo SDK 54

## Issues Fixed
✅ Removed incorrect React.use polyfill from app/_layout.tsx
✅ Fixed PolicyGate to use proper imports instead of require()
✅ Cleaned up expo-router imports

## Required Manual Fixes

### 1. Fix app.json

Remove the `android.manifest` field (not supported in SDK 54) and temporarily disable notification assets:

```json
{
  "expo": {
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.litxtech.lumi",
      "permissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.VIBRATE",
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.SCHEDULE_EXACT_ALARM"
      ]
    },
    "plugins": [
      ["expo-notifications", {
        "color": "#ffffff",
        "defaultChannel": "default",
        "enableBackgroundRemoteNotifications": false
      }]
    ]
  }
}
```

**Remove these lines:**
- Line 49-51: `"manifest": { "android:supportsPictureInPicture": true }`
- Line 100: `"icon": "./local/assets/notification_icon.png",`
- Line 103-105: `"sounds": ["./local/assets/notification_sound.wav"],`
- Duplicate permissions (CAMERA, RECORD_AUDIO, etc. without android.permission prefix)

### 2. Fix tsconfig.json

Add `baseUrl` to compilerOptions:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@rork/*": ["./.rorkai/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ]
}
```

### 3. Fix babel.config.js

Add react-native-reanimated plugin (required for SDK 54):

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
    plugins: [
      "react-native-reanimated/plugin",
    ],
  };
};
```

### 4. Clear Cache and Reinstall

```bash
# Clear all caches
rm -rf node_modules .expo .eas android ios
rm -f package-lock.json

# Reinstall dependencies
npm install

# Start with clean cache
npx expo start -c
```

### 5. If Still Failing

Check for:
- Missing notification asset files in `./local/assets/`
- Circular dependencies in providers
- Incompatible package versions

Run expo doctor to check for issues:
```bash
npx expo doctor
```

## Summary

The main bundling issue was caused by:
1. ❌ Incorrect React.use polyfill (fixed)
2. ❌ Using require() instead of import (fixed)
3. ⚠️ Missing android.manifest removal (needs manual fix)
4. ⚠️ Missing notification assets (needs manual fix)
5. ⚠️ Missing baseUrl in tsconfig (needs manual fix)
6. ⚠️ Missing reanimated babel plugin (needs manual fix)

After applying the manual fixes above, the bundling should work correctly.
