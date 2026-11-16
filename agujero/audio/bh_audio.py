# Soundtrack for the black-hole short with the skill's audio kit (dsp / instruments / sfx_gen): dark synth pad bed,
# music-box arpeggio, timpani on the big beats, effects on their frames, voice on top, -14 LUFS, true-peak limited.
import json
import numpy as np
from scipy import ndimage, signal
from dsp import SR, ns, dbg, rng, lp, hp, bp, place, pan, st, read_wav, write_wav, integrated, true_peak, colored
import instruments as I
import sfx_gen as G

TOTAL = 1702
DUR = TOTAL / 30
N = ns(DUR)
fr = lambda f: f / 30
R = rng(3)
B = "/home/claude/agujero"
vx, vsr = read_wav(f"{B}/public/voz/voz.wav")
v = vx.mean(0) if vx.ndim > 1 else vx
v = signal.resample_poly(v, SR, vsr) if vsr != SR else v
voice = np.zeros(N); voice[: min(N, len(v))] = v[:N]; voice = st(voice)
frases = json.load(open(f"{B}/frases.json"))

# ---------------- music ----------------
M = np.zeros((2, N)); m2f = I.m2f; Q = 0.55
CH = {"Dm": [50, 57, 62, 65], "Bb": [46, 53, 58, 62], "Gm": [43, 55, 58, 62], "A": [45, 52, 57, 61], "F": [41, 53, 57, 60], "C": [48, 55, 60, 64], "Ab": [44, 51, 56, 60]}
SECT = [(0.0, fr(172), ["Dm", "Bb", "Gm", "A"], "glock", 1.0), (fr(172), fr(446), ["Dm", "F", "C", "Bb"], "musicbox", 0.8),
        (fr(446), fr(691), ["Gm", "Bb", "A", "A"], "glock", 1.0), (fr(691), fr(925), ["Dm", "Bb", "Gm", "A"], "musicbox", 0.9),
        (fr(925), fr(991), ["A"], None, 0.35), (fr(991), fr(1283), ["Dm", "F", "C", "A"], "glock", 1.0),
        (fr(1283), fr(1449), ["Bb", "F", "C", "Dm"], "musicbox", 0.9), (fr(1449), fr(1688), ["Dm", "Ab", "Dm", "Ab"], None, 1.1)]
for t0, t1, chords, arp, en in SECT:
    bar, k, t = 4 * Q, 0, t0
    while t < t1 - 0.05:
        ch = chords[k % len(chords)]; d = min(bar, t1 - t)
        place(M, I.pad([m2f(n) for n in CH[ch]], d, vel=0.55 * en, r=rng(k + int(t0 * 10)), att=0.3, rel=0.5, warm=900), t)
        place(M, pan(I.pluck(m2f(CH[ch][0] - 12), vel=0.6 * en, r=rng(k), dur=d * 0.9, bright=0.2), 0), t)
        if arp:
            for i in range(8):
                ti = t + i * Q / 2
                if ti >= t1 - 0.05: break
                note = CH[ch][[0, 2, 3, 2, 1, 3, 2, 3][i]] + 12
                x = (I.musicbox if arp == "musicbox" else I.glock)(m2f(note), vel=0.3 * en, r=rng(k * 8 + i))
                place(M, pan(x, -0.35 if i % 2 else 0.35), ti)
        t += bar; k += 1
# sub drone under everything (the hole), swelling inside
dr = colored(N, rng(5), slope=-2.0); dr = lp(dr, 120)
env = 0.25 + 0.5 * np.clip((np.arange(N) / SR - fr(1449)) / 4, 0, 1)
M += st(dr * env * 0.6)
for f in [80, 152, 326, 661, 909, 1143, 1413, 1539]:
    place(M, pan(I.timpani(m2f(38), vel=0.85, r=rng(f)), 0), fr(f))
end = frases[-1]["t1"]
place(M, pan(I.timpani(m2f(31), vel=1.0, r=rng(99), dur=2.2), 0), end - 0.2)
place(M, pan(I.cymbal(vel=0.45, r=rng(98), dur=1.8), 0.2), end - 0.2)
gate = np.ones(N); gate[ns(fr(925)): ns(fr(986))] = 0.1; gate[ns(end + 0.05):] = 0.0
M *= ndimage.uniform_filter1d(gate, ns(0.05))[None, :]

# ---------------- effects ----------------
S = np.zeros((2, N))
def wh(f, dur=0.6, g=0.5, p=0.0, lo=300, hi=2000): place(S, pan(G.whoosh(dur, rng(f), f_lo=lo, f_hi=hi) * g, p), fr(f) - dur * 0.45)
for f, d in [(172, 0.6), (300, 0.5), (339, 0.5), (446, 0.4), (603, 0.4), (691, 0.6), (991, 0.5), (1157, 0.5), (1283, 0.7), (1449, 0.9), (1604, 0.5), (1668, 0.5)]:
    wh(f, d, 0.4)
