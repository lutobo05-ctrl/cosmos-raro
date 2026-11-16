// The black hole short: one three.js world posed per frame (pure function of shot id + frame), built from the
// skill's pieces (lit flat character cards, contact-free space, world ink on the geometry, post chain in BH.tsx).
// Sets: "space" = the hole (inked black sphere + toon accretion disk + lensed halo + photon ring), Leo's ship,
// colourful nebulae and stars; "inside" = streaks of light and matter pouring into the central point.
import * as THREE from "three";
import { Pen, bodyFront, Outfit, FrontOpts, headBlob, INK, fxBurst } from "./toon";
import { Pool, Actor, Fx, Stage, tier, tierW, light2D, BODY as BODY_G, WIDE as WIDE_G } from "./troop";
import { NOINK } from "./ink";
import { LIGHTS, LightPreset } from "./lights";
import { TONE, CHAR } from "./shade";
import { ctex } from "./paint";
import {
  SHOTS, camAt, smooth, lerp, RH, SHIP, KID_X, KID_Z, fallY, kidFollowY, kidBigY, BIG, leoView,
} from "./story";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const rad = (d: number) => (d * Math.PI) / 180;
const rr = (x0: number, y0: number, x1: number, y1: number, r: number): [number, number][] => {
  const pts: [number, number][] = [];
  for (const [cx, cy, a] of [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]])
    for (let i = 0; i <= 8; i++) pts.push([cx + r * Math.cos(rad(a + (90 * i) / 8)), cy + r * Math.sin(rad(a + (90 * i) / 8))]);
  return pts;
};

// warm key light from the disk below, cool fill: characters read lit by the hole
const SL: LightPreset = { ...LIGHTS.golden, el: -25, lit: [1.5, 1.05, 0.7], shade: [0.3, 0.3, 0.55], lift: [0.06, 0.06, 0.14],
  charTint: [1.0, 0.92, 0.85], charShade: 0.84, sunCol: "#ffc890", sunI: 3.2, sky: "#8fa0ff", ground: "#ff9a50", hemiI: 0.7 };

