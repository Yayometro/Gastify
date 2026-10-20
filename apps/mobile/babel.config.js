module.exports = function (api) {
  api.cache(true);
  return {
    // NativeWind v4: className on React Native components.
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
