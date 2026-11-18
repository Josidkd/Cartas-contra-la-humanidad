# Rediseño visual de Cartas contra la humanidad

## Intención y aprobación
Trasladar al juego real la dirección editorial monocroma de la maqueta `editorial-monocroma-v2.html`, aprobada en conversación. El usuario aprobó también extenderla a configuración de jugadores, turnos y clasificación final. La selección debe resultar inequívoca: carta negra, texto blanco, borde blanco y etiqueta «✓ Elegida».

## Objetivos
- Portada con título protagonista, cartas decorativas y configuración clara.
- Configuración de 3–15 jugadores y 2–10 rondas, con nombres etiquetados y errores en pantalla.
- Cabecera con ronda actual y zar; pantallas privadas para pasar el dispositivo.
- Pregunta compacta al responder y mano completa de diez cartas en cuadrícula adaptable.
- Selección previa y confirmación explícita tanto al responder como al elegir ganador; no consumir cartas al seleccionarlas.
- Pantalla de ganador de ronda y clasificación final ordenada, contemplando empates.
- Mantener los mazos, el juego local en un dispositivo y las reglas existentes.

## Enfoques
1. **Editorial monocromo (elegido):** jerarquía tipográfica, márgenes amplios, cartas negras y blancas. Es coherente con el juego y con la maqueta aprobada.
2. Mesa de juego: más profundidad y movimiento; aumenta el trabajo visual sin mejorar necesariamente la claridad.
3. Fiesta con color: más expresivo, pero menos fiel a la identidad que el usuario eligió.

## Diseño
- Fondo oscuro, tarjetas de respuesta marfil, tipografía sans-serif y títulos de peso alto. No requiere fuentes externas.
- Contenedor centrado, controles táctiles de al menos 44 px y disposición móvil primero. Sin anchos que sumen padding fuera del viewport.
- Estados de hover, foco y selección distintos. La selección mantiene `aria-pressed`; los errores y confirmaciones se anuncian mediante regiones de estado.
- No bloquear zoom; respetar movimiento reducido.
- En móvil, pregunta sobre la mano; en escritorio, pregunta lateral. Las cartas se expanden con textos largos, sin recortar contenido.
- El formulario de nombres admite hasta quince jugadores sin solapar botones.
- El anuncio de ganador precede al avance de ronda. Al finalizar se muestra únicamente la clasificación, con todos los empatados reconocidos.

## Restricciones y no objetivos
- HTML, CSS y JavaScript sin frameworks ni dependencias de ejecución nuevas.
- Conservar `componentes/cartasPregunta.js` y `componentes/cartasRespuesta.js`.
- No añadir multijugador remoto, cuentas, persistencia ni reglas nuevas.
- No reutilizar la maqueta como implementación: es referencia visual, no una partida funcional.
- Insertar nombres y cartas como texto seguro; no interpretar nombres de usuario como HTML.
- Los detalles no fijados por la maqueta (formulario, anuncio de ganador y clasificación) seguirán el mismo sistema visual; esta es una decisión de implementación, no una pantalla ya revisada por el usuario.

## Verificación
Pruebas sin dependencias con Node para validación, selección/confirmación, progresión y clasificación. Comprobación manual de teclado, anchos móvil/escritorio, textos largos y privacidad entre turnos. Si no hay navegador automatizable disponible, documentar esa limitación en vez de afirmar una validación visual que no se ha realizado.