// ---------------- cast ----------------
const ASTRO: Outfit = { jacket: "#f1eee8", pants: "#e4e1dc", boots: "#7f8494", hat: "hair", hair: "#4a2e20", buttons: "#ff7a3a", build: "kid" };
const LEO: Outfit = { jacket: "#ff8a3d", pants: "#3b4a6a", boots: "#2a2a3a", hat: "hair", hair: "#e8b84a", buttons: "#ffffff", build: "kid", skin: "#f5c9a0" };
const KID_A = 112;
const astro = (p: Pen, o: FrontOpts, helmet = true) => {
  const seed = o.seed ?? 3, H = headBlob(seed, KID_A, o.facing ?? 0), HH = 2 * H.b, u = (2 * H.a) / 100;
  const sole = 975, torsoBot = sole - 1.0 * HH, chin = torsoBot - 0.85 * HH, hc = chin - H.b;
  p.poly(rr(300 - 52 * u, chin + 4 * u, 300 + 52 * u, torsoBot - 10 * u, 10 * u), "#c9ccd6", 9);
  bodyFront(p, ASTRO, o);
  p.ell(300, chin + 2 * u, 46 * u, 11 * u, "#b9bdc9", 9);
  p.poly(rr(300 - 16 * u, chin + 30 * u, 300 + 16 * u, chin + 48 * u, 3 * u), "#3b4a6a", 6);
  p.dot(300 - 8 * u, chin + 39 * u, 3 * u, "#7ee07a"); p.dot(300 + 6 * u, chin + 39 * u, 3 * u, "#ff5a4a");
  if (!helmet) return;
  const R = H.a * 1.34, cx = 300, cy = hc - 6 * u, g = p.g;
  g.save(); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fillStyle = "rgba(200,230,255,0.16)"; g.fill(); g.restore();
  p.ell(cx, cy, R, R, null, 10);
  p.arc(cx, cy, R * 0.8, R * 0.8, 200, 250, 5.4 * u, "rgba(255,255,255,0.85)");
  p.dot(cx + R * 0.45, cy - R * 0.55, 5 * u, "rgba(255,255,255,0.85)");
};
/** Leo's ship: WIDE 2000 x 1400 card, a fat cartoon cruiser with a big window, Leo inside */
const shipDraw = (leo: FrontOpts, k: number) => (p: Pen) => {
  const g = p.g;
  // engine flames (right)
  const fl = 1 + 0.12 * Math.sin(k * 1.7);
  p.poly([[1700, 560], [1700 + 240 * fl, 640], [1700, 720]], "#5ad7ff", 0);
  p.poly([[1700, 600], [1700 + 140 * fl, 640], [1700, 680]], "#ffffff", 0);
  // fins
  p.poly([[1350, 470], [1560, 260], [1660, 260], [1560, 520]], "#e2453c", 12);
  p.poly([[1350, 800], [1560, 1010], [1660, 1010], [1560, 760]], "#e2453c", 12);
  // hull
  p.poly(rr(300, 420, 1720, 860, 210), "#eef2fa", 14);
  p.poly(rr(330, 700, 1700, 760, 20), "#c9d2e6", 0);
  p.band([[420, 600], [1650, 600]], "#2f6fae", 26, 6);
  for (const x of [1180, 1330, 1480]) { p.ell(x, 520, 34, 34, "#9fd4ff", 9); }
  p.poly(rr(1690, 540, 1760, 740, 20), "#7f8494", 12);
  // big round window with Leo
  p.ell(640, 640, 260, 230, "#1d2b4a", 16);
  p.clip(Array.from({ length: 49 }, (_, i) => [640 + 250 * Math.cos(i / 48 * 6.283), 640 + 220 * Math.sin(i / 48 * 6.283)] as [number, number]), () => {
    g.fillStyle = "#3a5a8a"; g.fillRect(380, 410, 520, 460);
    g.save(); g.translate(640 - 300 * 0.9, 640 - 330 * 0.9); g.scale(0.9, 0.9); bodyFront(p, LEO, leo); g.restore();
  });
  p.arc(640, 640, 220, 190, 200, 250, 18, "rgba(255,255,255,0.7)");
  p.ell(640, 640, 260, 230, null, 16);
};
/** alarm-style clock face: 300 x 300; mins/hours hand angles in radians */
const clockDraw = (am: number, ah: number, col: string) => (p: Pen) => {
  p.ell(150, 150, 130, 130, col, 14);
  p.ell(150, 150, 104, 104, "#fbf6ea", 9);
  for (let i = 0; i < 12; i++) { const q = rad(i * 30); p.dot(150 + 86 * Math.cos(q), 150 + 86 * Math.sin(q), i % 3 ? 4 : 8); }
  p.stroke([[150, 150], [150 + 62 * Math.sin(ah), 150 - 62 * Math.cos(ah)]], 12);
  p.stroke([[150, 150], [150 + 88 * Math.sin(am), 150 - 88 * Math.cos(am)]], 8);
  p.dot(150, 150, 10);
};
/** gravity arrow pointing down, 200 x 600; len 0..1 */
const arrowDraw = (len: number) => (p: Pen) => {
  const y1 = 80 + 420 * len;
  p.line([[100, 40], [100, y1]], "#ff5a7a", 40);
  p.poly([[40, y1 - 10], [160, y1 - 10], [100, y1 + 80]], "#ff5a7a", 12);
};
/** a light wave climbing: 300 x 700 sine, wavelength wl (px), colour */
const waveDraw = (wl: number, col: string) => (p: Pen) => {
  const pts: [number, number][] = [];
  for (let y = 680; y >= 20; y -= 6) pts.push([150 + 90 * Math.sin((y / wl) * Math.PI * 2), y]);
  p.line(pts, col, 22);
};
const flashDraw = (p: Pen) => { const g = p.g, gr = g.createRadialGradient(256, 256, 0, 256, 256, 256); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,240,200,0.8)"); gr.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = gr; g.fillRect(0, 0, 512, 512); };

