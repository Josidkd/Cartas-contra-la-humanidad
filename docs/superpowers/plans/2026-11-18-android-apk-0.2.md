# Android APK 0.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar un APK Android 0.2.0 firmado, offline e instalable directamente desde GitHub.

**Architecture:** Reutilizar la web estática mediante Capacitor y un paquete de assets de lista explícita. Mantener la calidad web y añadir lint/build Android más prueba instrumentada offline. Firmar y publicar en un job aislado tras superar todos los controles.

**Tech Stack:** Capacitor core/android/cli 8.6.2, Node >=22, JDK 21, Android SDK 36/minSdk 24, Gradle generado por Capacitor, GitHub Actions; node:test, c8, ESLint, Prettier y Playwright existentes.

**Spec:** `docs/superpowers/specs/2026-11-18-android-apk-0.2-design.md`

## Global Constraints

- No tocar master ni fusionar PRs; no modificar protección de ramas.
- Trabajar en version-0.2 y mantener version-0.1 intacta.
- App ID io.github.josidkd.cartascontralahumanidad; versión 0.2.0 y versionCode 2.
- Juego offline, sin backend ni Google Play; sin alterar las reglas ni contenido de cartas.
- Conservar umbrales del 80 % en líneas, sentencias, funciones y ramas.
- No registrar ni publicar claves, contraseñas o tokens; no pasar contraseñas en argumentos de procesos.
- Firma release solo con código de confianza; ninguna PR recibe los secretos de firma.
- Publicar v0.2.0 con APK firmado y SHA-256 solo tras superar los controles.

## Review Focus

- Assets sobrantes o secretos incluidos en el APK: comprobar lista exacta y limpieza de dist, inspeccionar assets del APK.
- App en blanco o dependiente de Internet: arranque y configuración en un emulador con conectividad desactivada.
- Firma diferente entre builds: huella esperada, keystore persistente y comprobación apksigner.
- Secretos filtrados por logs/artefactos: revisar argumentos, variables, cifrado y permisos del workflow; solo publicar APK y checksum.
- CI web verde pero Android roto: mantener un job nativo obligatorio y esperar su resultado antes de etiquetar/publicar.

---

### Task 1: Assets y herramientas para Capacitor

**Files:** crear `scripts/build-web.cjs`, `tests/build-web.test.cjs`, `capacitor.config.json`; modificar `package.json`, `package-lock.json`, `.gitignore`, `.prettierignore`, `eslint.config.cjs`, `index.html` y documentación de versión/Node.
**Interfaces:** `buildWebAssets(sourceRoot, outputDir)` exportado desde scripts/build-web.cjs; `npm run build:web` genera dist; `npm run android:sync` ejecuta build:web y cap sync android. La aplicación web sigue abriéndose con index.html.

- [ ] Registrar baseline y disponer de Node 22 mediante herramienta portable/temporal, sin cambiar el Node global. Instalar versiones idénticas 8.6.2 de core/android/cli con lockfile.
- [ ] Escribir pruebas antes del empaquetador: copiar exactamente cinco archivos públicos, conservar contenido y rutas relativas, borrar un archivo obsoleto en dist y no copiar un archivo privado de prueba.
- [ ] Ejecutar `node --test tests/build-web.test.cjs`; esperado: fallo por empaquetador ausente.
- [ ] Implementar buildWebAssets con APIs fs de Node y lista explícita; generar dist, ignorar outputs y configurar webDir=dist, appId/appName aprobados, sin server.url ni live reload remoto.
- [ ] Actualizar npm/HTML a 0.2.0 y scripts de pruebas para incluir el empaquetador. Ampliar ignores de herramientas generadas, no del código fuente propio. Mantener cobertura solo del código del juego, no inflarla con tareas de copia.
- [ ] Ejecutar instalación reproducible, lint, formato, unitarios/cobertura, build:web y E2E. Esperado: todo pasa, cuatro métricas >=80 %, assets exactos y contenido de mazos intacto.
- [ ] Commit de empaquetado y versión.

### Task 2: Contenedor y verificación Android

**Files:** generar `android/` mediante Capacitor; modificar Gradle/manifest/recursos propios y crear `android/app/src/androidTest/java/io/github/josidkd/cartascontralahumanidad/OfflineSmokeTest.java`; añadir workflow/job de comprobación Android y documentación.
**Interfaces:** `npm run android:sync`; Gradle `lintDebug`, `testDebugUnitTest`, `assembleDebug` y `connectedDebugAndroidTest`. El emulador ejecuta el APK con Wi-Fi y datos desactivados.

