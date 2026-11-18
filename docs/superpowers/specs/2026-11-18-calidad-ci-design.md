# Calidad automatizada y GitHub Actions

## Intención y aprobación

El usuario pide lint, Prettier, E2E, cobertura unitaria mínima del 80 % y comprobación de todo en GitHub Actions antes de continuar. En conversación aprobó mantener node:test, añadir c8, ESLint y Prettier, sustituir el smoke test opcional por Playwright y actualizar la rama version-0.1 y su PR existente, sin fusionar.

## Enfoques

- Elegido: node:test + c8, ESLint + Prettier y Playwright. Reutiliza la lógica probada y limita la migración a E2E.
- Alternativa: migrar unitarios a Vitest. Añade trabajo sin aportar una ventaja necesaria en esta aplicación estática.

## Alcance

- Incorporar package.json y package-lock.json con dependencias solo de desarrollo y comandos npm reproducibles.
- ESLint sobre el JavaScript de producción, tests, scripts y configuraciones; tratar correctamente scripts clásicos de navegador y CommonJS sin desactivar globalmente las reglas de calidad.
- Prettier sobre JS, HTML, CSS, JSON, Markdown y YAML. Elegir LF para resultados consistentes entre Windows y Linux; ignorar dependencias e informes generados.
- Conservar node:test y medir el código ejecutable del juego con c8. Exigir al menos 80 % en líneas, sentencias, funciones y ramas; producir informes de texto, HTML y LCOV. No sumar mazos de datos, pruebas ni herramientas al porcentaje del juego. Incluir main.js aunque no se ejecute; ampliar la inclusión si se añaden módulos de lógica.
- Garantizar que la ejecución mediante node:vm identifica los archivos de producción por rutas absolutas y que la cobertura refleja realmente su ejecución, no solo el helper de pruebas.
- Sustituir tests/browser.test.cjs por E2E Playwright en Chromium de escritorio (1440 px) y móvil (360 px), con comprobaciones adicionales a 768 px. Interactuar con formularios, botones y teclado; no invocar funciones internas para avanzar una partida.
- Cubrir configuración inválida, quince jugadores, partida completa, selección/cambio/confirmación, ocultación entre turnos, votación anónima, resultado y clasificación, nueva partida, navegación/foco y nombres tratados como texto. Preservar las comprobaciones de textos largos y movimiento reducido que sean relevantes.
- Servir la aplicación por HTTP local durante E2E con un servidor solo de desarrollo. Sin introducir servidor ni dependencias en el juego distribuido.

## GitHub Actions

- Un workflow en push, pull_request y workflow_dispatch; Node 22 en Ubuntu.
- Jobs separados para lint/formato, unitarios/cobertura y E2E. Instalación con npm ci y caché de npm.
- E2E instala Chromium y dependencias de sistema mediante Playwright; no depende de Chrome preinstalado, variables locales ni omisiones silenciosas.
- Fallar ante cualquier error o umbral incumplido. Publicar cobertura e informes E2E; conservar trazas y capturas de fallos. Permisos contents: read y cancelación de ejecuciones obsoletas en una misma rama/PR.
- Actualizar documentación con comandos locales y controles que deben exigirse en la protección de master. El workflow por sí solo no impide fusionar: no cambiar reglas de protección del repositorio sin autorización adicional.

## Restricciones y no objetivos

- Mantener el juego estático, su diseño, reglas y contenido de cartas.
- No rebajar umbrales ni excluir ramas difíciles para alcanzar el porcentaje.
- No añadir frameworks de aplicación, servicios de cobertura externos, despliegues ni secretos de CI.
- Publicar los cambios en la PR #1, sin fusionar ni modificar master.

## Decisiones de implementación

La sintaxis concreta de configuración, versiones compatibles y selectores accesibles quedan a cargo del implementador. Un refactor de producción solo se justifica si resuelve un defecto demostrado o facilita medición real sin alterar comportamiento. Todas las modificaciones se verificarán con las mismas órdenes que ejecutará CI.

## Aceptación

npm ci, npm run lint, npm run format:check, npm run test:coverage y npm run test:e2e deben terminar correctamente. La cobertura debe mostrar main.js con las cuatro métricas >=80 %. Debe comprobarse que entradas con errores de lint/formato y una cobertura deliberadamente insuficiente causan salida distinta de cero. Verificar la ejecución real del workflow después del push y distinguir un resultado remoto pendiente o fallido de los resultados locales.
