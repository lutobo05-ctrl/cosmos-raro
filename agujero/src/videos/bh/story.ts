// "¿Qué pasaría si cayeras en un agujero negro?" — timeline at 30 fps, timed to public/voz/voz.wav (frases.json).
// Camera grammar from the skill: never still (slow push-ins), smootherstep glides, 6-frame crossfades between places.
export const FPS = 30;
export const TOTAL = 1702;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const smoother = (x: number) => { const u = clamp01(x); return u * u * u * (u * (6 * u - 15) + 10); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// keywords (frames): congelado ~80 · espagueti ~152 | Leo ~238 · asomas ~275 · caer ~326 | Flotas ~376 |
// pies ~506 · cabeza ~528 · estira ~545 · aprieta ~565 | espaguetización ~661 | Leo ~716 · despacio ~806 · rojo ~858 ·
// oscuro ~873 · quieto ~909 | cayendo ~965 | Fíjate 991 · estira ~1061 · normal ~1110 · vuela ~1143 | luz ~1165 ·
// cuesta ~1201 | gigante ~1325 · galaxia ~1381 · borde ~1413 | dentro ~1484 · centro ~1539 · luz ~1574 |
// Leo ~1625 · nunca ~1632 · ti ~1678 · terminó ~1688 → end 1701

export type Place = "space" | "inside";
type Key = { f: number; pos: V3; look: V3; fov: number; glide?: boolean };
export type ShotDef = { id: number; a: number; b: number; place: Place; bhScale?: number; keys: Key[] };
const X = 6;
export const XFADE = X;

export const RH = 6;                      // event horizon radius (m) of the "small" hole
export const SHIP: V3 = [0, 34, 0];
export const KID_X = 1.6, KID_Z = 1.2;    // the fall line, just off the ship's side
/** where the kid is, in his own time, for the falling shots */
export const fallY = (f: number) => f < 318 ? SHIP[1] - 1.2 : SHIP[1] - 1.2 - 0.000105 * (f - 318) ** 2 - 0.006 * (f - 318);

export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 172 + X, place: "space", keys: [ // hook: two of you — frozen and red, and already spaghetti
    { f: 0, pos: [0.3, 8.9, 7.4], look: [0, 6.9, 0], fov: 50 },
    { f: 172 + X, pos: [0.15, 8.6, 5.9], look: [0, 6.8, 0], fov: 50 },
  ] },
  { id: 2, a: 172, b: 339 + X, place: "space", keys: [ // the ship, Leo at the window, you lean out... and fall
    { f: 172, pos: [10, 37.5, 17], look: [0.5, 33.8, 0], fov: 46 },
    { f: 300, pos: [8.2, 36.6, 14], look: [1.0, 33.4, 0], fov: 46 },
    { f: 345, pos: [8.0, 35.5, 14], look: [1.2, 22, 0], fov: 50, glide: true },
  ] },
  { id: 3, a: 339, b: 446 + X, place: "space", keys: [] }, // floating (camera follows the kid, see camAt)
  { id: 4, a: 446, b: 603 + X, place: "space", keys: [] }, // stretched: feet pulled harder than head
  { id: 5, a: 603, b: 691 + X, place: "space", keys: [] }, // spaghettification
  { id: 6, a: 691, b: 925 + X, place: "space", keys: [ // Leo's view from the ship: slower, redder, darker... frozen
    { f: 691, pos: [-2.2, 37.2, 5.2], look: [KID_X * 0.6, 17, KID_Z * 0.6], fov: 22 },
    { f: 931, pos: [-1.8, 36.6, 4.2], look: [KID_X * 0.6, 7.9, KID_Z * 0.6], fov: 9 },
  ] },
  { id: 7, a: 925, b: 991 + X, place: "space", keys: [ // "Espera…"
    { f: 925, pos: [KID_X + 0.35, 9.9, KID_Z + 2.6], look: [KID_X, 9.7, KID_Z], fov: 40 },
    { f: 997, pos: [KID_X + 0.25, 9.85, KID_Z + 2.0], look: [KID_X, 9.7, KID_Z], fov: 40 },
  ] },
  { id: 8, a: 991, b: 1157 + X, place: "space", keys: [ // two clocks: yours ticks normally, Leo's flies
    { f: 991, pos: [16, 22, 36], look: [0.5, 21, 0], fov: 52 },
    { f: 1163, pos: [13, 21.5, 32], look: [0.5, 21, 0], fov: 52 },
  ] },
  { id: 9, a: 1157, b: 1283 + X, place: "space", keys: [ // your light climbs an ever steeper hill to reach him
    { f: 1157, pos: [12, 13, 24], look: [1, 13, 0], fov: 50 },
    { f: 1289, pos: [12, 27, 24], look: [1, 27, 0], fov: 50, glide: true },
  ] },
  { id: 10, a: 1283, b: 1449 + X, place: "space", bhScale: 7, keys: [] }, // a giant one: you cross the edge, nothing happens
  { id: 11, a: 1449, b: 1604 + X, place: "inside", keys: [ // inside: every path leads to the centre, even light
    { f: 1449, pos: [0, 30, 0.01], look: [0, -60, 0], fov: 60 },
    { f: 1610, pos: [0, 12, 0.01], look: [0, -60, 0], fov: 64 },
  ] },
  { id: 12, a: 1604, b: 1668 + X, place: "space", keys: [ // for Leo you never finish falling
    { f: 1604, pos: [-1.6, 36.4, 4.0], look: [KID_X * 0.6, 7.9, KID_Z * 0.6], fov: 10 },
    { f: 1674, pos: [-1.4, 36.0, 3.6], look: [KID_X * 0.6, 7.9, KID_Z * 0.6], fov: 8 },
  ] },
  { id: 13, a: 1668, b: TOTAL, place: "inside", keys: [ // ...for you, it's already over
    { f: 1668, pos: [0, 8, 0.01], look: [0, -60, 0], fov: 64 },
    { f: TOTAL, pos: [0, 2, 0.01], look: [0, -60, 0], fov: 70 },
  ] },
];

