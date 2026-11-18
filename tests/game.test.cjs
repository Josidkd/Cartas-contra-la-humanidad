const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame, configure } = require('./helpers/dom.cjs');

function openHand() {
  const game = loadGame();
  configure(game);
  game.run('creaJugadores(); turnoZar(); controlPartida(); turnoJugador(1)');
  return game;
}

function openVote() {
  const game = openHand();
  game.run(
    'seleccionaRespuesta(1, jugadores[1].cartas[0]); vota(1, jugadores[1].cartas[0]); turnoJugador(2); seleccionaRespuesta(2, jugadores[2].cartas[0]); vota(2, jugadores[2].cartas[0]); votaRespuestas()',
  );
  return game;
}

// Catch accepting fractional/out-of-range counts or leaving validation to browser alerts.
for (const value of ['2', '16', '3.5', '', 'abc']) {
  test(`rejects player count ${JSON.stringify(value)} with an inline error`, () => {
    const game = loadGame();
    game.el('numJugadores').value = value;
    game.run('creaPartida()');
    assert.ok(game.el('error-inicio')?.textContent);
    assert.equal(game.el('crear-jugadores').hidden, true);
    assert.equal(game.alerts.length, 0);
  });
}
for (const count of [3, 15]) {
  test(`creates ${count} labelled name inputs`, () => {
    const game = loadGame();
    game.el('numJugadores').value = String(count);
    game.run('creaPartida()');
    assert.equal(game.el('inicio-app').hidden, true);
    assert.equal(game.el('crear-jugadores').hidden, false);
    assert.equal(game.document.getElementsByName('inputNombre').length, count);
    assert.match(game.el('formularioJugadores').innerHTML, /for="nombre-1"/);
    assert.ok(game.el(`nombre-${count}`));
  });
}
for (const rounds of [2, 10]) {
  test(`starts a game with ${rounds} rounds and deals ten unique cards per player`, () => {
    const game = loadGame();
    configure(game, 3, rounds);
    game.run('creaJugadores()');
    assert.equal(game.run('rondas'), rounds);
    assert.equal(game.run('jugadores.length'), 3);
    assert.equal(game.run('jugadores.every(j => j.cartas.length === 10)'), true);
    assert.equal(game.run('new Set(jugadores.flatMap(j => j.cartas)).size'), 30);
    assert.equal(game.el('crear-jugadores').hidden, true);
    assert.equal(game.el('pantallaGenerica').hidden, false);
  });
}
for (const rounds of ['1', '11', '2.5', '']) {
  test(`rejects rounds ${JSON.stringify(rounds)} without starting a game`, () => {
    const game = loadGame();
    configure(game);
    game.el('numRondas').value = rounds;
    game.run('creaJugadores()');
    assert.ok(game.el('error-jugadores')?.textContent);
    assert.equal(game.run('jugadores.length'), 0);
    assert.equal(game.el('crear-jugadores').hidden, false);
  });
}
test('rejects whitespace-only names and focuses the invalid field', () => {
  const game = loadGame();
  configure(game);
  game.document.getElementsByName('inputNombre')[1].value = '   ';
  game.run('creaJugadores()');
  assert.ok(game.el('error-jugadores')?.textContent);
  assert.equal(game.document.activeElement, game.document.getElementsByName('inputNombre')[1]);
  assert.equal(game.run('jugadores.length'), 0);
});
test('renders a name as escaped text rather than HTML in the turn screen', () => {
  const game = loadGame();
  configure(game);
  game.document.getElementsByName('inputNombre')[0].value =
    '  <img src=x onerror="alert(1)"> & \'Ana\'  ';
  game.run('creaJugadores()');
  assert.equal(game.run('jugadores[0].nombre'), '<img src=x onerror="alert(1)"> & \'Ana\'');
  const html = game.el('divContenido').innerHTML;
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
  assert.match(html, /&quot;/);
  assert.match(html, /&amp;/);
  assert.match(html, /&#39;/);
});

test('dealing can use the last card of each real deck', () => {
  const game = loadGame();
  game.run(
    'jugadores = [{ cartas: [] }]; Math.random = () => 0.999999; reparteCarta(0); reparteCartaZar(0)',
  );
  assert.equal(game.run('jugadores[0].cartas[0]'), game.run('cartasRespuesta.length - 1'));
  assert.equal(game.run('cartaZar'), game.run('cartasPregunta.length - 1'));
});
test('recycling an exhausted response deck excludes cards still held by players', () => {
  const game = loadGame();
  game.run(
    'jugadores = [{ cartas: [0] }, { cartas: [1] }]; cartasRespuestaUsadas = cartasRespuesta.map((_, i) => i); Math.random = () => 0.5; reparteCarta(0)',
  );
  assert.equal(game.run('jugadores[0].cartas.length'), 2);
  assert.equal(game.run('jugadores[0].cartas[1] > 1'), true);
  assert.equal(game.alerts.length, 0);
});

test('opening a hand shows ten cards, disables confirmation and does not spend the turn', () => {
  const game = openHand();
  assert.equal(game.document.querySelectorAll('[data-card]').length, 10);
  assert.equal(game.el('confirmar-carta')?.disabled, true);
  assert.equal(game.run('jugadores[1].estadoRonda'), false);
  assert.match(game.el('estado-partida').textContent, /Ronda 1.*2/);
  assert.match(game.el('estado-partida').textContent, /Pablo/);
});
test('selecting and changing a card leaves exactly one marked without consuming a response', () => {
  const game = openHand();
  const before = game.json('jugadores[1].cartas');
  game.run(
    'seleccionaRespuesta(1, jugadores[1].cartas[0]); seleccionaRespuesta(1, jugadores[1].cartas[1])',
  );
  assert.deepEqual(game.json('jugadores[1].cartas'), before);
  assert.equal(game.run('respuestasCarta.length'), 0);
  assert.equal(game.run('jugadores[1].estadoRonda'), false);
  const marked = game.document
    .querySelectorAll('[data-card]')
    .filter((el) => el.classList.contains('selected'));
  assert.equal(marked.length, 1);
  assert.equal(marked[0].id, `carta-${before[1]}`);
  assert.equal(marked[0].getAttribute('aria-pressed'), 'true');
  assert.equal(game.el('confirmar-carta').disabled, false);
  assert.ok(
    game
      .el('seleccion-estado')
      .textContent.includes(game.run('cartasRespuesta[jugadores[1].cartas[1]]')),
  );
});
test('confirmation consumes exactly one card, refills the hand and hides it for the next player', () => {
  const game = openHand();
  const chosen = game.run('jugadores[1].cartas[0]');
  game.run(`seleccionaRespuesta(1, ${chosen}); vota(1, ${chosen}); vota(1, ${chosen})`);
  assert.deepEqual(game.json('respuestasJugador'), [1]);
  assert.deepEqual(game.json('respuestasCarta'), [chosen]);
  assert.equal(game.run('jugadores[1].cartas.length'), 10);
  assert.equal(game.run(`jugadores[1].cartas.includes(${chosen})`), false);
  assert.equal(game.run('jugadores[1].estadoRonda'), true);
  assert.equal(game.document.querySelectorAll('[data-card]').length, 0);
  assert.match(game.el('divContenido').innerHTML, /Luis/);
});
test('unselected, wrong-player and out-of-hand confirmations cannot submit', () => {
  const game = openHand();
  game.run(
    'vota(1, jugadores[1].cartas[0]); seleccionaRespuesta(2, jugadores[2].cartas[0]); vota(2, jugadores[2].cartas[0]); seleccionaRespuesta(1, -1); vota(1, -1)',
  );
  assert.equal(game.run('respuestasCarta.length'), 0);
  assert.equal(game.run('jugadores[1].estadoRonda'), false);
});
test('the next hand starts without a previous selection', () => {
  const game = openHand();
  game.run(
    'seleccionaRespuesta(1, jugadores[1].cartas[0]); vota(1, jugadores[1].cartas[0]); turnoJugador(2)',
  );
  assert.equal(game.el('confirmar-carta').disabled, true);
  assert.equal(
    game.document
      .querySelectorAll('[data-card]')
      .filter((el) => el.getAttribute('aria-pressed') === 'true').length,
    0,
  );
});
test('zar selects anonymously without awarding a point before confirmation', () => {
  const game = openHand();
  game.run(
    'seleccionaRespuesta(1, jugadores[1].cartas[0]); vota(1, jugadores[1].cartas[0]); turnoJugador(2); seleccionaRespuesta(2, jugadores[2].cartas[0]); vota(2, jugadores[2].cartas[0]); votaRespuestas()',
  );
  const html = game.el('divContenido').innerHTML;
  assert.equal(game.document.querySelectorAll('[data-card]').length, 2);
  assert.doesNotMatch(html, /Ana|Luis/);
  assert.equal(game.el('confirmar-carta').disabled, true);
  game.run('seleccionaGanador(2)');
  assert.equal(game.el('voto-2').getAttribute('aria-pressed'), 'true');
  assert.equal(game.run('jugadores[2].rondasGanadas'), 0);
  assert.equal(game.run('rondas'), 2);
  assert.equal(game.el('confirmar-carta').disabled, false);
});

test('anonymous voting shuffles display order without changing response ownership', () => {
  const game = openHand();
  game.run(
    'seleccionaRespuesta(1, jugadores[1].cartas[0]); vota(1, jugadores[1].cartas[0]); turnoJugador(2); seleccionaRespuesta(2, jugadores[2].cartas[0]); vota(2, jugadores[2].cartas[0]); Math.random = () => 0; votaRespuestas()',
  );
  const html = game.el('divContenido').innerHTML;
  assert.ok(html.indexOf('id="voto-2"') < html.indexOf('id="voto-1"'));
  assert.deepEqual(game.json('respuestasJugador'), [1, 2]);
  game.run('seleccionaGanador(2); ganaRonda(2)');
  assert.equal(game.run('jugadores[2].rondasGanadas'), 1);
  assert.equal(game.run('jugadores[1].rondasGanadas'), 0);
});

test('winner confirmation awards one point and shows the result before advancing', () => {
  const game = openVote();
  const winningText = game.run('respuestaCompleta(respuestasCarta[0])');
  game.run('seleccionaGanador(1); ganaRonda(1); ganaRonda(1)');
  assert.equal(game.run('jugadores[1].rondasGanadas'), 1);
  assert.equal(game.run('rondas'), 2);
  assert.equal(game.run('fase'), 'resultado');
  assert.match(game.el('divContenido').innerHTML, /Ana/);
  assert.ok(
    game
      .el('divContenido')
      .innerHTML.includes(game.run(`escapaHTML(${JSON.stringify(winningText)})`)),
  );
  assert.equal(game.alerts.length, 0);
});
test('winner cannot be confirmed without selecting an eligible response', () => {
  const game = openVote();
  game.run('ganaRonda(1); seleccionaGanador(0); ganaRonda(0)');
  assert.equal(game.run('jugadores.every(j => j.rondasGanadas === 0)'), true);
  assert.equal(game.run('rondas'), 2);
});
test('continuing the result advances once, rotates zar and resets round state', () => {
  const game = openVote();
  game.run('seleccionaGanador(1); ganaRonda(1); cambioRonda(); cambioRonda()');
  assert.equal(game.run('rondas'), 1);
  assert.equal(game.run('jugadorZar'), 1);
  assert.equal(game.run('preguntaLeida'), false);
  assert.equal(game.run('jugadores.every(j => !j.estadoRonda)'), true);
  assert.equal(game.run('respuestasCarta.length'), 0);
  assert.equal(game.run('fase'), 'entrega-zar');
});
test('final round shows only the final screen and preserves the player turn order', () => {
  const game = openVote();
  game.run('rondas = 1; seleccionaGanador(2); ganaRonda(2); cambioRonda()');
  assert.equal(game.el('fin').hidden, false);
  assert.equal(game.el('pantallaGenerica').hidden, true);
  assert.equal(game.el('crear-jugadores').hidden, true);
  assert.equal(game.run('fase'), 'fin');
  const html = game.el('puntuaciones').innerHTML;
  assert.ok(html.indexOf('Luis') < html.indexOf('Pablo'));
  assert.deepEqual(game.json('jugadores.map(j => j.nombre)'), ['Pablo', 'Ana', 'Luis']);
});
test('classification is descending, recognises all tied winners and escapes their names', () => {
  const game = loadGame();
  configure(game);
  game.run(
    'creaJugadores(); jugadores[0].rondasGanadas = 1; jugadores[1].rondasGanadas = 3; jugadores[2].rondasGanadas = 3; jugadores[1].nombre = "<b>Ana</b>"; muestraClasificacion()',
  );
  const html = game.el('puntuaciones').innerHTML;
  assert.match(html, /Empate/);
  assert.match(html, /&lt;b&gt;Ana&lt;\/b&gt;/);
  assert.doesNotMatch(html, /<b>Ana/);
  assert.ok(html.indexOf('Luis') < html.indexOf('Pablo'));
  assert.match(html.replace(/<[^>]*>/g, ''), /3 puntos/);
  assert.equal(game.run('jugadores[0].nombre'), 'Pablo');
});
test('fifteen players can complete ten rounds with valid hands and exactly one winner per round', () => {
  const game = loadGame();
  configure(game, 15, 10);
  game.run(`creaJugadores();
    for (let ronda = 0; ronda < 10; ronda++) {
      turnoZar(); controlPartida();
      for (let i = 0; i < 14; i++) {
        const jugador = jugadorActivo;
        turnoJugador(jugador);
        const carta = jugadores[jugador].cartas[0];
        seleccionaRespuesta(jugador, carta); vota(jugador, carta);
      }
      votaRespuestas();
      const ganador = respuestasJugador[0];
      seleccionaGanador(ganador); ganaRonda(ganador); cambioRonda();
    }`);
  assert.equal(game.run('rondas'), 0);
  assert.equal(game.run('jugadores.reduce((suma, j) => suma + j.rondasGanadas, 0)'), 10);
  assert.equal(
    game.run(
      'jugadores.every(j => j.cartas.length === 10 && j.cartas.every(c => Number.isInteger(c)))',
    ),
    true,
  );
  assert.equal(game.run('new Set(jugadores.flatMap(j => j.cartas)).size'), 150);
  assert.equal(game.el('fin').hidden, false);
  assert.equal(game.alerts.length, 0);
});
