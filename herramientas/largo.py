#!/usr/bin/env python3
"""Vídeo largo semanal de COSMOS RARO (16:9, 1920x1080, 30 fps).

Junta los reels de la semana en un vídeo de 8-10 min con narración nueva (Kokoro em_alex):
  intro → por cada reel: tarjeta de capítulo narrada + el reel (con su audio) en el centro, fondo desenfocado y
  datos en los laterales + bloque «Y además…» narrado sobre un plano del reel → outro con llamada a suscribirse.
Escribe <salida>.mp4 (dos pasadas, < 95 MB para que quepa en GitHub) y <salida>_capitulos.txt para la descripción.

Uso:  python3 largo.py semana.json salida   (ver semana_ejemplo.json)
semana.json = {"titulo": str, "intro": str, "outro": str,
               "reels": [{"mp4": ruta, "tema": str, "intro": str, "extra": str, "datos": [str, str, str]}]}
Requiere: ffmpeg, Pillow, numpy, soundfile, kokoro-onnx con el modelo en /home/claude/tts.
"""
import json, os, subprocess, sys, textwrap
import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1920, 1080, 30
FB = "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf"
FM = "/usr/share/fonts/truetype/google-fonts/Poppins-Medium.ttf"
if not os.path.exists(FB):
    FB = FM = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
YEL, INK, BG = (255, 210, 63), (18, 10, 42), (5, 4, 12)
HERE = os.path.dirname(os.path.abspath(__file__))
AVATAR = os.path.join(HERE, "avatar_800.png")
ENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS),
       "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]

_k = None
def tts(text, out):
    global _k
    if _k is None:
        from kokoro_onnx import Kokoro
        _k = Kokoro("/home/claude/tts/kokoro-v1.0.onnx", "/home/claude/tts/voices-v1.0.bin")
    a, sr = _k.create(text, voice="em_alex", speed=1.1, lang="es")
    a = np.concatenate([np.zeros(int(0.25 * sr), np.float32), a.astype(np.float32), np.zeros(int(0.45 * sr), np.float32)])
    sf.write(out, a, sr)
    return len(a) / sr

def font(sz, bold=True): return ImageFont.truetype(FB if bold else FM, sz)

def text(d, xy, s, f, fill=(255, 255, 255), anchor="la", stroke=6):
    d.text(xy, s, font=f, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=INK)

def stars(seed=1):
    rng = np.random.default_rng(seed)
    im = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(im)
    for _ in range(700):
        x, y, r = rng.integers(0, W), rng.integers(0, H), rng.choice([1, 1, 1, 2, 2, 3])
        c = int(rng.integers(120, 255)); d.ellipse([x - r, y - r, x + r, y + r], fill=(c, c, min(255, c + 20)))
    return im

def frame_of(mp4, t, out):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", mp4, "-frames:v", "1", out], check=True)
    return Image.open(out).convert("RGB")

def dur(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                                capture_output=True, text=True).stdout.strip())

def still_segment(png, wav, out, zoom=True):
    """a still (with a slow Ken Burns push) + narration"""
    d = dur(wav); n = int(d * FPS) + 1
    vf = (f"scale={W*2}:{H*2},zoompan=z='min(1+0.0004*on,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={W}x{H}:fps={FPS}"
          if zoom else f"scale={W}:{H},fps={FPS}")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-i", png, "-i", wav, "-vf", vf + ",format=yuv420p",
                    "-t", f"{d:.3f}", *ENC, "-shortest", out], check=True)

