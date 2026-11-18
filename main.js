/* exported creaPartida, creaJugadores, turnoZar, turnoJugador, seleccionaRespuesta, vota,
   votaRespuestas, seleccionaGanador, ganaRonda, cambioRonda, reiniciarJuego */
// Los manejadores anteriores son la API de los atributos onclick/onsubmit de la interfaz.
// Estado de una partida local: el orden del array determina los turnos.
let numeroJugadores;
let jugadores = [];
let cartasPreguntaUsadas = [];
let cartasRespuestaUsadas = [];
let jugadorZar;
let cartaZar;
let rondas;
let totalRondas;
let preguntaLeida = false;
let respuestasJugador = [];
let respuestasCarta = [];
let fase = 'inicio';
let jugadorActivo = null;
let seleccion = null;

function escapaHTML(texto) {
  return String(texto).replace(
    /[&<>"']/g,
    (caracter) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[caracter],
  );
}

function muestraPantalla(id) {
  document.querySelectorAll('[data-screen]').forEach((pantalla) => {
    pantalla.hidden = pantalla.id !== id;
  });
  if (id === 'crear-jugadores' || id === 'inicio-app') {
    const titulo = document.getElementById(
      id === 'crear-jugadores' ? 'titulo-jugadores' : 'titulo-inicio',
    );
    titulo.focus();
  }
}

function errorCampo(id, mensaje, campo) {
  document.getElementById(id).textContent = mensaje;
  if (campo) {
    campo.setAttribute('aria-invalid', 'true');
    campo.focus();
  }
}

function enteroEnRango(valor, minimo, maximo) {
  const numero = Number(valor);
  return (
    String(valor).trim() !== '' && Number.isInteger(numero) && numero >= minimo && numero <= maximo
  );
}

function creaPartida() {
  const campo = document.getElementById('numJugadores');
  if (!enteroEnRango(campo.value, 3, 15)) {
    errorCampo('error-inicio', 'Introduce un número entero de jugadores entre 3 y 15.', campo);
    return;
  }
  campo.removeAttribute('aria-invalid');
  document.getElementById('error-inicio').textContent = '';
  numeroJugadores = Number(campo.value);
  creaFormularioJugadores(numeroJugadores);
  muestraPantalla('crear-jugadores');
}

function creaFormularioJugadores(numJugadores) {
  let campos = '';
  for (let i = 1; i <= numJugadores; i++) {
    campos += `<div class="player-field"><label for="nombre-${i}">Jugador ${String(i).padStart(2, '0')}</label>
      <input id="nombre-${i}" name="inputNombre" type="text" placeholder="¿Cómo te llamas?" autocomplete="off" maxlength="80" aria-describedby="error-jugadores"></div>`;
  }
  document.getElementById('formularioJugadores').innerHTML = campos;
  document.getElementById('error-jugadores').textContent = '';
}

function creaJugadores() {
  const campoRondas = document.getElementById('numRondas');
  if (!enteroEnRango(campoRondas.value, 2, 10)) {
    errorCampo('error-jugadores', 'Elige un número entero de rondas entre 2 y 10.', campoRondas);
    return;
  }
  campoRondas.removeAttribute('aria-invalid');
  const campos = Array.from(document.getElementsByName('inputNombre'));
  campos.forEach((campo) => campo.removeAttribute('aria-invalid'));
  const vacio = campos.find((campo) => !campo.value.trim());
  if (vacio) {
    errorCampo('error-jugadores', 'Todos los jugadores necesitan un nombre.', vacio);
    return;
  }
  document.getElementById('error-jugadores').textContent = '';
  jugadores = campos.map((campo) => ({
    nombre: campo.value.trim(),
    rondasGanadas: 0,
    cartas: [],
    estadoRonda: false,
  }));
  rondas = totalRondas = Number(campoRondas.value);
  empiezaPartida();
}

function empiezaPartida() {
  cartasPreguntaUsadas = [];
  cartasRespuestaUsadas = [];
  respuestasJugador = [];
  respuestasCarta = [];
  preguntaLeida = false;
  jugadores.forEach((jugador, i) => {
    while (jugador.cartas.length < 10) reparteCarta(i);
  });
  jugadorZar = 0;
  reparteCartaZar();
  controlPartida();
}

// Elegir de un conjunto disponible evita reintentos y respeta el tamaño real del mazo.
function reparteCarta(nJugador) {
  let disponibles = cartasRespuesta
    .map((_, i) => i)
    .filter((i) => !cartasRespuestaUsadas.includes(i));
  if (!disponibles.length) {
    cartasRespuestaUsadas = jugadores.flatMap((jugador) => jugador.cartas);
    disponibles = cartasRespuesta
      .map((_, i) => i)
      .filter((i) => !cartasRespuestaUsadas.includes(i));
    document.getElementById('aviso-juego').textContent =
      'El mazo se ha barajado de nuevo. Algunas respuestas pueden repetirse.';
  }
  const carta = disponibles[Math.floor(Math.random() * disponibles.length)];
  cartasRespuestaUsadas.push(carta);
  jugadores[nJugador].cartas.push(carta);
}

function reparteCartaZar() {
  if (cartasPreguntaUsadas.length === cartasPregunta.length) cartasPreguntaUsadas = [];
  const disponibles = cartasPregunta
    .map((_, i) => i)
    .filter((i) => !cartasPreguntaUsadas.includes(i));
  cartaZar = disponibles[Math.floor(Math.random() * disponibles.length)];
  cartasPreguntaUsadas.push(cartaZar);
}

function actualizaCabecera() {
  document.getElementById('estado-partida').textContent =
    `Ronda ${totalRondas - rondas + 1} / ${totalRondas} · Zar: ${jugadores[jugadorZar].nombre}`;
}

function renderContenido(html) {
  document.getElementById('divContenido').innerHTML = html;
  muestraPantalla('pantallaGenerica');
  actualizaCabecera();
  const titulo = document.getElementById('titulo-turno');
  if (titulo) titulo.focus();
}

function pieCarta(numero = '') {
  return `<span class="card-footer"><span>Cartas contra<br>la humanidad.</span><span>${numero}</span></span>`;
}

function preguntaHTML(clase = '') {
  return `<article class="playing-card black-card question ${clase}">
    <div><p class="card-label">La pregunta</p><p class="card-copy">${escapaHTML(cartasPregunta[cartaZar])}</p></div>
    ${pieCarta('01')}
  </article>`;
}

function controlPartida() {
  if (rondas <= 0) {
    muestraClasificacion();
    return;
  }
  if (!preguntaLeida) {
    iniciaTurno(jugadorZar, 'zar');
    return;
  }
  const siguiente = jugadores.findIndex((jugador, i) => !jugador.estadoRonda && i !== jugadorZar);
  if (siguiente >= 0) iniciaTurno(siguiente, 'jugador');
  else avisoVoto();
}

function iniciaTurno(jugador, tipo) {
  fase = tipo === 'zar' ? 'entrega-zar' : 'entrega-jugador';
  jugadorActivo = jugador;
  seleccion = null;
  document.getElementById('aviso-juego').textContent = '';
  const esZar = tipo === 'zar';
  renderContenido(`<div class="handoff">
    <p class="eyebrow">${esZar ? 'Tú mandas esta ronda' : 'Que nadie mire tu mano'}</p>
    <p class="handoff-icon" aria-hidden="true">${esZar ? '✳' : '↗'}</p>
    <h1 id="titulo-turno" class="screen-title" tabindex="-1">Pasa el dispositivo a<br><span class="handoff-name">${escapaHTML(jugadores[jugador].nombre)}.</span></h1>
    <p class="intro">${esZar ? 'Eres el zar. Lee la pregunta en voz alta y después elige tu respuesta favorita.' : 'Cuando tengas el dispositivo, abre tus cartas. Solo tú debes verlas.'}</p>
    <button type="button" class="button button-primary" onclick="${esZar ? 'turnoZar()' : `turnoJugador(${jugador})`}">${esZar ? 'Ver pregunta' : 'Ver mis cartas'} <span aria-hidden="true">→</span></button>
  </div>`);
}

function turnoZar() {
  if (fase !== 'entrega-zar') return;
  fase = 'pregunta';
  preguntaLeida = true;
  renderContenido(`<div class="question-screen"><p class="eyebrow">Léela en voz alta</p>
    <h1 id="titulo-turno" class="screen-title" tabindex="-1">Aquí empieza el desastre.</h1>
    ${preguntaHTML('question-large')}
    <button type="button" class="button button-primary" onclick="controlPartida()">Que respondan los demás <span aria-hidden="true">→</span></button></div>`);
}

function cartaRespuestaHTML(id, texto, accion, numero) {
  return `<button type="button" id="${id}" data-card class="playing-card white-card answer" aria-pressed="false" onclick="${accion}">
    <span class="card-copy">${escapaHTML(texto)}</span>
    <span class="selection-badge" aria-hidden="true">✓ Elegida</span>${pieCarta(String(numero).padStart(2, '0'))}
  </button>`;
}

function controlesSeleccion(accion, etiqueta) {
  return `<div class="confirm"><p id="seleccion-estado" role="status" aria-live="polite">Toca una carta para seleccionarla. Confirma cuando lo tengas claro.</p>
    <button type="button" id="confirmar-carta" class="button button-primary" disabled onclick="${accion}">${etiqueta} <span aria-hidden="true">→</span></button></div>`;
}

function turnoJugador(nJugador) {
  if (fase !== 'entrega-jugador' || jugadorActivo !== nJugador) return;
  fase = 'mano';
  seleccion = null;
  const respuestas = jugadores[nJugador].cartas
    .map((carta, i) =>
      cartaRespuestaHTML(
        `carta-${carta}`,
        cartasRespuesta[carta],
        `seleccionaRespuesta(${nJugador},${carta})`,
        i + 1,
      ),
    )
    .join('');
  renderContenido(`<div class="game-top"><div><p class="eyebrow">Tu turno</p>
    <h1 id="titulo-turno" class="screen-title" tabindex="-1">${escapaHTML(jugadores[nJugador].nombre)}, haz lo tuyo.</h1>
    <p class="intro">Elige la respuesta más horrible. Sin presión.</p></div><span class="pill">Solo tú puedes ver tu mano</span></div>
    <div class="board">${preguntaHTML()}<section aria-label="Tus respuestas">
      <div class="hand-title"><span>Tu mano</span><span>10 cartas · Elige 1</span></div>
      <div class="hand">${respuestas}</div>
      ${controlesSeleccion(`vota(${nJugador}, seleccion)`, 'Jugar esta carta')}
    </section></div>`);
}

function marcaSeleccion(id, texto) {
  document.querySelectorAll('[data-card]').forEach((carta) => {
    const marcada = carta.id === id;
    carta.classList.toggle('selected', marcada);
    carta.setAttribute('aria-pressed', String(marcada));
  });
  document.getElementById('seleccion-estado').textContent = `Has elegido: «${texto}»`;
  document.getElementById('confirmar-carta').disabled = false;
}

function seleccionaRespuesta(nJugador, carta) {
  if (fase !== 'mano' || jugadorActivo !== nJugador || !jugadores[nJugador].cartas.includes(carta))
    return;
  seleccion = carta;
  marcaSeleccion(`carta-${carta}`, cartasRespuesta[carta]);
}

function vota(nJugador, carta) {
  if (fase !== 'mano' || jugadorActivo !== nJugador || seleccion === null || seleccion !== carta)
    return;
  const indice = jugadores[nJugador].cartas.indexOf(carta);
  if (indice < 0 || jugadores[nJugador].estadoRonda) return;
  fase = 'entrega-jugador'; // Bloquea una segunda confirmación antes de cambiar de pantalla.
  seleccion = null;
  respuestasJugador.push(nJugador);
  respuestasCarta.push(carta);
  jugadores[nJugador].cartas.splice(indice, 1);
  jugadores[nJugador].estadoRonda = true;
  reparteCarta(nJugador);
  controlPartida();
}

function avisoVoto() {
  fase = 'entrega-voto';
  seleccion = null;
  jugadorActivo = jugadorZar;
  renderContenido(`<div class="handoff"><p class="eyebrow">El veredicto</p><p class="handoff-icon" aria-hidden="true">✳</p>
    <h1 id="titulo-turno" class="screen-title" tabindex="-1">${escapaHTML(jugadores[jugadorZar].nombre)}, tú decides.</h1>
    <p class="intro">Pasa el dispositivo al zar. Todas las respuestas son anónimas: elige la que más te haga reír.</p>
    <button type="button" class="button button-primary" onclick="votaRespuestas()">Ver respuestas <span aria-hidden="true">→</span></button></div>`);
}

function respuestaCompleta(carta) {
  const pregunta = cartasPregunta[cartaZar];
  const respuesta = cartasRespuesta[carta];
  return pregunta.includes('______')
    ? pregunta.replace('______', () => respuesta)
    : `${pregunta} ${respuesta}`;
}

function votaRespuestas() {
  if (fase !== 'entrega-voto') return;
  fase = 'votacion';
  seleccion = null;
  // Mezclar una copia impide deducir autores por el orden de entrega del dispositivo.
  const candidatas = respuestasCarta.map((carta, i) => ({ carta, jugador: respuestasJugador[i] }));
  for (let i = candidatas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidatas[i], candidatas[j]] = [candidatas[j], candidatas[i]];
  }
  const respuestas = candidatas
    .map(({ carta, jugador }, i) =>
      cartaRespuestaHTML(
        `voto-${jugador}`,
        respuestaCompleta(carta),
        `seleccionaGanador(${jugador})`,
        i + 1,
      ),
    )
    .join('');
  renderContenido(`<p class="eyebrow">El zar tiene la última palabra</p>
    <h1 id="titulo-turno" class="screen-title" tabindex="-1">¿Cuál se lleva la ronda?</h1>
    <p class="intro">Lee las combinaciones y elige tu favorita. Aquí no hay respuestas correctas.</p>
    <div class="hand voting-hand">${respuestas}</div>
    ${controlesSeleccion('ganaRonda(seleccion)', 'Confirmar ganador')}`);
}

