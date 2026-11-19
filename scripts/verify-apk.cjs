const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const gameAssets = [
  'assets/public/index.html',
  'assets/public/style.css',
  'assets/public/main.js',
  'assets/public/componentes/cartasPregunta.js',
  'assets/public/componentes/cartasRespuesta.js',
];
const allowedAssets = new Set([
  ...gameAssets,
  'assets/public/cordova.js',
  'assets/public/cordova_plugins.js',
  'assets/native-bridge.js',
  'assets/capacitor.config.json',
  'assets/capacitor.plugins.json',
  // Android Gradle Plugin generates these release-only optimization profiles.
  'assets/dexopt/baseline.prof',
  'assets/dexopt/baseline.profm',
]);

function validateApkMetadata(actual, expected) {
  const identity = actual.badging.match(
    /^package: name='([^']+)' versionCode='(\d+)' versionName='([^']*)'/m,
  );
  if (!identity || identity[1] !== expected.appId)
    throw new Error('Identidad de aplicación incorrecta');
  if (Number(identity[2]) !== expected.versionCode || identity[3] !== expected.version)
    throw new Error('Versión/versionCode del APK incorrectos');
  if (/^application-(?:debuggable|testOnly)/m.test(actual.badging))
    throw new Error('No se publica un APK debug o testOnly');
  if (
    !/^sdkVersion:'24'$/m.test(actual.badging) ||
    !/^targetSdkVersion:'36'$/m.test(actual.badging)
  )
    throw new Error('SDK mínimo/target del APK incorrectos');
  const signers = [
    ...actual.certificates.matchAll(/Signer #\d+ certificate SHA-256 digest: ([\da-f:]+)/gi),
  ];
  if (
    signers.length !== 1 ||
    signers[0][1].replace(/:/g, '').toLowerCase() !== expected.certificateSha256.toLowerCase()
  )
    throw new Error('Certificado de firma inesperado');
  for (const file of actual.files) {
    if (
      /(?:^|\/)(?:signing\.local\.json|[^/]*\.(?:jks|keystore|p12|pfx)|\.env)(?:$|\/)/i.test(file)
    )
      throw new Error('Archivo privado dentro del APK');
    if (file.startsWith('assets/') && !file.endsWith('/') && !allowedAssets.has(file))
      throw new Error('Asset no autorizado dentro del APK: ' + file);
  }
  for (const file of gameAssets) {
    if (!actual.files.includes(file))
      throw new Error('Falta un archivo del juego en assets: ' + file);
  }
}

function verifyApk(apk) {
  const root = path.resolve(__dirname, '..');
  const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const { appId } = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8'));
  const gradle = fs.readFileSync(path.join(root, 'android/app/build.gradle'), 'utf8');
  const versionCode = Number(gradle.match(/versionCode\s+(\d+)/)?.[1]);
  const certificateSha256 = fs
    .readFileSync(path.join(root, 'android/signing-certificate.sha256'), 'utf8')
    .trim();
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (!sdk) throw new Error('ANDROID_HOME no está configurado');
  const tools = path.join(sdk, 'build-tools/36.0.0');
  const badging = execFileSync(
    path.join(tools, process.platform === 'win32' ? 'aapt.exe' : 'aapt'),
    ['dump', 'badging', apk],
    { encoding: 'utf8' },
  );
  const certificates = execFileSync(
    'java',
    ['-jar', path.join(tools, 'lib/apksigner.jar'), 'verify', '--verbose', '--print-certs', apk],
    { encoding: 'utf8' },
  );
  const files = execFileSync('unzip', ['-Z1', apk], { encoding: 'utf8' }).trim().split(/\r?\n/);
  validateApkMetadata(
    { badging, certificates, files },
    { appId, version, versionCode, certificateSha256 },
  );
  const checksum = crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex');
  fs.writeFileSync(apk + '.sha256', `${checksum}  ${path.basename(apk)}\n`);
  console.log(
    `APK verificado: ${appId} ${version} (code ${versionCode}), certificado esperado y assets públicos`,
  );
}

if (require.main === module) {
  try {
    if (!process.argv[2]) throw new Error('Uso: node scripts/verify-apk.cjs ruta.apk');
    verifyApk(path.resolve(process.argv[2]));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { validateApkMetadata };
