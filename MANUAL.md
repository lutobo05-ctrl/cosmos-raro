# COSMOS RARO — manual del reel diario

Canal **«NADIE TE LO CONTÓ»** (antes Cosmos Raro; el repo y el registro conservan el nombre antiguo). YouTube Shorts en español: «una historia real con giro, cada día a las 19:00 (Madrid)». **Temas de TODO tipo** (historia, ciencia, trucos, inventos, delitos curiosos, deporte, psicología, animales, espacio…). Siempre con la fórmula de las secciones 6, 7 y 8.
Este kit contiene un short completo y probado (`agujero/`, agujero negro) y un segundo mundo de ejemplo con suelo
(`venus_world/`, superficie de Venus). Cada día se hace UN short nuevo con este mismo motor.

## 0. Reglas que no se negocian
- **Datos reales con fuente.** Cada afirmación del guion debe salir de una búsqueda web hecha ese día (NASA, ESA, revistas, museos). Las fuentes se apuntan arriba en `GUION.md` y en la descripción del vídeo. Si un dato está discutido, el guion lo dice («podría», «se cree»).
- **Nada repetido.** Lee `registro` (hoja «Cosmos Raro — registro y temas» en Drive) y no repitas tema ni gancho. YouTube no monetiza el contenido «masivo o repetitivo»: cada short debe tener su propio mundo, sus personajes o su situación y su chiste final. No vale cambiar solo el texto sobre las mismas tomas.
- **Formato:** vertical 1080×1920, 30 fps, 45–58 s, voz en español ANIMADA (ver más abajo; 3,3–3,7 palabras por segundo), **subtítulos karaoke de todo lo que dice la voz** (petición de Luis; manda sobre la Biblia de estilo, que decía «sin subtítulos»), cámara siempre en movimiento, -14 LUFS.
- **GANCHO OBLIGATORIO** en cada reel y en cada vídeo largo (petición de Luis):
  1. **Frase 1 del guion** (≤ 12 palabras): una paradoja o pregunta que sorprenda. Nunca empieces con «Hoy vamos a ver…» ni con un saludo.
  2. **Rótulo de gancho:** una pregunta corta en MAYÚSCULAS, arriba, durante los primeros 2,5 s (`subtitulos.py --gancho`). Ej.: «¿Y SI CAYERAS EN UN AGUJERO NEGRO?».
  3. **Imagen de gancho:** el fotograma 0 ya es la imagen más espectacular del vídeo (el clímax o una versión de él), con la cámara empujando hacia dentro. Nada de planos de presentación lentos al principio.
  4. **Sonido de gancho:** golpe (timpani o boom) y whoosh en el fotograma 0.
  5. Comprueba el fotograma 0 y el 45 en las fotos de prueba: tiene que haber movimiento, texto y algo raro a la vista.
- **Voz animada:** `VOZ=ricks python3 voz.py` (estilo elegido por Luis; opciones: alex_animado, alex_santa, dora). Escribe el guion para que se diga con energía: frases cortas, ¡exclamaciones!, ¿preguntas al espectador?, «…» antes de los giros. No escribas palabras enteras en MAYÚSCULAS en la voz, porque Kokoro las deletrea.
- **Estilo:** el del paquete `shorts-animados-claude` (caricatura 3D: personajes planos con contorno en un mundo 3D pintado, tinta, desenfoque y gradación). La guía manda: `SKILL.md` + `referencias/BIBLIA_DE_ESTILO.md` de ese repositorio.

## 1. Preparar el entorno (unos 5 min)
```bash
cd /home/claude
git clone --depth 1 https://github.com/luispablovillasenor-afk/shorts-animados-claude ext/repo
# el kit (este zip) se descarga de Drive y se descomprime en /home/claude/kit
cd kit/agujero && npm install   # (kit = este repo clonado) --no-audit --no-fund --loglevel=error
pip install --break-system-packages -q kokoro-onnx soundfile scipy opencv-python-headless
mkdir -p /home/claude/tts && cd /home/claude/tts
curl -sSL -o voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
curl -sSL -o kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
```
Chrome está en `/usr/bin/google-chrome`. Renderizar SIEMPRE con `gl: "swangle"` (no hay GPU).