function seleccionaGanador(nJugador) {
  if (fase !== 'votacion' || !respuestasJugador.includes(nJugador)) return;
  seleccion = nJugador;
  const carta = respuestasCarta[respuestasJugador.indexOf(nJugador)];
  marcaSeleccion(`voto-${nJugador}`, respuestaCompleta(carta));
}

function ganaRonda(nJugador) {
  if (
    fase !== 'votacion' ||
    seleccion === null ||
    seleccion !== nJugador ||
    !respuestasJugador.includes(nJugador)
  )
    return;
  fase = 'resultado';
  seleccion = null;
  const ganador = jugadores[nJugador];
  const carta = respuestasCarta[respuestasJugador.indexOf(nJugador)];
  ganador.rondasGanadas++;
  renderContenido(`<div class="round-result"><p class="eyebrow">Una mala idea. Un punto más.</p>
    <h1 id="titulo-turno" class="screen-title" tabindex="-1">${escapaHTML(ganador.nombre)}<br>se lleva la ronda.</h1>
    <p class="intro">${ganador.rondasGanadas} ${ganador.rondasGanadas === 1 ? 'punto' : 'puntos'} de dudoso honor.</p>
    <article class="playing-card white-card winning-card"><p class="card-copy">${escapaHTML(respuestaCompleta(carta))}</p>
      ${pieCarta('✳')}</article>
    <button type="button" class="button button-primary" onclick="cambioRonda()">${rondas === 1 ? 'Ver clasificación' : 'Siguiente ronda'} <span aria-hidden="true">→</span></button></div>`);
}

