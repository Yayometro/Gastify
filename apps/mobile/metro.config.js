// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Code shared with the web app lives outside this folder (../../packages/core, imported as
// "@gastify/core/..."; the alias itself is the `paths` entry in tsconfig.json). Metro only
// bundles files it watches, so the shared folder has to be listed here.
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, '../../packages/core')];

// One copy of React for the whole app. The workspace root installs React 19.3 for the web;
// this app needs 19.2.3 (Expo SDK 57). A package hoisted to the root, such as react-redux,
// would otherwise load the root React and break hooks ("Invalid hook call"). So `react` and
// `react-native` are always resolved from this app, whoever asks for them.
const isSingleton = (name) =>
  name === 'react' || name.startsWith('react/') || name === 'react-native' || name.startsWith('react-native/');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (isSingleton(moduleName)) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(__dirname, 'package.json') },
      moduleName,
      platform
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

// NativeWind v4: className support. `input` is the CSS file with the Tailwind layers and the
// --gf-* color tokens.
const { withNativeWind } = require('nativewind/metro');

module.exports = withNativeWind(config, { input: './src/global.css' });
