# Verificación del rediseño 0.1

## Ejecutar el juego

Abrir `index.html` en un navegador. No requiere instalación, compilación ni conexión a Internet. La partida es local: los jugadores comparten el mismo dispositivo.

## Pruebas funcionales

Requiere Node.js 20 o posterior:

```sh
node --test tests/game.test.cjs
node --check main.js
```

Las pruebas ejecutan la lógica y los dos mazos reales en un contexto aislado. El documento se sustituye por un doble mínimo: estas pruebas no garantizan por sí solas el diseño en navegador.

## Prueba opcional en Chrome/Chromium

Sin paquetes npm. Indicar la ruta de un navegador instalado; con Node 20, habilitar su WebSocket experimental:

```sh
BROWSER_BIN='C:/Program Files/Google/Chrome/Application/chrome.exe' node --experimental-websocket --test tests/browser.test.cjs
```

El script abre un perfil temporal, prueba la aplicación real mediante DevTools y cierra ese navegador al acabar. Guarda capturas en `.superpowers/verification/` (ignorado por Git). Sin `BROWSER_BIN` o WebSocket, esta prueba se omite explícitamente.

## Comprobado automáticamente en Chrome

- [x] Portada y mano a 360, 768 y 1440 px, sin desbordamiento horizontal.
- [x] Formulario de quince jugadores y error con foco en el primer nombre vacío.
- [x] Nombres con HTML se muestran literalmente, sin crear elementos ni ejecutar código.
- [x] Diez cartas y botón de confirmación inicialmente desactivado.
- [x] Selección con fondo distinto, etiqueta visible y `aria-pressed`.
- [x] Confirmación mediante tecla Enter y foco trasladado a la entrega del dispositivo.
- [x] Ocultación de la mano anterior después de confirmar.
- [x] Regreso desde configuración al inicio con foco restaurado y enlace del logotipo válido al abrir el archivo local.
- [x] Respuestas del zar mezcladas sin alterar la asociación entre cartas y autores (prueba de lógica).
- [x] Partida completa de quince jugadores, dos rondas, votación, resultado y clasificación.
- [x] Una sola pantalla visible al terminar.
- [x] Nombres de 80 caracteres y textos sin espacios de 300 caracteres, sin recortar cartas.
- [x] Transiciones desactivadas cuando se solicita movimiento reducido.
- [x] Sin excepciones JavaScript durante ese recorrido.

También se ejecuta en Node una partida de quince jugadores y diez rondas, comprobando diez cartas válidas por mano y diez puntos totales.

## Revisión visual

Capturas de portada de escritorio, selección móvil/escritorio y clasificación móvil revisadas durante la implementación. La selección se identifica por inversión de contraste, borde y etiqueta, sin depender de un color de acento.

## Comprobaciones manuales pendientes

- [ ] Safari y Firefox, y dispositivos táctiles físicos.
- [ ] Zoom de navegador al 200 % y tamaño de texto del sistema.
- [ ] Recorrido completo con lector de pantalla y solo tabulador.
- [ ] Preferencias estéticas finales con el usuario sobre las pantallas no incluidas en la maqueta inicial.
