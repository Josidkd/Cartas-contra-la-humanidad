# Calidad y CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir lint, formato, unitarios con 80 % de cobertura y E2E verificables localmente y en GitHub Actions.

**Architecture:** Conservar node:test y el juego estático. c8 mide main.js ejecutado en VM; Playwright reemplaza el smoke test CDP y usa un servidor HTTP local de desarrollo. GitHub Actions ejecuta los mismos comandos npm.

**Tech Stack:** Node.js, npm, ESLint 9, Prettier 3, c8, Playwright Test y GitHub Actions; Node 22 en CI y herramientas compatibles con el Node 20.18 local.

**Spec:** `docs/superpowers/specs/2026-11-18-calidad-ci-design.md`

## Global Constraints

- Mantener el juego estático, su diseño, reglas y contenido de cartas.
- Dependencias solo de desarrollo; instalación reproducible con npm ci y lockfile versionado.
- Exigir al menos 80 % en líneas, sentencias, funciones y ramas del código del juego; excluir mazos de datos, pruebas y herramientas, no lógica difícil.
- E2E mediante la interfaz real; no invocar funciones internas para avanzar la partida.
- Publicar los cambios en la PR #1, sin fusionar ni modificar master.
- No cambiar reglas de protección del repositorio sin autorización adicional.

## Review Focus

- Cobertura falsa por archivos VM con rutas relativas: main.js debe figurar con ejecución real y no como archivo vacío.
- E2E omitidos por falta de navegador: npm run test:e2e debe fallar en vez de omitir tests.
- Diferencias Windows/Linux y finales de línea: mismas órdenes npm y archivos LF.
- Pruebas inestables por preguntas/respuestas aleatorias: seleccionar por rol/estado, no por texto aleatorio ni esperas fijas.
- CI verde con controles incompletos: verificar jobs, artefactos y fallo de los umbrales; no confundir workflow con protección de rama.

---

### Task 1: Herramientas, lint, formato y cobertura

**Files:** crear `package.json`, `package-lock.json`, `eslint.config.cjs`, `.prettierrc.json`, `.prettierignore`, `.gitattributes`, `.c8rc.json`; modificar `.gitignore`, `tests/helpers/dom.cjs`, `tests/game.test.cjs` y los archivos que requieran formato o declaraciones explícitas de globales.
**Interfaces:** scripts `lint`, `format`, `format:check`, `test:unit`, `test:coverage`; `npm test` ejecuta unitarios con cobertura. Conservar `loadGame()` y `configure(game,count,rounds)`.

- [ ] Registrar baseline de unitarios. Crear manifest y configuraciones, instalar dependencias de desarrollo compatibles y generar lockfile.
- [ ] Ejecutar lint, comprobación de formato y cobertura contra el estado previo a sus correcciones; registrar fallos reales sin ocultarlos.
- [ ] Configurar entornos browser/script y Node/CommonJS; declarar las funciones usadas por HTML y las variables compartidas entre scripts sin desactivar globalmente no-undef ni no-unused-vars.
- [ ] Corregir avisos legítimos y aplicar Prettier con LF; ignorar solo archivos generados/dependencias. No cambiar reglas del juego ni textos de los mazos.
- [ ] Dar rutas absolutas a node:vm. Ejecutar c8 con inclusión de main.js, all y check-coverage; exigir 80 en las cuatro métricas. Escribir casos sobre comportamiento real para cubrir ramas faltantes antes de cualquier corrección de producción.
- [ ] Comprobar salidas negativas: ESLint con referencia indefinida por stdin, Prettier con entrada mal formateada y c8 check-coverage con umbral superior al informe actual. Cada control debe devolver código distinto de cero sin dejar archivos de prueba en producción.
- [ ] Ejecutar `npm run lint`, `npm run format:check`, `npm test`; resultados esperados: sin avisos/errores, main.js presente y cuatro métricas >=80. Confirmar que un archivo no ejecutado no desaparece del informe.
- [ ] Commit de herramientas y pruebas, sin publicar hasta completar los controles restantes.

