// "En Venus, un día dura más que un año" — timeline at 30 fps, timed to public/voz/voz.wav (frases.json).
// Grammar from the skill: the camera never stops (slow push-ins on holds), smootherstep glides of 18-46 frames,
// a change of place is a 6-frame crossfade, reactions land 0-3 frames before their word.
export const FPS = 30;
export const TOTAL = 1548;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const smoother = (x: number) => { const u = clamp01(x); return u * u * u * (u * (6 * u - 15) + 10); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// phrases (frames): P1 2 · P2 90 (Amanece ~133, oeste ~185, al revés ~205) · P3 239 (Mala idea ~293, cuatro meses ~375)
// P4 401 (comes ~425, cenas ~445, sigue ahí ~465) · P5 512 (Venus tarda ~595) · P6 698 · P7 800 · P8 869 (al revés ~930,
// peonza ~965, alrededor del Sol ~990) · P9 1085 (pirueta ~1175, cámara lenta ~1205) · P10 1232 · P11 1315 (460 ~1375,
// ácido ~1440) · P12 1459 → last word ends 1547

export type Place = "surface" | "space";
type Key = { f: number; pos: V3; look: V3; fov: number; glide?: boolean };
export type ShotDef = { id: number; a: number; b: number; place: Place; keys: Key[] };
const X = 6; // crossfade
export const XFADE = X;

// surface spots
export const HERO: V3 = [0, 0, 0];
export const TABLE: V3 = [7, 0, -1.4];
export const TRACK: V3 = [-2, 0, -34];
export const TRACK_R = 2.6;
export const ROCKET: V3 = [-3.6, 0, -4.2];

// space: the Sun at the origin of the space set, Venus on a 40 m orbit, Earth on 62 m
export const SUN_AT: V3 = [-40, 0, 0];
export const ORBIT_V = 40, ORBIT_E = 62;

export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 90 + X, place: "surface", keys: [ // hook: the astronaut kid, face on, then the plains of Venus open up
    { f: 0, pos: [0.18, 1.12, 2.2], look: [0, 1.04, 0], fov: 40 },
    { f: 34, pos: [0.14, 1.1, 2.0], look: [0, 1.04, 0], fov: 40 },
    { f: 90, pos: [-1.9, 1.7, 5.4], look: [0, 0.95, 0], fov: 46, glide: true },
    { f: 96, pos: [-1.95, 1.72, 5.5], look: [0, 0.95, 0], fov: 46 },
  ] },
  { id: 2, a: 90, b: 239 + X, place: "surface", keys: [ // past the kid to the horizon: the Sun comes up in the west
    { f: 90, pos: [-1.95, 1.72, 5.5], look: [0, 0.95, 0], fov: 46 },
    { f: 128, pos: [1.6, 1.25, -1.2], look: [-2, 6, -120], fov: 44, glide: true },
    { f: 196, pos: [1.5, 1.32, -1.9], look: [-2, 7, -120], fov: 43 },
    { f: 222, pos: [0.35, 1.15, 2.3], look: [0, 1.05, 0], fov: 40, glide: true }, // back on his face: "al revés"
    { f: 245, pos: [0.3, 1.13, 2.1], look: [0, 1.05, 0], fov: 40 },
  ] },
  { id: 3, a: 239, b: 401 + X, place: "surface", keys: [ // the alarm clock
    { f: 239, pos: [0.9, 0.95, 2.6], look: [0.35, 0.75, 0], fov: 42 },
    { f: 288, pos: [0.82, 0.92, 2.3], look: [0.38, 0.72, 0], fov: 42 },
    { f: 300, pos: [0.75, 0.8, 1.6], look: [0.62, 0.55, 0.3], fov: 40, glide: true }, // "Mala idea": onto the ringing clock
    { f: 330, pos: [0.4, 1.3, 3.4], look: [0.2, 0.9, 0], fov: 44, glide: true },
    { f: 407, pos: [0.35, 1.25, 3.0], look: [0.2, 0.9, 0], fov: 44 },
  ] },
  { id: 4, a: 401, b: 512 + X, place: "surface", keys: [ // breakfast, lunch, dinner: the Sun does not move
    { f: 401, pos: [7.4, 1.35, 2.4], look: [7.0, 1.2, -1.6], fov: 46 },
    { f: 518, pos: [7.25, 1.25, 1.6], look: [7.0, 1.3, -1.6], fov: 46 },
  ] },
  { id: 5, a: 512, b: 800 + X, place: "space", keys: [ // Venus spins once in 243 days... and goes round the Sun in 225
    { f: 512, pos: [1.2, 1.0, 15], look: [0, 0, 0], fov: 40 },
    { f: 690, pos: [3.6, 1.8, 13], look: [0, 0, 0], fov: 40 },
    { f: 732, pos: [-40, 62, 64], look: [-40, 0, 0], fov: 52, glide: true },
    { f: 806, pos: [-40, 66, 70], look: [-40, 0, 0], fov: 52 },
  ] },
  { id: 6, a: 800, b: 869 + X, place: "surface", keys: [ // "Espera…"
    { f: 800, pos: [0.12, 1.1, 2.1], look: [0, 1.04, 0], fov: 40 },
    { f: 875, pos: [0.06, 1.08, 1.55], look: [0, 1.04, 0], fov: 40 },
  ] },
  { id: 7, a: 869, b: 1085 + X, place: "space", keys: [ // "Fíjate": spins backwards like a lazy top, but runs round faster than Earth
    { f: 869, pos: [0, 2.0, 15], look: [0, 0.6, 0], fov: 40 },
    { f: 975, pos: [-1.4, 2.4, 13], look: [0, 0.6, 0], fov: 40 },
    { f: 1010, pos: [-40, 120, 40], look: [-40, 0, 0], fov: 54, glide: true },
    { f: 1091, pos: [-40, 126, 44], look: [-40, 0, 0], fov: 54 },
  ] },
  { id: 8, a: 1085, b: 1232 + X, place: "surface", keys: [ // a whole lap of the track while doing one slow pirouette
    { f: 1085, pos: [TRACK[0] + 2.2, 7.6, TRACK[2] + 8.6], look: [TRACK[0], 0.3, TRACK[2] - 0.2], fov: 50 },
    { f: 1238, pos: [TRACK[0] - 0.8, 7.0, TRACK[2] + 8.0], look: [TRACK[0], 0.3, TRACK[2] - 0.2], fov: 50 },
  ] },
  { id: 9, a: 1232, b: 1315 + X, place: "surface", keys: [ // never late for school
    { f: 1232, pos: [0.9, 0.95, 3.0], look: [0.1, 0.7, 0], fov: 42 },
    { f: 1321, pos: [0.7, 0.9, 2.5], look: [0.1, 0.72, 0], fov: 42 },
  ] },
  { id: 10, a: 1315, b: 1459 + X, place: "surface", keys: [ // 460 degrees, acid clouds
    { f: 1315, pos: [-0.2, 1.0, 3.2], look: [-0.2, 0.95, 0], fov: 44 },
    { f: 1372, pos: [-0.25, 0.98, 2.7], look: [-0.25, 0.95, 0], fov: 44 },
    { f: 1410, pos: [0.6, 0.5, 3.6], look: [-0.2, 3.5, -6], fov: 50, glide: true }, // up to the acid clouds
    { f: 1465, pos: [0.6, 0.5, 3.4], look: [-0.2, 3.9, -6], fov: 50 },
  ] },
  { id: 11, a: 1459, b: TOTAL, place: "surface", keys: [ // ...it would last a few seconds: back to the rocket, lift-off
    { f: 1459, pos: [2.2, 1.4, 4.6], look: [-2.2, 1.6, -2.6], fov: 48 },
    { f: 1500, pos: [2.0, 1.35, 4.2], look: [-2.6, 1.9, -3.0], fov: 48 },
    { f: TOTAL, pos: [1.8, 0.9, 4.0], look: [ROCKET[0], 9, ROCKET[2]], fov: 52, glide: true },
  ] },
];