/** the kid (own frame) for the follow shots */
export const kidFollowY = (f: number) => {
  if (f < 446) return lerp(31.6, 27.5, smooth((f - 330) / 130));
  if (f < 603) return lerp(27.5, 24.0, (f - 446) / 157);
  return lerp(24.0, 22.4, (f - 603) / 94);
};
/** kid in the giant-hole shot: drifts down onto the horizon (radius RH*7) and through it at "borde" */
export const BIG = 7;
export const kidBigY = (f: number) => RH * BIG + lerp(3.4, -1.2, smooth((f - 1290) / 150));

export const camAt = (id: number, f: number) => {
  const S = SHOTS[id - 1];
  if (id >= 3 && id <= 5) { // follow the falling kid from the side, getting closer as he stretches
    const y = kidFollowY(f), k = id === 3 ? lerp(5.2, 4.4, (f - 339) / 113) : id === 4 ? lerp(4.4, 3.6, (f - 446) / 163) : lerp(3.6, 7.5, smooth((f - 603) / 60));
    const sy = id === 3 ? 1 : id === 4 ? 1 + 0.7 * smooth((f - 500) / 70) : 1.7 + 2.2 * smooth((f - 610) / 40);
    const mid = y + 1.3 - 0.65 * sy;
    return { pos: [KID_X + 0.45 * k, mid + 0.4, KID_Z + k] as V3, look: [KID_X, mid - 0.15, KID_Z] as V3, fov: id === 5 ? 50 : 42 };
  }
  if (id === 10) {
    const y = kidBigY(f);
    return { pos: [KID_X + 3.0, y + 0.6, KID_Z + 9.5 + 0.015 * (f - 1283)] as V3, look: [KID_X, y - 0.6, KID_Z] as V3, fov: 50 };
  }
  const k = S.keys;
  if (f <= k[0].f) return { pos: k[0].pos, look: k[0].look, fov: k[0].fov };
  for (let i = 1; i < k.length; i++) if (f <= k[i].f) {
    const u = (f - k[i - 1].f) / (k[i].f - k[i - 1].f), t = k[i].glide ? smoother(u) : u;
    return { pos: lerp3(k[i - 1].pos, k[i].pos, t), look: lerp3(k[i - 1].look, k[i].look, t), fov: lerp(k[i - 1].fov, k[i].fov, t) };
  }
  const l = k[k.length - 1];
  return { pos: l.pos, look: l.look, fov: l.fov };
};

export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (let i = SHOTS.length - 1; i > 0; i--) {
    const a = SHOTS[i].a;
    if (f >= a + XFADE) return [{ id: i + 1, alpha: 1 }];
    if (f >= a) return [{ id: i, alpha: 1 }, { id: i + 1, alpha: (f - a + 1) / (XFADE + 1) }];
  }
  return [{ id: 1, alpha: 1 }];
};
export const worldF = (f: number) => f;

/** what Leo sees: the kid slows down, reddens and darkens, frozen just above the edge from ~909 */
export const leoView = (f: number) => {
  const u = smooth((f - 691) / 218);
  return { y: lerp(19, RH + 1.15, 1 - (1 - u) ** 2.2), red: smooth((f - 820) / 70), dark: smooth((f - 850) / 70) };
};

export const dofAt = (id: number, f: number): { cInf: number; focus?: V3 } => {
  if (id === 1) return { cInf: 6, focus: [0, 9, 0] };
  if (id === 3 || id === 4) return { cInf: 8, focus: [KID_X, kidFollowY(f), KID_Z] };
  if (id === 7) return { cInf: 10, focus: [KID_X, 9.7, KID_Z] };
  if (id === 10) return { cInf: 5, focus: [KID_X, kidBigY(f), KID_Z] };
  return { cInf: 0 };
};

export const MARKS = [
  { a: 640, b: 697, label: "ESPAGUETIZACIÓN", sub: "(se llama así de verdad)", col: "#ffd23f" },
  { a: 1368, b: 1444, label: "Sagitario A*", sub: "4,3 millones de soles", col: "#ffffff" },
];