## 2. Crear el short del día
1. Copia `kit/agujero` en `/home/claude/hoy` (enlaza `node_modules` con `ln -s`) y renombra la composición en `src/Root.tsx`.
2. **Tema y gancho:** una historia REAL y poco conocida con giro, de cualquier tema (alterna temas: no dos días seguidos del mismo). Comprueba cada dato en 2 fuentes. PROHIBIDO repetir historias de Ricks Clips u otros canales del formato (lista en la sección 8): busca historias nuevas. El gancho sigue la regla 1 de la sección 8 (alguien hace algo absurdo, en pasado).
3. **Guion** (`GUION.md`, 160–200 palabras, unos 12 bloques). Fórmula de la Biblia: gancho → «Imagínate…» → escalada con cifras concretas → giro «Espera…» → explicación «Fíjate:» con una analogía cotidiana → «Por suerte… / Por desgracia…» → remate irónico que cierra el gancho. Escribe los números con letras para la voz.
4. **Voz:** `python3 voz.py` (lee `## Voz` del guion, ajusta `SPEED` para quedar entre 45 y 58 s y genera `frases.json` con los tiempos). Usa `frases.json` para colocar cada acción entre 0 y 3 fotogramas antes de su palabra.
5. **Mundo y tomas** (`src/videos/bh/story.ts` y `world.ts`): reutiliza el motor (`toon.ts`, `troop.ts`, `paint.ts`, `shade.ts`, `ink.ts`, `lensblur.ts`, `grade.ts`). Escribe un mundo NUEVO para el tema. Personajes nuevos para cada historia (época y lugar de la historia); el astronauta solo si la historia es del espacio. Hay dos ejemplos: espacio (agujero negro: disco con shader, nave, relojes, ondas, escena interior) y superficie (`venus_world/`: cielo pintado, suelo, rocas, volcanes, nubes, mesa, cohete).
6. **Fotos de prueba** antes de renderizar: `node pruebas/fotos.mjs <Comp> out/t_ f1,f2,... 0.5`. Haz un collage y míralo. Arregla y repite hasta que todas las tomas se lean bien.
7. **Render:** `pruebas/render_all.sh` (tramos de unos 340 fotogramas; adapta el id y los rangos) en segundo plano, y comprueba el avance cada 10 minutos. Velocidad aproximada: 1,8–3 s por fotograma en espacio sin desenfoque y 4–5 s con desenfoque o superficie. Un short de 55 s tarda entre 1 y 1,5 h. Si el tiempo no da, baja `cInf` a 0 en más tomas.
8. **Sonido:** adapta `audio/bh_audio.py` (música sintetizada con los acordes por sección, efectos en sus fotogramas y voz encima). Objetivo: voz delante, música 5–10 dB por debajo, efectos unos 9 dB por debajo, -14 LUFS y -1 dBTP.
9. **Montaje:** une los tramos RE-CODIFICANDO con el filtro `concat` (el concat con `-c copy` falló una vez) y añade el audio. Comprueba con `ffprobe` que dura lo que debe, que es 1080×1920 y que tiene audio.
9b. **Subtítulos + rótulo de gancho:** `python3 herramientas/subtitulos.py frases.json final_sin_subs.mp4 final.mp4 --gancho "¿PREGUNTA GANCHO?"`. Salen trozos de 2–4 palabras con la palabra activa en amarillo, en el centro-abajo (y ≈ 1320). Las cifras de arriba (MARKS) siguen en y ≈ 300. Que no se pisen con el rótulo: no pongas MARKS en los primeros 3 s.
10. **Revisión:** saca un collage de 16–18 fotogramas repartidos por todo el vídeo y míralo. Pasa `python3 ext/repo/herramientas/medir_30fps.py final.mp4 medida`: cámara en movimiento en más del 70 % de los fotogramas y 0 cortes. Si algo se ve mal, rehaz solo ese tramo.

