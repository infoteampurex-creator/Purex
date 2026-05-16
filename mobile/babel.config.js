module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Resolves `@/*` imports to `./src/*` at bundle time.
      // tsconfig.json's `paths` config only handles TypeScript's
      // type-checker — Metro's runtime resolver ignores it. This
      // plugin wires the same alias into the actual bundle.
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
          },
        },
      ],
    ],
  };
};