export const camAt = (id: number, f: number) => {
  const k = SHOTS[id - 1].keys;
  if (f <= k[0].f) return { pos: k[0].pos, look: k[0].look, fov: k[0].fov };
  for (let i = 1; i < k.length; i++) if (f <= k[i].f) {
    const u = (f - k[i - 1].f) / (k[i].f - k[i - 1].f), t = k[i].glide ? smoother(u) : u;
    return { pos: lerp3(k[i - 1].pos, k[i].pos, t), look: lerp3(k[i - 1].look, k[i].look, t), fov: lerp(k[i - 1].fov, k[i].fov, t) };
  }
  const l = k[k.length - 1];
  return { pos: l.pos, look: l.look, fov: l.fov };
};

/** one or two layers: each next shot fades in over the previous one for XFADE frames */
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (let i = SHOTS.length - 1; i > 0; i--) {
    const a = SHOTS[i].a;
    if (f >= a + XFADE) return [{ id: i + 1, alpha: 1 }];
    if (f >= a) return [{ id: i, alpha: 1 }, { id: i + 1, alpha: (f - a + 1) / (XFADE + 1) }];
  }
  return [{ id: 1, alpha: 1 }];
};

// ---- slow motion on "a cámara lenta": the world clock runs at 30 % ----
const SLOW = { in0: 1196, in1: 1206, out0: 1238, out1: 1240, rate: 0.3 };
const rateAt = (f: number) => 1 - (1 - SLOW.rate) * (smooth((f - SLOW.in0) / (SLOW.in1 - SLOW.in0)) - smooth((f - SLOW.out0) / (SLOW.out1 - SLOW.out0)));
const WF = (() => { const a = [0]; for (let f = 1; f <= TOTAL + 2; f++) a.push(a[f - 1] + rateAt(f - 0.5)); return a; })();
export const worldF = (f: number) => { const i = Math.max(0, Math.min(TOTAL + 1, Math.floor(f))); return WF[i] + (WF[i + 1] - WF[i]) * (f - i); };