## 3. Trampas ya conocidas (no repetirlas)
- **Tarjetas vistas desde arriba:** si la cámara mira casi en vertical, el personaje se ve de canto. Usa `face: true` (la tarjeta copia la orientación de la cámara).
- **Estirar a un personaje** (espaguetización y similares): ancla la cabeza y deja que el cuerpo crezca hacia abajo (`head: true`, `drop = 1.3·(sy−1)`).
- **Brillo:** los shaders aditivos con colores por encima de 2 queman la imagen. Disco: hot 2,0 / warm 1,35 y ganancia 0,55.
- **Objetos que salen del plano:** el encuadre vertical es estrecho (unos ±12–14° en horizontal). Comprueba que lo importante cabe.
- **Desenfoque:** ya va con menos muestras (PRE 12 y MAIN 28/10). Es el paso más caro; pon `cInf: 0` en las tomas abiertas.
- **Final:** el último plano debe tener algo en pantalla hasta la última palabra. Que no acabe en cielo vacío.
- **Brillo general:** apunta a 0,30–0,50 de media. El agujero negro salió en 0,20, demasiado oscuro para el móvil.

## 4. Publicar (YouTube + TikTok + Instagram vía Metricool)
1. **Copia ligera:** H.264 en dos pasadas a unos 1,2 Mbps (unos 8–10 MB), con nombre `AAAA-MM-DD_tema.mp4`.
2. **URL pública:** `herramientas/subir_video.sh AAAA-MM-DD_tema.mp4` sube el vídeo a la rama `videos` (pública) y escribe la URL raw. Si falla (sin permiso de push), no hay publicación automática: entrega a Luis (punto 5).
3. **Metricool**, una sola llamada a `createScheduledPost` con `media: [URL]`, fecha de HOY a las 19:00 Europe/Madrid y `autoPublish: true`. En `providers` van solo las redes que `getBrandSettings` muestre conectadas:
   - `youtube`: `youtubeData {title, type:"short", privacy:"public", madeForKids:false, category:"SCIENCE_TECHNOLOGY", tags:[…]}`.
   - `tiktok`: `tiktokData {title, isAigc:true}` (declara la IA, como pide TikTok).
   - `instagram`: `instagramData {type:"REEL", showReelOnFeed:true, isAiGenerated:true}`.
   - `text` (descripción): 2 líneas que amplían el dato + «Fuentes:» con 2–3 enlaces + «Un dato imposible cada día a las 19:00 → suscríbete» + `#Shorts #historiasreales #curiosidades` + 2 etiquetas del tema.
   - `firstCommentText`: una pregunta para que la gente comente, del tipo «¿Tú te habrías tirado? 👇».
4. **Título:** como mucho 60 caracteres, gancho + 1 emoji como mucho. Evita el clickbait falso: el título tiene que ser verdad.
5. **Entregar siempre a Luis** (SendUserFile con el MP4 + SendUserMessage con título, descripción y etiquetas), diciendo si ya está programado o si tiene que subirlo él.
6. Nunca subas vídeos a Drive (el conector solo admite unos 3 MB).
7. **Registro:** fila del día en la hoja de Drive + `reels/AAAA-MM-DD_tema/` en el repo (guion, frases.json, story.ts, world.ts) + push a main.

## 4b. La voz de Luis (los miércoles)
El estratega de los domingos deja el guion del miércoles en `voz/AAAA-MM-DD_guion.md` y se lo manda a Luis. Si el miércoles existe `voz/AAAA-MM-DD.(m4a|mp3|wav|ogg|opus)` en el repo (haz `git pull` antes), usa su voz: `python3 herramientas/voz_usuario.py voz/AAAA-MM-DD.m4a GUION.md <carpeta_del_short>` genera `voz.wav` y `frases.json` en vez de Kokoro. Revisa las fotos de prueba en los momentos clave, porque los cortes son aproximados (±0,5 s). En la descripción pon «Narrado por Luis». Si no hay grabación, usa Kokoro como siempre.

## 4c. Vídeo largo semanal (domingos)
`herramientas/largo.py semana.json salida` monta un vídeo 16:9 de 8–10 min con los reels de la semana. Para cada reel lleva: tarjeta de capítulo narrada + el reel en el centro con datos en los laterales + «Y además…» con un dato extra investigado. Cierra con una despedida que pide suscribirse. Empieza con un **AVANCE-GANCHO** (`gancho` + `gancho_rotulo` en semana.json): 8–15 s con los planos más espectaculares de la semana (`momento` de cada reel), una frase hablada que prometa algo («Quédate hasta el final…») y la pregunta en grande. Todas las narraciones llevan subtítulos karaoke automáticamente. Los reels se descargan de la rama `videos`. Se publica como `youtubeData.type:"video"` el domingo a las 12:00, con los capítulos de `salida_capitulos.txt` en la descripción. Las horas de visualización de los vídeos largos son la otra vía para monetizar (8.000 h en 12 meses para quien entre desde febrero de 2027); los Shorts no cuentan para esas horas.