// ---------------- toon accretion disk ----------------
const DISK_VS = `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const DISK_FS = `uniform float uT; uniform float rIn; uniform float rOut; uniform float uGain; varying vec3 vP;
void main(){
  float r = length(vP.xy); float t = clamp((r - rIn) / (rOut - rIn), 0.0, 1.0);
  float a = atan(vP.y, vP.x) + uT * (2.2 / (0.4 + t * 2.0));          // inner gas spins faster
  float b = 0.5 + 0.5 * sin(r * 2.2 + 3.5 * sin(a * 2.0 + r * 0.35));
  b = floor(b * 3.0 + 0.5) / 3.0;                                    // toon steps
  vec3 hot = vec3(2.0, 1.6, 1.05), warm = vec3(1.35, 0.5, 0.12), cool = vec3(0.55, 0.1, 0.32);
  vec3 c = mix(hot, warm, smoothstep(0.0, 0.45, t)); c = mix(c, cool, smoothstep(0.45, 1.0, t));
  float al = smoothstep(0.0, 0.06, t) * (1.0 - smoothstep(0.75, 1.0, t));
  gl_FragColor = vec4(c * (0.45 + 0.75 * b) * al * uGain, 1.0);
}`;
const diskMat = (rIn: number, rOut: number, gain: number, u: { uT: { value: number } }) => new THREE.ShaderMaterial({
  uniforms: { uT: u.uT, rIn: { value: rIn }, rOut: { value: rOut }, uGain: { value: gain } },
  vertexShader: DISK_VS, fragmentShader: DISK_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
});

export class World {
  root = new THREE.Group();
  private space = new THREE.Group();
  private inside = new THREE.Group();
  private hole = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private stars: THREE.Points; private nebulae: THREE.Mesh[] = [];
  private halo: THREE.Mesh; private photon: THREE.Mesh; private glow: THREE.Mesh;
  private streaks: THREE.LineSegments; private streakSeed: Float32Array; private core: THREE.Mesh;
  private U = { uT: { value: 0 } };
  private frustum = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private sph = new THREE.Sphere(); private v = new THREE.Vector3();

  constructor() {
    const R = this.root;
    R.add(this.space, this.inside);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    R.add(this.hemi, this.sun, this.sun.target);
    // stars (shared by both sets)
    {
      const N = 3200, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const u = hh(i, 40) * 2 - 1, q = hh(i, 41) * 6.28, s = Math.sqrt(1 - u * u), r2 = 1500;
        pos.set([Math.cos(q) * s * r2, u * r2, Math.sin(q) * s * r2], i * 3);
        const w = 0.5 + hh(i, 42) * 0.9, k = hh(i, 43);
        col.set(k < 0.2 ? [w, w * 0.8, w * 0.6] : k < 0.4 ? [w * 0.7, w * 0.85, w * 1.1] : [w, w, w], i * 3);
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      this.stars = new THREE.Points(geo, new THREE.PointsMaterial({ size: 2.6, sizeAttenuation: false, vertexColors: true, fog: false }));
      this.stars.layers.set(NOINK); this.stars.frustumCulled = false; R.add(this.stars);
    }
    // ===== space set =====
    const S = this.space;
    // painted nebulae for colour (purple, teal, pink) far away
    const neb = (key: string, stops: [number, string][]) => ctex(key, 512, 512, (g, r) => {
      for (let i = 0; i < 9; i++) { const x = 140 + r() * 232, y = 140 + r() * 232, q = 90 + r() * 140, gr = g.createRadialGradient(x, y, 0, x, y, q);
        for (const [o, c] of stops) gr.addColorStop(o, c); g.fillStyle = gr; g.fillRect(0, 0, 512, 512); }
    });
    const nt = [neb("nebA", [[0, "rgba(150,70,220,0.35)"], [0.6, "rgba(90,40,160,0.12)"], [1, "rgba(60,20,120,0)"]]),
      neb("nebB", [[0, "rgba(40,180,200,0.3)"], [0.6, "rgba(30,110,170,0.1)"], [1, "rgba(20,60,140,0)"]]),
      neb("nebC", [[0, "rgba(240,90,150,0.3)"], [0.6, "rgba(160,50,120,0.1)"], [1, "rgba(100,30,90,0)"]])];
    for (let i = 0; i < 14; i++) {
      const u = hh(i, 50) * 1.6 - 0.8, q = hh(i, 51) * 6.28, s = Math.sqrt(1 - u * u), d = 900;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: nt[i % 3], transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
      const w = 500 + hh(i, 52) * 600; m.scale.set(w, w, 1);
      m.position.set(Math.cos(q) * s * d, u * d, Math.sin(q) * s * d); m.layers.set(NOINK); this.nebulae.push(m); S.add(m);
    }
    // the hole: inked black sphere, disk, lensed halo, photon ring, soft glow
    const H = this.hole; S.add(H);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(RH, 96, 64), new THREE.MeshBasicMaterial({ color: "#000000" }));
    ball.renderOrder = 2; H.add(ball);
    const disk = new THREE.Mesh(new THREE.RingGeometry(RH * 1.5, RH * 3.2, 192, 8), diskMat(RH * 1.5, RH * 3.2, 0.55, this.U));
    disk.rotation.x = -Math.PI / 2 + 0.12; disk.layers.set(NOINK); disk.renderOrder = 3; H.add(disk);
    this.halo = new THREE.Mesh(new THREE.RingGeometry(RH * 1.03, RH * 1.9, 192, 4), diskMat(RH * 1.03, RH * 1.7, 0.5, this.U));
    this.halo.layers.set(NOINK); this.halo.renderOrder = 1; H.add(this.halo);
    this.photon = new THREE.Mesh(new THREE.RingGeometry(RH * 1.0, RH * 1.06, 192, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.0, 1.5), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.photon.layers.set(NOINK); this.photon.renderOrder = 4; H.add(this.photon);
    this.glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ctex("bhGlow", 512, 512, (g) => flashDraw(new Pen(g))), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(0.45, 0.22, 0.12) }));
    this.glow.scale.set(RH * 6, RH * 6, 1); this.glow.layers.set(NOINK); this.glow.renderOrder = 0; H.add(this.glow);

    // ===== inside set: streaks pouring into the centre =====
    const N = 700, pos = new Float32Array(N * 6), col = new Float32Array(N * 6);
    this.streakSeed = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      this.streakSeed.set([hh(i, 60), hh(i, 61), hh(i, 62), hh(i, 63)], i * 4);
      const k = hh(i, 64), c = k < 0.35 ? [3.0, 2.2, 1.0] : k < 0.6 ? [2.4, 0.9, 0.3] : k < 0.8 ? [1.2, 0.5, 2.2] : [0.6, 1.6, 2.4];
      col.set([...c, ...c.map((x) => x * 0.15)], i * 6);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); sg.setAttribute("color", new THREE.BufferAttribute(col, 3));
    this.streaks = new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.streaks.frustumCulled = false; this.streaks.layers.set(NOINK); this.inside.add(this.streaks);
    this.core = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 5.5, 4.5) }));
    this.core.position.set(0, -60, 0); this.core.layers.set(NOINK); this.inside.add(this.core);
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const S = SHOTS[id - 1], t = f / 30;
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 5000; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const isIn = S.place === "inside";
    this.space.visible = !isIn; this.inside.visible = isIn;
    scene.fog = null; scene.background = new THREE.Color("#04030a");
    this.stars.position.copy(cam.position);
    this.U.uT.value = t;
    const L = SL;
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    const sunDir = V(0.3, -0.6, 0.5).normalize(); // light from the disk, below
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI; this.sun.position.copy(cam.position).addScaledVector(sunDir, -100); this.sun.target.position.copy(cam.position);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    for (const m of this.nebulae) m.quaternion.copy(cam.quaternion);

    // the hole (scaled up for the "giant" shot)
    const sc = S.bhScale ?? 1;
    this.hole.scale.setScalar(sc);
    this.halo.quaternion.copy(cam.quaternion); this.photon.quaternion.copy(cam.quaternion); this.glow.quaternion.copy(cam.quaternion);
    // billboards inside a scaled group: undo nothing (uniform scale)

    // inside: streaks rush to the centre, light that tries to leave curves back
    if (isIn) {
      const pa = this.streaks.geometry.attributes.position as THREE.BufferAttribute, sd = this.streakSeed, C = V(0, -60, 0);
      for (let i = 0; i < pa.count / 2; i++) {
        const s0 = sd[i * 4], s1 = sd[i * 4 + 1], s2 = sd[i * 4 + 2], s3 = sd[i * 4 + 3];
        const ph = (t * (0.25 + 0.5 * s0) + s1) % 1, r = 120 * (1 - ph) ** 1.6 + 1.5;
        const th = s2 * 6.283 + ph * (2 + 3 * s3), el = (s3 - 0.5) * 2.6;
        const dir = V(Math.cos(th) * Math.cos(el), Math.sin(el), Math.sin(th) * Math.cos(el));
        const head = C.clone().addScaledVector(dir, r), tail = C.clone().addScaledVector(dir, r + 6 + 30 * (1 - ph));
        pa.setXYZ(i * 2, head.x, head.y, head.z); pa.setXYZ(i * 2 + 1, tail.x, tail.y, tail.z);
      }
      pa.needsUpdate = true;
      const pulse = id === 13 ? 1 - smooth((f - 1688) / 12) : 1;
      this.core.scale.setScalar((1 + 0.15 * Math.sin(t * 9)) * pulse);
      (this.streaks.material as THREE.LineBasicMaterial).opacity = id === 13 ? 1 - smooth((f - 1690) / 10) : 1;
    }

    // ---- cast ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const light = light2D(V(-0.3, 0.6, -0.5), right);
    type Pl = { key: string; x: number; y: number; z: number; size: [number, number, number]; draw: (p: Pen) => void; wide?: boolean; scale?: number; sx?: number; sy?: number; tint?: [number, number, number]; wob?: number; face?: boolean; head?: boolean };
    const places: Pl[] = [];
    const st: Stage = { places: [], fx: [] };
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const lidAt = (i: number) => { let s = Math.round(-60 * hh(i, 9)); for (let n = 0; s <= f && n < 80; n++) { const k = f - s; if (k >= 0 && k < 4) return [0.5, 1, 1, 0.5][k]; s += Math.round(15 + 54 * hh(i * 31 + n, 13)); } return 0; };
    const visible = (x: number, y: number, z: number, r: number) => this.frustum.intersectsSphere(this.sph.set(this.v.set(x, y, z), r));
    const kid = (x: number, y: number, z: number, o: FrontOpts, ext: Partial<Pl> = {}, frozen = false) => {
      if (!visible(x, y + 1, z, 4 * (ext.sy ?? 1))) return;
      const d = cam.position.distanceTo(this.v.set(x, y + 1.0, z)) / Math.max(1, (ext.sy ?? 1) * 0.6), [w, h, k] = tier(d);
      const o2: FrontOpts = { ...o, light, seed: 3, blink: frozen ? 0 : d < 16 ? (o.blink ?? lidAt(1)) : 0 };
      places.push({ key: `astro|${JSON.stringify(o2)}`, x, y, z, size: [w, h, k], draw: (p) => astro(p, o2), head: true, ...ext });
    };
    const leo = (x: number, y: number, z: number, o: FrontOpts) => {
      if (!visible(x, y + 1, z, 3)) return;
      const d = cam.position.distanceTo(this.v.set(x, y + 1.0, z)), [w, h, k] = tier(d);
      const o2: FrontOpts = { ...o, light, seed: 5, blink: lidAt(7) };
      places.push({ key: `leo|${JSON.stringify(o2)}`, x, y, z, size: [w, h, k], draw: (p) => bodyFront(p, LEO, o2) });
    };
    const fxCard = (key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, soft = false) =>
      st.fx.push({ key, cw, ch, draw, x, y, z, w, h, soft });
    const ship = (leoExpr: FrontOpts["expr"], wave = false) => {
      const sc2 = 3.0;
      if (!visible(SHIP[0], SHIP[1], SHIP[2], 10)) return;
      const d = cam.position.distanceTo(this.v.set(...SHIP)) / sc2, [w, h, k] = tierW(d);
      const lo: FrontOpts = { mode: "stand", expr: leoExpr, light, seed: 5, blink: lidAt(7), wave: wave ? 0.5 + 0.5 * Math.sin(f * 0.4) : undefined };
      places.push({ key: `ship|${JSON.stringify(lo)}|${f % 4}`, x: SHIP[0], y: SHIP[1] - 1375 * 0.00216 * sc2 + 4.2, z: SHIP[2], size: [w, h, k], wide: true, scale: sc2, draw: shipDraw(lo, f) });
    };
    const g8 = (hz: number) => Math.floor(((((t * hz) % 1) + 1) % 1) * 8) / 8; void g8;

    if (!isIn) {
      if (id === 1) { // hook: frozen red copy (what Leo sees) + the real you, stretching into the hole
        const fr = smooth((f - 60) / 25);
        const yF = lerp(8.6, 7.1, smooth(f / 80));
        kid(-0.75, yF, 0.4, { mode: "stand", expr: f < 70 ? "shock" : "shock", headTilt: 0.05 }, { tint: [1 - 0.1 * fr, 1 - 0.6 * fr, 1 - 0.65 * fr] }, f > 80);
        if (f > 100) {
          const s = smooth((f - 118) / 34);
          kid(0.75, lerp(7.1, 5.6, s), 0.4, { mode: "stand", expr: s > 0.5 ? "dazed" : "nervous" }, { sy: 1 + 3.2 * s, sx: 1 - 0.62 * s, wob: s });
          if (f > 150 && f < 162) fxCard(`fl|${f - 150}`, 500, 500, (p) => fxBurst(p, (f - 150) / 12, "#fff3b0", 12, 20, 200), 0.75, 7.2, 0.8, 3, 3);
        }
      }
      if (id === 2 || id === 6 || id === 8 || id === 9 || id === 12) ship(id === 2 ? (f > 320 ? "shock" : "grin") : id === 12 ? "pained" : "shock", id === 12);
      if (id === 2) {
        const lean = smooth((f - 262) / 24) * 0.22, y = fallY(f);
        kid(KID_X + 1.0, y, KID_Z + 1.2, { mode: "stand", expr: f > 318 ? "shock" : f > 262 ? "nervous" : "smile", tilt: f < 318 ? lean : 0.1 * Math.sin(f * 0.2) });
      }
      if (id >= 3 && id <= 5) {
        const y = kidFollowY(f);
        const s = id === 3 ? 0 : id === 4 ? smooth((f - 500) / 70) * 0.7 : 0.7 + smooth((f - 610) / 40) * 2.2;
        const expr = id === 3 ? "relief" : id === 4 ? (f > 540 ? "pained" : "nervous") : "dazed";
        kid(KID_X, y, KID_Z, { mode: "stand", expr: expr as FrontOpts["expr"], tilt: id === 3 ? 0.12 * Math.sin(f * 0.05) : 0 }, { sy: 1 + s, sx: 1 / (1 + 0.55 * s), wob: id === 5 ? 1 : 0 });
        if (id === 4 && f > 504) { // feet pulled harder than the head
          const a = smooth((f - 504) / 12), b = smooth((f - 526) / 12);
          fxCard(`arF|${a.toFixed(2)}`, 200, 600, arrowDraw(0.9 * a), KID_X + 0.8, y + 1.3 - 1.3 * (1 + s) - 0.2, KID_Z + 0.2, 0.5, 1.5);
          if (b > 0) fxCard(`arH|${b.toFixed(2)}`, 200, 600, arrowDraw(0.25 * b), KID_X + 0.8, y + 1.15, KID_Z + 0.2, 0.5, 1.5);
        }
      }
      if (id === 6 || id === 12) { // Leo's view
        const lv = id === 6 ? leoView(f) : { y: RH + 1.15, red: 1, dark: 1 };
        kid(KID_X * 0.6, lv.y, KID_Z * 0.6, { mode: "stand", expr: "shock" }, { tint: [1 - 0.15 * lv.dark, 1 - 0.65 * lv.red - 0.2 * lv.dark, 1 - 0.7 * lv.red - 0.15 * lv.dark], sy: 1.3, sx: 0.85, face: true }, true);
      }
      if (id === 7) kid(KID_X, 9.0, KID_Z, { mode: "stand", expr: "nervous", headTilt: 0.12, look: -1 }, { sy: 1.25, sx: 0.88 });
      if (id === 8 || id === 9) {
        kid(KID_X * 0.6, RH + 1.4, KID_Z * 0.6, { mode: "stand", expr: id === 8 ? "smile" : "nervous" }, { sy: 1.3, sx: 0.85 });
        if (id === 8) {
          const kidMin = (f - 991) * 0.04, leoMin = (f - 991) * 0.04 + Math.max(0, f - 1100) ** 2 * 0.012;
          fxCard(`ckK|${Math.round(kidMin * 20)}`, 300, 300, clockDraw(kidMin, kidMin / 12, "#7fd0ff"), KID_X + 4.6, RH + 4.2, 2, 4.6, 4.6);
          fxCard(`ckL|${Math.round(leoMin * 20)}`, 300, 300, clockDraw(leoMin, leoMin / 12, "#ff8a3d"), 6.5, SHIP[1] - 6.5, 2, 5.6, 5.6);
          if (f > 1138 && f < 1150) fxCard(`flL|${f}`, 500, 500, (p) => fxBurst(p, (f - 1138) / 12, "#fff3b0", 10, 20, 200), 6.5, SHIP[1] - 5.5, 2.2, 6, 6);
        }
        if (id === 9) { // light climbing: each wave leaves the kid, slows, stretches and reddens
          for (let k = 0; k < 6; k++) {
            const u = (((f - 1160) / 90 + k / 6) % 1 + 1) % 1, y = RH + 3 + (SHIP[1] - RH - 8) * (1 - (1 - u) ** 0.6);
            const wl = 60 + 260 * u, col = u < 0.3 ? "#fff176" : u < 0.55 ? "#ffb34a" : u < 0.8 ? "#ff6a3a" : "#c2263a";
            fxCard(`wave|${Math.round(wl / 10)}|${col}`, 300, 700, waveDraw(wl, col), 1.0 + 0.4 * k % 2, y, 1.5, 1.2, 2.8);
          }
        }
      }
      if (id === 10) {
        const y = kidBigY(f);
        kid(KID_X, y, KID_Z, { mode: "stand", expr: f > 1400 ? "relief" : "smile_closed", tilt: 0.06 * Math.sin(f * 0.05) });
      }
    } else {
      // a tiny you, falling to the centre (shot 11 only)
      if (id === 11) {
        const u = smooth((f - 1449) / 150);
        kid(0.4, lerp(14, -20, u), 0.3, { mode: "stand", expr: f > 1530 ? "shock" : "nervous" }, { sy: 1 + 2 * u, sx: 1 - 0.5 * u, face: true });
      }
    }

    // ---- place cards (with per-card stretch, wobble and tint) ----
    let ai = 0;
    for (const p of places) {
      const a = this.actor(ai++), [w, h, k] = p.size, s = p.scale ?? 1, sy = p.sy ?? 1, sx = p.sx ?? 1;
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.geometry = p.wide ? WIDE_G : BODY_G;
      // stretched kids keep the head where it was: the body grows down, toward the hole
      const drop = p.head && sy > 1 ? 1.3 * (sy - 1) : 0;
      a.mesh.visible = true; a.mesh.position.set(p.x, p.y - drop, p.z);
      if (p.face) { a.mesh.quaternion.copy(cam.quaternion); a.mesh.position.set(p.x, p.y, p.z).addScaledVector(this.v.set(0, 1, 0).applyQuaternion(cam.quaternion), -drop); }
      else a.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), (p.wob ?? 0) * 0.06 * Math.sin(f * 0.5));
      a.mesh.scale.set(s * sx, s * sy, s);
      const tc = p.tint ?? [1, 1, 1];
      a.mat.color.setRGB(tc[0], tc[1], tc[2]);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    for (const p of st.fx) {
      if (!visible(p.x, p.y, p.z, Math.max(p.w, p.h))) continue;
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft); e.mesh.visible = true; e.mesh.position.set(p.x, p.y, p.z);
      e.mesh.quaternion.copy(cam.quaternion);
      e.mesh.scale.set(p.w, p.h, 1);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (let i = 0; i < ai; i++) this.actors[i].bind();
    for (let i = 0; i < fi; i++) this.fxs[i].bind();
    void INK; void tier;
    return V(...c.look);
  }
}
