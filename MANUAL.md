# COSMOS RARO — manual del reel diario

Canal de YouTube Shorts en español: «un dato imposible del universo, cada día a las 19:00 (Madrid)».
Este kit contiene un short completo y probado (`agujero/`, agujero negro) y un segundo mundo de ejemplo con suelo
(`venus_world/`, superficie de Venus). Cada día se hace UN short nuevo con este mismo motor.

## 0. Reglas que no se negocian
- **Datos reales con fuente.** Cada afirmación del guion debe salir de una búsqueda web hecha ese día (NASA, ESA, revistas, museos). Las fuentes se apuntan arriba en `GUION.md` y en la descripción del vídeo. Si un dato está discutido, el guion lo dice («podría», «se cree»).
- **Nada repetido.** Lee `registro` (hoja «Cosmos Raro — registro y temas» en Drive) y no repitas tema ni gancho. YouTube no monetiza el contenido «masivo o repetitivo»: cada short debe tener su propio mundo, sus personajes o su situación y su chiste final. No vale cambiar solo el texto sobre las mismas tomas.
- **Formato:** vertical 1080×1920, 30 fps, 45–58 s, voz en español (Kokoro `em_alex`, a 3,3–3,7 palabras por segundo), sin subtítulos (solo cifras o palabras sueltas arriba), cámara siempre en movimiento, -14 LUFS.
- **Estilo:** el del paquete `shorts-animados-claude` (caricatura 3D: personajes planos con contorno en un mundo 3D pintado, tinta, desenfoque y gradación). La guía manda: `SKILL.md` + `referencias/BIBLIA_DE_ESTILO.md` de ese repositorio.

## 1. Preparar el entorno (unos 5 min)
```bash
cd /home/claude
git clone --depth 1 https://github.com/luispablovillasenor-afk/shorts-animados-claude ext/repo
# el kit (este zip) se descarga de Drive y se descomprime en /home/claude/kit
cd kit/agujero && npm install --no-audit --no-fund --loglevel=error
pip install --break-system-packages -q kokoro-onnx soundfile scipy opencv-python-headless
mkdir -p /home/claude/tts && cd /home/claude/tts
curl -sSL -o voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
curl -sSL -o kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
```
Chrome está en `/usr/bin/google-chrome`. Renderizar SIEMPRE con `gl: "swangle"` (no hay GPU).

