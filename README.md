# Cartas contra la humanidad · 0.2.1

Juego local para **3–15 jugadores** que comparten un dispositivo. Preguntas negras, respuestas blancas y una clasificación de dudoso honor.

## Jugar

Abre `index.html` en tu navegador. La aplicación no requiere compilación, instalación ni conexión a Internet. El contenido de las cartas está dirigido a adultos.

## Android

La versión 0.2 añade un APK firmado para Android 7.0 o posterior, con System WebView actualizado. Descarga el instalador desde [GitHub Releases](https://github.com/Josidkd/Cartas-contra-la-humanidad/releases/tag/v0.2.1).

Consulta [docs/android.md](docs/android.md) para instalación, firma, actualizaciones, copia de seguridad y compilación. La app reutiliza el mismo juego offline; no requiere Google Play ni servicios externos.

## Desarrollo

Necesitas **Node.js >=22** y npm, también para las herramientas de Capacitor. GitHub Actions utiliza Node 22. No es necesario cambiar el Node global para jugar abriendo `index.html`.

```sh
npm ci
npm run serve
```

Abre <http://127.0.0.1:4173>. El servidor de desarrollo solo expone los archivos públicos del juego, no el repositorio completo.

## Controles de calidad

```sh
npm ci
npx playwright install chromium
npm run quality
```

En Linux, para instalar también las dependencias de sistema del navegador:

```sh
npx playwright install --with-deps chromium
```

| Comando                              | Comprobación                                                |
| ------------------------------------ | ----------------------------------------------------------- |
| `npm run lint`                       | ESLint, sin warnings permitidos                             |
| `npm run format:check`               | Prettier: JS, HTML, CSS, JSON, Markdown y YAML              |
| `npm run format`                     | Aplica el formato del proyecto                              |
| `npm run test:unit`                  | Pruebas del juego y pruebas HTTP del servidor de desarrollo |
| `npm run test:coverage` / `npm test` | Pruebas y umbrales de cobertura con c8                      |
| `npm run test:e2e`                   | Playwright en Chromium escritorio y móvil                   |
| `npm run quality`                    | Todos los controles anteriores, sin modificar archivos      |

### Cobertura mínima

Se exige **80 % por archivo** en las cuatro métricas: **líneas, sentencias, funciones y ramas**. Incumplir cualquiera hace fallar el comando y el job de CI.

El código del juego está en `main.js`, incluido explícitamente aunque no se ejecute. No se cuentan tests, scripts de desarrollo ni mazos de datos para inflar el porcentaje. Si se extraen módulos de lógica, deben añadirse a `include` en `.c8rc.json`. La cobertura se obtiene solo de node:test, no de los E2E.

Informes generados:

- `coverage/index.html`: cobertura navegable; también LCOV y resumen JSON.
- `playwright-report/index.html`: informe E2E.
- `test-results/`: trazas y capturas cuando falla un E2E.

```sh
npx playwright show-report
```

Los E2E recorren formularios, selección, turnos privados, voto, resultados, clasificación y nueva partida con la interfaz real. El servidor arranca y se detiene automáticamente. Sin Chromium instalado, **fallan**: no se omiten silenciosamente. Los proyectos cubren escritorio y emulación móvil; esta última no equivale a probar un dispositivo físico.

### Dependencias de cobertura

Las versiones de `glob` y `minimatch` de `test-exclude` se fijan mediante overrides para evitar avisos de seguridad de sus rangos transitivos. Son dependencias exclusivamente de desarrollo; al actualizarlas deben comprobarse tanto la cobertura real como el caso de un archivo no ejecutado.

## GitHub Actions

El workflow [`Quality`](.github/workflows/quality.yml) se ejecuta en cada **push**, **pull request** y ejecución manual. Usa Ubuntu, Node 22 y `npm ci` con el lockfile. Ejecuta tres jobs web independientes y un job Android que depende de ellos:

1. **`lint-format`**: ESLint y Prettier.
2. **`unit-coverage`**: pruebas y cobertura mínima; adjunta el informe.
3. **`e2e`**: instala Chromium y sus dependencias, ejecuta escritorio/móvil y adjunta informes y trazas.
4. **`android-debug`**: después de los controles web, ejecuta lint/build Android y una prueba offline en emulador. No utiliza secretos de release.

Los artefactos se conservan siete días, también cuando las pruebas fallan. Los informes y dependencias locales están excluidos de Git.

### Impedir fusiones con controles fallidos

Un workflow fallido **no impide por sí solo** fusionar. Para exigirlo, un administrador debe crear una regla de protección/ruleset para `master`, activar los status checks requeridos y seleccionar `lint-format`, `unit-coverage`, `e2e` y `android-debug` cuando aparezcan tras la primera ejecución. Es recomendable exigir que la rama esté actualizada y no permitir omitir estos controles.

El workflow `Android APK` reutiliza esos controles al recibir un tag de versión y publica el APK solo después de validar firma, versión y assets. Sus secretos de firma no se pasan a los checks de PR.

Este cambio añade las comprobaciones, pero **no modifica la protección del repositorio** ni fusiona la PR.

Más detalle sobre los escenarios y las comprobaciones manuales pendientes en [docs/visual-checklist.md](docs/visual-checklist.md).