function cambioRonda() {
  if (fase !== 'resultado') return;
  fase = 'transicion';
  seleccion = null;
  preguntaLeida = false;
  jugadores.forEach((jugador) => {
    jugador.estadoRonda = false;
  });
  respuestasJugador = [];
  respuestasCarta = [];
  rondas--;
  if (rondas > 0) {
    jugadorZar = (jugadorZar + 1) % numeroJugadores;
    reparteCartaZar();
  }
  controlPartida();
}

function muestraClasificacion() {
  fase = 'fin';
  seleccion = null;
  jugadorActivo = null;
  const ordenados = [...jugadores].sort((a, b) => b.rondasGanadas - a.rondasGanadas);
  const ganadores = ordenados.filter(
    (jugador) => jugador.rondasGanadas === ordenados[0].rondasGanadas,
  );
  const empate = ganadores.length > 1;
  const filas = ordenados
    .map((jugador, i) => {
      const puesto =
        ordenados.findIndex((otro) => otro.rondasGanadas === jugador.rondasGanadas) + 1;
      return `<li class="leaderboard-row ${i < ganadores.length ? 'leaderboard-winner' : ''}">
      <span class="leaderboard-rank">${String(puesto).padStart(2, '0')}</span>
      <span class="leaderboard-name">${escapaHTML(jugador.nombre)}</span>
      <span class="leaderboard-score">${jugador.rondasGanadas} <span>${jugador.rondasGanadas === 1 ? 'punto' : 'puntos'}</span></span></li>`;
    })
    .join('');
  document.getElementById('puntuaciones').innerHTML = `<p class="eyebrow">Fin de la partida</p>
    <h1 id="titulo-final" class="screen-title" tabindex="-1">${empate ? 'Empate en lo más alto.' : 'La peor persona.<br>La mejor puntuación.'}</h1>
    <p class="intro">${ganadores.map((jugador) => escapaHTML(jugador.nombre)).join(' y ')} ${empate ? 'comparten la victoria' : 'se lleva la victoria'}. La dignidad no la recupera nadie.</p>
    <ol class="leaderboard" aria-label="Clasificación por puntos">${filas}</ol>`;
  document.getElementById('divContenido').innerHTML = '';
  document.getElementById('estado-partida').textContent = 'Partida terminada';
  document.getElementById('aviso-juego').textContent = '';
  muestraPantalla('fin');
  document.getElementById('titulo-final').focus();
}

function reiniciarJuego() {
  location.reload();
}
