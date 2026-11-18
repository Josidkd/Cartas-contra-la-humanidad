const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { buildWebAssets } = require('../scripts/build-web.cjs');

async function fixture(t) {
  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'cartas-assets-'));
  t.after(() => fs.rm(sandbox, { recursive: true, force: true }));
  const root = path.join(sandbox, 'source');
  await fs.mkdir(path.join(root, 'componentes'), { recursive: true });
  const files = {
    'index.html': '<script defer src="main.js"></script>',
    'style.css': 'body { background: black; }',
    'main.js': 'const title = "Cartas";',
    'componentes/cartasPregunta.js': 'var cartasPregunta = ["Pregunta"];',
    'componentes/cartasRespuesta.js': 'var cartasRespuesta = ["Respuesta"];',
  };
  for (const [name, content] of Object.entries(files))
    await fs.writeFile(path.join(root, name), content);
  await fs.writeFile(path.join(root, 'private-test.txt'), 'must never enter the app');
  return { root, output: path.join(sandbox, 'dist'), files };
}

test('web bundle contains exactly the public files with unchanged content and relative paths', async (t) => {
  const { root, output, files } = await fixture(t);
  await buildWebAssets(root, output);
  assert.deepEqual((await fs.readdir(output)).sort(), [
    'componentes',
    'index.html',
    'main.js',
    'style.css',
  ]);
  assert.deepEqual((await fs.readdir(path.join(output, 'componentes'))).sort(), [
    'cartasPregunta.js',
    'cartasRespuesta.js',
  ]);
  for (const [name, content] of Object.entries(files))
    assert.equal(await fs.readFile(path.join(output, name), 'utf8'), content);
  await assert.rejects(fs.access(path.join(output, 'private-test.txt')), { code: 'ENOENT' });
});

test('web bundle removes stale output rather than shipping files from a previous build', async (t) => {
  const { root, output } = await fixture(t);
  await fs.mkdir(output);
  await fs.writeFile(path.join(output, 'obsolete-private.txt'), 'stale');
  await buildWebAssets(root, output);
  await assert.rejects(fs.access(path.join(output, 'obsolete-private.txt')), { code: 'ENOENT' });
});

test('web bundle rejects destructive output paths that contain its source', async (t) => {
  const { root } = await fixture(t);
  await assert.rejects(buildWebAssets(root, root), /output|salida/i);
  await assert.rejects(buildWebAssets(root, path.dirname(root)), /output|salida/i);
  assert.equal(await fs.readFile(path.join(root, 'main.js'), 'utf8'), 'const title = "Cartas";');
});
