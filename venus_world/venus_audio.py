# Soundtrack for the Venus short, built with the skill's audio kit (plantillas/audio: dsp, instruments, sfx_gen):
# an original synthesized music bed (pad + music box / glock arpeggio, timpani hits on the numbers), sound effects
# placed on their frames, voice on top, music ducked under speech, master at -14 LUFS with a true-peak limiter.
import json, sys
import numpy as np
from scipy import ndimage, signal
from dsp import SR, ns, dbg, rng, lp, hp, bp, place, pan, st, read_wav, write_wav, integrated, true_peak, colored, ramp, fades
import instruments as I
import sfx_gen as G

FPS = 30
TOTAL = 1548
DUR = TOTAL / FPS
N = ns(DUR)
fr = lambda f: f / FPS
R = rng(7)

# ---------------- voice ----------------
vx, vsr = read_wav("/home/claude/venus/public/voz/voz.wav")
v = vx.mean(0) if vx.ndim > 1 else vx
v = signal.resample_poly(v, SR, vsr) if vsr != SR else v
voice = np.zeros(N); voice[: min(N, len(v))] = v[:N]
voice = st(voice)
frases = json.load(open("/home/claude/venus/frases.json"))

# ---------------- music ----------------
Q = 0.6  # beat (s) = 100 bpm
M = np.zeros((2, N))
m2f = I.m2f
CH = {"Am": [57, 60, 64], "F": [53, 57, 60], "C": [48, 55, 64], "G": [55, 59, 62], "Dm": [50, 57, 62], "E": [52, 56, 59],
      "Fm": [53, 56, 60], "Bb": [46, 53, 62]}
# sections: (t0, t1, chords per 4 beats, arp instrument, energy)
SECT = [
    (0.0, fr(512), ["Am", "F", "C", "G"], "musicbox", 0.8),       # surface: curious, playful
    (fr(512), fr(800), ["Dm", "Bb", "F", "C"], "glock", 0.9),       # space: wonder
    (fr(800), fr(869), ["E"], None, 0.4),                            # "Espera…": suspended
    (fr(869), fr(1232), ["Am", "F", "C", "G"], "glock", 1.0),       # explanation, brighter
    (fr(1232), fr(1315), ["F", "C"], "musicbox", 0.8),              # por suerte
    (fr(1315), DUR, ["Fm", "Fm", "E", "E"], None, 1.0),             # por desgracia: heat, tension
]
for t0, t1, chords, arp, en in SECT:
    bar = 4 * Q
    k, t = 0, t0
    while t < t1 - 0.05:
        ch = chords[k % len(chords)]
        d = min(bar, t1 - t)
        p = I.pad([m2f(n) for n in CH[ch]], d, vel=0.5 * en, r=rng(k + int(t0 * 10)), att=0.25, rel=0.5, warm=1100)
        place(M, p, t)
        bass = I.pluck(m2f(CH[ch][0] - 12), vel=0.55 * en, r=rng(k), dur=d * 0.9, bright=0.25)
        place(M, pan(bass, 0), t)
        if arp:
            for i in range(8):
                ti = t + i * Q / 2
                if ti >= t1 - 0.05: break
                note = CH[ch][[0, 1, 2, 1, 0, 2, 1, 2][i]] + (12 if i % 4 == 2 else 12)
                x = (I.musicbox if arp == "musicbox" else I.glock)(m2f(note), vel=0.32 * en, r=rng(k * 8 + i))
                place(M, pan(x, -0.3 if i % 2 else 0.3), ti)
        t += bar; k += 1
# heat drone under P11-P12
hd = colored(ns(DUR - fr(1315)), rng(3), slope=-1.5)
hd = lp(hd, 300) * np.linspace(0, 1, len(hd)) ** 0.7
place(M, st(hd * 0.25), fr(1315))
# timpani hits on the numbers + final hit on "segundos"
for f in [335, 598, 712, 1000, 1372]:
    place(M, pan(I.timpani(m2f(40), vel=0.8, r=rng(f)), 0), fr(f))
place(M, pan(I.timpani(m2f(33), vel=1.0, r=rng(99), dur=2.0), 0), frases[-1]["t1"] - 0.25)
place(M, pan(I.cymbal(vel=0.5, r=rng(98), dur=1.8), 0.2), frases[-1]["t1"] - 0.25)
# "Espera…": music stops dead, then resumes
gate = np.ones(N); a, b = ns(fr(800)), ns(fr(866))
gate[a:b] = 0.12; gate = ndimage.uniform_filter1d(gate, ns(0.05))
M *= gate[None, :]

# ---------------- sound effects ----------------
S = np.zeros((2, N))
def wh(f, dur=0.5, g=0.5, p=0.0, lo=350, hi=2200):
    place(S, pan(G.whoosh(dur, rng(f), f_lo=lo, f_hi=hi) * g, p), fr(f) - dur * 0.45)
# camera moves
for f, d in [(70, 0.7), (115, 0.8), (214, 0.5), (296, 0.35), (322, 0.5), (512, 0.6), (718, 0.9), (800, 0.3), (869, 0.5), (995, 0.9), (1085, 0.5), (1232, 0.4), (1315, 0.4), (1405, 0.7)]:
    wh(f, d, 0.45)
