#!/usr/bin/env python3
"""SALOBRE · generador de reels verticales (1080x1920, 30 fps, MP4 H.264 sin audio).

Uso:  python3 reel.py guion.json salida.mp4
El audio se añade en la app (Instagram / TikTok) con un sonido en tendencia: da más alcance.

guion.json:
{
  "escenas": [
    {"tipo": "foto", "img": "fotos/dream-bigger-photo-3.jpg", "dur": 2.4,
     "zoom": [1.0, 1.12], "foco": [0.6, 0.3],           # punto que se mantiene centrado (0-1)
     "texto": "¿Sabes hacia dónde vas?", "pos": "abajo", # abajo | centro | arriba
     "estilo": "gancho"},                                # gancho | titulo | frase | pequeño
    {"tipo": "color", "fondo": "#F1EEE8", "dur": 2.0,
     "texto": "Dream Bigger", "estilo": "titulo", "img": "fotos/estrella-dtf.png"},
    {"tipo": "cierre", "dur": 2.2}                       # logo + web
  ]
}
Rutas relativas a la carpeta del kit (la que contiene fotos/, logos/ y fuentes/).
"""
import json, os, subprocess, sys, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1920, 30
KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INK, PAPER, BLUE = (20, 20, 19), (241, 238, 232), (46, 98, 176)
F_BLACK = os.path.join(KIT, 'fuentes', 'archivo-xw-black.ttf')
F_SEMI = os.path.join(KIT, 'fuentes', 'archivo-xw-semi.ttf')
F_MED = os.path.join(KIT, 'fuentes', 'archivo-w-med.ttf')
WEB = 'salobree.myshopify.com'

def P(p):
    return p if os.path.isabs(p) else os.path.join(KIT, p)

def ease(t):
    return 0.5 - 0.5 * math.cos(math.pi * max(0, min(1, t)))

def font(path, size):
    return ImageFont.truetype(path, size)

STYLES = {  # (fuente, tamaño, mayúsculas, interletrado)
    'gancho': (F_BLACK, 84, True, 2),
    'titulo': (F_BLACK, 110, True, 4),
    'frase': (F_SEMI, 60, True, 3),
    'pequeño': (F_MED, 40, True, 6),
}

def wrap(draw, text, fnt, maxw, track):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if tw(draw, t, fnt, track) <= maxw or not cur:
            cur = t
        else:
            lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def tw(draw, s, fnt, track):
    return sum(draw.textlength(ch, font=fnt) for ch in s) + track * max(0, len(s) - 1)

