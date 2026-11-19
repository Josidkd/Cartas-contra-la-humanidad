# Android APK · versión 0.2.0

## Intención y decisiones aprobadas

El usuario quiere instalar y compartir el juego como APK, no publicarlo en Google Play. Ha pedido subirlo a GitHub como versión 0.2 y ha autorizado generar una clave de firma y guardarla cifrada en GitHub Actions. Ya existe la rama `version-0.2`, basada en `version-0.1`; la rama 0.1, su PR y master no se modificarán.

## Enfoques

- **Elegido como propuesta del implementador: Capacitor 8.6.2.** Empaqueta el HTML/CSS/JS existente, mantiene el juego offline y evita reescribir la interfaz.
- WebView Android a medida: menos infraestructura npm, pero exige mantener directamente el contenedor y sus medidas de seguridad.
- PWA: válida para instalar desde navegador, pero no entrega el APK que el usuario pide; descartada para este objetivo.

## Resultado esperado

- App «Cartas contra la humanidad», identificador estable `io.github.josidkd.cartascontralahumanidad`.
- Versión visible y npm `0.2.0`; Android `versionName=0.2.0`, `versionCode=2`.
- Android 7.0/API 24 o posterior, usando los valores de Capacitor 8: compile/target SDK 36 y JDK 21. Herramientas npm con Node 22 o posterior; sin cambiar instalaciones globales del equipo automáticamente.
- APK release firmado, instalable sin Android Studio y sin Google Play, adjunto a una release de GitHub `v0.2.0`, con suma SHA-256.
- Instrucciones para permitir la instalación desde la aplicación que abra el APK. No prometer que Android/Play Protect no muestre advertencias.
- Clave y applicationId estables para que futuras versiones con versionCode superior actualicen la app instalada sin cambiar la firma.

## Empaquetado

Un script de build copia una lista explícita de archivos públicos a `dist/`: index.html, style.css, main.js y los dos mazos. No incluye pruebas, node_modules, documentación, secretos ni archivos del repositorio. Capacitor utiliza esa carpeta como webDir; no se configura server.url ni se necesitan servicios externos durante el juego.

Se conserva la aplicación web y su comportamiento; se adaptan únicamente versión y detalles de integración Android, como área segura/teclado cuando sean necesarios. El proceso nativo y la interfaz se comprobarán sin conectividad. No se añaden cuentas, backend, analítica, publicidad ni multijugador remoto. No se promete conservar una partida si Android mata el proceso, igual que la web no dispone de persistencia.

## Calidad y Android

Se conservan ESLint, Prettier, las pruebas node:test y la cobertura mínima del 80 % en líneas, sentencias, funciones y ramas del código de juego. Los E2E Playwright seguirán probando escritorio y móvil.

Se añaden pruebas del paquete web para comprobar contenido/aislamiento, Android lint y compilación debug. Una prueba instrumentada en emulador Android comprobará el arranque offline y un recorrido básico por la interfaz empaquetada. No se presentarán los E2E web como sustitutos de una prueba Android.

## Firma y custodia

- Generar una clave RSA de release y contraseñas aleatorias localmente, sin imprimir material privado ni contraseñas y sin pasarlos como argumentos visibles a procesos.
- Conservar el keystore y los datos necesarios para recuperarlo fuera del repositorio, en una carpeta privada del usuario. Indicar su ubicación al entregar y pedir una copia de seguridad fuera del equipo.
- Guardar mediante la API de GitHub y cifrado de clave pública únicamente los secretos necesarios: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD` y `ANDROID_KEY_ALIAS`. No mostrar sus valores en logs ni conversación.
- El APK contiene el certificado público, pero nunca la clave privada. Registrar su huella pública y verificar la firma de la salida.
- Las pull requests solo compilan/prueban debug, sin acceder a secretos de firma. La firma release solo se ejecuta en un tag o ejecución manual de código de confianza. No subir el keystore como artefacto, ni siquiera temporalmente.

## GitHub y publicación

Mantener el workflow de calidad y añadir comprobaciones Android. Reutilizar esos controles desde un workflow de release; publicar el APK solo después de que terminen correctamente. El job de publicación tendrá `contents: write`; los controles de calidad solo lectura. El keystore se reconstruye en el directorio temporal del runner y se borra al terminar, incluso si falla el build.

Subir commits a `version-0.2`, crear una PR separada hacia `version-0.1` para no incluir de nuevo el rediseño ya pendiente de master y publicar el tag/release `v0.2.0` desde el commit verificado, sin fusionar ninguna rama. Tanto la PR como la release deben explicar que la 0.2 parte del trabajo aún no fusionado de la 0.1.

## Restricciones y aceptación

- No tocar master ni fusionar PRs; no modificar protección de ramas.
- No registrar ni publicar claves, contraseñas o tokens. La autorización de firma no implica permiso para exponerlos.
- No reducir los controles existentes para hacer pasar Android.
- Comprobar localmente lint, formato, unitarios, cobertura, E2E y paquete web; comprobar en Actions el build, lint nativo y smoke test offline en emulador.
- Verificar versionName, versionCode, applicationId, firma y huella del APK final, y que APK/SHA-256 están realmente adjuntos a la release.
- Distinguir compilación/instalación en emulador de comprobaciones pendientes en un móvil físico. Documentar límites y el procedimiento de futuras actualizaciones.