def card(title, sub, bg, avatar=True):
    im = bg.copy(); d = ImageDraw.Draw(im)
    if avatar and os.path.exists(AVATAR):
        av = Image.open(AVATAR).convert("RGBA").resize((300, 300))
        m = Image.new("L", (300, 300), 0); ImageDraw.Draw(m).ellipse((12, 12, 288, 288), fill=255)
        im.paste(av, (W // 2 - 150, 150), m)
    y = 520
    for line in textwrap.wrap(title, 34):
        text(d, (W // 2, y), line, font(84), YEL, "ma", 9); y += 100
    if sub:
        for line in textwrap.wrap(sub, 60):
            text(d, (W // 2, y + 20), line, font(46, False), (255, 255, 255), "ma", 5); y += 60
    return im

def reel_segment(r, i, out, tmp):
    """the vertical reel centred, a blurred fill behind, number/topic on the left, facts on the right"""
    side = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(side)
    text(d, (120, 200), f"#{i}", font(140), YEL, "la", 10)
    y = 380
    for line in textwrap.wrap(r["tema"], 16):
        text(d, (120, y), line, font(54)); y += 66
    y = 230
    for k, s in enumerate(r.get("datos", [])[:3]):
        d.ellipse([1430, y + 14, 1456, y + 40], fill=YEL)
        for line in textwrap.wrap(s, 20):
            text(d, (1476, y), line, font(40, False), stroke=4); y += 52
        y += 40
    ov = os.path.join(tmp, f"side{i}.png"); side.save(ov)
    fc = ("[0:v]scale=1920:-2,crop=1920:1080,boxblur=30:3,eq=brightness=-0.25[bg];"
          "[0:v]scale=-2:1080[fg];[bg][fg]overlay=(W-w)/2:0[v1];[v1][1:v]overlay=0:0,fps=30,format=yuv420p[v]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", r["mp4"], "-loop", "1", "-i", ov, "-filter_complex", fc,
                    "-map", "[v]", "-map", "0:a", "-shortest", *ENC, out], check=True)

def bed(total, out):
    """soft synth pad (A minor / F / C / G) under the whole video, ducked later"""
    sr = 48000; n = int(total * sr); t = np.arange(n) / sr; x = np.zeros(n, np.float32)
    ch = [[220, 261.6, 329.6], [174.6, 220, 261.6], [196, 261.6, 329.6], [196, 246.9, 293.7]]
    bar = 6.0
    for k in range(int(total / bar) + 1):
        a, b = int(k * bar * sr), min(n, int((k + 1) * bar * sr) + sr)
        tt = t[a:b] - k * bar; env = np.minimum(1, tt / 1.5) * np.minimum(1, (b - a) / sr - tt)
        for f in ch[k % 4]:
            x[a:b] += (np.sin(2 * np.pi * f / 2 * tt) + 0.3 * np.sin(2 * np.pi * f * tt)) * env
    x = np.convolve(x, np.ones(30) / 30, "same") * 0.05
    sf.write(out, np.stack([x, x], 1), sr)

def main(cfg_path, out_base):
    cfg = json.load(open(cfg_path)); tmp = out_base + "_tmp"; os.makedirs(tmp, exist_ok=True)
    segs, chapters, t = [], [], 0.0
    def add(path, label=None):
        nonlocal t
        if label: chapters.append((t, label))
        segs.append(path); t += dur(path)
    # intro
    wav = os.path.join(tmp, "intro.wav"); tts(cfg["intro"], wav)
    png = os.path.join(tmp, "intro.png"); card(cfg["titulo"], "Un dato imposible del universo, cada día", stars(1)).save(png)
    p = os.path.join(tmp, "s00.mp4"); still_segment(png, wav, p); add(p, "Intro")
    for i, r in enumerate(cfg["reels"], 1):
        d0 = dur(r["mp4"])
        bgf = frame_of(r["mp4"], d0 * 0.3, os.path.join(tmp, f"f{i}.png")).resize((W, int(W * 1920 / 1080)))
        bgc = bgf.crop((0, (bgf.height - H) // 2, W, (bgf.height - H) // 2 + H)).filter(ImageFilter.GaussianBlur(14))
        bgc = Image.blend(bgc, Image.new("RGB", (W, H), BG), 0.45)
        wav = os.path.join(tmp, f"c{i}.wav"); tts(r["intro"], wav)
        png = os.path.join(tmp, f"c{i}.png"); card(f"#{i} · {r['tema']}", None, bgc).save(png)
        p = os.path.join(tmp, f"s{i:02d}a.mp4"); still_segment(png, wav, p); add(p, f"#{i} {r['tema']}")
        p = os.path.join(tmp, f"s{i:02d}b.mp4"); reel_segment(r, i, p, tmp); add(p)
        if r.get("extra"):
            wav = os.path.join(tmp, f"e{i}.wav"); tts(r["extra"], wav)
            fr = frame_of(r["mp4"], d0 * 0.7, os.path.join(tmp, f"g{i}.png")).resize((W, int(W * 1920 / 1080)))
            im = fr.crop((0, (fr.height - H) // 2, W, (fr.height - H) // 2 + H)); dd = ImageDraw.Draw(im)
            text(dd, (190, 110), "Y ADEMÁS…", font(72), YEL, "la", 8)
            png = os.path.join(tmp, f"e{i}.png"); im.save(png)
            p = os.path.join(tmp, f"s{i:02d}c.mp4"); still_segment(png, wav, p); add(p)
    wav = os.path.join(tmp, "outro.wav"); tts(cfg["outro"], wav)
    png = os.path.join(tmp, "outro.png"); card("¿Cuál te ha volado la cabeza?", "Suscríbete a COSMOS RARO: un dato imposible cada día a las 19:00", stars(2)).save(png)
    p = os.path.join(tmp, "s99.mp4"); still_segment(png, wav, p); add(p, "Despedida")
    # join + music bed + loudness, then a two-pass encode under ~95 MB
    lst = os.path.join(tmp, "list.txt")
    open(lst, "w").write("".join(f"file '{os.path.abspath(s)}'\n" for s in segs))
    joined = os.path.join(tmp, "joined.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, *ENC, joined], check=True)
    total = dur(joined); bedwav = os.path.join(tmp, "bed.wav"); bed(total, bedwav)
    mixed = os.path.join(tmp, "mixed.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", joined, "-i", bedwav, "-filter_complex",
                    "[0:a][1:a]amix=inputs=2:duration=first:weights='1 0.6',loudnorm=I=-14:TP=-1.5:LRA=11[a]",
                    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", mixed], check=True)
    kbps = max(800, min(2500, int((92 * 8 * 1024) / total) - 200))
    common = ["-c:v", "libx264", "-preset", "medium", "-b:v", f"{kbps}k", "-maxrate", f"{int(kbps*1.5)}k", "-bufsize", f"{kbps*3}k"]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mixed, *common, "-pass", "1", "-passlogfile", os.path.join(tmp, "p"), "-an", "-f", "mp4", "/dev/null"], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mixed, *common, "-pass", "2", "-passlogfile", os.path.join(tmp, "p"),
                    "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out_base + ".mp4"], check=True)
    with open(out_base + "_capitulos.txt", "w") as f:
        for s, lab in chapters: f.write(f"{int(s // 60)}:{int(s % 60):02d} {lab}\n")
    print(f"OK {out_base}.mp4  {total/60:.1f} min  {os.path.getsize(out_base + '.mp4')/1e6:.1f} MB")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
