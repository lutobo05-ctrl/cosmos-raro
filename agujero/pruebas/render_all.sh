#!/bin/bash
cd /home/claude/agujero
for r in "0 339" "340 679" "680 1019" "1020 1359" "1360 1701"; do
  set -- $r; o=out/part_$1.mp4
  [ -f $o ] && continue
  node pruebas/render.mjs AgujeroNegro out/tmp_part.mp4 $1 $2 1 2 > out/log_$1.txt 2>&1 && mv out/tmp_part.mp4 $o || { echo "fail $1" >> out/render_status.txt; exit 1; }
  echo "ok $1 $(date +%T)" >> out/render_status.txt
done
echo ALLDONE >> out/render_status.txt