## 2. Crear el short del día
1. Copia `kit/agujero` en `/home/claude/hoy` (enlaza `node_modules` con `ln -s`) y renombra la composición en `src/Root.tsx`.
2. **Tema y gancho:** elige el siguiente tema «pendiente» del registro, o uno nuevo mejor. El gancho es la primera frase: una paradoja que sea verdad («En X, Y pasa al revés»). Funcionan bien: «¿Qué pasaría si…?», escalas imposibles y cosas que existen de verdad y parecen mentira.
3. **Guion** (`GUION.md`, 160–200 palabras, unos 12 bloques). Fórmula de la Biblia: gancho → «Imagínate…» → escalada con cifras concretas → giro «Espera…» → explicación «Fíjate:» con una analogía cotidiana → «Por suerte… / Por desgracia…» → remate irónico que cierra el gancho. Escribe los números con letras para la voz.
4. **Voz:** `python3 voz.py` (lee `## Voz` del guion, ajusta `SPEED` para quedar entre 45 y 58 s y genera `frases.json` con los tiempos). Usa `frases.json` para colocar cada acción entre 0 y 3 fotogramas antes de su palabra.
5. **Mundo y tomas** (`src/videos/bh/story.ts` y `world.ts`): reutiliza el motor (`toon.ts`, `troop.ts`, `paint.ts`, `shade.ts`, `ink.ts`, `lensblur.ts`, `grade.ts`). Escribe un mundo NUEVO para el tema. El astronauta (`astro()`) es la mascota del canal y sale siempre, pero en situaciones distintas. Hay dos ejemplos: espacio (agujero negro: disco con shader, nave, relojes, ondas, escena interior) y superficie (`venus_world/`: cielo pintado, suelo, rocas, volcanes, nubes, mesa, cohete).
6. **Fotos de prueba** antes de renderizar: `node pruebas/fotos.mjs <Comp> out/t_ f1,f2,... 0.5`. Haz un collage y míralo. Arregla y repite hasta que todas las tomas se lean bien.
7. **Render:** `pruebas/render_all.sh` (tramos de unos 340 fotogramas; adapta el id y los rangos) en segundo plano, y comprueba el avance cada 10 minutos. Velocidad aproximada: 1,8–3 s por fotograma en espacio sin desenfoque y 4–5 s con desenfoque o superficie. Un short de 55 s tarda entre 1 y 1,5 h. Si el tiempo no da, baja `cInf` a 0 en más tomas.
8. **Sonido:** adapta `audio/bh_audio.py` (música sintetizada con los acordes por sección, efectos en sus fotogramas y voz encima). Objetivo: voz delante, música 5–10 dB por debajo, efectos unos 9 dB por debajo, -14 LUFS y -1 dBTP.
9. **Montaje:** une los tramos RE-CODIFICANDO con el filtro `concat` (el concat con `-c copy` falló una vez) y añade el audio. Comprueba con `ffprobe` que dura lo que debe, que es 1080×1920 y que tiene audio.
10. **Revisión:** saca un collage de 16–18 fotogramas repartidos por todo el vídeo y míralo. Pasa `python3 ext/repo/herramientas/medir_30fps.py final.mp4 medida`: cámara en movimiento en más del 70 % de los fotogramas y 0 cortes. Si algo se ve mal, rehaz solo ese tramo.

## 3. Trampas ya conocidas (no repetirlas)
- **Tarjetas vistas desde arriba:** si la cámara mira casi en vertical, el personaje se ve de canto. Usa `face: true` (la tarjeta copia la orientación de la cámara).
- **Estirar a un personaje** (espaguetización y similares): ancla la cabeza y deja que el cuerpo crezca hacia abajo (`head: true`, `drop = 1.3·(sy−1)`).
- **Brillo:** los shaders aditivos con colores por encima de 2 queman la imagen. Disco: hot 2,0 / warm 1,35 y ganancia 0,55.
- **Objetos que salen del plano:** el encuadre vertical es estrecho (unos ±12–14° en horizontal). Comprueba que lo importante cabe.
- **Desenfoque:** ya va con menos muestras (PRE 12 y MAIN 28/10). Es el paso más caro; pon `cInf: 0` en las tomas abiertas.
- **Final:** el último plano debe tener algo en pantalla hasta la última palabra. Que no acabe en cielo vacío.
- **Brillo general:** apunta a 0,30–0,50 de media. El agujero negro salió en 0,20, demasiado oscuro para el móvil.

## 4. Publicar
- Sube el MP4 final a la carpeta de Drive «Cosmos Raro / videos» con el nombre `AAAA-MM-DD_tema.mp4`.
- **Metricool** (conector): programa la publicación en YouTube como Short para HOY a las 19:00 (Europe/Madrid).
  - Título: ≤ 60 caracteres, gancho + emoji como mucho. Ej.: «¿Qué pasaría si cayeras en un agujero negro? 🕳️».
  - Descripción: 2 líneas que amplían el dato, «Fuentes:» con 2–3 enlaces y los hashtags `#Shorts #espacio #universo #curiosidades #ciencia`.
  - Si Metricool no está conectado o falla: NO se publica. Deja el vídeo y los textos en Drive y avisa al usuario con una notificación.
- Añade una fila al registro: fecha, tema, gancho, título, enlace de Drive, estado (programado / pendiente de subir / error) y fuentes.

## 5. Plazo
La tarea empieza sobre las 12:40 (Madrid). Si a las 18:15 el vídeo no está listo, programa lo que haya solo si está completo y revisado. Si no lo está, avisa y deja el día como «pendiente».
