# Android · APK 0.2.1

## Instalar y compartir

El APK se publica en [GitHub Releases](https://github.com/Josidkd/Cartas-contra-la-humanidad/releases/tag/v0.2.1) como `cartas-contra-la-humanidad-0.2.1.apk`, junto con su suma SHA-256. El tag inicial v0.2.0 se conserva sin sobrescribir; su publicación quedó bloqueada por el verificador de assets.

1. Descarga el APK en el móvil. Requiere **Android 7.0/API 24 o posterior** y Android System WebView/Chrome actualizado.
2. Ábrelo desde el navegador o la aplicación de archivos.
3. Si Android lo solicita, permite instalar aplicaciones desde **esa aplicación concreta**. Puedes revocar ese permiso después.
4. Instala el juego. Android o Play Protect pueden mostrar advertencias por tratarse de una aplicación distribuida fuera de Google Play; no se garantiza que desaparezcan.

Comparte **solo el APK** y, si quieres, su checksum o enlace de descarga. No compartas ninguna copia de las claves de firma. El juego contiene lenguaje y contenido para adultos.

El juego funciona sin conexión y se juega compartiendo un dispositivo. No hay cuentas, analítica, backend ni multijugador remoto. La partida no se guarda si cierras/recargas la app o Android termina el proceso.

## Integridad y actualizaciones

- ID estable: `io.github.josidkd.cartascontralahumanidad`.
- Versión: `0.2.1`; Android versionCode: `3`.
- Certificado público esperado: [`android/signing-certificate.sha256`](../android/signing-certificate.sha256).
- El archivo `.apk.sha256` permite comprobar que la descarga coincide con el APK publicado. Por ejemplo, en PowerShell: `Get-FileHash .\cartas-contra-la-humanidad-0.2.1.apk -Algorithm SHA256`.

Una futura actualización debe conservar **applicationId y clave de firma**, e incrementar versionCode. No hace falta desinstalar la app si esos requisitos se cumplen. No se promete conservar partidas: esta versión no tiene persistencia.

## Compilar

Necesitas Node >=22, JDK21 y SDK Android (plataforma 36, build-tools 36.0.0 y platform-tools). No se cambian automáticamente las instalaciones globales.

```sh
npm ci
npm run android:sync
cd android
./gradlew :app:lintDebug :app:assembleDebug
```

En Windows, utiliza `gradlew.bat`. `android:sync` genera `dist/` copiando solamente los cinco archivos públicos y sincroniza los assets con Capacitor 8.6.2. No copies el repositorio completo dentro de la aplicación.

El APK debug es de desarrollo, no el archivo firmado que se publica para compartir. El APK release exige `ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD` y `ANDROID_KEY_ALIAS`; sin ellos, Gradle falla expresamente. Nunca pases contraseñas como argumentos de un comando ni las escribas en Gradle o en el repositorio.

## Pruebas

Se conservan ESLint, Prettier, cobertura del 80 % y los E2E Playwright. El job `android-debug` añade:

- Rechazo de un build release sin credenciales de firma.
- Android lint, compilación debug y compilación de la prueba instrumentada.
- Rechazo del APK debug por el verificador de publicación.
- Emulador Android API35 con Wi-Fi y datos desactivados.
- Smoke test Espresso Web: arranque de los assets empaquetados, configuración de jugadores y lectura de una pregunta real, mediante la interfaz.

Los informes nativos se adjuntan como `android-reports`. Eso no sustituye pruebas en un móvil físico, otras versiones Android o distintas versiones de System WebView.

## Firma y copia de seguridad

La clave privada no está en Git, en el APK ni en los artefactos de CI. El APK contiene únicamente el certificado público necesario para verificar la firma.

El material de recuperación se guarda en una carpeta privada del perfil del usuario: `<perfil>/.cartas-contra-la-humanidad/signing/`. Incluye el keystore PKCS12 y `signing.local.json` con los datos para usarlo. La carpeta se protege con permisos locales. Haz una **copia de seguridad cifrada y fuera de este equipo**; si se pierde la clave, no se podrán firmar actualizaciones compatibles con las instalaciones existentes.

GitHub Actions utiliza estos secretos cifrados:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`

Las pull requests no reciben estos secretos. El workflow de release los reconstruye temporalmente solo después de que pase toda la calidad, borra el keystore incluso si falla el build y sube únicamente APK/checksum. No regeneres ni reemplaces la clave para cada build.

## Publicar una versión

1. Incrementa package.json, versión visible y versionName/versionCode Android.
2. Conserva la firma e ID; ejecuta los controles web y espera los checks Android de la rama/PR.
3. Crea un tag `v` que coincida exactamente con la versión npm y súbelo.
4. El workflow `Android APK` reutiliza toda la calidad, construye el release firmado, comprueba identidad/versión/SDK, firma/huella y lista de assets, y genera el checksum.
5. Solo si todo pasa, un job separado con `contents: write` publica el APK y checksum en GitHub Releases. La firma y las pruebas usan permisos de repositorio de solo lectura.

La ejecución manual construye y guarda un artefacto verificado, pero no publica una release salvo que la referencia de ejecución sea un tag de versión. No se debe mover un tag ya publicado para corregir una release: publica una nueva versión.

La rama `version-0.2` parte de `version-0.1`, cuyo rediseño/calidad aún no están fusionados en master. La PR Android se dirige a version-0.1 para separar ambos trabajos; publicar el APK no fusiona ninguna de las ramas.