// ---- story clocks ----
/** sun elevation (deg) above the western horizon: below it in the hook, rises on "Amanece" */
export const sunEl = (f: number) => lerp(-8, 9, smooth((f - 116) / 60));
/** Venus spin (rad, retrograde = negative) and orbit angle (rad) */
export const venusSpin = (f: number) => {
  // P5: a slow, readable spin; P6 one orbit while it spins only 225/243 of a turn; P8 spin shown big and backwards
  return -0.004 * f - 2 * Math.PI * (225 / 243) * smooth((f - 705) / 85) - 0.012 * Math.max(0, Math.min(f, 1000) - 880);
};
export const venusOrbit = (f: number) => 2 * Math.PI * smooth((f - 705) / 85) + (f > 1000 ? (2 * Math.PI * (f - 1000)) / 70 : 0);
export const earthOrbit = (f: number) => 0.9 + (f > 1000 ? (2 * Math.PI * (f - 1000)) / (70 * 365 / 225) : 0);
/** runner on the track: one full lap from 1088 to 1228 (in world frames, so it slows down with the clock) */
export const lapAt = (wf: number) => 2 * Math.PI * clamp01((wf - 1088) / 132);
/** heat: 0 → 1 over P11 (sky turns sickly, clouds drip) */
export const heatAt = (f: number) => smooth((f - 1318) / 50);
/** rocket lift-off */
export const liftAt = (f: number) => Math.max(0, f - 1506);

/** thin-lens depth of field: cInf = blur at infinity (px at 1080p); focus point (default = camera look) */
export const dofAt = (id: number, f: number): { cInf: number; focus?: V3 } => {
  if (id === 1) return f < 40 ? { cInf: 14, focus: [0, 1.06, 0] } : { cInf: lerp(12, 4, smooth((f - 40) / 50)), focus: [0, 1.0, 0] };
  if (id === 2) return f < 110 ? { cInf: 6 } : f < 200 ? { cInf: 0 } : { cInf: 13, focus: [0, 1.06, 0] };
  if (id === 3) return { cInf: 12 };
  if (id === 4) return { cInf: 10, focus: [TABLE[0], 1.0, TABLE[2] - 0.5] };
  if (id === 5 || id === 7) return { cInf: 0 };
  if (id === 6) return { cInf: 15, focus: [0, 1.06, 0] };
  if (id === 8) return { cInf: 4 };
  if (id === 9) return { cInf: 11, focus: [0, 0.7, 0] };
  if (id === 10) return f < 1400 ? { cInf: 12, focus: [-0.2, 0.9, 0] } : { cInf: 3 };
  return { cInf: 6 };
};

// ---- discreet numbers at the top of the frame ----
export const MARKS = [
  { a: 335, b: 405, label: "117 días", sub: "entre dos amaneceres", col: "#ffd23f" },
  { a: 598, b: 700, label: "243 días", sub: "en girar sobre sí mismo", col: "#ffffff" },
  { a: 712, b: 800, label: "225 días", sub: "en dar la vuelta al Sol", col: "#ffd23f" },
  { a: 1000, b: 1085, label: "Venus: 225 días", sub: "Tierra: 365 días", col: "#ffd23f" },
  { a: 1372, b: 1455, label: "460 °C", sub: "", col: "#ff7a3a" },
];
