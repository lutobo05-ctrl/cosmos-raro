#!/bin/bash
# Sube un MP4 a la rama huérfana «videos» del repo público y escribe su URL pública (raw) en la salida.
# Uso: herramientas/subir_video.sh ruta/AAAA-MM-DD_tema.mp4      (máx. 95 MB; GitHub rechaza > 100 MB)
# Mantiene solo los últimos 21 vídeos y reescribe la rama en un único commit para que el repo no engorde.
set -euo pipefail
SRC="$1"; NAME="$(basename "$SRC")"; REPO=https://github.com/lutobo05-ctrl/cosmos-raro
SIZE=$(stat -c %s "$SRC"); [ "$SIZE" -lt 99000000 ] || { echo "ERROR: $NAME pesa $SIZE bytes (>95 MB)"; exit 1; }
W=/tmp/cosmos-videos; rm -rf "$W"
if git ls-remote --exit-code --heads "$REPO" videos >/dev/null 2>&1; then
  git clone -q --depth 1 --branch videos "$REPO" "$W"
else
  git init -q "$W"; git -C "$W" checkout -q --orphan videos; git -C "$W" remote add origin "$REPO"
fi
cp "$SRC" "$W/$NAME"
cd "$W"; ls -1 *.mp4 | sort | head -n -21 | xargs -r rm -f
printf '# Vídeos de COSMOS RARO\nURLs públicas que usa Metricool para publicar. Solo se guardan los últimos 21.\n' > README.md
git checkout -q --orphan tmp && git add -A && git -c user.name="Cosmos Raro bot" -c user.email="noreply@anthropic.com" commit -qm "videos $(date +%F)"
git branch -D videos -q 2>/dev/null || true; git branch -m videos
git push -q -f origin videos
echo "https://raw.githubusercontent.com/lutobo05-ctrl/cosmos-raro/videos/$NAME"
