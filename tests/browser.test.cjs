const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// Optional real-browser checks, no npm packages required.
// BROWSER_BIN=/path/to/chrome node --experimental-websocket --test tests/browser.test.cjs
const available = process.env.BROWSER_BIN && typeof WebSocket === 'function';
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test(
  'real browser: responsive layout, strong selection, private turns and full game',
  { skip: !available, timeout: 60000 },
  async () => {
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cartas-browser-'));
    const screenshots = path.resolve(__dirname, '../.superpowers/verification');
    fs.mkdirSync(screenshots, { recursive: true });
    const browser = spawn(
      process.env.BROWSER_BIN,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--remote-debugging-port=0',
        `--user-data-dir=${profile}`,
        'about:blank',
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    );
    let socket;
    let send;
    try {
      const endpoint = await new Promise((resolve, reject) => {
        let output = '';
        const timeout = setTimeout(
          () => reject(new Error('Chrome did not expose DevTools')),
          15000,
        );
        browser.once('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
        browser.stderr.on('data', (chunk) => {
          output += chunk;
          const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
          if (match) {
            clearTimeout(timeout);
            resolve(match[1]);
          }
        });
      });
      socket = new WebSocket(endpoint);
      await new Promise((resolve, reject) => {
        socket.addEventListener('open', resolve, { once: true });
        socket.addEventListener('error', reject, { once: true });
      });
      let nextId = 0;
      const pending = new Map();
      socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        const request = pending.get(message.id);
        if (!request) return;
        pending.delete(message.id);
        if (message.error) request.reject(new Error(JSON.stringify(message.error)));
        else request.resolve(message.result);
      });
      send = (method, params = {}, sessionId) =>
        new Promise((resolve, reject) => {
          const id = ++nextId;
          const timer = setTimeout(() => {
            pending.delete(id);
            reject(new Error(`CDP timeout: ${method}`));
          }, 10000);
          pending.set(id, {
            resolve: (value) => {
              clearTimeout(timer);
              resolve(value);
            },
            reject: (error) => {
              clearTimeout(timer);
              reject(error);
            },
          });
          socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
        });
      const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
      const command = (method, params) => send(method, params, sessionId);
      const evaluate = async (expression) => {
        const result = await command('Runtime.evaluate', {
          expression,
          returnByValue: true,
          awaitPromise: true,
        });
        if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
        return result.result.value;
      };
      await command('Page.enable');
      const errors = [];
      socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        if (message.method === 'Runtime.exceptionThrown')
          errors.push(message.params.exceptionDetails.text);
      });
      await command('Runtime.enable');
      async function viewport(width) {
        await command('Emulation.setDeviceMetricsOverride', {
          width,
          height: 1000,
          deviceScaleFactor: 1,
          mobile: false,
        });
        await pause(60);
      }
      async function navigate() {
        await command('Page.navigate', {
          url: pathToFileURL(path.resolve(__dirname, '../index.html')).href,
        });
        for (let i = 0; i < 100; i++) {
          if (
            await evaluate(
              'document.readyState === "complete" && typeof creaPartida === "function"',
            )
          )
            return;
          await pause(30);
        }
        throw new Error('Game did not load');
      }
      async function screenshot(name) {
        const { data } = await command('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: false,
        });
        fs.writeFileSync(path.join(screenshots, name), Buffer.from(data, 'base64'));
      }
      async function noOverflow(label) {
        const size = await evaluate(
          '({content: document.documentElement.scrollWidth, viewport: innerWidth})',
        );
        assert.ok(
          size.content <= size.viewport + 1,
          `${label}: horizontal overflow ${JSON.stringify(size)}`,
        );
      }
      await viewport(1440);
      await navigate();
      const navigationIssues = [];
      const expectedHome = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
      if ((await evaluate('document.querySelector(".brand").href')) !== expectedHome)
        navigationIssues.push('Home link does not resolve to index.html when running locally');
      await noOverflow('desktop home');
      await screenshot('desktop-home.png');
      for (const width of [360, 768]) {
        await viewport(width);
        await noOverflow(`home ${width}`);
      }
      await screenshot('tablet-home.png');
      await viewport(360);
      await screenshot('mobile-home.png');
      await evaluate(
        `document.getElementById('numJugadores').value = '15'; document.querySelector('#inicio-app button[type="submit"]').click()`,
      );
      assert.equal(await evaluate('document.querySelectorAll("[name=inputNombre]").length'), 15);
      await evaluate('document.querySelector("#crear-jugadores .button-secondary").click()');
      if ((await evaluate('document.activeElement.id')) !== 'titulo-inicio')
        navigationIssues.push('Returning home does not restore focus to the visible heading');
      await evaluate('creaPartida()');
      await noOverflow('fifteen-player setup');
      await evaluate(
        `document.getElementById('numRondas').value = '2'; document.querySelector('#crear-jugadores button[type="submit"]').click()`,
      );
      assert.equal(await evaluate('document.activeElement.id'), 'nombre-1');
      await evaluate(
        `document.querySelectorAll('[name=inputNombre]').forEach((field, i) => field.value = i === 0 ? '<img src=x onerror="window.injected=true">' : 'Jugador ' + (i + 1)); document.querySelector('#crear-jugadores button[type="submit"]').click()`,
      );
      assert.equal(await evaluate('Boolean(window.injected)'), false);
      assert.equal(await evaluate('document.querySelectorAll("#divContenido img").length'), 0);
      await evaluate('turnoZar(); controlPartida(); turnoJugador(1)');
      assert.equal(await evaluate('document.querySelectorAll("[data-card]").length'), 10);
      assert.equal(await evaluate('document.getElementById("confirmar-carta").disabled'), true);
      for (const width of [360, 768, 1440]) {
        await viewport(width);
        await noOverflow(`hand ${width}`);
      }
      await evaluate('document.querySelector("[data-card]").click()');
      const selection = await evaluate(`(() => {
      const selected = document.querySelector('.answer.selected');
      const normal = document.querySelector('.answer:not(.selected)');
      return { selected: getComputedStyle(selected).backgroundColor, normal: getComputedStyle(normal).backgroundColor,
        label: getComputedStyle(selected.querySelector('.selection-badge')).display,
        pressed: selected.getAttribute('aria-pressed') };
    })()`);
      assert.notEqual(selection.selected, selection.normal);
      assert.equal(selection.label, 'block');
      assert.equal(selection.pressed, 'true');
      await screenshot('desktop-selected.png');
      await viewport(360);
      await screenshot('mobile-selected.png');
      await evaluate(`document.querySelector('.answer.selected').focus()`);
      const focusStyle = await evaluate('getComputedStyle(document.activeElement).outlineStyle');
      assert.notEqual(focusStyle, 'none');
      // The actual keyboard path, rather than a synthetic click, submits the chosen response.
      await evaluate('document.getElementById("confirmar-carta").focus()');
      await command('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13,
        text: '\r',
      });
      await command('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13,
      });
      assert.equal(await evaluate('document.querySelectorAll("[data-card]").length'), 0);
      assert.equal(await evaluate('document.activeElement.id'), 'titulo-turno');
      // Finish the remaining responses and both rounds with the real game functions.
      await evaluate(`(() => {
      while (fase === 'entrega-jugador') {
        const j = jugadorActivo; turnoJugador(j); seleccionaRespuesta(j, jugadores[j].cartas[0]); vota(j, seleccion);
      }
      votaRespuestas(); seleccionaGanador(respuestasJugador[0]); ganaRonda(seleccion); cambioRonda();
      turnoZar(); controlPartida();
      while (fase === 'entrega-jugador') {
        const j = jugadorActivo; turnoJugador(j); seleccionaRespuesta(j, jugadores[j].cartas[0]); vota(j, seleccion);
      }
      votaRespuestas(); seleccionaGanador(respuestasJugador[0]); ganaRonda(seleccion); cambioRonda();
    })()`);
      assert.equal(await evaluate('fase'), 'fin');
      assert.equal(
        await evaluate('document.querySelectorAll("[data-screen]:not([hidden])").length'),
        1,
      );
      await noOverflow('classification');
      await screenshot('mobile-final.png');
      // Stress unbroken names and card text without altering the shipped decks.
      await navigate();
      await evaluate(
        `document.getElementById('numJugadores').value='3'; creaPartida(); document.querySelectorAll('[name=inputNombre]').forEach(f => f.value='A'.repeat(80)); document.getElementById('numRondas').value='2'; creaJugadores(); turnoZar(); controlPartida(); turnoJugador(1); document.querySelectorAll('.answer .card-copy').forEach(el=>el.textContent='A'.repeat(300))`,
      );
      await noOverflow('long names and card text');
      const clipping = await evaluate(
        `Array.from(document.querySelectorAll('.answer')).some(el => el.scrollHeight > el.clientHeight + 2)`,
      );
      assert.equal(clipping, false);
      await command('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
      });
      assert.equal(
        await evaluate('getComputedStyle(document.querySelector(".answer")).transitionDuration'),
        '0s',
      );
      assert.deepEqual(errors, []);
      assert.deepEqual(navigationIssues, []);
      console.log(`Screenshots: ${screenshots}`);
    } finally {
      if (send && socket?.readyState === 1) {
        try {
          await send('Browser.close');
        } catch {
          /* Browser may close before its reply. */
        }
      }
      if (socket) socket.close();
      browser.kill();
      await pause(300);
      fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    }
  },
);
