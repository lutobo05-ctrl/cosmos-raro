// Venus, one three.js world posed per frame (pure function of shot id + frame), built from the skill's pieces:
// painted sky by elevation, two-tone world materials, painted ground, flat cartoon clouds, lit character cards with
// contact blobs, world ink. Two sets: the surface of Venus (thick orange sky, basalt plains, volcanoes) and space
// (the Sun, Venus and Earth on their orbits, toon-lit with an inked rim).
import * as THREE from "three";
import { Pen, bodyFront, Outfit, Expr, FrontOpts, headBlob, INK, fxBurst, fxPuff } from "./toon";
import { Pool, Actor, Fx, Stage, tier, tierW, light2D, blob, BODY, WIDE } from "./troop";
import { NOINK } from "./ink";
import { LIGHTS, LightPreset } from "./lights";
import { TONE, CHAR, twoTone, untone } from "./shade";
import { cloudHD, rep, ctex } from "./paint";
import {
  FPS, SHOTS, camAt, smooth, worldF, sunEl, venusSpin, venusOrbit, earthOrbit, lapAt, heatAt, liftAt,
  HERO, TABLE, TRACK, TRACK_R, ROCKET, SUN_AT, ORBIT_V, ORBIT_E,
} from "./story";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const lam = (p: THREE.MeshLambertMaterialParameters) => twoTone(new THREE.MeshLambertMaterial(p));
const rad = (d: number) => (d * Math.PI) / 180;
const rr = (x0: number, y0: number, x1: number, y1: number, r: number): [number, number][] => {
  const pts: [number, number][] = [];
  for (const [cx, cy, a] of [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]])
    for (let i = 0; i <= 8; i++) pts.push([cx + r * Math.cos(rad(a + (90 * i) / 8)), cy + r * Math.sin(rad(a + (90 * i) / 8))]);
  return pts;
};

// ---------------- look: thick, hot, orange Venus day ----------------
const VL: LightPreset = { ...LIGHTS.golden, el: 34, lit: [1.42, 1.08, 0.72], shade: [0.4, 0.27, 0.27], lift: [0.06, 0.04, 0.05],
  charTint: [1.0, 0.9, 0.78], charShade: 0.88, fog: "#e7b06c", sunCol: "#ffd6a0", sunI: 3.0, sky: "#f0c890", ground: "#7a4a34", hemiI: 0.6, actorShadow: false };
const SKY_DAY = ["#f4c47c", "#eaa862", "#d98e52", "#bb7046", "#8f553c"];
const SKY_HOT = ["#e6d47a", "#d0b35a", "#b59a4a", "#8c7a3e", "#5e5232"];
const SKY_E = [0, 4, 10, 22, 45];
const CLOUD_V = { lit: "#f8dca0", mid: "#e0b072", shade: "#b08262" };
const LIGHT = -2.1;

// ---------------- cast: the astronaut kid ----------------
const ASTRO: Outfit = { jacket: "#f1eee8", pants: "#e4e1dc", boots: "#7f8494", hat: "hair", hair: "#4a2e20", buttons: "#ff7a3a", build: "kid" };
const KID_A = 112, KID = { torso: 0.85, legs: 1.0 };
/** the kid in a space suit: backpack behind, bodyFront, then a glass bubble helmet around the head */
const astro = (p: Pen, o: FrontOpts, helmetFog = 0) => {
  const seed = o.seed ?? 3, H = headBlob(seed, KID_A, o.facing ?? 0), HH = 2 * H.b, u = (2 * H.a) / 100;
  const tall = (1 + KID.torso + KID.legs) * HH, sole = 975, two = Math.PI * 2, ph = o.phase ?? 0;
  const bob = o.mode === "march" ? 0.025 * tall * Math.cos(2 * two * ph) : 0;
  const torsoBot = o.mode === "sit" ? sole - 0.2 * HH : sole - KID.legs * HH + bob;
  const chin = torsoBot - KID.torso * HH, hc = chin - H.b;
  // backpack
  p.poly(rr(300 - 52 * u, chin + 4 * u, 300 + 52 * u, torsoBot - 10 * u, 10 * u), "#c9ccd6", 9);
  p.poly(rr(300 - 40 * u, chin - 8 * u, 300 - 20 * u, chin + 10 * u, 4 * u), "#9aa0b0", 7);
  bodyFront(p, ASTRO, o);
  // suit details: collar ring + chest panel
  p.ell(300, chin + 2 * u, 46 * u, 11 * u, "#b9bdc9", 9);
  p.poly(rr(300 - 16 * u, chin + 30 * u, 300 + 16 * u, chin + 48 * u, 3 * u), "#3b4a6a", 6);
  p.dot(300 - 8 * u, chin + 39 * u, 3 * u, "#7ee07a"); p.dot(300 + 6 * u, chin + 39 * u, 3 * u, "#ff5a4a");
  // bubble helmet
  const R = H.a * 1.34, cx = 300 + (o.tilt ?? 0) * 0.6 * (sole - hc), cy = hc - 6 * u;
  const g = p.g;
  g.save(); g.beginPath(); g.arc(cx, cy, R, 0, two);
  g.fillStyle = `rgba(200,230,255,${(0.16 + 0.5 * helmetFog).toFixed(3)})`; g.fill(); g.restore();
  p.ell(cx, cy, R, R, null, 10);
  p.arc(cx, cy, R * 0.8, R * 0.8, 200, 250, 9 * u * 0.6, "rgba(255,255,255,0.85)");
  p.dot(cx + R * 0.45, cy - R * 0.55, 5 * u, "rgba(255,255,255,0.85)");
};