### Task 2: E2E obligatorios con Playwright

**Files:** crear `playwright.config.cjs`, `scripts/serve.cjs`, `tests/e2e/game.spec.cjs`; reemplazar/eliminar `tests/browser.test.cjs`; actualizar scripts npm y `.gitignore`.
**Interfaces:** `npm run test:e2e` ejecuta Chromium escritorio y móvil sin skips; `npm run serve` sirve solo archivos públicos en 127.0.0.1:4173. Playwright inicia/detiene el servidor con webServer y usa baseURL http://127.0.0.1:4173.

- [ ] Escribir E2E antes de configurar su ejecución completa: errores y foco, quince jugadores, selección sin envío, cambio de carta, confirmación por teclado, privacidad entre turnos, voto sin nombres y partida completa de dos rondas hasta nueva partida. Acceder mediante roles, etiquetas y estado visible.
- [ ] Ejecutar y registrar los fallos de infraestructura iniciales; añadir Playwright como dependencia de desarrollo, configurarlo y descargar Chromium.
- [ ] Crear servidor HTTP de desarrollo con allowlist de index.html, style.css, main.js y dos mazos; responder 404 a rutas privadas, 405 a métodos no admitidos y errores controlados al leer archivos. Probar esas respuestas con peticiones HTTP reales.
- [ ] Añadir proyectos escritorio 1440x1000 y móvil 360x800, cobertura de viewport 768, movimiento reducido y nombres/textos largos usando inputs o contenido real. No reemplazar cartas ni llamar funciones internas para simular una partida.
- [ ] Configurar testDir aislado, forbidOnly en CI, reintentos solo en CI, trazas/capturas en fallos e informe HTML. Eliminar el smoke test opcional y su documentación obsoleta.
- [ ] Ejecutar `npm run test:e2e`: todos los escenarios deben pasar en ambos proyectos sin skips; ejecutar también lint, formato y unitarios con cobertura.
- [ ] Commit de E2E y servidor de desarrollo.

### Task 3: Workflow, documentación y verificación remota

**Files:** crear `.github/workflows/quality.yml`, `README.md`; actualizar `docs/visual-checklist.md` y los documentos/formatos que correspondan.
**Interfaces:** jobs estables `lint-format`, `unit-coverage`, `e2e`; los comandos son exactamente los scripts npm de tareas 1 y 2.

- [ ] Crear workflow para push, pull_request y workflow_dispatch, Ubuntu y Node 22, npm ci y caché npm; permisos contents: read y concurrency por referencia.
- [ ] Job lint-format ejecuta lint y format:check; unit-coverage ejecuta test:coverage y sube coverage; e2e instala Chromium con `npx playwright install --with-deps chromium`, ejecuta test:e2e y sube playwright-report/test-results incluso en fallos, sin continue-on-error.
- [ ] Documentar instalación, comandos, cuatro umbrales, ubicación de informes y diferencia entre workflow fallido y reglas de protección. Explicar controles recomendados para master sin modificar su configuración.
- [ ] Ejecutar `npm ci`, `npm run lint`, `npm run format:check`, `npm run test:coverage`, `npm run test:e2e` y `git diff --check`; todos deben terminar en cero. Revisar workflow contra esas órdenes y confirmar que informes/dependencias están ignorados.
- [ ] Revisar el diff completo frente a la especificación, con revisión propia si no hay herramienta de subagentes. Registrar cualquier limitación o desviación.
- [ ] Commit y push a version-0.1; actualizar PR #1 con controles y cobertura reales. Consultar la ejecución de Actions y comunicar su estado real; corregir fallos si los hay sin relajar controles.

## Revisión del plan

Los tres entregables comparten solo comandos npm y artefactos de salida definidos arriba. La cobertura de VM se comprueba expresamente y E2E ya no depende de una variable local. Los cinco riesgos tienen verificación local o remota asignada. Las dependencias añadidas son exclusivamente de desarrollo y no cambian cómo se distribuye el juego.
