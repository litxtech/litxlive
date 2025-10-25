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

module.exports = config;