// ---------------- props (2D cards) ----------------
const clockDraw = (ring: number, k: number) => (p: Pen) => { // 300 x 300, alarm clock; ring 0..1 shakes it
  const j = ring > 0 ? Math.sin(k * 2.7) * 9 * ring : 0, a = ring > 0 ? Math.sin(k * 1.9) * 0.12 * ring : 0;
  p.g.save(); p.g.translate(150 + j, 160); p.g.rotate(a); p.g.translate(-150, -160);
  for (const s of [-1, 1]) { p.ell(150 + s * 62, 72, 34, 26, "#e9c240", 9, 0, 360, s * 30); }
  p.stroke([[110, 245], [92, 272]], 12); p.stroke([[190, 245], [208, 272]], 12);
  p.ell(150, 160, 98, 98, "#e2453c", 12);
  p.ell(150, 160, 74, 74, "#fbf6ea", 8);
  for (let i = 0; i < 12; i++) { const q = rad(i * 30); p.dot(150 + 60 * Math.cos(q), 160 + 60 * Math.sin(q), i % 3 ? 3 : 6); }
  p.stroke([[150, 160], [150, 112]], 9); p.stroke([[150, 160], [186, 172]], 7); p.dot(150, 160, 8);
  p.g.restore();
  if (ring > 0) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const q = rad(-90 + s * (40 + i * 22)); p.stroke([[150 + 120 * Math.cos(q), 160 + 120 * Math.sin(q)], [150 + 145 * Math.cos(q), 160 + 145 * Math.sin(q)]], 9);
  }
};
const signDraw = (p: Pen) => { // 400 x 600, a wooden post with an arrow board "OESTE" and a little sun
  p.poly(rr(184, 200, 216, 590, 6), "#8a5a3a", 9);
  p.poly([[40, 90], [300, 90], [372, 160], [300, 230], [40, 230]], "#f2e2bc", 12);
  const g = p.g; g.font = "bold 74px DejaVu Sans, Arial, sans-serif"; g.fillStyle = INK; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("OESTE", 190, 164);
  p.ell(200, 40, 30, 30, "#ffd23f", 8);
  for (let i = 0; i < 8; i++) { const q = rad(i * 45); p.stroke([[200 + 40 * Math.cos(q), 40 + 40 * Math.sin(q)], [200 + 54 * Math.cos(q), 40 + 54 * Math.sin(q)]], 7); }
};
const schoolDraw = (p: Pen) => { // 500 x 400, a tiny school far away
  p.poly([[60, 380], [60, 170], [250, 60], [440, 170], [440, 380]], "#e8c49a", 12);
  p.poly([[40, 180], [250, 50], [460, 180]], null, 14);
  p.poly(rr(210, 270, 290, 380, 6), "#8a5a3a", 9);
  for (const x of [110, 350]) p.poly(rr(x - 30, 210, x + 30, 260, 4), "#7fb8e0", 8);
  const g = p.g; g.font = "bold 58px DejaVu Sans, Arial, sans-serif"; g.fillStyle = INK; g.textAlign = "center"; g.fillText("COLE", 250, 165);
  p.ell(250, 112, 22, 22, "#fbf6ea", 6); p.stroke([[250, 112], [250, 98]], 4); p.stroke([[250, 112], [262, 116]], 4);
};
const thermoDraw = (level: number, pop: number) => (p: Pen) => { // 240 x 720, thermometer; level 0..1, pop 0..1 bursts the top
  p.poly(rr(80, 60, 160, 600, 40), "#f6f2ea", 12);
  const top = 580 - 500 * level;
  p.poly(rr(100, Math.min(560, top), 140, 610, 20), "#e23b2e", 0);
  p.ell(120, 640, 58, 58, "#e23b2e", 12);
  for (let i = 0; i < 9; i++) p.stroke([[160, 120 + i * 55], [182, 120 + i * 55]], 6);
  if (pop > 0) { p.g.save(); p.g.translate(-130, -190 - 40 * pop); p.g.scale(1.0, 1.0); fxBurst(p, Math.min(1, pop), "#ffd23f", 10, 30, 150); p.g.restore(); }
};
const tableDraw = (n: number) => (p: Pen) => { // WIDE 2000 x 1400, ground 1375: a camping table, plates appear one by one
  p.poly(rr(560, 820, 1440, 880, 16), "#c98f5a", 12);
  for (const x of [640, 1360]) p.poly(rr(x - 18, 870, x + 18, 1375, 6), "#8a5a3a", 10);
  p.poly(rr(600, 880, 1400, 905, 8), "#a8724a", 8);
  const plate = (x: number, food: number) => {
    p.ell(x, 818, 120, 26, "#fbf6ea", 9);
    if (food === 0) { p.ell(x - 30, 806, 40, 14, "#ffffff", 7); p.ell(x - 30, 804, 14, 9, "#ffc21a", 0); p.poly(rr(x + 10, 790, x + 80, 812, 8), "#d27a4a", 7); }
    if (food === 1) { p.ell(x, 790, 66, 30, "#d9a05a", 8, 180, 360); p.poly(rr(x - 68, 790, x + 68, 806, 4), "#6a3a22", 6); p.poly(rr(x - 70, 776, x + 70, 790, 4), "#5cb04a", 0); p.ell(x, 810, 62, 9, "#d9a05a", 7); }
    if (food === 2) { for (let i = 0; i < 6; i++) p.arc(x + (i - 2.5) * 12, 806, 50 - i * 4, 14, 180, 360, 7, "#f2d27a"); p.ell(x, 790, 26, 14, "#c8342a", 6); }
  };
  if (n >= 1) plate(760, 0);
  if (n >= 2) plate(1000, 1);
  if (n >= 3) plate(1240, 2);
};
const rocketDraw = (fire: number, k: number) => (p: Pen) => { // 600 x 1000 BODY card, soles at 975
  const body: [number, number][] = [[300, 60], [380, 200], [400, 720], [200, 720], [220, 200]];
  if (fire > 0) {
    const fl = 1 + 0.15 * Math.sin(k * 2.3);
    p.poly([[230, 760], [300, 760 + 240 * fl * fire], [370, 760]], "#ff8a1a", 0);
    p.poly([[262, 760], [300, 760 + 150 * fl * fire], [338, 760]], "#ffe066", 0);
  }
  for (const s of [-1, 1]) p.poly([[300 + s * 95, 560], [300 + s * 190, 800], [300 + s * 190, 870], [300 + s * 100, 760]], "#e2453c", 12);
  p.poly(body, "#f4f1ea", 12);
  p.poly([[300, 60], [366, 175], [234, 175]], "#e2453c", 12);
  p.poly(rr(240, 720, 360, 790, 10), "#7f8494", 12);
  p.ell(300, 330, 58, 58, "#7fc4ef", 12); p.arc(300, 330, 40, 40, 200, 260, 8, "#ffffff");
  p.stroke([[214, 480], [386, 480]], 8);
};
const arrowDraw = (p: Pen) => { // 700 x 300, a curved "backwards" arrow
  const pts: [number, number][] = [];
  for (let i = 0; i <= 30; i++) { const q = rad(200 + (140 * i) / 30); pts.push([350 + 300 * Math.cos(q), 300 + 200 * Math.sin(q)]); }
  p.line(pts, "#ffd23f", 34);
  const [x, y] = pts[0];
  p.poly([[x - 40, y - 50], [x + 30, y - 40], [x - 10, y + 40]], "#ffd23f", 12);
};
const trackDraw = (p: Pen) => { // 1024 x 1024, the running track seen from above (flat on the ground)
  const g = p.g, c = 512;
  g.fillStyle = "#c2553a"; g.beginPath(); g.arc(c, c, 500, 0, Math.PI * 2); g.arc(c, c, 330, 0, Math.PI * 2, true); g.fill("evenodd");
  g.strokeStyle = "#f4eadb"; g.lineWidth = 6;
  for (const r of [345, 395, 445, 495]) { g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.stroke(); }
  g.strokeStyle = INK; g.lineWidth = 10; for (const r of [500, 330]) { g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.stroke(); }
  g.fillStyle = "#f4eadb"; g.fillRect(c - 8, c + 330, 16, 170);
};
const sunDiscDraw = (p: Pen) => { // 512 x 512 soft glowing sun
  const g = p.g, gr = g.createRadialGradient(256, 256, 0, 256, 256, 256);
  gr.addColorStop(0, "rgba(255,255,236,1)"); gr.addColorStop(0.28, "rgba(255,244,190,1)"); gr.addColorStop(0.34, "rgba(255,214,140,0.75)");
  gr.addColorStop(0.6, "rgba(255,190,110,0.25)"); gr.addColorStop(1, "rgba(255,170,90,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
};
const dripDraw = (k: number) => (p: Pen) => { // 256 x 512, acid drops falling
  for (let i = 0; i < 6; i++) {
    const x = 30 + i * 40, y = ((k * 9 + i * 77) % 460) + 20;
    p.poly([[x, y - 22], [x + 12, y + 6], [x, y + 16], [x - 12, y + 6]], "#b8e04a", 5);
  }
};

// ---------------- toon planets for the space set ----------------
const PLANET_VS = `varying vec3 vN; varying vec3 vW; varying vec2 vUv;
void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const PLANET_FS = `uniform sampler2D map; uniform vec3 sunPos; uniform vec3 shadeCol; uniform float litK; varying vec3 vN; varying vec3 vW; varying vec2 vUv;
void main(){ float d = dot(normalize(vN), normalize(sunPos - vW)); float t = smoothstep(-0.06, 0.1, d);
  vec3 c = texture2D(map, vUv).rgb; gl_FragColor = vec4(c * mix(shadeCol, vec3(litK), t), 1.0); }`;
const planetMat = (tex: THREE.Texture) => new THREE.ShaderMaterial({
  uniforms: { map: { value: tex }, sunPos: { value: new THREE.Vector3(...SUN_AT) }, shadeCol: { value: new THREE.Vector3(0.16, 0.13, 0.3) }, litK: { value: 1.25 } },
  vertexShader: PLANET_VS, fragmentShader: PLANET_FS,
});
const venusTex = () => ctex("venusTex", 1024, 512, (g, r) => {
  g.fillStyle = "#e9b866"; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 26; i++) { // swirling cloud bands
    const y = r() * 512, h = 10 + r() * 40, c = r() < 0.5 ? "rgba(255,226,160,0.55)" : "rgba(196,134,70,0.45)";
    g.fillStyle = c; g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= 1024; x += 32) g.lineTo(x, y + Math.sin(x * 0.012 + i) * 18);
    for (let x = 1024; x >= 0; x -= 32) g.lineTo(x, y + h + Math.sin(x * 0.01 + i * 2) * 14);
    g.fill();
  }
  for (let i = 0; i < 40; i++) { const x = r() * 1024, y = 80 + r() * 352, rr2 = 10 + r() * 30; g.strokeStyle = "rgba(170,110,60,0.5)"; g.lineWidth = 5; g.beginPath(); g.arc(x, y, rr2, 0, 4.5); g.stroke(); }
  // a big dark mark so the (slow, backwards) spin reads
  g.fillStyle = "rgba(150,90,50,0.85)"; g.beginPath(); g.ellipse(300, 250, 90, 60, 0.3, 0, 6.3); g.fill();
  g.fillStyle = "rgba(255,240,200,0.9)"; g.beginPath(); g.ellipse(760, 200, 70, 40, -0.2, 0, 6.3); g.fill();
});
const earthTex = () => ctex("earthTex", 1024, 512, (g, r) => {
  g.fillStyle = "#2f7fd0"; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 14; i++) { const x = r() * 1024, y = 90 + r() * 330; g.fillStyle = "#4fae5a"; g.beginPath(); g.ellipse(x, y, 40 + r() * 90, 30 + r() * 60, r() * 3, 0, 6.3); g.fill(); }
  g.fillStyle = "#f4f6fb"; g.fillRect(0, 0, 1024, 40); g.fillRect(0, 472, 1024, 40);
  for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(255,255,255,0.55)"; g.beginPath(); g.ellipse(r() * 1024, r() * 512, 30 + r() * 60, 8 + r() * 10, 0, 0, 6.3); g.fill(); }
});

// ---------------- world ----------------
export class World {
  root = new THREE.Group();
  private surf = new THREE.Group();
  private space = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private skyMat: THREE.ShaderMaterial; private sky: THREE.Mesh;
  private fog = new THREE.Fog("#e7b06c", 60, 900);
  private clouds: THREE.Mesh[] = [];
  private cloudMats: THREE.MeshBasicMaterial[] = [];
  private venus: THREE.Mesh; private earth: THREE.Mesh; private sunBall: THREE.Mesh;
  private orbitV: THREE.Mesh; private orbitE: THREE.Mesh; private stars: THREE.Points;
  private sunCache = new Map<number, THREE.Vector3>();
  private frustum = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private sph = new THREE.Sphere(); private v = new THREE.Vector3();
  private c1 = new THREE.Color(); private c2 = new THREE.Color();

  constructor() {
    const R = this.root;
    R.add(this.surf, this.space);
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el)); gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(2400, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
    R.add(this.hemi, this.sun, this.sun.target);

    // ======== SURFACE ========
    const S = this.surf;
    const ground = ctex("venusGround", 1024, 1024, (g, r) => {
      g.fillStyle = "#c98a52"; g.fillRect(0, 0, 1024, 1024);
      for (let i = 0; i < 420; i++) { const x = r() * 1024, y = r() * 1024, q = 10 + r() * 70, gr = g.createRadialGradient(x, y, 0, x, y, q);
        const c = r() < 0.5 ? "150,96,58" : r() < 0.6 ? "226,170,110" : "176,116,70"; gr.addColorStop(0, `rgba(${c},0.55)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(x - q, y - q, 2 * q, 2 * q); }
      // dark cracks between basalt plates (the "seams painted dark")
      g.strokeStyle = "rgba(70,40,30,0.55)"; g.lineWidth = 3;
      for (let i = 0; i < 70; i++) { let x = r() * 1024, y = r() * 1024; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 90; y += (r() - 0.5) * 90; g.lineTo(x, y); } g.stroke(); }
      for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "rgba(110,66,44,0.5)" : "rgba(240,196,140,0.45)"; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 1 + r() * 4, 1 + r() * 2.5, r() * 3, 0, 6.3); g.fill(); }
    });
    const gm = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000).rotateX(-Math.PI / 2), lam({ map: rep(ground, 600, 600) }));
    gm.receiveShadow = true; S.add(gm);
    // rocks: jittered dodecahedrons, a seat rock next to the hero
    const rockM = [lam({ color: "#b47a50" }), lam({ color: "#c58c5c" }), lam({ color: "#a06a46" })];
    const rock = (x: number, z: number, s: number, i: number, flat = 0.6) => {
      const geo = new THREE.DodecahedronGeometry(1, 0), pos = geo.attributes.position;
      for (let k = 0; k < pos.count; k++) pos.setXYZ(k, pos.getX(k) * (0.8 + hh(i * 7 + k, 3) * 0.4), pos.getY(k) * flat, pos.getZ(k) * (0.8 + hh(i * 5 + k, 4) * 0.4));
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, rockM[i % 3]); m.position.set(x, s * flat * 0.35, z); m.scale.setScalar(s); m.rotation.y = hh(i, 5) * 6.28;
      m.castShadow = true; m.receiveShadow = true; S.add(m);
    };
    rock(0.72, 0.32, 0.22, 1, 0.7); // the clock's rock
    rock(-0.15, -0.35, 0.34, 2, 0.6); // seat rock (behind the hero, for the "sit")
    for (let i = 0; i < 260; i++) {
      const a = hh(i, 10) * 6.28, d = 3 + hh(i, 11) ** 1.6 * 140, x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (Math.hypot(x - TRACK[0], z - TRACK[2]) < TRACK_R + 2.5 || Math.hypot(x - TABLE[0], z - TABLE[2]) < 3 || Math.hypot(x - ROCKET[0], z - ROCKET[2]) < 3) continue;
      if (Math.hypot(x, z) < 3.2 && z > -2) continue; // keep the hero's foreground clean
      rock(x, z, 0.12 + hh(i, 12) * (0.25 + d * 0.012), i);
    }
    // volcanoes and mesas on the horizon
    const volM = lam({ color: "#9a5e40" }), mesaM = lam({ color: "#86523c" });
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * Math.PI * 2 + hh(k, 30) * 0.2, d = 260 + hh(k, 31) * 300, h = 30 + hh(k, 32) * 70;
      const vol = k % 3 !== 0;
      const geo = vol ? new THREE.CylinderGeometry(h * 0.12, h * 1.4, h, 18, 1, true) : new THREE.CylinderGeometry(h * 0.9, h * 1.2, h * 0.45, 9);
      const m = new THREE.Mesh(geo, vol ? volM : mesaM); m.position.set(Math.cos(a) * d, (vol ? h : h * 0.45) / 2 - 1, Math.sin(a) * d);
      m.receiveShadow = true; S.add(m);
    }
    // clouds: Venus is overcast, a low ceiling of flat cartoon clouds
    const cm = [0, 1, 2, 3].map((k) => cloudHD(k + 4, CLOUD_V));
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2 + hh(i, 20), d = 60 + hh(i, 21) * 520, y = 28 + hh(i, 22) * 90 + d * 0.08;
      const mat = new THREE.MeshBasicMaterial({ map: cm[i % 4], color: new THREE.Color(1.08, 1.04, 1.0), transparent: true, depthWrite: false, fog: false });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      const w = 70 + hh(i, 23) * 90;
      m.position.set(Math.cos(a) * d, y, Math.sin(a) * d); m.scale.set(w, w / 2, 1); m.layers.set(NOINK);
      this.clouds.push(m); this.cloudMats.push(mat); S.add(m);
    }

    // ======== SPACE ========
    const P = this.space;
    {
      const N = 2600, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const u = hh(i, 40) * 2 - 1, q = hh(i, 41) * 6.28, s = Math.sqrt(1 - u * u), r2 = 1500;
        pos.set([Math.cos(q) * s * r2, u * r2, Math.sin(q) * s * r2], i * 3);
        const w = 0.6 + hh(i, 42) * 0.8, warm = hh(i, 43);
        col.set([w, w * (0.9 + 0.1 * warm), w * (1.05 - 0.2 * warm)], i * 3);
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      this.stars = new THREE.Points(geo, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, fog: false }));
      this.stars.layers.set(NOINK); this.stars.frustumCulled = false; P.add(this.stars);
    }
    this.sunBall = new THREE.Mesh(new THREE.SphereGeometry(7, 48, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.5, 1.3), fog: false }));
    this.sunBall.position.set(...SUN_AT); this.sunBall.layers.set(NOINK); P.add(this.sunBall);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ctex("sunHalo", 512, 512, (g) => sunDiscDraw(new Pen(g))), transparent: true, depthWrite: false, fog: false, color: new THREE.Color(1.6, 1.3, 0.9) }));
    halo.scale.set(46, 46, 1); halo.position.set(...SUN_AT); halo.layers.set(NOINK); halo.name = "halo"; P.add(halo);
    this.venus = new THREE.Mesh(new THREE.SphereGeometry(3, 64, 40), planetMat(venusTex()));
    this.earth = new THREE.Mesh(new THREE.SphereGeometry(3.2, 64, 40), planetMat(earthTex()));
    P.add(this.venus, this.earth);
    const ring = (r: number, col: string) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.12, 6, 256).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55, fog: false }));
      m.position.set(...SUN_AT); m.layers.set(NOINK); P.add(m); return m;
    };
    this.orbitV = ring(ORBIT_V, "#ffd23f"); this.orbitE = ring(ORBIT_E, "#7fb8ff");
  }

  /** camera-relative sun frozen per shot */
  private shotSun(id: number) {
    let v = this.sunCache.get(id);
    if (v) return v;
    const s = SHOTS[id - 1];
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) { const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1; fx += x / n; fz += z / n; }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = rad(id === 2 ? 10 : id === 8 ? 120 : 62), el = rad(VL.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }
  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const fw = worldF(f), t = fw / FPS, L = VL, S = SHOTS[id - 1], inSpace = S.place === "space";
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look);
    cam.fov = c.fov; cam.near = inSpace ? 0.5 : 0.08; cam.far = 5000; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    this.surf.visible = !inSpace; this.space.visible = inSpace;
    const focus = V(...c.look), dist = cam.position.distanceTo(focus), sunDir = this.shotSun(id);
    const heat = id === 10 || id === 11 ? heatAt(f) : 0;

    // light rig (two-tone world + character cards)
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.15 + 6, 8, 60);
    this.sun.position.copy(focus).addScaledVector(sunDir, 200); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 500; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(L.lit[0] + 0.1 * heat, L.lit[1] + 0.12 * heat, L.lit[2] - 0.1 * heat); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(0.04, 0.02, 0);
    TONE.uSat.value = 0.9;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);

    // sky + fog
    const su = this.skyMat.uniforms;
    if (inSpace) {
      for (let i = 0; i < 5; i++) untone(["#05040c", "#070614", "#0a0a1e", "#0b0b22", "#0c0c26"][i], su["c" + i].value);
      su.e.value.set(rad(10), rad(30), rad(60), rad(89));
      scene.fog = null;
    } else {
      for (let i = 0; i < 5; i++) { untone(SKY_DAY[i], this.c1); untone(SKY_HOT[i], this.c2); su["c" + i].value.copy(this.c1).lerp(this.c2, heat); }
      su.e.value.set(rad(SKY_E[1]), rad(SKY_E[2]), rad(SKY_E[3]), rad(SKY_E[4]));
      untone(L.fog, this.fog.color); this.fog.color.lerp(untone("#d6c062"), heat);
      this.fog.near = 40; this.fog.far = 700; scene.fog = this.fog;
    }
    this.sky.position.copy(cam.position); scene.background = null;
    for (const [i, m] of this.clouds.entries()) {
      m.quaternion.copy(cam.quaternion); m.position.x += 0; // static ceiling
      this.cloudMats[i].color.setRGB(1.08 - 0.25 * heat, 1.04 + 0.02 * heat, 1.0 - 0.45 * heat);
    }

    // ---- space set ----
    if (inSpace) {
      const vo = venusOrbit(f), eo = earthOrbit(f);
      this.venus.position.set(SUN_AT[0] + ORBIT_V * Math.cos(vo), 0, SUN_AT[2] - ORBIT_V * Math.sin(vo));
      this.venus.rotation.set(0.05, venusSpin(f), 0);
      const showE = id === 7 && f > 985;
      this.earth.visible = showE;
      this.earth.position.set(SUN_AT[0] + ORBIT_E * Math.cos(eo), 0, SUN_AT[2] - ORBIT_E * Math.sin(eo));
      this.earth.rotation.y = f * 0.05;
      this.orbitV.visible = (id === 5 && f > 700) || showE; this.orbitE.visible = showE;
      (this.orbitV.material as THREE.MeshBasicMaterial).opacity = 0.55 * (id === 5 ? smooth((f - 700) / 15) : smooth((f - 985) / 15));
      (this.orbitE.material as THREE.MeshBasicMaterial).opacity = 0.55 * smooth((f - 985) / 15);
      const halo = this.space.getObjectByName("halo")!; halo.quaternion.copy(cam.quaternion);
      this.stars.position.copy(cam.position);
    }

    // ---- cast ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const light = light2D(sunDir, right);
    const st: Stage = { places: [], fx: [] };
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const lidAt = (i: number) => { // 4-frame blinks every 0.5-2.3 s
      let s = Math.round(-60 * hh(i, 9));
      for (let n = 0; s <= f && n < 80; n++) { const k = f - s; if (k >= 0 && k < 4) return [0.5, 1, 1, 0.5][k]; s += Math.round(15 + 54 * hh(i * 31 + n, 13)); }
      return 0;
    };
    const visible = (x: number, y: number, z: number, r: number) => this.frustum.intersectsSphere(this.sph.set(this.v.set(x, y, z), r));
    const kid = (x: number, z: number, o: FrontOpts, fog = 0, y = 0) => {
      if (!visible(x, y + 0.7, z, 2)) return;
      const d = cam.position.distanceTo(this.v.set(x, y + 1.0, z)), [w, h, k] = tier(d);
      const o2: FrontOpts = { ...o, light, seed: 3, blink: d < 16 ? (o.blink ?? lidAt(1)) : 0 };
      st.places.push({ key: `astro|${JSON.stringify(o2)}|${fog.toFixed(2)}`, x, y, z, size: [w, h, k], draw: (p) => astro(p, o2, fog) });
      blob(st, sunDir, x, y, z, 0.8);
    };
    const card = (key: string, x: number, y: number, z: number, scale: number, draw: (p: Pen) => void, wide = false) => {
      if (!visible(x, y + scale, z, 3 * scale)) return;
      const d = cam.position.distanceTo(this.v.set(x, y + scale, z)) / scale, [w, h, k] = wide ? tierW(d) : tier(d);
      st.places.push({ key: `${key}|${w}`, x, y, z, size: [w, h, k], wide, scale, draw });
    };
    const fxCard = (key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, soft = false, flat = false, rot = 0) =>
      st.fx.push({ key, cw, ch, draw, x, y, z, w, h, soft, flat, rot });

    if (!inSpace) {
      // the Sun rising in the west (-z), behind the kid
      const el = rad(sunEl(f)), sd = 600;
      if (sunEl(f) > -6) fxCard("sundisc", 512, 512, sunDiscDraw, -8, Math.tan(el) * sd + 4, -sd, 110, 110, true);
      // sign pointing west, seen in the sunrise shot
      fxCard("signOeste", 400, 600, signDraw, -1.3, 0.75, -3.4, 1.0, 1.5);
      // kid poses by shot
      const g = (hz: number) => Math.floor(((((t * hz) % 1) + 1) % 1) * 8) / 8;
      if (id === 1) kid(HERO[0], HERO[2], { mode: "stand", expr: f < 40 ? "grin" : "smile", wave: f > 46 && f < 84 ? Math.sin(f * 0.5) * 0.5 + 0.5 : undefined });
      if (id === 2) kid(HERO[0], HERO[2], { mode: "stand", expr: f > 200 ? "shock" : "smile", look: f > 200 ? 0 : -1 });
      if (id === 3) kid(HERO[0], HERO[2], { mode: "stand", expr: f > 292 ? "nervous" : "smile_closed" });
      if (id === 6) kid(HERO[0], HERO[2], { mode: "stand", expr: "shock", headTilt: 0.08 });
      if (id === 9) kid(HERO[0] - 0.15, HERO[2] - 0.35, { mode: "sit", expr: "relief", look: -1 }, 0, 0.16);
      if (id === 10) kid(HERO[0], HERO[2], { mode: "stand", expr: f > 1370 ? "pained" : "nervous" }, heat * 0.6);
      if (id === 11) { // runs to the rocket, then he's inside it
        const u = smooth((f - 1462) / 40);
        if (u < 0.98) kid(HERO[0] + (ROCKET[0] + 0.9 - HERO[0]) * u, HERO[2] + (ROCKET[2] + 0.8 - HERO[2]) * u, { mode: "march", phase: g(2.2), expr: "shock", facing: -1, lift: 70 }, 0.6);
      }
      // the alarm clock on its rock
      if (id <= 3 || id === 6) {
        const ring = id === 3 && f > 290 && f < 360 ? 1 : 0;
        fxCard(`clock|${ring}|${ring ? f % 6 : 0}`, 300, 300, clockDraw(ring, f), 0.72, 0.47 + 0.1, 0.32, 0.3, 0.3);
      }
      // the table with the meals
      if (id === 4 || id === 3) {
        const n = f < 403 ? 0 : f < 424 ? 1 : f < 445 ? 2 : 3;
        kid(TABLE[0], TABLE[2] - 0.55, { mode: "stand", expr: n >= 3 ? "grin" : "smile", look: 0 });
        card(`table|${n}`, TABLE[0], 0, TABLE[2], 0.62, tableDraw(n), true);
        if (n > 0 && f < 456) { const k = f - [0, 403, 424, 445][n]; if (k < 10) fxCard(`pop|${k}`, 500, 500, (p) => fxBurst(p, k / 10, "#fff3b0", 10, 20, 160), TABLE[0] - 0.56 + (n - 1) * 0.37, 0.75, TABLE[2] + 0.1, 0.5, 0.5); }
      }
      // the running track: a whole lap while doing one slow pirouette
      if (id === 8) {
        fxCard("track", 1024, 1024, trackDraw, TRACK[0], 0.02, TRACK[2], TRACK_R * 2.4, TRACK_R * 2.4, false, true);
        const a = lapAt(fw), x = TRACK[0] + Math.sin(a) * TRACK_R, z = TRACK[2] + Math.cos(a) * TRACK_R;
        const turn = Math.floor(((a / (Math.PI * 2)) * 4) % 4), facing = ([0, 1, 0, -1] as const)[turn];
        kid(x, z, { mode: "march", phase: g(2.0), expr: "grin", facing, lift: 60 });
        // the lazy spinning top in the middle of the track
        const spin = Math.floor(fw / 6) % 2;
        card(`top|${spin}`, TRACK[0], 0, TRACK[2], 0.9, (p) => {
          p.poly([[300, 975], [190, 700], [300, 560], [410, 700]], spin ? "#e2453c" : "#ffd23f", 12);
          p.poly([[190, 700], [410, 700], [300, 760]], spin ? "#ffd23f" : "#e2453c", 10);
          p.poly(rr(285, 470, 315, 560, 8), "#8a5a3a", 9);
        });
      }
      // school far away (P10), thermometer + acid drips (P11), the rocket (P12; also in the background before)
      if (id === 9) fxCard("school", 500, 400, schoolDraw, -3.2, 1.5, -30, 4.0, 3.2);
      if (id === 10) {
        const lv = smooth((f - 1322) / 50), pop = f > 1372 ? Math.min(1, (f - 1372) / 12) : 0;
        fxCard(`thermo|${lv.toFixed(2)}|${pop.toFixed(2)}`, 240, 720, thermoDraw(lv, pop), -0.7, 0.62, 0.35, 0.36, 1.08);
        if (f > 1395) for (let i = 0; i < 9; i++) fxCard(`drip|${(f + i * 7) % 24}`, 256, 512, dripDraw(f + i * 13), -3 + i * 0.8, 3.4 - ((f * 0.06 + i * 0.7) % 3.2), -6 - (i % 3) * 1.5, 0.6, 1.2);
      }
      if (id === 11 || id === 10 || id === 1 || id === 2) {
        const up = liftAt(f), y = 0.0075 * up * up;
        card(`rocket|${up > 0 ? 1 : 0}|${up > 0 ? f % 4 : 0}`, ROCKET[0], y, ROCKET[2], 2.0, rocketDraw(up > 0 ? Math.min(1, up / 6) : 0, f));
        if (up > 0) for (let k = 0; k < 6; k++) {
          const u = ((f - 1506 + k * 4) % 24) / 24;
          fxCard(`puff|${Math.round(u * 10)}`, 300, 300, (p) => fxPuff(p, u), ROCKET[0] + (k - 2.5) * 0.4 * u * 3, 0.4 + u * 0.6, ROCKET[2] + 0.4, 1.4 + u * 2, 1.4 + u * 2, true);
        }
      }
    } else {
      // space overlays: the "backwards" arrow around Venus
      if (id === 7 && f > 900 && f < 985) {
        const a = smooth((f - 900) / 12) * (1 - smooth((f - 975) / 10));
        if (a > 0.05) fxCard("arrowBack", 700, 300, arrowDraw, this.venus.position.x, this.venus.position.y + 3.3, this.venus.position.z + 1.5, 6.5 * a, 2.8 * a);
      }
    }

    let ai = 0;
    for (const p of st.places) {
      const a = this.actor(ai++), [w, h, k] = p.size, s = p.scale ?? 1;
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.geometry = p.wide ? WIDE : BODY;
      a.mesh.visible = true; a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), 0);
      a.mesh.scale.set(p.mirror ? -s : s, s, s);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    for (const p of st.fx) {
      if (!visible(p.x, p.y, p.z, Math.max(p.w, p.h))) continue;
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft); e.mesh.visible = true; e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else {
        const yaw = Math.atan2(cam.position.x - p.x, cam.position.z - p.z);
        e.mesh.rotation.order = "YXZ"; e.mesh.rotation.set(0, yaw, 0);
        if (p.soft) e.mesh.quaternion.copy(cam.quaternion);
      }
      e.mesh.scale.set(p.w, p.h, 1);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (let i = 0; i < ai; i++) this.actors[i].bind();
    for (let i = 0; i < fi; i++) this.fxs[i].bind();
    void INK; void LIGHT; void ({} as Expr);
    return focus;
  }
}