## 4d. Objetivos de monetización (para el estratega)
- Escalón 1 (donaciones, membresías, tienda): 500 suscriptores + 3 subidas en 90 días + 3 M de visualizaciones de Shorts en 90 días o 3.000 h de vídeos largos en 12 meses.
- Escalón 2 (anuncios): 1.000 suscriptores + 10 M de visualizaciones de Shorts en 90 días o 4.000 h. Desde el 1 de febrero de 2027, para quien entre nuevo: 20 M de visualizaciones de Shorts o 8.000 h.
- YouTube no monetiza el contenido «masivo o repetitivo»: cada reel con mundo y chiste propios, la voz de Luis cada semana y fuentes reales.

## 5. Plazo
La tarea empieza sobre las 12:40 (Madrid). Si a las 18:15 el vídeo no está listo, programa lo que haya solo si está completo y revisado. Si no lo está, avisa y deja el día como «pendiente».

## 6. Fórmula Ricks Clips (referencia estudiada, 16-11-2026)
Fuente: análisis de revid.ai de los 15 Shorts de @RicksClips3000 (167 M de vistas) + medición de 20 vídeos a 30 fps en la Biblia de estilo del skill.
- Duración 56–78 s (mediana 64 s), ~200–280 palabras. La voz empieza en el cuadro 1–4.
- 7 tiempos del guion:
  1. GANCHO (0–3 s): una frase llana de 9–14 palabras sobre algo raro, sin explicar el porqué. Sin fechas ni contexto.
  2. PLANTEAMIENTO (3–12 s): quién, dónde, UN número exacto y qué está en juego, con la cámara recorriendo el set.
  3. EL QUE SE BURLA (12–20 s): una frase sarcástica corta, en primer plano grande.
  4. EL PROTAGONISTA (~20 s): tranquilo, no se explica.
  5. ESCALADA (20–40 s): tres sucesos raros cada vez mayores; el burlón cada vez más chulo.
  6. «VERÁS,» (una sola vez, a mitad): el truco explicado con algo cotidiano (soplar la sopa), 3–5 frases cortas.
  7. REMATE (últimos ~10 s): se ENSEÑA, no se explica, y cae sobre el burlón. La última frase es la mayor revelación. Sin moraleja.
- El «burlón»: un vecino, un jefe, un rival, un rey, un científico escéptico… y en el espacio puede ser un científico escéptico, un rey, un astronauta chulo… el universo le da la lección.
- Narrador: uno solo, enérgico, «rápido pero natural», como un chaval contándoselo a un amigo. Sin fechas ni títulos, máximo un nombre.
- Subtítulos: 1–2 palabras a la vez, blanco grueso con borde oscuro.
- Luz: sol cálido y bajo contra sombras frías azul-violeta. Sombras nunca negras; el verde nunca es el color principal.
- Cámara: baja y abierta, deslizándose siempre (en movimiento ~65 % de los cuadros), casi sin cortes duros (0–1 por vídeo); las transiciones son movimientos de cámara o destellos de 4 cuadros.

## 7. Comprobación medida obligatoria (paso del vídeo de Mr omi)
Antes de dar un reel por bueno: `python3 herramientas/medir_30fps.py reel.mp4 /tmp/medida` y comparar con la referencia.
Medición del reel del agujero negro (16-11) frente a la referencia:
| Medida | Referencia | Agujero negro | Qué hacer |
|---|---|---|---|
| Brillo medio | 0.43–0.54 | 0.20 | Subir luz: nunca negro; de noche o en el espacio, azul noche/violeta |
| Píxeles casi negros | 2 % | 56 % | Nunca negro puro: fondo mínimo ~#1a1440 |
| Saturación | 0.38–0.65 | 0.82 | Bajar ~25 % la saturación del grade |
| Duración de cada movimiento de cámara | ~23 cuadros, entrada y salida suaves | 8 cuadros | Deslizamientos más largos (20–25 cuadros) |
| Cortes duros | 0–1 | 0 | Bien |
| Cámara en movimiento | ~65 % | 73 % | Bien |
Otras reglas que encontraron sus agentes: líneas de tinta en ~3/4 de los bordes (que el desenfoque no las borre),
personajes de 3,5 cabezas de alto con brazos y piernas finos, sombras violetas al atardecer (no marrones),
luz cálida en el planteamiento y azul noche cuando empieza el «Verás,».
Si el reel falla en 2 o más medidas, se corrige antes de publicar.

