const fs = require('node:fs/promises');
const path = require('node:path');

const publicFiles = [
  'index.html',
  'style.css',
  'main.js',
  'componentes/cartasPregunta.js',
  'componentes/cartasRespuesta.js',
];

async function buildWebAssets(sourceRoot, outputDir) {
  const source = path.resolve(sourceRoot);
  const output = path.resolve(outputDir);
  const relativeSource = path.relative(output, source);
  if (
    !relativeSource ||
    (!relativeSource.startsWith('..' + path.sep) &&
      relativeSource !== '..' &&
      !path.isAbsolute(relativeSource))
  ) {
    throw new Error('La carpeta de salida no puede contener el código fuente');
  }
  await fs.rm(output, { recursive: true, force: true });
  for (const file of publicFiles) {
    const destination = path.join(output, file);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(path.join(source, file), destination);
  }
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  buildWebAssets(root, path.join(root, 'dist')).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { buildWebAssets };