- [ ] Generar plataforma Android con cap add android, conservar wrapper y fuentes necesarios; ignorar cachés, builds, local.properties y assets copiados por sync. No ignorar fuentes/configuraciones nativas mantenidas.
- [ ] Configurar versionName=0.2.0 y versionCode=2; usar minSdk24/SDK36/JDK21 del template. Añadir icono/splash monocromos propios y revisar teclado/áreas seguras sin reescribir el juego.
- [ ] Escribir la prueba instrumentada offline: esperar a que cargue la web local, comprobar el formulario inicial, avanzar a configuración y verificar campos etiquetados. Interactuar con la interfaz mediante Espresso Web; no simular el juego llamando funciones internas. Cualquier espera de arranque debe estar acotada y observar el estado real.
- [ ] Añadir al workflow de calidad un job android-debug después de los tres jobs web: Node22, JDK21, SDK, npm ci, android:sync, Android lint/build y smoke test en emulador API35 x86_64. Sin secretos de release.
- [ ] Publicar la rama/PR 0.2 y ejecutar Actions para observar fallos nativos si los hay. Corregir causas, no reducir controles. Esperado: build, lint y prueba instrumentada pasan.
- [ ] Commit de plataforma y comprobación Android; no etiquetar release todavía.

### Task 3: Firma estable y secretos autorizados

**Files:** configuración release en `android/app/build.gradle`; utilidades de configuración solo si son reutilizables sin contener secretos; material privado fuera del repositorio en el perfil del usuario.
**Interfaces:** secretos `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`; Gradle lee keystore temporal y contraseña desde entorno. Documentar huella pública SHA-256.

- [ ] Revisar que no hay una clave previa configurada; no reemplazar una firma existente sin consultar. Elegir ruta privada fuera del repositorio y verificar exclusión de archivos keystore/jks y credenciales locales.
- [ ] Obtener JDK21/keytool temporal desde fuente oficial si no existe, verificando su checksum. Generar clave RSA y contraseña aleatoria con APIs criptográficas; usar storepass/keypass por entorno, no argumentos con valores. Alias estable, validez apropiada para actualizaciones.
- [ ] Guardar copia local privada del keystore y datos de recuperación. No imprimir secretos ni subirlos como artefactos. Extraer solo certificado/huella pública para verificación.
- [ ] Obtener la clave pública de GitHub Actions; cifrar los valores con sealed boxes de una biblioteca estándar y registrar los tres secretos mediante API autenticada. No persistir tokens; comprobar nombres presentes sin leer/imprimir valores.
- [ ] Configurar firma release únicamente si existen las variables necesarias; fallar claramente si faltan. Un debug build no utiliza ni necesita esa configuración privada.
- [ ] Verificar que los archivos y diff solo contienen referencias a secretos, rutas no privadas y certificado público. Commit de configuración, nunca del material de firma.

### Task 4: APK release y publicación 0.2.0

**Files:** crear `.github/workflows/android-release.yml`; adaptar `.github/workflows/quality.yml` para reutilización; actualizar README y documentación Android/instalación/backup.
**Interfaces:** workflow de release para tags v* y ejecución manual; reutiliza calidad completa. Job de firma/publicación con contents: write, condicionado al éxito de calidad. Archivo final `cartas-contra-la-humanidad-0.2.0.apk` y checksum SHA-256.

- [ ] Hacer reutilizable el workflow de calidad con workflow_call y evitar duplicar runs de tags innecesariamente. Mantener controles en pushes de ramas y pull requests.
- [ ] Crear release workflow: npm ci, android:sync, reconstrucción del keystore en RUNNER_TEMP, assembleRelease y limpieza always. No ejecutar comandos de PR no confiables con secretos. No usar continue-on-error para eludir controles.
- [ ] Verificar con herramientas Android applicationId, versionName, versionCode, firma y huella. Inspeccionar el paquete para excluir archivos privados; generar SHA-256 y subir solo APK/checksum como artefactos/release assets.
- [ ] Documentar Android mínimo, instalación desde origen permitido, advertencias, actualización con la misma firma y necesidad de backup externo. Indicar ruta de la copia privada en la entrega, sin revelar contraseña ni clave.
- [ ] Ejecutar npm ci y todos los controles locales posibles; revisar el diff completo como pase separado (revisión propia si no hay subagentes). Confirmar que checks web y Android de version-0.2 están verdes.
- [ ] Crear PR hacia version-0.1, sin fusionar; subir tag v0.2.0 del commit verificado. Esperar workflow release, corregir fallos sin relajar controles y comprobar que el APK y checksum están adjuntos a la release.
- [ ] Entregar enlace de descarga, compatibilidad, resultados de verificación y ubicación de backup. No afirmar prueba en un móvil físico si solo se probó un emulador.

## Revisión del plan

Las interfaces compartidas son dist, android:sync, tareas Gradle y nombres de secretos explícitos. La firma tiene un paso separado para evitar usar material privado en checks de PR. El release depende de toda la calidad, no solo de compilar. Los cinco riesgos tienen prueba o inspección asignada; la publicación no modifica las ramas previas.