## 8. Cómo escribe Ricks Clips: 20 guiones transcritos (16-11-2026)
Últimos 20 Shorts de @RicksClips3000 (0,56–34,8 M de vistas, de 41 a 78 s, mayoría de 58 a 66 s), transcritos desde YouTube.
Primeras frases reales (así abren):
- «He loaded the shotgun with gold and fired it into the walls of the mine.» (5 M)
- «He drilled 82 holes into the wood because down the hill an army is marching…» (8,4 M)
- «They painted the jail cell pink.» (11 M)
- «He saw gaps into a railroad every 39 ft.» (29,6 M)
- «He poured cooking oil into the sea with a pirate ship so close behind them…» (16,7 M)
- «They buried a man alive with a bell tied to his finger.» (13,5 M)
- «He put a bronze ball in a dragon's mouth and told the emperor: if this ever falls out, run.» (34,8 M)
- «A man snuck into a family's house every night and moved every single thing one inch to the left.» (10 M)
- «If you plant a tree beside an empty road, cars will steer right into it.» (5,8 M)

REGLAS SACADAS DE LOS 20:
1. **Gancho = «Él/Ellos + verbo en pasado + acción absurda»** (14 de 20). Un acto concreto y visual, nunca un dato ni una pregunta. Los 6 restantes: «Si haces X, pasa Y», «Hay un botón… y nadie puede pulsarlo», «Imagina que…».
2. **«Verás,» (You see) en 17 de 20.** Dos usos: justo después del gancho para dar contexto en 1 frase, y/o a 10–15 s del final para explicar el truco.
3. **Burla en diálogo, corta y graciosa**, siempre de un testigo: «¿Vamos a luchar o a rallar queso?», «A Barbie le va a encantar». 1–3 líneas por vídeo.
4. **Comparaciones cotidianas exageradas**: «como un paraguas humano», «perdería una carrera contra uno que lleva dos cervezas», «¿alguna vez has soplado la sopa?».
5. **Escalada con conectores**: «Pero se pone más raro», «Entonces», «Hasta que una noche», «A la mañana siguiente».
6. **Un número exacto** en el planteamiento (82 agujeros, 15 minutos, 39 pies, 47 arañazos).
7. **Final en BUCLE**: en 7 de 20 la última frase se corta en la última palabra («…justo cuando un tren entra en la…») para que el vídeo vuelva a empezar y se vea dos veces. El remate es una imagen, no una moraleja.
8. Sin fechas, sin introducción, máximo un nombre (Gary, Jerry, Eddie), personajes anónimos («su colega», «el rico»).
9. Títulos: «Por qué X…», «Cómo un X…», «El X que…», «Esta forma salvó…». Nunca «Curiosidades de…».

ADAPTACIÓN A COSMOS RARO (ejemplos de gancho):
- «Un astronauta metió una pluma y un martillo en la mochila y los soltó a la vez.»
- «Pintaron de negro el satélite más caro del mundo.»
- «Él apostó su carrera a que Venus giraba al revés.»
Cada reel debe tener un protagonista que hace algo raro, un burlón y un remate visual que cae sobre el burlón.

## 9. Voz del canal: «ricks» (16-11-2026)
Elegida por Luis: voz parecida a la del doblaje en español de Ricks Clips. Medido en su vídeo (pista «Español (US)»): tono mediano 200 Hz (152–267), muy expresiva.
Nuestra voz `VOZ=ricks` (Piper es_MX-claude-high, por defecto en `voz.py`): 3,7 palabras/s, tono 195 Hz (159–248).
Instalación: `pip install --break-system-packages piper-tts` y descargar/descomprimir en /home/claude/tts2/
https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-es_MX-claude-high.tar.bz2
