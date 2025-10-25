const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Web platform için resolver ayarları
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Web için asset resolver
config.resolver.assetExts.push(
  // Web assets
  'svg',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp'
);

// Bundle boyutunu küçültmek için optimizasyonlar
config.transformer.minifierConfig = {
  keep_fnames: false,
  mangle: {
    keep_fnames: false,
  },
  compress: {
    drop_console: true,
    drop_debugger: true,
    pure_funcs: ['console.log', 'console.info', 'console.debug'],
  },
};

// Tree shaking için
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
