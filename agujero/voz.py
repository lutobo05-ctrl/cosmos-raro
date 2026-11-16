#!/usr/bin/env python3
"""Voz del short con Kokoro, versión ANIMADA (COSMOS RARO).
Lee las frases numeradas de «## Voz» en GUION.md y genera public/voz/voz.wav + frases.json (t0/t1 por frase).
- Velocidad distinta por frase: el gancho (frase 1) más rápido, las preguntas algo más lentas y con pausa,
  el remate final con aire.
- Procesado tipo radio: +1,5 semitonos, más presencia (3,2 kHz), compresión y limitador → suena con más energía.
- Escribe el guion con puntuación expresiva (¡!, ¿?, «…») y sin MAYÚSCULAS enteras (Kokoro las deletrearía).
Estilos (variable de entorno VOZ): ricks (por defecto: voz masculina latina, rápida y expresiva, parecida al doblaje
en español de Ricks Clips; Piper es_MX-claude-high, medida 3,7 palabras/s y tono 195 Hz frente a 3,6 y 200 Hz del doblaje),
alex_animado, alex_santa, dora, plano.
Piper: pip install --break-system-packages piper-tts ; modelo en /home/claude/tts2/vits-piper-es_MX-claude-high
(descarga: https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-es_MX-claude-high.tar.bz2).
"""
import json, os, re, subprocess
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

STYLE = os.environ.get("VOZ", "ricks")
if STYLE == "ricks":
    from piper import PiperVoice, SynthesisConfig
    PV = PiperVoice.load('/home/claude/tts2/vits-piper-es_MX-claude-high/es_MX-claude-high.onnx')
    VOICE = None
else:
    k = Kokoro('/home/claude/tts/kokoro-v1.0.onnx', '/home/claude/tts/voices-v1.0.bin')
    VOICE = {"alex_animado": "em_alex", "plano": "em_alex", "dora": "ef_dora",
             "alex_santa": 0.65 * k.get_voice_style('em_alex') + 0.35 * k.get_voice_style('em_santa')}[STYLE]
SEMI = {"ricks": -0.5, "alex_animado": 1.5, "alex_santa": 1.0, "dora": 0.5, "plano": 0.0}[STYLE]

def synth(s, speed):
    if STYLE == "ricks":
        cfg = SynthesisConfig(length_scale=0.70 * 1.2 / speed, noise_scale=0.75, noise_w_scale=0.9)
        a = np.concatenate([c.audio_float_array for c in PV.synthesize(s, syn_config=cfg)])
        return a.astype(np.float32), PV.config.sample_rate
    a, r = k.create(s, voice=VOICE, speed=speed, lang='es'); return a.astype(np.float32), r
BASE = float(os.environ.get("VOZ_SPEED", "1.2"))
lines = [l.split('. ', 1)[1] for l in open('GUION.md').read().split('## Voz')[1].strip().splitlines() if re.match(r'^\d+\. ', l)]

def speed_for(i, s):
    if STYLE == "plano": return BASE - 0.08
    if i == 0: return BASE + 0.08                    # hook: punchy
    if s.strip().endswith('?'): return BASE - 0.08   # questions land
    if i == len(lines) - 1: return BASE - 0.05       # the final joke breathes
    return BASE

sr = 22050 if STYLE == 'ricks' else 24000; out = [np.zeros(int(0.05 * sr), np.float32)]; t = 0.05; segs = []
for i, s in enumerate(lines):
    a, sr = synth(s, speed_for(i, s))
    nz = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 200): nz[-1] + 420]
    segs.append({'i': i + 1, 'text': s, 't0': round(t, 3), 't1': round(t + len(a) / sr, 3), 'words': len(s.split())})
    out.append(a); t += len(a) / sr
    gap = 0.0 if i == len(lines) - 1 else (0.28 if s.strip().endswith(('?', '…')) else 0.11)
    out.append(np.zeros(int(gap * sr), np.float32)); t += gap
os.makedirs('public/voz', exist_ok=True)
sf.write('public/voz/voz_raw.wav', np.concatenate(out), sr)
r = 2 ** (SEMI / 12)
af = (f"asetrate={sr}*{r:.4f},aresample={sr},atempo={1/r:.4f}," if SEMI else "") + \
     "highpass=f=90,equalizer=f=3200:t=q:w=1.2:g=5,equalizer=f=200:t=q:w=1:g=2," \
     "acompressor=threshold=-20dB:ratio=4:attack=5:release=60:makeup=6,alimiter=limit=0.9"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'public/voz/voz_raw.wav', '-af', af, 'public/voz/voz.wav'], check=True)
json.dump(segs, open('frases.json', 'w'), ensure_ascii=False, indent=1)
d = t; W = sum(s['words'] for s in segs)
print(f'voz {STYLE}: {d:.2f}s, {W} palabras, {W/d:.2f} palabras/s')
for s in segs: print(s['i'], s['t0'], s['t1'], round(s['t0'] * 30), s['text'][:50])
