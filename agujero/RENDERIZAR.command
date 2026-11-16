#!/bin/bash
# Doble clic en Mac: renderiza el short de AgujeroNegro y le pone el sonido.
cd "$(dirname "$0")" || exit 1
fail() { echo; echo "ERROR: $1"; echo "Pulsa Enter para cerrar."; read; exit 1; }
command -v node >/dev/null || fail "Falta Node.js (https://nodejs.org)."
command -v ffmpeg >/dev/null || fail "Falta ffmpeg (brew install ffmpeg)."
[ -f public/voz/voz.wav ] || fail "Falta public/voz/voz.wav"
[ -f audio/mezcla.wav ] || fail "Falta audio/mezcla.wav"
[ -d node_modules ] || { echo "Instalando dependencias (solo la primera vez)..."; npm install || fail "npm install falló"; }
mkdir -p salida
echo "Renderizando (puede tardar; la ventana muestra el progreso)..."
npx remotion render src/index.ts AgujeroNegro "salida/agujero_sin_audio.mp4" --codec h264 --crf 16 --props='{"mute":true}' || fail "El render falló (mira el mensaje de arriba)."
ffmpeg -y -v error -i "salida/agujero_sin_audio.mp4" -i "audio/mezcla.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "salida/agujero_final.mp4" || fail "No se pudo unir el audio."
ffprobe -v error -show_entries format=duration -of csv=p=0 "salida/agujero_final.mp4"
echo; echo "LISTO: $(pwd)/salida/agujero_final.mp4"; echo "Pulsa Enter para cerrar."; read
