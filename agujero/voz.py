import json, re, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro('/home/claude/tts/kokoro-v1.0.onnx', '/home/claude/tts/voices-v1.0.bin')
lines = [l.split('. ', 1)[1] for l in open('GUION.md').read().split('## Voz')[1].strip().splitlines() if re.match(r'^\d+\. ', l)]
SPEED = 1.2
out, t, segs, sr = [], 0.06, [], 24000
out.append(np.zeros(int(0.06 * sr), np.float32))
for i, s in enumerate(lines):
    a, sr = k.create(s, voice='em_alex', speed=SPEED, lang='es')
    a = a.astype(np.float32)
    # trim leading/trailing silence
    nz = np.where(np.abs(a) > 0.01)[0]
    a = a[max(0, nz[0] - 240): nz[-1] + 480]
    segs.append({'i': i + 1, 'text': s, 't0': round(t, 3), 't1': round(t + len(a) / sr, 3), 'words': len(s.split())})
    out.append(a); t += len(a) / sr
    gap = 0.16 if i < len(lines) - 1 else 0.0
    out.append(np.zeros(int(gap * sr), np.float32)); t += gap
v = np.concatenate(out)
sf.write('public/voz/voz.wav', v, sr)
json.dump(segs, open('frases.json', 'w'), ensure_ascii=False, indent=1)
W = sum(s['words'] for s in segs)
print(f'dur {len(v)/sr:.2f}s words {W} wps {W/(len(v)/sr):.2f}')
for s in segs: print(s['i'], s['t0'], s['t1'], round(s['t0']*30), s['text'][:50])
