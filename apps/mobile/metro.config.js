// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Code shared with the web app lives outside this folder (../../packages/core, imported as
// "@gastify/core/..."; the alias itself is the `paths` entry in tsconfig.json). Metro only
// bundles files it watches, so the shared folder has to be listed here.
// This is not an npm workspace (yet): the third-party packages core uses (decimal.js) are
// found by walking up from packages/core to the repo root node_modules.
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, '../../packages/core')];

module.exports = config;
