# Rediseño visual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar la maqueta editorial aprobada al recorrido completo del juego, con selección inequívoca y confirmación explícita.

**Architecture:** Conservar la aplicación estática y sus mazos. Mantener el control de la partida en `main.js`, con funciones de renderizado y selección claras; sustituir las plantillas inseguras por escape de texto o nodos DOM. No añadir herramientas de compilación.

**Tech Stack:** HTML, CSS, JavaScript; pruebas `node:test` y `node:vm` con DOM mínimo de prueba, sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-11-18-rediseno-visual-design.md`

## Global Constraints

- HTML, CSS y JavaScript sin frameworks ni dependencias de ejecución nuevas.
- Conservar `componentes/cartasPregunta.js` y `componentes/cartasRespuesta.js`.
- Configuración de 3–15 jugadores y 2–10 rondas.
- La selección debe resultar inequívoca: carta negra, texto blanco, borde blanco y etiqueta «✓ Elegida».
- No consumir cartas al seleccionarlas.
- No bloquear zoom; respetar movimiento reducido.
- Insertar nombres y cartas como texto seguro; no interpretar nombres de usuario como HTML.

## Review Focus

- Quince nombres, nombres largos y contenido HTML literal: formulario utilizable sin ejecutar contenido.
- Cambio de selección y doble confirmación: una sola respuesta consumida por turno.
- Ronda final y empates: clasificación correcta, sin pantallas de partida superpuestas.
- Diez cartas y textos largos a 360 px: ninguna carta cortada ni desbordamiento horizontal.
- Paso de dispositivo y teclado: no mostrar la mano anterior y mantener foco visible.

---

### Task 1: Estructura editorial y configuración

**Files:** modificar `index.html`, `style.css`, `main.js`; crear `tests/game.test.cjs`.
**Interfaces:** conservar `creaPartida()`, `creaFormularioJugadores(numero)`, `creaJugadores()` y `reiniciarJuego()`; agregar `escapaHTML(texto)` para plantillas y `muestraPantalla(id)` para visibilidad exclusiva.

- [x] Escribir pruebas que carguen los scripts con `node:vm` y un DOM mínimo: aceptar extremos 3/15 y 2/10, rechazar valores fuera de rango, fracciones y nombres vacíos; escapar `<`, `>`, `&`, comillas en nombres.
- [x] Ejecutar `node --test tests/game.test.cjs`; comprobar que las nuevas expectativas fallan antes de modificar producción.
- [x] Rehacer la estructura semántica de `index.html`: idioma, viewport ampliable, portada, formulario con etiquetas, cabecera y regiones de estado; eliminar IDs duplicados.
- [x] Aplicar en `style.css` el sistema de la maqueta: contenedor centrado, jerarquía editorial, controles de al menos 44 px, cuadrícula adaptable y tarjetas de altura mínima, sin alturas que recorten texto.
- [x] Adaptar configuración en `main.js` con errores locales, validación numérica entera y nombres seguros. Mantener estados de juego y mazos.
- [x] Ejecutar las pruebas; verificar quince campos y mensajes de error en el DOM de prueba.

### Task 2: Turnos, cartas y confirmación

**Files:** modificar `main.js`, `style.css`, `tests/game.test.cjs`.
**Interfaces:** conservar `controlPartida()`, `iniciaTurno(jugador,tipo)`, `turnoZar()`, `turnoJugador(jugador)`, `vota(jugador,carta)`, `votaRespuestas()`. Agregar `seleccionaRespuesta(jugador,carta)` y `seleccionaGanador(jugador)`; seleccionar solo actualiza estado/DOM, confirmar llama al flujo existente una vez.

- [x] Añadir pruebas: seleccionar no consume carta ni avanza; cambiar de selección deja solo una marcada; confirmar consume una carta, repone hasta diez y pasa turno; confirmar de nuevo no registra otra respuesta.
- [x] Ejecutar pruebas y comprobar fallos de las expectativas nuevas.
- [x] Implementar cabecera de ronda y zar, entrega privada del dispositivo, pregunta lateral/compacta y mano completa de diez cartas.
- [x] Implementar selección de alto contraste, etiqueta «✓ Elegida», `aria-pressed`, foco visible y botón de confirmación inicialmente desactivado. Distinguir selección de hover.
- [x] Aplicar el mismo patrón al voto del zar, conservando anonimato hasta confirmar ganador.
- [x] Ejecutar pruebas, incluyendo paso al siguiente jugador sin conservar la mano anterior en el contenido visible.

### Task 3: Resultado de ronda y clasificación

**Files:** modificar `main.js`, `style.css`, `tests/game.test.cjs`; crear `docs/visual-checklist.md` y `.gitignore` si no existe.
**Interfaces:** `ganaRonda(jugador)` registra una sola victoria y muestra resultado; `cambioRonda()` continúa únicamente desde ese resultado; `muestraClasificacion()` ordena copia de jugadores sin alterar el orden de turnos.

- [x] Añadir pruebas: ganador suma una vez, continuar reduce una ronda, la última ronda muestra solo el final, clasificación descendente, empates reconocidos y nombres tratados como texto.
- [x] Ejecutar pruebas y confirmar fallos antes de implementar.
- [x] Sustituir el `alert` de ganador por pantalla propia con carta ganadora y botón de continuación; renderizar clasificación ordenada y nueva partida.
- [x] Ignorar `.superpowers/` en `.gitignore`, sin borrar las maquetas. Documentar comprobaciones visuales: 360/768/1440 px, diez cartas, textos largos, quince jugadores, teclado, zoom y movimiento reducido.
- [x] Ejecutar `node --test tests/game.test.cjs`, `node --check main.js` y `git diff --check`; todos deben terminar con código cero.
- [x] Comprobar el recorrido completo en Chrome real abriendo `index.html` como archivo local; pruebas adicionales de 360/768/1440 px y capturas. La aplicación no requiere servidor.
- [x] Revisar el diff contra la especificación y presentar los cambios sin incluir los archivos locales del servidor de maquetas.

## Revisión del plan

Cobertura: portada/configuración en tarea 1, turnos/selección en tarea 2, resultados/final en tarea 3. Las interfaces conservan el flujo actual; no se cambian los mazos ni se introduce infraestructura. Los cinco riesgos de Review Focus tienen pruebas funcionales o una comprobación visual explícita; no se confunde un test de DOM mínimo con una validación de navegador.
