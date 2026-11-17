#!/usr/bin/env python3
"""SALOBRE · publicaciones y carruseles de Instagram (1080x1350 PNG).

Uso:  python3 post.py diapositivas.json carpeta_salida/
diapositivas.json = {"diapositivas": [ ...mismas escenas que reel.py pero sin "dur"... ]}
  tipo "foto"  : foto a sangre con texto (zoom = encuadre fijo, foco = punto central)
  tipo "color" : fondo liso con imagen opcional (estrella, logo) y frase grande
  tipo "cierre": logo + texto + web
Genera 01.png, 02.png... en la carpeta de salida.
"""
import json, os, sys
import reel
reel.W, reel.H = 1080, 1350

def main(src, outdir):
    os.makedirs(outdir, exist_ok=True)
    g = json.load(open(src))
    for i, sc in enumerate(g['diapositivas'], 1):
        sc = dict(sc); sc['dur'] = 2 / reel.FPS; sc['aparece'] = False
        if sc.get('tipo', 'foto') == 'foto':
            z = sc.get('zoom', [1.0, 1.0]); sc['zoom'] = [z[0], z[0]] if isinstance(z, list) else [z, z]
        fr = list(reel.scene_frames(sc))[-1]
        p = os.path.join(outdir, f'{i:02d}.png'); fr.save(p, optimize=True); print('ok', p)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
