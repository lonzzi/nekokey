module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          lazyImports: true,
          native: {
            disableImportExportTransform: true,
          },
        },
      ],
      'nativewind/babel',
    ],
    plugins: ['react-native-reanimated/plugin'],
    env: {
      production: {
        plugins: ['transform-remove-console'],
      },
    },
  };
};
