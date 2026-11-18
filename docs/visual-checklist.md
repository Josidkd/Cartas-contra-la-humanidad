# Verificación del juego 0.1

## Ejecución

El juego sigue siendo estático: se puede abrir `index.html` sin instalar herramientas ni conectarse a Internet. Para desarrollo y E2E se utiliza un servidor HTTP local que solo expone los cinco archivos públicos de la aplicación.

## Controles automatizados

```sh
npm ci
npx playwright install chromium
npm run quality
```

`npm run quality` exige lint, formato, pruebas con cobertura y E2E. Ninguna prueba E2E se omite por falta de navegador: si no se instaló Chromium, el comando falla.

### Unitarios y cobertura

`npm run test:coverage` ejecuta las pruebas node:test del juego y las pruebas HTTP del servidor de desarrollo. El documento de los unitarios se sustituye por un doble mínimo; el juego y sus mazos reales se ejecutan en node:vm con rutas absolutas.

c8 incluye `main.js` aunque no se ejecute y exige un mínimo del 80 % por archivo en líneas, sentencias, funciones y ramas. No se cuentan pruebas, herramientas ni mazos de datos para aumentar el porcentaje. Si se añaden módulos de lógica hay que incorporarlos a la inclusión de `.c8rc.json`.

Informes en `coverage/`: HTML (`index.html`), LCOV y resumen JSON, además de la salida de consola. Para comprobar cobertura solo se usan unitarios; los E2E no contribuyen al porcentaje.

### E2E

`npm run test:e2e` usa Playwright y Chromium descargado, con proyectos escritorio (1440 px) y móvil (360 px). El servidor se inicia y detiene automáticamente. Los escenarios avanzan con botones, formularios y teclado, sin invocar funciones internas del juego.

- [x] Configuración inválida de jugadores y rondas; foco en el campo con error.
- [x] Quince campos de jugador y nombres con HTML tratados como texto literal.
- [x] Regreso al inicio y navegación desde el logotipo.
- [x] Diez cartas, selección/cambio visibles y confirmación inicialmente desactivada.
- [x] Selección en negro, etiqueta «✓ Elegida» y `aria-pressed`.
- [x] Confirmación con Enter, mano anterior oculta y foco en el siguiente turno.
- [x] Voto sin nombres de los autores, resultado de ronda y clasificación ordenada.
- [x] Partida completa de dos rondas con tres jugadores y reinicio.
- [x] Anchos 360, 768 y 1440 px sin desbordamiento horizontal.
- [x] Nombres de 80 caracteres y cartas reales sin recorte.
- [x] Movimiento reducido sin transiciones.
- [x] Sin errores JavaScript en el recorrido completo.

Los unitarios también cubren una partida de quince jugadores y diez rondas, empates, dobles confirmaciones, pertenencia de las cartas, reciclado de mazo y mezcla anónima de las candidatas.

Playwright guarda su informe HTML en `playwright-report/`, y trazas/capturas de fallos en `test-results/`. En CI, `forbidOnly` evita publicar tests enfocados accidentalmente y solo se aplican reintentos limitados a ese entorno.

## GitHub Actions

El workflow de calidad ejecuta los mismos comandos en push y pull requests. Los nombres estables de sus jobs son `lint-format`, `unit-coverage` y `e2e`; consulta README.md para detalles y protección de rama.

## Comprobaciones manuales pendientes

- [ ] Safari y Firefox, y dispositivos táctiles físicos (la emulación móvil no los sustituye).
- [ ] Zoom de navegador al 200 % y tamaño de texto del sistema.
- [ ] Recorrido completo con lector de pantalla y solo tabulador.
- [ ] Revisión estética final por el usuario de las pantallas nuevas.
