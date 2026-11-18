const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createAppServer } = require('../scripts/serve.cjs');

async function serve(t, root) {
  const server = createAppServer(root);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  return `http://127.0.0.1:${server.address().port}`;
}

test('development server serves public assets and rejects private paths and unsupported methods', async (t) => {
  const base = await serve(t);
  const home = await fetch(base);
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-type'), /text\/html/);
  assert.match(await home.text(), /Cartas contra la humanidad/);
  for (const route of [
    '/main.js',
    '/style.css',
    '/componentes/cartasPregunta.js',
    '/componentes/cartasRespuesta.js',
  ]) {
    assert.equal((await fetch(base + route)).status, 200);
  }
  for (const route of [
    '/package.json',
    '/.git/config',
    '/tests/game.test.cjs',
    '/%2egit/config',
    '/missing',
    '/%ZZ',
  ]) {
    const response = await fetch(base + route);
    assert.ok([400, 404].includes(response.status), `${route} must not expose files`);
  }
  assert.equal((await fetch(base, { method: 'POST' })).status, 405);
  const head = await fetch(base, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});

test('development server returns a controlled error when an allowed asset is missing', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cartas-server-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const base = await serve(t, root);
  const response = await fetch(base + '/main.js');
  assert.equal(response.status, 500);
  assert.doesNotMatch(
    await response.text(),
    new RegExp(root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  );
});
