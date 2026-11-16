#!/usr/bin/env python3
"""Subtítulos quemados estilo TikTok + rótulo de gancho para COSMOS RARO.

- Trozos de 2–4 palabras (cortando en la puntuación), grandes y en negrita con borde negro; la palabra que suena se
  pone en amarillo (karaoke ASS \\k). Los tiempos por palabra se reparten dentro de cada frase de frases.json según
  las sílabas (más una pausa en comas y puntos). Es aproximado (±0,2 s), suficiente para trozos cortos.
- Rótulo de gancho (--gancho "TEXTO"): grande, arriba, con un golpe de escala, durante los primeros --gancho-dur s.

Uso:
  python3 subtitulos.py frases.json entrada.mp4 salida.mp4 [--gancho "¿Y SI…?"] [--gancho-dur 2.4] [--horizontal]
  python3 subtitulos.py --ass frases.json salida.ass [--horizontal] [--offset 3.2]   (solo genera el .ass)
frases.json: [{"text": str, "t0": s, "t1": s}, ...]  (el que escribe voz.py / voz_usuario.py)
"""
import json, re, subprocess, sys

def syl(w):
    w = w.lower()
    n = len(re.findall(r"[aeiouáéíóúü]+", w)) or 1
    return n + (0.6 if re.search(r"[,;:]$", w) else 0) + (1.0 if re.search(r"[.!?…]$", w) else 0)

def ts(t):
    t = max(0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"

def chunks(words):
    out, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= 4 or (len(cur) >= 2 and re.search(r"[,.;:!?…]$", w[0])) or sum(len(x[0]) for x in cur) > 20:
            out.append(cur); cur = []
    if cur:
        if out and len(cur) == 1 and len(out[-1]) < 4: out[-1] += cur
        else: out.append(cur)
    return out

def build_ass(frases, horizontal=False, offset=0.0, gancho=None, gancho_dur=2.4):
    W, H = (1920, 1080) if horizontal else (1080, 1920)
    fs, mv, hfs = (80, 80, 104) if horizontal else (124, 600, 136)
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Poppins,{fs},&H003FD2FF,&H00FFFFFF,&H00180A12,&H96000000,-1,0,0,0,100,100,1,0,1,{10 if not horizontal else 6},3,2,50,50,{mv},1
Style: Hook,Poppins,{hfs},&H003FD2FF,&H00FFFFFF,&H00180A12,&H96000000,-1,0,0,0,100,100,1,0,1,11,4,8,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    allc = []
    for fr in frases:
        words = fr["text"].split()
        if not words: continue
        wts = [syl(w) for w in words]; tot = sum(wts); span = fr["t1"] - fr["t0"]
        t = fr["t0"]; timed = []
        for w, k in zip(words, wts):
            d = span * k / tot; timed.append((w, t, t + d)); t += d
        allc += chunks(timed)
    for i, c in enumerate(allc):
        a = c[0][1]; b = c[-1][2]
        nxt = allc[i + 1][0][1] if i + 1 < len(allc) else b + 0.4
        b = min(max(b, a + 0.35), nxt) if nxt > a else b
        kar = "".join("{\\k%d}%s " % (max(1, round((w[2] - w[1]) * 100)), w[0].replace("{", "").replace("}", "")) for w in c).strip()
        pop = "{\\fscx82\\fscy82\\t(0,90,\\fscx100\\fscy100)}"
        ev.append(f"Dialogue: 1,{ts(a + offset)},{ts(b + offset)},Sub,,0,0,0,,{pop}{kar}")
    if gancho:
        y = 330 if horizontal else 470
        g = gancho.replace("\\N", "\\N")
        ev.append(f"Dialogue: 2,{ts(0.0 + offset)},{ts(gancho_dur + offset)},Hook,,0,0,0,,"
                  f"{{\\pos({W // 2},{y})\\fscx140\\fscy140\\t(0,160,\\fscx100\\fscy100)\\fad(0,250)}}{g}")
    return head + "\n".join(ev) + "\n"

def wrap_hook(s, n=16):
    words, lines, cur = s.split(), [], ""
    for w in words:
        if len(cur) + len(w) + 1 > n and cur: lines.append(cur); cur = w
        else: cur = (cur + " " + w).strip()
    if cur: lines.append(cur)
    return "\\N".join(lines)

if __name__ == "__main__":
    a = sys.argv[1:]
    opt = lambda k, d=None: (a[a.index(k) + 1] if k in a else d)
    horiz = "--horizontal" in a
    if a[0] == "--ass":
        fr = json.load(open(a[1])); open(a[2], "w").write(build_ass(fr, horiz, float(opt("--offset", 0))))
        sys.exit(0)
    fr = json.load(open(a[0])); src, dst = a[1], a[2]
    g = opt("--gancho"); g = wrap_hook(g, 26 if horiz else 13) if g else None
    ass = dst + ".ass"
    open(ass, "w").write(build_ass(fr, horiz, 0.0, g, float(opt("--gancho-dur", 2.4))))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", f"ass={ass}", "-c:v", "libx264", "-crf", "17",
                    "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", dst], check=True)
    print("OK", dst)
