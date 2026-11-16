#!/usr/bin/env python3
"""Usa la voz grabada por Luis en lugar de Kokoro.
Lee voz/AAAA-MM-DD.(m4a|mp3|wav|ogg|opus) del repo, la limpia (paso alto, -18 LUFS aprox.), la parte por silencios en
tantas frases como tenga la sección «## Voz» de GUION.md y escribe public/voz/voz.wav + frases.json con el mismo formato
que voz.py, para que story.ts y el audio se sincronicen igual.
Uso: python3 voz_usuario.py <grabacion> <GUION.md> <carpeta_del_short>
Si el número de tramos no cuadra, reparte el tiempo en proporción al número de caracteres de cada frase (aproximado:
revisa las fotos de prueba en los momentos clave)."""
import json, re, subprocess, sys
import numpy as np, soundfile as sf
src, guion, out = sys.argv[1:4]
lines = [l.split('. ', 1)[1] for l in open(guion).read().split('## Voz')[1].strip().splitlines() if re.match(r'^\d+\. ', l)]
wav = f"{out}/public/voz/voz.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-ac", "1", "-ar", "24000",
                "-af", "highpass=f=80,afftdn=nf=-25,loudnorm=I=-18:TP=-2,silenceremove=start_periods=1:start_threshold=-45dB",
                wav], check=True)
a, sr = sf.read(wav); n = len(a); hop = int(0.02 * sr)
env = np.array([np.sqrt(np.mean(a[i:i + hop] ** 2)) for i in range(0, n - hop, hop)])
quiet = env < (np.percentile(env, 95) * 0.06)
gaps, i = [], 0
while i < len(quiet):
    if quiet[i]:
        j = i
        while j < len(quiet) and quiet[j]: j += 1
        if (j - i) * 0.02 >= 0.25 and i > 0 and j < len(quiet): gaps.append(((i + j) / 2 * 0.02, (j - i) * 0.02))
        i = j
    else: i += 1
need = len(lines) - 1; total = n / sr
# expected boundaries from character counts, then snap each one to the nearest pause (±1.6 s), in order
w = np.cumsum([len(l) + 12 for l in lines]); est = list(w[:-1] / w[-1] * total)
cuts, used, how = [], set(), "silencios"
for e in est:
    cand = [g for g in gaps if abs(g[0] - e) < 1.6 and g[0] not in used and (not cuts or g[0] > cuts[-1] + 0.4)]
    if cand:
        g = min(cand, key=lambda g: abs(g[0] - e) - 0.5 * g[1]); cuts.append(g[0]); used.add(g[0])
    else:
        cuts.append(max(e, (cuts[-1] + 0.5) if cuts else e)); how = "silencios + proporcional"
b = [0.0] + cuts + [total]
segs = [{"i": k + 1, "text": s, "t0": round(b[k], 3), "t1": round(b[k + 1], 3), "words": len(s.split())} for k, s in enumerate(lines)]
json.dump(segs, open(f"{out}/frases.json", "w"), ensure_ascii=False, indent=1)
W = sum(s["words"] for s in segs)
print(f"voz de Luis: {total:.1f}s, {W/total:.2f} palabras/s, cortes por {how}")