def draw_text(img, text, style, pos, color, alpha=1.0, dy=0, shadow=False):
    fpath, size, upper, track = STYLES.get(style, STYLES['frase'])
    if upper: text = text.upper()
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    fnt = font(fpath, size)
    lines = wrap(d, text, fnt, W - 160, track)
    while len(lines) > 4 and size > 40:
        size -= 6; fnt = font(fpath, size); lines = wrap(d, text, fnt, W - 160, track)
    lh = int(size * 1.08)
    total = lh * len(lines)
    y0 = {'arriba': int(H * 0.13), 'centro': (H - total) // 2, 'abajo': H - total - int(H * 0.22)}.get(pos, H - total - int(H * 0.22)) + dy
    a = int(255 * alpha)
    for i, ln in enumerate(lines):
        x = (W - tw(d, ln, fnt, track)) / 2
        y = y0 + i * lh
        for ch in ln:
            d.text((x, y), ch, font=fnt, fill=color + (a,))
            x += d.textlength(ch, font=fnt) + track
    if shadow:  # sombra suave para leer sobre foto
        sh = lay.split()[3].filter(ImageFilter.GaussianBlur(14)).point(lambda v: int(v * 0.55))
        shadow = Image.new('RGBA', img.size, (0, 0, 0, 0)); shadow.putalpha(sh)
        img.alpha_composite(shadow)
    img.alpha_composite(lay)

def cover(im, zoom, foco):
    iw, ih = im.size
    s = max(W / iw, H / ih) * zoom
    cw, ch = W / s, H / s
    cx = min(max(foco[0] * iw, cw / 2), iw - cw / 2)
    cy = min(max(foco[1] * ih, ch / 2), ih - ch / 2)
    box = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
    return im.resize((W, H), Image.BICUBIC, box=box)

def scene_frames(sc):
    n = max(1, int(round(sc.get('dur', 2.0) * FPS)))
    kind = sc.get('tipo', 'foto')
    if kind == 'foto':
        src = Image.open(P(sc['img'])).convert('RGB')
        z0, z1 = sc.get('zoom', [1.0, 1.08]); f0 = sc.get('foco', [0.5, 0.45]); f1 = sc.get('foco_fin', f0)
    elif kind == 'color':
        bg = sc.get('fondo', '#F1EEE8')
        src = sc.get('img')
        src = Image.open(P(src)).convert('RGBA') if src else None
    for i in range(n):
        t = i / max(1, n - 1); e = ease(t)
        if kind == 'foto':
            z = z0 + (z1 - z0) * t
            fo = [f0[0] + (f1[0] - f0[0]) * e, f0[1] + (f1[1] - f0[1]) * e]
            fr = cover(src, z, fo).convert('RGBA')
            grad = Image.linear_gradient('L').resize((W, H)).point(lambda v: int(v * 0.55))
            dark = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dark.putalpha(grad)
            if sc.get('texto') and sc.get('pos', 'abajo') == 'abajo': fr.alpha_composite(dark)
            col = (255, 255, 255)
        elif kind == 'color':
            fr = Image.new('RGBA', (W, H), bg)
            col = INK if sum(Image.new('RGB', (1, 1), bg).getpixel((0, 0))) > 380 else (255, 255, 255)
            if src is not None:
                s = (1.0 + 0.06 * t) * min(760, H * 0.42); im = src.copy(); im.thumbnail((int(s), int(s)))
                fr.alpha_composite(im, ((W - im.width) // 2, int(H * 0.33 - im.height / 2)))
        else:  # cierre
            fr = Image.new('RGBA', (W, H), PAPER)
            logo = Image.open(P('logos/SALOBRE-logo-principal-negro.png')).convert('RGBA')
            logo.thumbnail((640, 640)); a = ease(t * 2.2)
            lg = logo.copy(); lg.putalpha(lg.split()[3].point(lambda v: int(v * a)))
            fr.alpha_composite(lg, ((W - lg.width) // 2, int(H * 0.40 - lg.height / 2 + (1 - a) * 30)))
            draw_text(fr, sc.get('texto', 'Dream Bigger'), 'frase', 'centro', INK, a, dy=260)
            draw_text(fr, sc.get('web', WEB), 'pequeño', 'centro', (90, 88, 84), ease(t * 2.2 - 0.4), dy=360)
            yield fr.convert('RGB'); continue
        if sc.get('texto'):
            a = ease(t * 4) if sc.get('aparece', True) else 1
            draw_text(fr, sc['texto'], sc.get('estilo', 'frase'), sc.get('pos', 'abajo'), col, a, dy=int((1 - a) * 24), shadow=(kind == 'foto'))
        if sc.get('sub'):
            sa = ease(t * 3 - 0.3) if sc.get('aparece', True) else 1
            draw_text(fr, sc['sub'], 'pequeño', sc.get('pos', 'abajo'), col, sa, dy=int(H * 0.11), shadow=(kind == 'foto'))
        yield fr.convert('RGB')

def main(guion, out):
    g = json.load(open(guion))
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
           '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    prev = None; XF = 6  # fundido entre escenas (frames)
    for sc in g['escenas']:
        frames = list(scene_frames(sc))
        if prev is not None and sc.get('corte', 'fundido') == 'fundido':
            for k in range(min(XF, len(frames))):
                frames[k] = Image.blend(prev, frames[k], (k + 1) / (XF + 1))
        for fr in frames: p.stdin.write(fr.tobytes())
        prev = frames[-1]
    p.stdin.close(); p.wait()
    print('ok', out)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
