const test = require('node:test');
const assert = require('node:assert/strict');
const { validateApkMetadata } = require('../scripts/verify-apk.cjs');

const fingerprint = 'a'.repeat(64);
const expected = {
  appId: 'io.github.josidkd.cartascontralahumanidad',
  version: '0.2.0',
  versionCode: 2,
  certificateSha256: fingerprint,
};
function metadata() {
  return {
    badging:
      "package: name='io.github.josidkd.cartascontralahumanidad' versionCode='2' versionName='0.2.0' platformBuildVersionName='16'\nsdkVersion:'24'\ntargetSdkVersion:'36'\n",
    certificates: `Signer #1 certificate SHA-256 digest: ${fingerprint}\n`,
    files: [
      'AndroidManifest.xml',
      'classes.dex',
      'META-INF/CERT.RSA',
      'assets/public/index.html',
      'assets/public/style.css',
      'assets/public/main.js',
      'assets/public/componentes/cartasPregunta.js',
      'assets/public/componentes/cartasRespuesta.js',
      'assets/public/cordova.js',
      'assets/public/cordova_plugins.js',
      'assets/native-bridge.js',
      'assets/capacitor.config.json',
      'assets/capacitor.plugins.json',
    ],
  };
}

test('APK validation accepts the expected version, certificate and bundled public assets', () => {
  assert.doesNotThrow(() => validateApkMetadata(metadata(), expected));
});
for (const [name, change, error] of [
  [
    'wrong app ID',
    (data) => {
      data.badging = data.badging.replace('io.github.josidkd.cartascontralahumanidad', 'other.app');
    },
    /identity|identidad/i,
  ],
  [
    'wrong version',
    (data) => {
      data.badging = data.badging.replace("versionName='0.2.0'", "versionName='0.1.0'");
    },
    /version|versión/i,
  ],
  [
    'wrong versionCode',
    (data) => {
      data.badging = data.badging.replace("versionCode='2'", "versionCode='1'");
    },
    /version|versión/i,
  ],
  [
    'debug build',
    (data) => {
      data.badging += 'application-debuggable\n';
    },
    /debug/i,
  ],
  [
    'wrong certificate',
    (data) => {
      data.certificates = `Signer #1 certificate SHA-256 digest: ${'b'.repeat(64)}`;
    },
    /certificate|certificado/i,
  ],
  [
    'unsupported minimum Android',
    (data) => {
      data.badging = data.badging.replace("sdkVersion:'24'", "sdkVersion:'28'");
    },
    /SDK/i,
  ],
  [
    'missing game file',
    (data) => {
      data.files = data.files.filter((file) => !file.endsWith('/main.js'));
    },
    /asset|archivo/i,
  ],
  [
    'private asset',
    (data) => {
      data.files.push('assets/public/signing.local.json');
    },
    /asset|privad/i,
  ],
  [
    'keystore outside assets',
    (data) => {
      data.files.push('res/raw/release.p12');
    },
    /privad/i,
  ],
]) {
  test(`APK validation rejects ${name}`, () => {
    const data = metadata();
    change(data);
    assert.throws(() => validateApkMetadata(data, expected), error);
  });
}