# hook: freeze (glassy shimmer down) and the spaghetti stretch (rubbery creak rising)
fz = np.zeros(ns(1.2)); fz[0] = 1; fz = G.resbank(fz, [(2600, 40, 1.0), (3900, 50, 0.7), (5200, 60, 0.4)]) * 0.5
place(S, pan(fz, -0.3), fr(80))
place(S, pan(G.creak(1.2, rng(7), rate0=60, rate1=420, scale=1.0) * 0.5, 0.3), fr(118))
place(S, pan(G.bolt_snap(rng(8)) * 0.5, 0.3), fr(152))
# falling: long descending whoosh
place(S, pan(G.whoosh(2.4, rng(9), f_lo=120, f_hi=900) * 0.5, 0), fr(320))
# stretching: creaks on "pies", "estira", "aprieta"; spaghetti
for f, a, b in [(506, 80, 200), (545, 100, 300), (565, 150, 380), (612, 60, 500)]:
    place(S, pan(G.creak(0.9, rng(f), rate0=a, rate1=b, scale=0.9) * 0.45, 0.15), fr(f))
# Leo's view: a slowing heartbeat-like tick that freezes at "quieto"
t, gap = fr(700), 0.45
while t < fr(909):
    place(S, pan(G.clink(rng(int(t * 99)), f0=1800, dur=0.08) * 0.25, -0.2), t); t += gap; gap *= 1.12
# clocks: yours ticks once a second, Leo's speeds up
for k in range(6): place(S, pan(G.clink(rng(200 + k), f0=2400, dur=0.06) * 0.3, 0.3), fr(1000) + k * 0.95)
t, gap = fr(1000), 0.5
while t < fr(1157):
    place(S, pan(G.clink(rng(int(t * 77)), f0=1500, dur=0.05) * 0.3, -0.3), t); t += gap; gap = max(0.04, gap * 0.9 if t > fr(1100) else gap)
# light climbing: tones that glide down as they climb (redshift)
for k in range(5):
    d = 1.3; n = ns(d); tt = np.arange(n) / SR
    f0 = 1200 * np.exp(-tt * 1.1); ph = 2 * np.pi * np.cumsum(f0) / SR
    x = np.sin(ph) * np.exp(-tt * 1.4) * np.minimum(1, tt / 0.03) * 0.15
    place(S, pan(x, 0.2 * (k % 2) - 0.1), fr(1165) + k * 0.75)
# giant hole: crossing the edge is silent (a soft air swell)
sw = hp(colored(ns(3.0), rng(31), slope=-0.5), 200) * np.sin(np.linspace(0, np.pi, ns(3.0))) * 0.08
place(S, st(sw), fr(1360))
# inside: rushing roar building, light pulled back at "luz"
ro = lp(colored(ns(fr(1688 - 1449)), rng(41), slope=-0.8), 1400) * np.linspace(0.05, 0.6, ns(fr(1688 - 1449)))
place(S, st(ro), fr(1449))
place(S, pan(G.whoosh(1.2, rng(42), f_lo=1500, f_hi=300) * 0.5, 0), fr(1570))
gateS = np.ones(N); gateS[ns(end + 0.05):] = 0
S *= ndimage.uniform_filter1d(gateS, ns(0.04))[None, :]

# ---------------- mix ----------------
lu = integrated
Lv = lu(voice)
gm = dbg((Lv - 8.0) - lu(M)); gs = dbg((Lv - 9.0) - lu(S))
duck = np.zeros(N)
for s in frases: duck[ns(s["t0"] - 0.08): ns(s["t1"] + 0.1)] = 1
duck = ndimage.uniform_filter1d(duck, ns(0.25))
mix = voice + M * gm * dbg(-3.0 * duck)[None, :] + S * gs
mix *= dbg(-14.0 - lu(mix))
ceil = dbg(-1.3); n = mix.shape[1]
up = np.abs(signal.resample_poly(mix, 4, 1, axis=-1)).max(0)
pk = np.pad(up, (0, max(0, 4 * n - len(up))))[: 4 * n].reshape(n, 4).max(1)
g = np.minimum(1.0, ceil / np.maximum(pk, 1e-12))
g = ndimage.minimum_filter1d(ndimage.minimum_filter1d(g, 2 * ns(0.003) + 1), ns(0.06))
mix *= np.minimum(1.0, ndimage.uniform_filter1d(g, ns(0.03)))[None, :]
if lu(mix) < -14.3: mix *= dbg(-14.0 - lu(mix))
mix = np.clip(mix, -dbg(-1.2), dbg(-1.2))
write_wav(f"{B}/audio/mezcla.wav", mix)
print(f"voice {Lv:.1f} | music {lu(M*gm):.1f} | sfx {lu(S*gs):.1f} | mix {lu(mix):.1f} LUFS | TP {true_peak(mix):.1f} dBTP | {n/SR:.2f}s")
