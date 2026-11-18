const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const publicFiles = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/main.js', ['main.js', 'text/javascript; charset=utf-8']],
  [
    '/componentes/cartasPregunta.js',
    ['componentes/cartasPregunta.js', 'text/javascript; charset=utf-8'],
  ],
  [
    '/componentes/cartasRespuesta.js',
    ['componentes/cartasRespuesta.js', 'text/javascript; charset=utf-8'],
  ],
]);

function createAppServer(root = path.resolve(__dirname, '..')) {
  return http.createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end('Método no permitido');
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    } catch {
      response.writeHead(400).end('Ruta no válida');
      return;
    }
    const asset = publicFiles.get(pathname);
    if (!asset) {
      response.writeHead(404).end('No encontrado');
      return;
    }
    try {
      const contents = await fs.readFile(path.join(root, asset[0]));
      response.writeHead(200, { 'Content-Type': asset[1], 'Cache-Control': 'no-store' });
      response.end(request.method === 'HEAD' ? undefined : contents);
    } catch {
      response.writeHead(500).end('No se pudo leer el recurso');
    }
  });
}

if (require.main === module) {
  const server = createAppServer();
  server.on('error', (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  server.listen(4173, '127.0.0.1', () => console.log('Juego: http://127.0.0.1:4173'));
}

module.exports = { createAppServer };