# surface wind bed (surface shots only)
wind = G.breeze(DUR, rng(11), level=0.6, bright=700)
wmask = np.ones(N)
for a0, a1 in [(512, 800), (869, 1085)]: wmask[ns(fr(a0)): ns(fr(a1))] = 0
wmask = ndimage.uniform_filter1d(wmask, ns(0.2))
wind = st(wind)[:, :N]
place(S, wind * wmask[None, : wind.shape[1]] * 0.5, 0)
# space shimmer
for a0, a1 in [(512, 800), (869, 1085)]:
    sh = colored(ns(fr(a1 - a0)), rng(a0), slope=0.5); sh = bp(sh, 3000, 9000) * 0.02
    sh *= np.minimum(1, np.minimum(np.arange(len(sh)), len(sh) - np.arange(len(sh))) / ns(0.4))
    place(S, st(sh), fr(a0))
# sunrise swell
place(S, pan(I.triangle(vel=0.35, r=rng(5)), 0.3), fr(140))
# alarm clock ringing 290-360: fast bell strikes
for k in range(int(fr(70) * 22)):
    t = fr(290) + k / 22
    x = G.clink(rng(k), f0=2300 + 300 * (k % 2), dur=0.09, bright=1.2) * 0.35
    place(S, pan(x, 0.25), t)
# plates appear (ceramic clinks) 403, 424, 445
for f in [403, 424, 445]:
    place(S, pan(G.clink(rng(f), f0=1400, dur=0.25) * 0.5, 0.1), fr(f))
    place(S, pan(I.glock(m2f(84 + [0, 4, 7][[403, 424, 445].index(f)]), vel=0.25, r=rng(f)), 0.1), fr(f))
# footsteps on the track (2 per gait cycle at 2 Hz) and the kid running to the rocket
def steps(f0, f1, hz, g):
    t = fr(f0)
    while t < fr(f1):
        place(S, pan(G.stroll_step(rng(int(t * 100)), scuff=0.3) * g, 0.0), t); t += 1 / hz
steps(1090, 1196, 4.0, 0.5)
steps(1206, 1236, 1.2, 0.5)                   # slow motion
place(S, pan(G.whoosh(1.4, rng(4), f_lo=120, f_hi=600) * 0.6, 0), fr(1196))
steps(1462, 1502, 4.4, 0.45)
# thermometer: rising sizzle then pop + glass crack
sz = colored(ns(fr(1372 - 1322)), rng(8), slope=0.3); sz = hp(sz, 2500) * np.linspace(0, 0.08, len(sz))
place(S, st(sz), fr(1322))
place(S, pan(G.bolt_snap(rng(9)) * 0.6, -0.2), fr(1372))
for k in range(3): place(S, pan(G.clink(rng(30 + k), f0=3200 + 500 * k, dur=0.18) * 0.4, -0.2), fr(1373) + 0.05 * k)
# acid drips
for k in range(14):
    t = fr(1398) + k * 0.33 + R.uniform(0, 0.1)
    d = np.zeros(ns(0.12)); d[0] = 1; d = G.reson(d, 900 + 400 * R.uniform(), 30) if hasattr(G, "reson") else d
    place(S, pan(d * 0.25, R.uniform(-0.5, 0.5)), t)
# rocket: ignition rumble + roar from 1506
rd = DUR - fr(1500)
rm = colored(ns(rd), rng(12), slope=-1.0); rm = lp(rm, 500)
env = np.clip((np.arange(len(rm)) / SR - fr(6)) / 0.6, 0, 1)
place(S, st(rm * env * 0.9), fr(1500))
wh(1520, 1.0, 0.6, 0, 150, 900)

# ---------------- mix ----------------
def lu(x): return integrated(x)
Lv = lu(voice)
# music sits ~10 dB under the voice, effects ~8 dB under; music ducks a further 3 dB while words are spoken
gm = dbg((Lv - 7.5) - lu(M)); gs = dbg((Lv - 9.0) - lu(S))
duck = np.zeros(N)
for s in frases: duck[ns(s["t0"] - 0.08): ns(s["t1"] + 0.1)] = 1
duck = ndimage.uniform_filter1d(duck, ns(0.25))
M2 = M * gm * dbg(-3.0 * duck)[None, :]
mix = voice + M2 + S * gs
# master to -14 LUFS, then a look-ahead limiter at -1 dBTP (simplified from mix.py)
mix *= dbg(-14.0 - lu(mix))
ceil = dbg(-1.3)
up = np.abs(signal.resample_poly(mix, 4, 1, axis=-1)).max(0)
n = mix.shape[1]
pk = np.pad(up, (0, max(0, 4 * n - len(up))))[: 4 * n].reshape(n, 4).max(1)
gr = np.minimum(1.0, ceil / np.maximum(pk, 1e-12))
L = ns(0.003)
g1 = ndimage.minimum_filter1d(gr, 2 * L + 1)
g2 = ndimage.minimum_filter1d(g1, ns(0.06))  # hold
g3 = np.minimum(1.0, ndimage.uniform_filter1d(g2, ns(0.03)))
mix *= g3[None, :]
mix *= dbg(-14.0 - lu(mix)) if lu(mix) < -14.3 else 1.0
mix = np.clip(mix, -dbg(-1.2), dbg(-1.2))
write_wav("/home/claude/venus/audio/mezcla.wav", mix)
print(f"voice {Lv:.1f} | music {lu(M2):.1f} | sfx {lu(S * gs):.1f} | mix {lu(mix):.1f} LUFS | TP {true_peak(mix):.1f} dBTP | {mix.shape[1]/SR:.2f}s")
