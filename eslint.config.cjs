const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.superpowers/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'dist/**',
      'android/app/src/main/assets/**',
      'android/**/build/**',
      'android/capacitor-cordova-android-plugins/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['main.js', 'componentes/*.js'],
    languageOptions: { sourceType: 'script', globals: globals.browser },
  },
  {
    files: ['main.js'],
    languageOptions: { globals: { cartasPregunta: 'readonly', cartasRespuesta: 'readonly' } },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  {
    files: ['tests/e2e/**/*.cjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
