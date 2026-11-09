// plantModels.js – artgerechte, stilisierte prozedurale 3D-Modelle für die Zimmerpflanzen aus plants.js
// ES-Modul. API:
//   buildPlant(plantId, { potDiameterCm, plantHeightCm, color, lod?, hangBelowM?, seed?, shape? }) -> THREE.Group
//     Ursprung = Topfboden-Mitte, Y nach oben, Meter. plantHeightCm = Laubhöhe über dem Topfrand
//     (bei Hängepflanzen: Trieblänge). Enthält Terrakottatopf + Erde.
//   disposePlant(group) – gibt die (referenzgezählten) Pflanzengeometrien frei; Topf/Materialien sind geteilt.
// Deterministisch (kein Math.random), Geometrien je Pflanze zu wenigen Meshes zusammengeführt.
import * as THREE from './vendor/three.module.min.js';

const V3 = THREE.Vector3;
const GOLD = Math.PI * (3 - Math.sqrt(5));
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const clampi = (v, a, b) => Math.round(clamp(v, a, b));
const lerp = (a, b, t) => a + (b - a) * t;

/* ------------------------------------------------------------------ */
/* Deterministischer Zufall                                            */
/* ------------------------------------------------------------------ */
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function makeRng(seed) {
  let a = seed >>> 0;
  const f = () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  f.range = (lo, hi) => lo + (hi - lo) * f();
  f.sym = (x) => (f() * 2 - 1) * x;
  return f;
}

/* ------------------------------------------------------------------ */
/* Materialien (modulweit geteilt)                                     */
/* ------------------------------------------------------------------ */
export const potMaterial = new THREE.MeshStandardMaterial({ color: 0xc26b47, roughness: 0.85 });
export const soilMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 1 });
const MATS = {
  leaf: new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.68, metalness: 0 }),
  gloss: new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.32, metalness: 0 }),
  waxy: new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.5, metalness: 0 }),
  stem: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0 }),
  succ: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0 }),
};
export const plantMaterials = MATS;

/* ------------------------------------------------------------------ */
/* Topf (geteilte Einheitsgeometrie, per Mesh-Skalierung angepasst)     */
/* ------------------------------------------------------------------ */
const POT_PROFILE = [
  [0.0, 0.0], [0.36, 0.0], [0.375, 0.006], [0.382, 0.02], [0.468, 0.795], [0.48, 0.8],
  [0.522, 0.808], [0.528, 0.82], [0.528, 0.985], [0.52, 1.0], [0.478, 1.0], [0.47, 0.99], [0.462, 0.92],
];
const POT_SOIL_Y = 0.93;
const potGeo = new THREE.LatheGeometry(POT_PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), 24);
const soilGeo = new THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2);
function potWallR(y, d, potH) { // Außenradius des Topfes in Höhe y (Pflanzen-Koordinaten)
  const u = y / potH;
  if (u >= 0.8) return 0.528 * d;
  return lerp(0.382, 0.468, clamp(u / 0.795, 0, 1)) * d;
}
export const potHeightFor = (potDiameterCm) => clamp(potDiameterCm / 100 * 0.9, 0.06, 0.5);

/* ------------------------------------------------------------------ */
/* Geometrie-Puffer                                                    */
/* ------------------------------------------------------------------ */
class Bucket {
  constructor() { this.p = []; this.c = []; this.i = []; }
  get n() { return this.p.length / 3; }
  v(x, y, z, col) { this.p.push(x, y, z); this.c.push(col.r, col.g, col.b); return this.p.length / 3 - 1; }
  t(a, b, c) { this.i.push(a, b, c); }
}

/* ------------------------------------------------------------------ */
/* Blatt-Vorlagen (modulweit gecacht, Schlüssel = Art/Form + LOD)        */
/* ------------------------------------------------------------------ */
const TPL = new Map();
function tpl(key, make) { let t = TPL.get(key); if (!t) { t = make(); TPL.set(key, t); } return t; }
function packTpl(xs, ys, ss, idx) {
  return { x: Float32Array.from(xs), y: Float32Array.from(ys), s: Float32Array.from(ss), idx: Uint16Array.from(idx), n: xs.length };
}
// Breitenprofil aus Stützpunkten [t, w] (Kosinus-Interpolation) + Spitze
function prof(pts, tip = 'point', tipPow = 1) {
  const lt = pts[pts.length - 1][0], lw = pts[pts.length - 1][1];
  return (t) => {
    if (t >= lt) {
      const u = clamp((t - lt) / (1 - lt), 0, 1);
      return tip === 'round' ? lw * Math.sqrt(Math.max(0, 1 - u * u)) : lw * Math.pow(1 - u, tipPow);
    }
    for (let i = 1; i < pts.length; i++) {
      if (t <= pts[i][0]) {
        const a = pts[i - 1], b = pts[i], f = (t - a[0]) / (b[0] - a[0]);
        return lerp(a[1], b[1], (1 - Math.cos(f * Math.PI)) / 2);
      }
    }
    return lw;
  };
}
function gridTpl(key, wfn, rows, cols, yfn) {
  return tpl(key + '|' + rows + 'x' + cols, () => {
    const xs = [], ys = [], ss = [], idx = [];
    for (let r = 0; r <= rows; r++) {
      const t = r / rows, w = wfn(t);
      for (let c = 0; c <= cols; c++) {
        const s = -1 + 2 * c / cols;
        xs.push(s * w * 0.5); ys.push(yfn ? yfn(t, s) : t); ss.push(s);
      }
    }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c, b = a + 1, cc = a + cols + 1, dd = cc + 1;
      idx.push(a, b, dd, a, dd, cc);
    }
    return packTpl(xs, ys, ss, idx);
  });
}
function diamondTpl(wPos = 0.45) {
  return tpl('diamond|' + wPos, () => packTpl([0, -0.5, 0, 0.5], [0, wPos, 1, wPos], [0, -1, 0, 1], [0, 1, 2, 0, 2, 3]));
}
function discTpl(rings, segs) {
  return tpl('disc|' + rings + 'x' + segs, () => {
    const xs = [0], ys = [0.5], ss = [0], idx = [];
    for (let r = 1; r <= rings; r++) {
      const rr = r / rings;
      for (let j = 0; j < segs; j++) {
        const a = j / segs * TAU;
        xs.push(0.5 * rr * Math.cos(a)); ys.push(0.5 + 0.5 * rr * Math.sin(a)); ss.push(rr * Math.cos(a));
      }
    }
    for (let j = 0; j < segs; j++) idx.push(0, 1 + j, 1 + (j + 1) % segs);
    for (let r = 1; r < rings; r++) {
      const o0 = 1 + (r - 1) * segs, o1 = 1 + r * segs;
      for (let j = 0; j < segs; j++) {
        const j1 = (j + 1) % segs;
        idx.push(o0 + j, o1 + j, o1 + j1, o0 + j, o1 + j1, o0 + j1);
      }
    }
    return packTpl(xs, ys, ss, idx);
  });
}
const W = {
  oval: prof([[0, 0.12], [0.12, 0.62], [0.45, 1], [0.75, 0.82]], 'point', 1.1),
  lance: prof([[0, 0.08], [0.15, 0.62], [0.4, 1], [0.7, 0.7]], 'point', 1.3),
  ellip: prof([[0, 0.18], [0.12, 0.62], [0.45, 1], [0.78, 0.82]], 'point', 0.9),
  obovate: prof([[0, 0.06], [0.25, 0.55], [0.62, 1], [0.85, 0.8]], 'point', 0.8),
  strap: prof([[0, 0.7], [0.15, 0.95], [0.5, 1], [0.82, 0.8]], 'point', 1.2),
  sword: prof([[0, 0.55], [0.12, 0.95], [0.3, 1], [0.55, 0.78]], 'point', 1.1),
  fiddle: prof([[0, 0.22], [0.14, 0.6], [0.34, 0.56], [0.6, 0.9], [0.8, 1]], 'round'),
  paddle: prof([[0, 0.12], [0.07, 0.6], [0.2, 0.92], [0.5, 1], [0.82, 0.9]], 'point', 0.7),
  calathea: prof([[0, 0.14], [0.1, 0.62], [0.35, 0.97], [0.55, 1], [0.82, 0.78]], 'point', 0.8),
  heart: prof([[0, 0.6], [0.2, 0.96], [0.32, 1], [0.6, 0.76], [0.85, 0.34]], 'point', 1),
  petal: prof([[0, 0.25], [0.2, 0.75], [0.55, 1], [0.8, 0.85]], 'round'),
  spathe: prof([[0, 0.1], [0.15, 0.7], [0.45, 1], [0.75, 0.75]], 'point', 1.6),
};
const heartY = (t, s) => t - 0.2 * Math.pow(Math.abs(s), 1.5) * Math.pow(1 - t, 4);

// Monstera: herzförmig mit Fiederschlitzen und Fenstern (THREE.Shape mit Löchern)
function monsteraTpl(cuts, holes, variant, lod) {
  return tpl(`monstera|${cuts}|${holes}|${variant}|${lod}`, () => {
    const K = lod ? 46 : 30;
    const ctrl = [[0, 0.035], [0.09, -0.05], [0.27, -0.07], [0.43, 0.06], [0.5, 0.3], [0.47, 0.56], [0.36, 0.78], [0.18, 0.93], [0, 1.0]];
    const curve = new THREE.CatmullRomCurve3(ctrl.map(([x, y]) => new V3(x, y, 0)), false, 'centripetal');
    const margin = curve.getSpacedPoints(K).map((p) => new THREE.Vector2(p.x, p.y));
    const rr = makeRng(hashStr('monstera' + cuts + holes + variant));
    const cutIdx = [];
    for (let k = 0; k < cuts; k++) cutIdx.push(Math.round((0.17 + 0.7 * (k + 0.5) / cuts + rr.sym(0.02)) * K));
    const side = () => {
      const out = [];
      for (let i = 0; i <= K; i++) {
        if (cutIdx.includes(i) && i > 0 && i < K) {
          const M = margin[i], Q = new THREE.Vector2(0, Math.max(0.06, M.y - 0.17));
          const depth = rr.range(0.4, 0.58);
          const I = M.clone().lerp(Q, depth);
          const dir = Q.clone().sub(M).normalize(), perp = new THREE.Vector2(-dir.y, dir.x);
          const A = margin[i - 1];
          const sg = perp.dot(A.clone().sub(M)) > 0 ? 1 : -1;
          out.push(I.clone().addScaledVector(perp, 0.007 * sg), I.clone().addScaledVector(perp, -0.007 * sg));
        } else out.push(margin[i].clone());
      }
      return out;
    };
    const right = side(), left = side().map((p) => new THREE.Vector2(-p.x, p.y));
    const outline = right.concat(left.slice(1, -1).reverse());
    const shape = new THREE.Shape(outline);
    if (holes) {
      for (const sg of [1, -1]) {
        for (let k = 0; k < cuts - 1; k++) {
          if (k >= holes) break;
          const Ma = margin[cutIdx[k]], Mb = margin[cutIdx[k + 1]];
          const Mm = Ma.clone().add(Mb).multiplyScalar(0.5);
          const Qm = new THREE.Vector2(0, Math.max(0.06, Mm.y - 0.17));
          const c = Mm.clone().lerp(Qm, rr.range(0.7, 0.78));
          const dir = Qm.clone().sub(Mm).normalize(), perp = new THREE.Vector2(-dir.y, dir.x);
          const a = rr.range(0.03, 0.045), b = rr.range(0.012, 0.018), np = lod ? 7 : 5;
          const pts = [];
          for (let j = 0; j < np; j++) {
            const ang = j / np * TAU;
            pts.push(new THREE.Vector2(sg * (c.x + dir.x * Math.cos(ang) * a + perp.x * Math.sin(ang) * b), c.y + dir.y * Math.cos(ang) * a + perp.y * Math.sin(ang) * b));
          }
          shape.holes.push(new THREE.Path(pts));
        }
      }
    }
    const g = new THREE.ShapeGeometry(shape, 1);
    const pos = g.attributes.position, xs = [], ys = [], ss = [];
    for (let i = 0; i < pos.count; i++) { xs.push(pos.getX(i)); ys.push(pos.getY(i)); ss.push(clamp(pos.getX(i) / 0.5, -1, 1)); }
    const idx = Array.from(g.index.array);
    g.dispose();
    return packTpl(xs, ys, ss, idx);
  });
}
// Farnwedel: Rhachis-Streifen + viele Fiederblättchen (je 2 Dreiecke)
function fernTpl(P) {
  return tpl('fern|' + P, () => {
    const xs = [], ys = [], ss = [], idx = [];
    const push = (x, y) => { xs.push(x); ys.push(y); ss.push(clamp(x / 0.5, -1, 1)); return xs.length - 1; };
    for (let i = 0; i <= P; i++) { const y = i / P, w = 0.012 * (1 - y * 0.8); push(-w, y); push(w, y); }
    for (let i = 0; i < P; i++) { const a = i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    for (let i = 0; i < P; i++) {
      const t = (i + 0.5) / P, y0 = 0.05 + 0.93 * i / P, dy = 0.93 / P;
      const lp = 0.5 * Math.pow(Math.sin(Math.PI * (0.1 + 0.88 * t)), 0.75);
      for (const sd of [-1, 1]) {
        const a = push(sd * 0.01, y0), b = push(sd * 0.01, y0 + dy * 0.9);
        const o1 = push(sd * lp, y0 + lp * 0.32 + dy * 0.15), o2 = push(sd * lp * 0.96, y0 + lp * 0.32 + dy * 0.5);
        idx.push(a, o1, o2, a, o2, b);
      }
    }
    return packTpl(xs, ys, ss, idx);
  });
}
// Palmwedel: Fiedern mit Mittelpunkt (3 Dreiecke), damit sie überhängen können
function palmTpl(key, P, start, fwd) {
  return tpl('palm|' + key + '|' + P, () => {
    const xs = [], ys = [], ss = [], idx = [];
    const push = (x, y) => { xs.push(x); ys.push(y); ss.push(clamp(x / 0.5, -1, 1)); return xs.length - 1; };
    const span = 1 - start - 0.02, wb = span / P * 0.8;
    for (let i = 0; i < P; i++) {
      const t = (i + 0.5) / P, y0 = start + span * i / P;
      const lp = 0.5 * Math.pow(Math.sin(Math.PI * (0.12 + 0.82 * t)), 0.6);
      for (const sd of [-1, 1]) {
        const b0 = push(0, y0), b1 = push(0, y0 + wb);
        const m0 = push(sd * lp * 0.5, y0 + fwd * lp * 0.5 + wb * 0.05), m1 = push(sd * lp * 0.5, y0 + fwd * lp * 0.5 + wb * 0.95);
        const tp = push(sd * lp, y0 + fwd * lp + wb * 0.5);
        idx.push(b0, m0, m1, b0, m1, b1, m0, tp, m1);
      }
    }
    return packTpl(xs, ys, ss, idx);
  });
}

/* ------------------------------------------------------------------ */
/* Blatt platzieren / verformen                                        */
/* ------------------------------------------------------------------ */
function frameAE(az, el, roll = 0) {
  const ce = Math.cos(el), se = Math.sin(el), ca = Math.cos(az), sa = Math.sin(az);
  const Y = new V3(ce * ca, se, ce * sa), Z = new V3(-se * ca, ce, -se * sa);
  const X = new V3().crossVectors(Y, Z);
  return roll ? rollFrame({ X, Y, Z }, roll) : { X, Y, Z };
}
function frameDir(dir, upHint, roll = 0) {
  const Y = dir.clone().normalize();
  let Z = upHint.clone().addScaledVector(Y, -upHint.dot(Y));
  if (Z.lengthSq() < 1e-8) Z = Math.abs(Y.y) < 0.9 ? new V3(0, 1, 0).addScaledVector(Y, -Y.y) : new V3(1, 0, 0).addScaledVector(Y, -Y.x);
  Z.normalize();
  const X = new V3().crossVectors(Y, Z);
  return roll ? rollFrame({ X, Y, Z }, roll) : { X, Y, Z };
}
function rollFrame(F, r) {
  const c = Math.cos(r), s = Math.sin(r);
  const X = F.X.clone().multiplyScalar(c).addScaledVector(F.Z, s);
  const Z = F.Z.clone().multiplyScalar(c).addScaledVector(F.X, -s);
  return { X, Y: F.Y, Z };
}
const ARC_N = 16;
function makeArc(L, curl, curl2) {
  const cy = new Float32Array(ARC_N + 1), cz = new Float32Array(ARC_N + 1), th = new Float32Array(ARC_N + 1);
  let y = 0, z = 0;
  for (let k = 1; k <= ARC_N; k++) {
    const tm = (k - 0.5) / ARC_N, t1 = k / ARC_N, a = curl * tm + curl2 * tm * tm;
    y += Math.cos(a) * L / ARC_N; z -= Math.sin(a) * L / ARC_N;
    cy[k] = y; cz[k] = z; th[k] = curl * t1 + curl2 * t1 * t1;
  }
  return { cy, cz, th, L };
}
const _ae = { y: 0, z: 0, th: 0 };
function arcEval(A, t) {
  if (t <= 0) { _ae.y = t * A.L; _ae.z = 0; _ae.th = 0; return _ae; }
  if (t >= 1) {
    const th = A.th[ARC_N], e = (t - 1) * A.L;
    _ae.y = A.cy[ARC_N] + Math.cos(th) * e; _ae.z = A.cz[ARC_N] - Math.sin(th) * e; _ae.th = th; return _ae;
  }
  const k = t * ARC_N, i = Math.floor(k), f = k - i;
  _ae.y = lerp(A.cy[i], A.cy[i + 1], f); _ae.z = lerp(A.cz[i], A.cz[i + 1], f); _ae.th = lerp(A.th[i], A.th[i + 1], f);
  return _ae;
}
const _lc = new V3();
function leafLocal(o, A, x, y, out) {
  const Wd = o.W || 0, X = x * Wd;
  let z = 0;
  if (o.fold) z -= o.fold * Math.abs(X);
  if (o.droop && Wd) z -= o.droop * X * X / (Wd * 0.5);
  if (o.cup) { const yy = (y - (o.anchor || 0)) * o.L; z += o.cup * (X * X + yy * yy) / (o.L * 0.5); }
  if (o.wave) z += o.wave * Wd * Math.sin(y * (o.waveF || 14) + (o.wavePh || 0)) * Math.abs(x) * 2;
  const a = arcEval(A, y);
  let xc = X, nc = z;
  if (o.twist) { const ph = o.twist * y, c = Math.cos(ph), s = Math.sin(ph); xc = X * c - z * s; nc = X * s + z * c; }
  return out.set(xc, a.y + Math.sin(a.th) * nc, a.z + Math.cos(a.th) * nc);
}
function arcOf(o) { return o._arc || (o._arc = makeArc(o.L, o.curl || 0, o.curl2 || 0)); }
// Weltpunkt auf der Blattfläche (x relativ zur Breite, y 0..1 entlang der Länge)
function leafPt(o, x, y, out = new V3()) {
  leafLocal(o, arcOf(o), x, y, _lc);
  const F = o.F;
  return out.copy(o.pos).addScaledVector(F.X, _lc.x).addScaledVector(F.Y, _lc.y).addScaledVector(F.Z, _lc.z);
}
function leafDir(o, y, out = new V3()) { // Tangente der Mittelrippe
  const A = arcOf(o), th = arcEval(A, clamp(y, 0, 1)).th;
  return out.copy(o.F.Y).multiplyScalar(Math.cos(th)).addScaledVector(o.F.Z, -Math.sin(th));
}
function leafNrm(o, y, out = new V3()) {
  const A = arcOf(o), th = arcEval(A, clamp(y, 0, 1)).th;
  return out.copy(o.F.Y).multiplyScalar(Math.sin(th)).addScaledVector(o.F.Z, Math.cos(th));
}
const _col = new THREE.Color();
function addLeaf(b, T, o) {
  const A = arcOf(o), F = o.F, base = b.n;
  let ax = 0, ay = 0, az = 0;
  if (o.anchor) { leafLocal(o, A, 0, o.anchor, _lc); ax = _lc.x; ay = _lc.y; az = _lc.z; }
  const P = o.pos, cf = o.colorFn, bc = o.color;
  for (let i = 0; i < T.n; i++) {
    leafLocal(o, A, T.x[i], T.y[i], _lc);
    const lx = _lc.x - ax, ly = _lc.y - ay, lz = _lc.z - az;
    if (cf) cf(_col, bc, T.x[i], T.y[i], T.s[i]); else _col.copy(bc);
    b.v(P.x + F.X.x * lx + F.Y.x * ly + F.Z.x * lz, P.y + F.X.y * lx + F.Y.y * ly + F.Z.y * lz, P.z + F.X.z * lx + F.Y.z * ly + F.Z.z * lz, _col);
  }
  const ix = T.idx;
  for (let i = 0; i < ix.length; i++) b.i.push(base + ix[i]);
}
// Rohr / Stängel entlang einer Punktfolge (Parallel-Transport-Rahmen)
function addTube(b, pts, rad, o = {}) {
  const n = pts.length; if (n < 2) return;
  const seg = o.seg || 5, col = o.color, cf = o.colorFn;
  const radAt = typeof rad === 'function' ? rad : Array.isArray(rad) ? (t, i) => rad[i] : () => rad;
  const ryAt = o.ry == null ? () => 1 : typeof o.ry === 'function' ? o.ry : () => o.ry;
  const T = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], c = pts[Math.min(n - 1, i + 1)];
    const t = c.clone().sub(a); if (t.lengthSq() < 1e-12) t.set(0, 1, 0); T.push(t.normalize());
  }
  let N = (o.up ? o.up.clone() : (Math.abs(T[0].y) < 0.9 ? new V3(0, 1, 0) : new V3(1, 0, 0)));
  N.addScaledVector(T[0], -N.dot(T[0]));
  if (N.lengthSq() < 1e-8) N.set(1, 0, 0).addScaledVector(T[0], -T[0].x);
  N.normalize();
  const Bv = new V3(), off = new V3(), base = b.n;
  for (let i = 0; i < n; i++) {
    if (i > 0) { N.addScaledVector(T[i], -N.dot(T[i])); if (N.lengthSq() < 1e-10) N.copy(Bv); N.normalize(); }
    Bv.crossVectors(T[i], N);
    const t = i / (n - 1), r = radAt(t, i), ry = ryAt(t, i);
    for (let j = 0; j < seg; j++) {
      const ph = j / seg * TAU + (o.phase || 0);
      const f = o.rmod ? o.rmod(ph, t) : 1;
      off.copy(N).multiplyScalar(Math.cos(ph) * r * f).addScaledVector(Bv, Math.sin(ph) * r * ry * f);
      if (cf) cf(_col, t, ph, i, j); else _col.copy(col);
      b.v(pts[i].x + off.x, pts[i].y + off.y, pts[i].z + off.z, _col);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) {
    const a = base + i * seg + j, bb = base + i * seg + (j + 1) % seg, c = a + seg, d = bb + seg;
    b.i.push(a, bb, d, a, d, c);
  }
  if (o.cap) {
    const ce = pts[n - 1].clone().addScaledVector(T[n - 1], o.capBulge || 0);
    if (cf) cf(_col, 1, 0, n - 1, -1); else _col.copy(o.capColor || col);
    const ci = b.v(ce.x, ce.y, ce.z, o.capColor || _col), r0 = base + (n - 1) * seg;
    for (let j = 0; j < seg; j++) b.i.push(r0 + j, r0 + (j + 1) % seg, ci);
  }
}
function arcPts(o, rows, t0 = 0, t1 = 1) {
  const out = [];
  for (let i = 0; i <= rows; i++) out.push(leafPt(o, 0, lerp(t0, t1, i / rows)));
  return out;
}
function bezierPts(p0, p1, p2, p3, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push(new V3().addScaledVector(p0, u * u * u).addScaledVector(p1, 3 * u * u * t).addScaledVector(p2, 3 * u * t * t).addScaledVector(p3, t * t * t));
  }
  return out;
}
function resample(pts, step) {
  const out = [pts[0].clone()], len = [0];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) { acc += pts[i].distanceTo(pts[i - 1]); len.push(acc); }
  const n = Math.max(2, Math.ceil(acc / step));
  let j = 1;
  for (let k = 1; k <= n; k++) {
    const s = acc * k / n;
    while (j < pts.length - 1 && len[j] < s) j++;
    const f = (s - len[j - 1]) / Math.max(1e-9, len[j] - len[j - 1]);
    out.push(pts[j - 1].clone().lerp(pts[j], clamp(f, 0, 1)));
  }
  out.total = acc;
  return out;
}
// Ellipsoid (Knospe, Kolben, Blüte) als kleines Rohr
function addBlob(b, center, axis, len, r, o = {}) {
  const ax = axis.clone().normalize(), rows = o.rows || 4, pts = [], rads = [];
  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    pts.push(center.clone().addScaledVector(ax, (t - 0.5) * len));
    rads.push(r * Math.pow(Math.sin(Math.PI * clamp(t, 0.001, 0.999)), o.pow || 0.7));
  }
  addTube(b, pts, rads, { seg: o.seg || 5, color: o.color, colorFn: o.colorFn });
}

/* ------------------------------------------------------------------ */
/* Farbhilfen                                                          */
/* ------------------------------------------------------------------ */
const col = (h) => new THREE.Color(h);
const VEIN = col(0xd9e6a8);
function vary(R, c, l = 0.1, h = 0.012, s = 0) {
  const o = c.clone();
  if (h || s) o.offsetHSL(R.sym(h), R.sym(s), 0);
  return o.multiplyScalar(1 + R.sym(l));
}
// Standard-Blattfärbung: hellere Mittelrippe, dunklerer Rand
function cfStd(mid = 0.22, edge = 0.18, vein = VEIN) {
  return (out, base, x, y, s) => {
    out.copy(base);
    const m = Math.max(0, 1 - Math.abs(s) * 2.2);
    if (m > 0 && mid) out.lerp(vein, m * mid * (1 - y * 0.6));
    if (edge) out.multiplyScalar(1 - edge * Math.abs(s) * (0.5 + y * 0.5));
  };
}

/* ------------------------------------------------------------------ */
/* Bau-Kontext                                                         */
/* ------------------------------------------------------------------ */
function makeCtx(d, H, potH, R, lod, color, hangBelow) {
  const B = { leaf: new Bucket(), gloss: new Bucket(), waxy: new Bucket(), stem: new Bucket(), succ: new Bucket() };
  return { d, H, potH, soilY: potH * POT_SOIL_Y, R, lod, base: col(color), hangBelow, B };
}
const soilPt = (c, r, az) => new V3(Math.cos(az) * r, c.soilY - 0.004, Math.sin(az) * r);
const horiz = (az) => new V3(Math.cos(az), 0, Math.sin(az));

/* ===================== Arten ===================== */

function bMonstera(c) {
  const { R, H, d, lod } = c;
  const n = clampi(2.5 + H * 6 + d * 8, 3, lod ? 10 : 6);
  const petCol = c.base.clone().lerp(col(0x9fbf6a), 0.35);
  for (let i = 0; i < n; i++) {
    const f = i / Math.max(1, n - 1);
    const az = i * GOLD + R.sym(0.35), base = soilPt(c, R() * d * 0.12, az + Math.PI);
    const pet = { pos: base, F: frameAE(az, R.range(1.12, 1.42)), L: H * R.range(0.5, 0.88) * (0.85 + 0.15 * (1 - f)), curl: R.range(0.45, 0.95) };
    const pts = arcPts(pet, lod ? 6 : 4);
    const Lb = clamp(H * 0.48, 0.05, 0.7) * R.range(0.78, 1.05) * (H < 0.3 ? 1 : 0.85 + 0.25 * (1 - f));
    addTube(c.B.stem, pts, (t) => Lb * 0.03 * (1.25 - t * 0.45), { seg: lod ? 5 : 4, color: vary(R, petCol, 0.06) });
    const endEl = Math.asin(clamp(leafDir(pet, 1).y, -1, 1));
    let T;
    if (Lb < 0.11) T = monsteraTpl(0, 0, 0, lod);
    else if (Lb < 0.2 || !lod) T = monsteraTpl(3, lod ? 1 : 0, i % 2, lod);
    else T = monsteraTpl(R() < 0.5 ? 5 : 4, 4, i % 2, lod);
    const el = clamp(endEl - R.range(0.95, 1.35), -1.0, 0.1);
    const o = {
      pos: pts[pts.length - 1], F: frameAE(az + R.sym(0.25), el, R.sym(0.25)), L: Lb, W: Lb * 0.95,
      curl: R.range(0.15, 0.45), fold: R.range(0.1, 0.22), color: vary(R, c.base, 0.1, 0.01).multiplyScalar(Lb < 0.11 ? 1.15 : 1), colorFn: cfStd(0.2, 0.15),
    };
    addLeaf(c.B.gloss, T, o);
  }
}

function bSansevieria(c) {
  const { R, H, d, lod } = c;
  const n = clampi(4 + H * 8 + d * 12, 5, lod ? 15 : 9);
  const T = gridTpl('sword2', prof([[0, 0.55], [0.15, 0.85], [0.5, 1], [0.78, 0.78]], 'point', 1.1), lod ? 16 : 9, lod ? 4 : 2);
  const dark = c.base.clone().multiplyScalar(0.55), light = col(0x9db58c), yellow = col(0xd8cf6a);
  const edged = lod && c.R() < 0.55;
  const clumps = d > 0.22 ? 3 : d > 0.14 ? 2 : 1;
  const centers = [];
  for (let k = 0; k < clumps; k++) centers.push(soilPt(c, clumps > 1 ? d * 0.17 : 0, k * TAU / clumps + R()));
  for (let i = 0; i < n; i++) {
    const cc = centers[i % clumps], az = i * GOLD + R.sym(0.4);
    const L = H * R.range(0.62, 1.0), Wd = clamp(L * 0.11, 0.014, 0.08);
    const ph = R() * 6, rows = lod ? 16 : 9;
    const o = {
      pos: cc.clone().add(horiz(az).multiplyScalar(R() * d * 0.05)), F: frameAE(az, R.range(1.3, 1.52), R.sym(1.6)), L, W: Wd,
      curl: R.range(-0.1, 0.3), fold: -0.35, twist: R.sym(0.7), color: vary(R, dark, 0.12),
      colorFn: (out, base, x, y, s) => {
        const band = 0.5 + 0.5 * Math.sin(TAU * (y * rows / 2.7 + Math.abs(s) * 0.45) + ph);
        out.copy(base).lerp(light, band * 0.55 * (0.4 + 0.6 * y));
        if (edged && Math.abs(s) > 0.99) out.copy(yellow);
      },
    };
    addLeaf(c.B.waxy, T, o);
  }
}

function bZamioculcas(c) {
  const { R, H, d, lod } = c;
  const n = clampi(3 + H * 7 + d * 6, 3, lod ? 8 : 6);
  const T = gridTpl('oval', W.oval, lod ? 4 : 3, 2);
  const stemCol = col(0x55703a), stemDark = col(0x2e3d22);
  for (let i = 0; i < n; i++) {
    const az = i * GOLD + R.sym(0.3), base = soilPt(c, R() * d * 0.14, az);
    const st = { pos: base, F: frameAE(az, R.range(1.08, 1.45)), L: H * R.range(0.72, 1.08), curl: R.range(0.25, 0.65) };
    const L = st.L, r0 = clamp(L * 0.032, 0.004, 0.018);
    const sp = R() * 9;
    addTube(c.B.stem, arcPts(st, lod ? 7 : 4), (t) => r0 * (t < 0.12 ? 1.35 - t * 2 : 1.1 - t * 0.7), {
      seg: 4, colorFn: (out, t, ph) => out.copy(stemCol).lerp(stemDark, (Math.sin(t * 40 + ph * 2 + sp) > 0.4) ? 0.6 : 0.1),
    });
    const pairs = clampi(3 + L * 9, 3, lod ? 7 : 5);
    const Ll0 = clamp(L * 0.2, 0.022, 0.11);
    const add = (t, sd) => {
      const p = leafPt(st, 0, t), Tg = leafDir(st, t), Nn = leafNrm(st, t);
      const dir = Tg.clone().multiplyScalar(0.55).addScaledVector(st.F.X, sd * 0.85);
      const Ll = Ll0 * (1.05 - 0.45 * Math.abs(t - 0.62));
      addLeaf(c.B.gloss, T, { pos: p, F: frameDir(dir, Nn), L: Ll, W: Ll * 0.48, curl: 0.25, fold: 0.12, color: vary(R, c.base, 0.08), colorFn: cfStd(0.12, 0.15) });
    };
    for (let k = 0; k < pairs; k++) { const t = 0.32 + 0.62 * k / pairs; add(t, 1); add(t + 0.03, -1); }
    const p = leafPt(st, 0, 1), Tg = leafDir(st, 1);
    addLeaf(c.B.gloss, T, { pos: p, F: frameDir(Tg, leafNrm(st, 1)), L: Ll0 * 0.85, W: Ll0 * 0.42, curl: 0.2, fold: 0.12, color: vary(R, c.base, 0.08), colorFn: cfStd(0.12, 0.15) });
  }
}

function bHanging(c, variegated, glossy, scale) {
  const { R, H, d, potH, soilY, lod } = c;
  const T = gridTpl('heart', W.heart, lod ? 4 : 3, 2, heartY);
  const bucket = glossy ? c.B.gloss : c.B.waxy;
  const Ls = clamp(d * 0.3 + H * 0.06, 0.035, 0.11) * scale;
  const cream = col(0xe9e2a0), vineCol = c.base.clone().lerp(col(0x9a9a55), 0.4);
  const cfVar = (ph) => (out, base, x, y, s) => {
    cfStd(0.18, 0.12)(out, base, x, y, s);
    if (variegated) { const v = Math.sin(x * 23 + y * 9 + ph) * Math.sin(y * 14 - x * 11 + ph * 1.7); if (v > 0.18) out.lerp(cream, 0.65); }
  };
  const moundH = clamp(H * 0.3, 0.05, 0.2);
  const nm = clampi(4 + d * 26, 4, lod ? 12 : 7);
  for (let k = 0; k < nm; k++) {
    const az = k * GOLD + R.sym(0.3), base = soilPt(c, R() * d * 0.15, az);
    const pet = { pos: base, F: frameAE(az, R.range(0.95, 1.35)), L: moundH * R.range(0.55, 1.0) + 0.01, curl: R.range(0.4, 0.9) };
    const pts = arcPts(pet, 3);
    addTube(c.B.stem, pts, Ls * 0.04, { seg: 3, color: vineCol });
    const L = Ls * R.range(0.8, 1.1);
    addLeaf(bucket, T, { pos: pts[3], F: frameAE(az + R.sym(0.3), R.range(-0.45, 0.25), R.sym(0.3)), L, W: L * 0.8, curl: 0.25, fold: 0.18, color: vary(R, c.base, 0.1), colorFn: cfVar(R() * 9) });
  }
  const nv = clampi(2 + d * 14 + H * 1.5, 3, lod ? 7 : 5);
  const floorY = -(c.hangBelow || 0) + 0.012;
  const rimR = 0.528 * d;
  for (let v = 0; v < nv; v++) {
    const az = (v + R.sym(0.35)) * TAU / nv, out = horiz(az), tang = new V3(-out.z, 0, out.x);
    const len = H * R.range(0.55, 1.0);
    const pts = [soilPt(c, d * 0.08, az), out.clone().multiplyScalar(rimR * 0.65).setY(soilY + moundH * 0.35), out.clone().multiplyScalar(rimR + 0.008).setY(potH + 0.01)];
    let acc = pts[1].distanceTo(pts[0]) + pts[2].distanceTo(pts[1]);
    const startAcc = acc;
    let cur = pts[2].clone(), step = 0.03, sway = R() * 6;
    while (acc < startAcc + len) {
      const nxt = cur.clone();
      if (cur.y - step > floorY) {
        nxt.y -= step;
        const rr = nxt.y > 0 ? potWallR(nxt.y, d, potH) + 0.01 : Math.hypot(cur.x, cur.z) + step * 0.12;
        const a = az + Math.sin(sway + acc * 7) * 0.08;
        nxt.x = Math.cos(a) * rr; nxt.z = Math.sin(a) * rr;
      } else {
        nxt.y = floorY;
        const a = az + Math.sin(sway + acc * 5) * 0.4;
        nxt.x += Math.cos(a) * step; nxt.z += Math.sin(a) * step;
      }
      acc += nxt.distanceTo(cur); pts.push(nxt); cur = nxt;
    }
    const tp = resample(pts, Math.max(lod ? 0.05 : 0.08, len / 14));
    addTube(c.B.stem, tp, Ls * 0.04, { seg: 3, color: vineCol });
    const total = tp.total, spc = Math.max(Ls * 0.95, len / (lod ? 13 : 8));
    let side = 1;
    for (let s = startAcc * 0.8; s < total - 0.01; s += spc * R.range(0.85, 1.15)) {
      const u = s / total, k = Math.min(tp.length - 2, Math.floor(u * (tp.length - 1)));
      const p = tp[k].clone().lerp(tp[k + 1], u * (tp.length - 1) - k);
      const Tg = tp[k + 1].clone().sub(tp[k]).normalize();
      const sz = Ls * (1 - 0.45 * clamp((s - startAcc) / len, 0, 1)) * R.range(0.85, 1.1);
      side = -side;
      const onFloor = p.y <= floorY + 0.005;
      const radial = new V3(p.x, 0, p.z).normalize();
      let dir, nh;
      if (onFloor) { dir = Tg.clone().addScaledVector(tang, side * 0.9).setY(0.15); nh = new V3(0, 1, 0); }
      else { dir = new V3(0, -0.8, 0).addScaledVector(radial, 0.55).addScaledVector(new V3(-radial.z, 0, radial.x), side * 0.45); nh = radial.clone().setY(0.35); }
      addLeaf(bucket, T, { pos: p.clone().addScaledVector(radial, 0.004), F: frameDir(dir, nh, R.sym(0.3)), L: sz, W: sz * 0.8, curl: 0.2, fold: 0.15, color: vary(R, c.base, 0.12), colorFn: cfVar(R() * 9) });
    }
  }
}

function bGruenlilie(c) {
  const { R, H, d, lod, potH } = c;
  const n = clampi(12 + H * 22 + d * 30, 12, lod ? 28 : 16);
  const T = gridTpl('strap', W.strap, lod ? 7 : 5, lod ? 4 : 2);
  const cream = col(0xf1f3dc);
  const edgeG = c.base.clone().multiplyScalar(0.62);
  const cf = (out, base, x, y, s) => { out.copy(edgeG); const a = Math.abs(s); if (a < 0.4) out.lerp(cream, 0.85); else if (a < 0.7) out.copy(base); };
  for (let i = 0; i < n; i++) {
    const az = i * GOLD + R.sym(0.3), f = i / n;
    const L = H * R.range(0.95, 1.3) * (0.75 + 0.25 * f);
    addLeaf(c.B.leaf, T, {
      pos: soilPt(c, R() * d * 0.08, az), F: frameAE(az, R.range(0.95, 1.45), R.sym(0.3)), L, W: clamp(L * 0.07, 0.008, 0.035),
      curl: R.range(1.1, 2.0), twist: R.sym(0.5), fold: -0.2, color: vary(R, c.base, 0.1), colorFn: cf,
    });
  }
  // Ausläufer mit Kindeln
  const nr = H > 0.22 && d > 0.11 ? clampi(H * 2.5, 1, 2) : 0;
  const stol = col(0xc9c88e);
  for (let k = 0; k < nr; k++) {
    const az = k * 2.3 + R(), out = horiz(az);
    const p0 = soilPt(c, d * 0.05, az), tip = out.clone().multiplyScalar(d * 0.5 + Math.min(H * 0.6, 0.3)).setY(potH - Math.min(H * 0.35, 0.18));
    const pts = bezierPts(p0, p0.clone().setY(potH + Math.min(H * 0.6, 0.3)), out.clone().multiplyScalar(d * 0.5 + Math.min(H * 0.5, 0.25)).setY(potH + Math.min(H * 0.45, 0.25)), tip, lod ? 8 : 5);
    addTube(c.B.stem, pts, 0.0018, { seg: 3, color: stol });
    for (let j = 0; j < 6; j++) {
      const a2 = j * GOLD, L = H * R.range(0.2, 0.3);
      addLeaf(c.B.leaf, gridTpl('strap', W.strap, 3, 2), { pos: tip, F: frameAE(a2, R.range(0.5, 1.1)), L, W: L * 0.08, curl: 1.4, color: vary(R, c.base, 0.1), colorFn: cf });
    }
  }
}

function bEinblatt(c) {
  const { R, H, d, lod } = c;
  const n = clampi(6 + H * 12 + d * 10, 6, lod ? 16 : 9);
  const T = gridTpl('lance', W.lance, lod ? 7 : 4, lod ? 4 : 2);
  const petCol = c.base.clone().multiplyScalar(1.2);
  for (let i = 0; i < n; i++) {
    const az = i * GOLD + R.sym(0.3);
    const pet = { pos: soilPt(c, R() * d * 0.12, az), F: frameAE(az, R.range(1.15, 1.45)), L: H * R.range(0.32, 0.55), curl: R.range(0.2, 0.5) };
    const pts = arcPts(pet, 4);
    addTube(c.B.stem, pts, clamp(H * 0.007, 0.0018, 0.006), { seg: 4, color: petCol });
    const L = clamp(H * 0.45, 0.05, 0.36) * R.range(0.8, 1.05);
    const el = Math.asin(leafDir(pet, 1).y) - R.range(0.1, 0.45);
    addLeaf(c.B.gloss, T, { pos: pts[4], F: frameAE(az + R.sym(0.2), el, R.sym(0.3)), L, W: L * 0.36, curl: R.range(0.4, 0.8), fold: 0.25, wave: 0.04, color: vary(R, c.base, 0.1), colorFn: cfStd(0.25, 0.12) });
  }
  const ns = clampi(1 + H * 4 + d * 4, 1, 6);
  const white = col(0xf7f8f2), spadix = col(0xeee6b4), stalk = col(0x6f9a52);
  const ST = gridTpl('spathe', W.spathe, lod ? 5 : 3, lod ? 4 : 2);
  for (let k = 0; k < ns; k++) {
    const az = k * 2.1 + R() * 1.2;
    const st = { pos: soilPt(c, R() * d * 0.1, az), F: frameAE(az, R.range(1.38, 1.52)), L: H * R.range(0.82, 0.98), curl: R.range(0.05, 0.2) };
    const pts = arcPts(st, 4);
    addTube(c.B.stem, pts, clamp(H * 0.005, 0.0015, 0.005), { seg: 3, color: stalk });
    const L = clamp(H * 0.17, 0.025, 0.12), top = pts[4], Tg = leafDir(st, 1);
    const outv = horiz(az);
    addLeaf(c.B.waxy, ST, { pos: top, F: frameDir(Tg.clone().addScaledVector(outv, -0.25), outv), L, W: L * 0.6, fold: -0.55, curl: -0.25, color: white, colorFn: (o, b, x, y, s) => { o.copy(b); if (y < 0.12) o.lerp(stalk, 0.5); } });
    addBlob(c.B.stem, top.clone().addScaledVector(Tg, L * 0.22).addScaledVector(outv, L * 0.12), Tg, L * 0.36, L * 0.055, { color: spadix, seg: 4, rows: 3 });
  }
}

function bCalathea(c) {
  const { R, H, d, lod } = c;
  const n = clampi(5 + H * 11 + d * 10, 5, lod ? 13 : 8);
  const rows = lod ? 12 : 6, T = gridTpl('calathea', W.calathea, rows, lod ? 6 : 4);
  const dark = c.base.clone().multiplyScalar(0.55), light = col(0xb3cc8c), petCol = col(0x7a5a66);
  const freq = lod ? 3 : 1.6;
  for (let i = 0; i < n; i++) {
    const az = i * GOLD + R.sym(0.3);
    const pet = { pos: soilPt(c, R() * d * 0.12, az), F: frameAE(az, R.range(1.25, 1.48)), L: H * R.range(0.38, 0.62), curl: R.range(0.2, 0.45) };
    const pts = arcPts(pet, 4);
    addTube(c.B.stem, pts, clamp(H * 0.006, 0.0015, 0.005), { seg: 3, color: petCol });
    const L = clamp(H * 0.45, 0.05, 0.3) * R.range(0.82, 1.05);
    const ph = R() * 0.3;
    addLeaf(c.B.leaf, T, {
      pos: pts[4], F: frameAE(az + R.sym(0.2), R.range(0.45, 1.05), R.sym(0.25)), L, W: L * 0.62, curl: R.range(0.15, 0.35), fold: 0.1, wave: 0.03,
      color: vary(R, c.base, 0.06),
      colorFn: (out, base, x, y, s) => {
        const a = Math.abs(s);
        const st = 0.5 + 0.5 * Math.cos(TAU * (y * freq - a * 0.55 + ph));
        out.copy(base).lerp(light, st * 0.75 * (1 - a * 0.5));
        if (a > 0.8) out.copy(dark);
        if (a < 0.2) out.lerp(light, 0.4);
      },
    });
  }
}

function bStrelitzie(c) {
  const { R, H, d, lod } = c;
  const n = clampi(4 + H * 5 + d * 6, 4, lod ? 11 : 7);
  const T = gridTpl('paddle', W.paddle, lod ? 8 : 5, lod ? 4 : 2);
  const a0 = R() * TAU, petCol = c.base.clone().lerp(col(0xa8b878), 0.3);
  for (let i = 0; i < n; i++) {
    const az = a0 + (i % 2) * Math.PI + R.sym(0.55), f = i / n;
    const pet = { pos: soilPt(c, R() * d * 0.08, az), F: frameAE(az, R.range(1.18, 1.48) + f * 0.05), L: H * R.range(0.45, 0.68), curl: R.range(0.08, 0.3) };
    const pts = arcPts(pet, 4);
    addTube(c.B.stem, pts, (t) => clamp(H * 0.011, 0.003, 0.012) * (1.2 - t * 0.4), { seg: 4, color: petCol });
    const L = clamp(H * 0.4, 0.06, 0.55) * R.range(0.82, 1.05);
    const el = Math.asin(leafDir(pet, 1).y) - R.range(0.05, 0.45);
    addLeaf(c.B.waxy, T, { pos: pts[4], F: frameAE(az + R.sym(0.15), el, R.sym(1.2)), L, W: L * 0.36, curl: R.range(0.2, 0.45), fold: 0.18, wave: 0.03, color: vary(R, c.base, 0.08), colorFn: cfStd(0.4, 0.1, col(0xd6dca0)) });
  }
}

function bPalm(c, areca) {
  const { R, H, d, lod } = c;
  const nf = clampi(4 + H * 5 + d * 8, 4, lod ? 9 : 6);
  const T = areca ? palmTpl('a', lod ? 13 : 9, 0.36, 0.7) : palmTpl('k', lod ? 10 : 7, 0.4, 0.4);
  const rach = areca ? col(0xb8a85a) : c.base.clone().lerp(col(0x7a7a4a), 0.4);
  const cane = col(0xa9a35a), ring = col(0x6b6a3a);
  for (let i = 0; i < nf; i++) {
    const az = i * GOLD + R.sym(0.3);
    const p0 = soilPt(c, R() * d * (areca ? 0.2 : 0.1), az);
    const L = H * R.range(0.95, 1.25);
    const o = {
      pos: p0, F: frameAE(az, areca ? R.range(1.2, 1.48) : R.range(1.05, 1.4), R.sym(0.15)), L, W: L * (areca ? 0.42 : 0.5),
      curl: areca ? R.range(0.5, 0.9) : R.range(0.9, 1.4), droop: areca ? 0.25 : 1.15, fold: areca ? -0.35 : 0.1,
      color: vary(R, c.base, 0.08), colorFn: cfStd(0.1, 0.12),
    };
    addLeaf(c.B.leaf, T, o);
    const r0 = clamp(L * (areca ? 0.016 : 0.011), 0.002, 0.014);
    const pts = arcPts(o, lod ? 8 : 5, 0, 0.98);
    addTube(c.B.stem, pts, (t) => r0 * (1 - t * 0.7), {
      seg: lod ? 4 : 3,
      colorFn: areca ? (out, t, ph, k) => out.copy(t < 0.3 ? cane : rach).lerp(ring, (t < 0.3 && k % 2) ? 0.35 : 0) : (out) => out.copy(rach),
    });
  }
}

function bRosetteTree(c, opt) {
  // Yucca / Drachenbaum: Stämme mit Blattschopf
  const { R, H, d, lod } = c;
  const nt = H < 0.45 ? 1 : (H < 0.9 || d < 0.2) ? 2 : 3;
  const Rl = clamp(H * opt.rosette * lerp(1.7, 1, clamp((H - 0.2) / 0.6, 0, 1)), 0.06, 0.5);
  const bark = col(opt.bark), barkD = bark.clone().multiplyScalar(0.7);
  const T = gridTpl(opt.tpl, opt.wfn, lod ? 4 : 3, opt.cols);
  const fr = [1, 0.7, 0.48];
  for (let k = 0; k < nt; k++) {
    const az = k * 2.4 + R(), p0 = soilPt(c, nt > 1 ? d * 0.13 : 0, az);
    const th = Math.max(0.03, H - Rl * 0.7) * fr[k] * R.range(0.92, 1.05);
    const rt = clamp(d * opt.trunkR, 0.006, 0.05) * (1 - 0.15 * k);
    const lean = horiz(az).multiplyScalar(th * R.range(0.06, 0.18));
    const wob = horiz(az + 1.6).multiplyScalar(th * opt.wobble * R.sym(1));
    const top = p0.clone().add(new V3(0, th, 0)).add(lean);
    const pts = bezierPts(p0, p0.clone().setY(p0.y + th * 0.35).add(wob), top.clone().setY(top.y - th * 0.3).sub(wob), top, lod ? 6 : 4);
    addTube(c.B.stem, pts, (t) => rt * (t < 0.1 ? 1.25 - t * 2.5 : 1 - t * 0.2), { seg: lod ? 7 : 5, cap: true, capColor: col(0x6f8a4a), colorFn: (out, t, ph, i) => out.copy(i % 2 ? bark : barkD) });
    const nl = clampi(opt.n0 + Rl * opt.n1, opt.n0, lod ? opt.nMax : Math.round(opt.nMax * 0.6));
    for (let i = 0; i < nl; i++) {
      const f = i / nl, a = i * GOLD;
      const L = Rl * R.range(0.85, 1.1) * (0.65 + 0.35 * f);
      const el = 1.45 - opt.spread * Math.pow(f, 0.8);
      addLeaf(c.B.leaf, T, {
        pos: top.clone().setY(top.y + Rl * 0.12 * (1 - f)), F: frameAE(a, el, R.sym(0.4)), L, W: L * opt.w,
        curl: R.range(opt.curl[0], opt.curl[1]), fold: 0.3, color: vary(R, c.base, 0.1), colorFn: opt.cf,
      });
    }
  }
}
function bYucca(c) {
  bRosetteTree(c, { rosette: 0.32, bark: 0x8b7d64, trunkR: 0.09, wobble: 0.03, tpl: 'sword', wfn: W.sword, cols: 2, n0: 14, n1: 30, nMax: 24, spread: 1.75, w: 0.09, curl: [0.0, 0.3], cf: cfStd(0.15, 0.1) });
}
function bDrachenbaum(c) {
  const red = col(0x8e2c3a);
  bRosetteTree(c, {
    rosette: 0.3, bark: 0x8f8a7a, trunkR: 0.045, wobble: 0.25, tpl: 'strapd', wfn: W.strap, cols: c.lod ? 3 : 2, n0: 16, n1: 30, nMax: 26, spread: 2.0, w: 0.065, curl: [0.3, 0.8],
    cf: (out, base, x, y, s) => { out.copy(base).multiplyScalar(0.8); if (Math.abs(s) > 0.95) out.copy(red); },
  });
}

function bElefantenfuss(c) {
  const { R, H, d, lod } = c;
  const rb = clamp(d * 0.36, 0.025, 0.2), hb = rb * 1.35;
  const neckTop = c.soilY + Math.max(hb + 0.03, H * 0.42);
  const rows = lod ? 10 : 6, pts = [], rad = [];
  for (let i = 0; i <= rows; i++) {
    const t = i / rows, y = lerp(c.soilY - 0.005, neckTop, t), yb = (y - c.soilY) / hb;
    pts.push(new V3(Math.sin(t * 3) * rb * 0.04, y, 0));
    rad.push(yb < 1 ? Math.max(rb * 0.16, rb * (0.92 + 0.12 * Math.sin(Math.PI * clamp(yb * 1.4, 0, 1))) * Math.pow(Math.cos(clamp(yb, 0, 1) * Math.PI / 2), 0.55)) : rb * 0.16 * (1 - 0.25 * t));
  }
  const bark = col(0x8c7a62), barkD = col(0x5e5040);
  addTube(c.B.stem, pts, rad, { seg: lod ? 10 : 7, cap: true, capColor: col(0x6b7a4a), colorFn: (out, t, ph, i, j) => out.copy(bark).lerp(barkD, ((i * 7 + j * 3) % 5) / 8) });
  const heads = H > 0.9 && d > 0.2 ? 2 : 1;
  const T = gridTpl('ribbon', W.strap, lod ? 6 : 4, 2);
  for (let h = 0; h < heads; h++) {
    let top = pts[rows].clone();
    if (h) {
      const bp = [top.clone(), top.clone().add(new V3(0.04, 0.05, 0.02)), top.clone().add(new V3(0.08, H * 0.18, 0.04))];
      addTube(c.B.stem, bp, rb * 0.12, { seg: 5, cap: true, color: bark });
      top = bp[2];
    }
    const nl = clampi(18 + H * 16, 18, lod ? 30 : 18);
    for (let i = 0; i < nl; i++) {
      const L = H * R.range(0.55, 0.95);
      addLeaf(c.B.leaf, T, { pos: top, F: frameAE(i * GOLD, R.range(0.7, 1.5), R.sym(0.5)), L, W: clamp(L * 0.035, 0.004, 0.016), curl: R.range(1.8, 2.8), twist: R.sym(1), fold: 0.15, color: vary(R, c.base, 0.12), colorFn: cfStd(0.1, 0.1) });
    }
  }
}

function bAloe(c) {
  const { R, H, d, lod } = c;
  const nl = clampi(8 + d * 30 + H * 8, 8, lod ? 16 : 10);
  const tooth = col(0xdfe0b8), spot = col(0xc8d6c0);
  const seg = lod ? 6 : 5, rows = lod ? 6 : 4;
  for (let i = 0; i < nl; i++) {
    const f = i / nl, az = i * GOLD;
    const L = H * R.range(1.0, 1.15) * (1 - 0.3 * f) + 0.02;
    const el = 0.85 + 0.6 * f + R.sym(0.08);
    const o = { pos: soilPt(c, d * 0.04 * (1 - f), az), F: frameAE(az, el), L, curl: R.range(0.2, 0.5) };
    const pts = arcPts(o, rows);
    const Wm = clamp(L * 0.15, 0.009, 0.07);
    const wAt = (t) => Wm * Math.pow(1 - t, 0.75) * Math.min(1, 0.65 + t * 3);
    const tang = new V3(-Math.sin(az), 0, Math.cos(az));
    const bc = vary(R, c.base, 0.08), ph = R() * 9;
    addTube(c.B.succ, pts, (t) => wAt(t), { seg, up: tang, ry: 0.5, colorFn: (out, t, a, ii, j) => { out.copy(bc); if (Math.sin(ii * 2.7 + j * 1.9 + ph) > 0.55) out.lerp(spot, 0.45); } });
    const nt = lod ? 6 : 3;
    for (let k = 1; k <= nt; k++) {
      const t = 0.12 + 0.8 * k / (nt + 1), p = leafPt(o, 0, t), Tg = leafDir(o, t), w = wAt(t);
      for (const sd of [1, -1]) {
        const e = p.clone().addScaledVector(tang, sd * w);
        const a = c.B.waxy.v(e.x - Tg.x * w * 0.25, e.y - Tg.y * w * 0.25, e.z - Tg.z * w * 0.25, tooth);
        const b = c.B.waxy.v(e.x + Tg.x * w * 0.25, e.y + Tg.y * w * 0.25, e.z + Tg.z * w * 0.25, tooth);
        const tp = e.clone().addScaledVector(tang, sd * w * 0.35).addScaledVector(Tg, w * 0.3);
        c.B.waxy.t(a, b, c.B.waxy.v(tp.x, tp.y, tp.z, tooth));
      }
    }
  }
}

function bEcheverie(c) {
  const { R, H, d, lod } = c;
  const pups = d > 0.14 ? (d > 0.24 ? 3 : 2) : 0;
  const rr0 = clamp(d * (pups ? 0.4 : 0.46), 0.025, 0.15);
  const rosH = rr0 * 0.75;
  const stemH = clamp(H - rosH - 0.1, 0, 0.05);
  let top = new V3(0, c.soilY, 0);
  if (stemH > 0.01) {
    const pts = bezierPts(top, top.clone().setY(top.y + stemH * 0.4), new V3(rr0 * 0.15, top.y + stemH * 0.7, 0), new V3(rr0 * 0.2, top.y + stemH, 0), 4);
    addTube(c.B.stem, pts, rr0 * 0.12, { seg: 5, color: col(0x8a8a6a) });
    top = pts[4];
  }
  const pink = col(0xd08a9a), inner = c.base.clone().lerp(col(0xd8e8d8), 0.35);
  const rosette = (ctr, r0, nl, seg, rows) => {
    for (let i = 0; i < nl; i++) {
      const f = i / nl, az = i * GOLD;
      const el = 0.28 + 1.05 * Math.pow(f, 1.2);
      const L = r0 * (1.0 - 0.6 * f) * R.range(0.92, 1.05);
      const o = { pos: ctr.clone().addScaledVector(horiz(az), r0 * 0.06 * (1 - f)).setY(ctr.y + r0 * 0.1 * f), F: frameAE(az, el), L, curl: -R.range(0.25, 0.5) };
      const pts = arcPts(o, rows);
      pts.push(leafPt(o, 0, 1.06));
      const Wm = L * 0.52, rad = [];
      for (let k = 0; k <= rows; k++) { const t = k / rows; rad.push(Wm * (0.4 + 0.6 * Math.pow(Math.sin(Math.PI * Math.min(0.5, t * 0.62)), 0.8)) * (t > 0.85 ? 0.75 : 1)); }
      rad.push(0);
      const tang = new V3(-Math.sin(az), 0, Math.cos(az)), bc = vary(R, c.base.clone().lerp(inner, f), 0.05);
      addTube(c.B.succ, pts, rad, { seg, up: tang, ry: 0.4, colorFn: (out, t, ph, k) => { out.copy(bc); if (k >= rows) out.lerp(pink, 0.45); } });
    }
  };
  rosette(top, rr0, clampi(14 + rr0 * 100, 14, lod ? (pups ? 22 : 28) : 14), lod ? 5 : 4, lod ? 5 : 3);
  for (let k = 0; k < pups; k++) {
    const az = k * TAU / pups + 0.7 + R.sym(0.4), rp = rr0 * R.range(0.4, 0.55);
    rosette(soilPt(c, Math.min(d * 0.46 - rp * 0.8, rr0 + rp * 0.7), az), rp, lod ? 10 : 7, 4, 3);
  }
}

function bKaktus(c) {
  const { R, H, d, lod } = c;
  const body = col(c.base), valley = body.clone().multiplyScalar(0.6), areole = col(0xf1ecd8);
  const column = H > d * 1.3;
  const ribs = column ? (lod ? 9 : 7) : (lod ? 13 : 9);
  const seg = ribs * 2;
  const rmod = (ph) => 1 + 0.09 * Math.cos(ribs * ph);
  const cf = (out, t, ph) => out.copy(body).lerp(valley, 0.5 - 0.5 * Math.cos(ribs * ph));
  const spines = (pts, rad, every) => {
    // Areolen + Dornen an Rippenkanten
    for (let i = 1; i < pts.length - 1; i += every) {
      const Tg = pts[i + 1].clone().sub(pts[i - 1]).normalize();
      let N = new V3(1, 0, 0).addScaledVector(Tg, -Tg.x).normalize();
      const B = new V3().crossVectors(Tg, N);
      for (let r = 0; r < ribs; r++) {
        const ph = (r + (i % 2) * 0.5) / ribs * TAU, rr = rad[i] * 1.09;
        if ((i % 2) && r % 1) continue;
        const dir = N.clone().multiplyScalar(Math.cos(ph)).addScaledVector(B, Math.sin(ph));
        const p = pts[i].clone().addScaledVector(dir, rr), sl = Math.max(0.003, rad[i] * 0.16);
        const tip1 = p.clone().addScaledVector(dir, sl).addScaledVector(Tg, sl * 0.5), tip2 = p.clone().addScaledVector(dir, sl * 0.7).addScaledVector(Tg, -sl * 0.6);
        const side = new V3().crossVectors(dir, Tg).multiplyScalar(sl * 0.25);
        const bb = c.B.waxy;
        const a = bb.v(p.x + side.x, p.y + side.y, p.z + side.z, areole), b = bb.v(p.x - side.x, p.y - side.y, p.z - side.z, areole);
        bb.t(a, b, bb.v(tip1.x, tip1.y, tip1.z, areole)); bb.t(a, b, bb.v(tip2.x, tip2.y, tip2.z, areole));
      }
    }
  };
  if (column) {
    const rc = clamp(Math.min(d * 0.3, H * 0.17), 0.015, 0.13);
    const hc = H + c.potH - c.soilY;
    const rows = lod ? 12 : 8, pts = [], rad = [];
    for (let i = 0; i <= rows; i++) {
      const t = i / rows, y = c.soilY - 0.005 + hc * t, top = (hc * (1 - t)) / rc;
      pts.push(new V3(0, y, 0));
      rad.push(top < 1 ? rc * Math.sqrt(Math.max(0.02, 1 - (1 - top) * (1 - top))) : rc * (t < 0.05 ? 0.9 : 1));
    }
    rad[rows] = 0.0001;
    addTube(c.B.succ, pts, rad, { seg, rmod, colorFn: cf });
    spines(pts, rad, 1);
    const arms = H > 0.4 ? (H > 0.8 ? 2 : 1) : 0;
    for (let k = 0; k < arms; k++) {
      const az = k * Math.PI + R.sym(0.5), out = horiz(az), y0 = c.soilY + hc * R.range(0.32, 0.5);
      const ra = rc * 0.62, ah = hc * R.range(0.3, 0.42);
      const ap = bezierPts(out.clone().multiplyScalar(rc * 0.5).setY(y0), out.clone().multiplyScalar(rc + ra * 1.6).setY(y0), out.clone().multiplyScalar(rc + ra * 1.6).setY(y0 + ah * 0.3), out.clone().multiplyScalar(rc + ra * 1.6).setY(y0 + ah), lod ? 8 : 5);
      const arad = ap.map((p, i) => { const tt = (ap.length - 1 - i) / (ap.length - 1); return tt < 0.15 ? ra * Math.sqrt(Math.max(0.02, tt / 0.15)) : ra; });
      addTube(c.B.succ, ap, arad, { seg, rmod, colorFn: cf, up: new V3(0, 1, 0) });
      spines(ap, arad, 2);
    }
  } else {
    const rb = clamp(Math.min(d * 0.4, H * 0.62), 0.02, 0.2);
    const hb = Math.max(H + c.potH - c.soilY, rb * 0.6);
    const rows = lod ? 9 : 6, pts = [], rad = [];
    for (let i = 0; i <= rows; i++) {
      const t = i / rows;
      pts.push(new V3(0, c.soilY - 0.005 + hb * t, 0));
      rad.push(rb * Math.pow(Math.sin(Math.PI * (0.3 + 0.7 * t)), 0.55) * (t > 0.97 ? 0.5 : 1));
    }
    rad[rows] = 0.0001;
    addTube(c.B.succ, pts, rad, { seg, rmod, colorFn: cf });
    spines(pts, rad, 1);
    if (R() < 0.6) { // Mammillaria-Blütenkranz
      const pinkC = col(0xe0609a), n = lod ? 9 : 6;
      for (let k = 0; k < n; k++) {
        const a = k / n * TAU, p = new V3(Math.cos(a) * rb * 0.45, pts[rows].y - hb * 0.08, Math.sin(a) * rb * 0.45);
        addBlob(c.B.waxy, p, new V3(Math.cos(a) * 0.4, 1, Math.sin(a) * 0.4), rb * 0.14, rb * 0.07, { color: pinkC, seg: 4, rows: 2 });
      }
    }
  }
}

function bOrchidee(c) {
  const { R, H, d, lod } = c;
  const nl = clampi(2 + d * 14, 2, 5);
  const T = gridTpl('obov', W.obovate, lod ? 6 : 4, lod ? 4 : 2);
  const a0 = R() * TAU;
  for (let i = 0; i < nl; i++) {
    const az = a0 + (i % 2) * Math.PI + R.sym(0.35), L = clamp(d * 0.95 + H * 0.12, 0.07, 0.3) * R.range(0.85, 1.05) * (1 - i * 0.08);
    addLeaf(c.B.gloss, T, { pos: soilPt(c, 0, az).setY(c.soilY + 0.006 + i * 0.006), F: frameAE(az, R.range(0.25, 0.55)), L, W: L * 0.42, curl: R.range(0.5, 0.9), fold: 0.35, color: vary(R, c.base, 0.06).multiplyScalar(1.1), colorFn: cfStd(0.12, 0.1) });
  }
  // Luftwurzeln
  const rootC = col(0xa8b29a);
  for (let k = 0; k < (d > 0.1 ? 2 : 1); k++) {
    const az = a0 + 1.4 + k * 2.6, out = horiz(az);
    addTube(c.B.stem, bezierPts(soilPt(c, 0.01, az).setY(c.soilY + 0.01), out.clone().multiplyScalar(d * 0.4).setY(c.soilY + 0.05), out.clone().multiplyScalar(d * 0.6).setY(c.potH + 0.02), out.clone().multiplyScalar(d * 0.62).setY(c.potH * 0.6), 5), 0.0025, { seg: 3, color: rootC });
  }
  const variants = [[0xfbfbf6, 0xd85a90], [0xf2b5d0, 0xa83570], [0xd65aa0, 0x7a1f4f]];
  const [pc, lc] = variants[Math.floor(R() * 3)];
  const petal = col(pc), lip = col(lc), stake = col(0x9b8a5f), spikeC = col(0x5f7a3c), bud = col(0xd9e2b0);
  const PT = gridTpl('petal', W.petal, lod ? 3 : 2, 2), DT = discTpl(lod ? 2 : 1, lod ? 8 : 6);
  const ns = H > 0.35 && d > 0.1 ? 2 : 1;
  for (let s = 0; s < ns; s++) {
    const az = a0 + Math.PI / 2 + s * 2.6 + R.sym(0.3), out = horiz(az);
    const hS = (H + c.potH - c.soilY) * (s ? 0.82 : 1), p0 = soilPt(c, 0.012, az + 1.5);
    const p1 = p0.clone().setY(p0.y + hS * 0.72);
    if (s === 0) addTube(c.B.stem, [p0.clone().addScaledVector(out, -0.006), p1.clone().addScaledVector(out, -0.006).setY(p1.y + 0.01)], 0.0022, { seg: 3, color: stake });
    const tip = p1.clone().addScaledVector(out, hS * 0.55).setY(p0.y + hS * 0.74);
    const arch = bezierPts(p1, p1.clone().setY(p0.y + hS * 0.98), tip.clone().addScaledVector(out, -hS * 0.12).setY(p0.y + hS * 0.98), tip, lod ? 8 : 5);
    addTube(c.B.stem, [p0, p0.clone().lerp(p1, 0.5), ...arch], 0.0022, { seg: 3, color: spikeC });
    const nf = clampi(3 + H * 6, 3, lod ? 7 : 5), fs = clamp(H * 0.15, 0.04, 0.08), fside = R() < 0.5 ? 1 : -1;
    for (let k = 0; k < nf + 2; k++) {
      const u = 0.12 + 0.86 * k / (nf + 1), idx = u * (arch.length - 1), i0 = Math.min(arch.length - 2, Math.floor(idx));
      const p = arch[i0].clone().lerp(arch[i0 + 1], idx - i0);
      if (k >= nf) { addBlob(c.B.waxy, p.clone().setY(p.y - fs * 0.15), new V3(0, 1, 0), fs * 0.32, fs * 0.13, { color: bud, seg: 4, rows: 3 }); continue; }
      const face = new V3(-out.z, 0, out.x).multiplyScalar(fside).addScaledVector(out, 0.35 + ((k % 2) ? 0.15 : -0.15)).setY(0.45).normalize();
      const up = new V3(0, 1, 0).addScaledVector(face, -face.y).normalize(), right = new V3().crossVectors(up, face);
      const ctr = p.clone().addScaledVector(face, fs * 0.15).setY(p.y - fs * 0.45);
      const petalAt = (ang, L, Wd, T2, bc, push = 0) => {
        const dir = up.clone().multiplyScalar(Math.cos(ang)).addScaledVector(right, Math.sin(ang));
        addLeaf(c.B.waxy, T2, { pos: ctr.clone().addScaledVector(face, push), F: frameDir(dir, face), L, W: Wd, fold: -0.12, curl: -0.15, color: bc, colorFn: T2 === DT ? null : (o, b, x, y) => { o.copy(b); if (y < 0.15) o.lerp(lip, 0.35); } });
      };
      petalAt(0, fs * 0.5, fs * 0.3, PT, petal);
      petalAt(2.4, fs * 0.48, fs * 0.28, PT, petal);
      petalAt(-2.4, fs * 0.48, fs * 0.28, PT, petal);
      petalAt(1.25, fs * 0.55, fs * 0.55, PT, petal, 0.002);
      petalAt(-1.25, fs * 0.55, fs * 0.55, PT, petal, 0.002);
      addLeaf(c.B.waxy, DT, { pos: ctr.clone().addScaledVector(face, fs * 0.08).addScaledVector(up, -fs * 0.12), F: frameDir(up, face), L: fs * 0.3, W: fs * 0.3, cup: 0.6, anchor: 0.5, color: lip });
    }
  }
}

function bPilea(c) {
  const { R, H, d, lod } = c;
  const DT = discTpl(lod ? 3 : 2, lod ? 12 : 8);
  const stemC = col(0x8fae6a), petC = c.base.clone().lerp(col(0xb8cc8a), 0.5);
  const plant = (base, Hs, nl, scale) => {
    const hs = Hs * 0.5, lean = horiz(R() * TAU).multiplyScalar(hs * 0.12);
    const top = base.clone().add(new V3(0, hs, 0)).add(lean);
    addTube(c.B.stem, bezierPts(base, base.clone().setY(base.y + hs * 0.4), top.clone().setY(top.y - hs * 0.3), top, 3), Math.max(0.002, Hs * 0.02), { seg: 4, color: stemC, cap: true });
    for (let i = 0; i < nl; i++) {
      const f = i / Math.max(1, nl - 1), az = i * GOLD + R.sym(0.2);
      const node = base.clone().lerp(top, 0.25 + 0.75 * f);
      const pet = { pos: node, F: frameAE(az, lerp(0.15, 1.15, f) + R.sym(0.15)), L: clamp(Hs * 0.42, 0.02, 0.22) * (1.1 - 0.5 * f) * scale, curl: R.range(0.3, 0.7) * (1 - f * 0.5) };
      const pts = arcPts(pet, 3);
      addTube(c.B.stem, pts, Math.max(0.0012, Hs * 0.006), { seg: 3, color: petC });
      const rL = clamp(Hs * 0.22, 0.02, 0.13) * (1.05 - 0.4 * f) * R.range(0.85, 1.05) * scale;
      const dirOut = leafDir(pet, 1).setY(0).normalize().setY(-0.1 + f * 0.25).normalize();
      addLeaf(c.B.waxy, DT, { pos: pts[3], F: frameDir(dirOut, new V3(0, 1, 0).addScaledVector(horiz(az), 0.4)), L: rL, W: rL, anchor: 0.42, cup: -0.18, color: vary(R, c.base, 0.1), colorFn: (o, b, x, y, s) => { o.copy(b); const r = Math.hypot(x, y - 0.5) * 2; o.multiplyScalar(1.12 - 0.22 * r); } });
    }
  };
  plant(soilPt(c, 0, 0), H + c.potH - c.soilY, clampi(6 + H * 26 + d * 10, 7, lod ? 22 : 12), 1);
  if (d > 0.12) for (let k = 0; k < (d > 0.2 ? 2 : 1); k++) plant(soilPt(c, d * 0.3, k * 2.5 + 1), Math.max(0.05, H * 0.2), lod ? 3 : 2, 0.9);
}

function bFarn(c) {
  const { R, H, d, lod } = c;
  const n = clampi(10 + H * 16 + d * 25, 10, lod ? 24 : 12);
  const T = fernTpl(lod ? 16 : 10);
  const young = c.base.clone().lerp(col(0xb6d36a), 0.45);
  for (let i = 0; i < n; i++) {
    const az = i * GOLD + R.sym(0.3), f = i / n;
    const L = H * R.range(1.1, 1.5) * (0.8 + 0.2 * f);
    addLeaf(c.B.leaf, T, {
      pos: soilPt(c, R() * d * 0.1, az), F: frameAE(az, R.range(0.85, 1.4), R.sym(0.25)), L, W: L * 0.3,
      curl: R.range(1.2, 2.0), droop: 0.12, fold: -0.08, twist: R.sym(0.3), color: vary(R, c.base, 0.1),
      colorFn: (o, b, x, y) => { o.copy(b).lerp(young, y * y * 0.7); },
    });
  }
}

function bSchefflera(c) {
  const { R, H, d, lod } = c;
  const ns = clampi(1 + d * 6, 1, 3);
  const T = gridTpl('obov', W.obovate, lod ? 4 : 3, 2);
  const stemC = col(0x7d8a52), petC = col(0x8aa35a);
  const tops = [];
  for (let s = 0; s < ns; s++) {
    const az = s * 2.4 + R(), base = soilPt(c, ns > 1 ? d * 0.12 : 0, az), h = H * R.range(0.6, 0.85) * (1 - s * 0.1);
    const top = base.clone().add(new V3(0, h, 0)).addScaledVector(horiz(az), h * 0.1);
    const pts = [base, top];
    addTube(c.B.stem, bezierPts(base, base.clone().setY(base.y + h * 0.4), top.clone().setY(top.y - h * 0.3), top, 4), clamp(H * 0.012, 0.003, 0.015), { seg: 4, color: stemC, cap: true });
    tops.push(pts);
  }
  const nl = clampi(6 + H * 12 + d * 8, 6, lod ? 15 : 8);
  const m = lod ? 7 : 5;
  for (let i = 0; i < nl; i++) {
    const pts = tops[i % ns], f = Math.floor(i / ns) / Math.ceil(nl / ns);
    const node = pts[0].clone().lerp(pts[pts.length - 1], 0.4 + 0.6 * f);
    const az = i * GOLD;
    const pet = { pos: node, F: frameAE(az, lerp(0.45, 1.15, f) + R.sym(0.2)), L: clamp(H * 0.26, 0.03, 0.3) * R.range(0.8, 1.1), curl: R.range(0.3, 0.6) };
    const pp = arcPts(pet, 3);
    addTube(c.B.stem, pp, clamp(H * 0.005, 0.0012, 0.005), { seg: 3, color: petC });
    const end = pp[3], fwd = leafDir(pet, 1).setY(0).normalize(), up = new V3(0, 1, 0), side = new V3().crossVectors(up, fwd);
    const Ll = clamp(H * 0.17, 0.025, 0.16) * R.range(0.85, 1.05);
    for (let k = 0; k < m; k++) {
      const psi = (k / (m - 1) - 0.5) * 4.6, w = 1 - 0.3 * Math.abs(psi) / 2.3;
      const dir = fwd.clone().multiplyScalar(Math.cos(psi)).addScaledVector(side, Math.sin(psi)).setY(-0.12).normalize();
      addLeaf(c.B.gloss, T, { pos: end.clone().addScaledVector(dir, Ll * 0.06), F: frameDir(dir, up), L: Ll * w, W: Ll * w * 0.42, curl: 0.35, fold: 0.15, color: vary(R, c.base, 0.08), colorFn: cfStd(0.18, 0.12) });
    }
  }
}

function bBasilikum(c) {
  const { R, H, d, lod } = c;
  const ns = clampi(3 + d * 14, 3, lod ? 6 : 4);
  const T = gridTpl('basil', W.ellip, lod ? 4 : 3, 2);
  const stemC = col(0x6f9a46);
  const leafPair = (p, rot, el, L) => {
    for (const sd of [0, Math.PI]) {
      addLeaf(c.B.waxy, T, { pos: p, F: frameAE(rot + sd + R.sym(0.2), el + R.sym(0.15), R.sym(0.2)), L, W: L * 0.62, curl: 0.55, fold: 0.38, color: vary(R, c.base, 0.08), colorFn: cfStd(0.12, 0.08) });
    }
  };
  for (let s = 0; s < ns; s++) {
    const az = s * GOLD + R.sym(0.3), base = soilPt(c, ns > 1 ? d * 0.16 * Math.sqrt(R()) : 0, az);
    const h = H * R.range(0.45, 0.75), top = base.clone().add(new V3(0, h, 0)).addScaledVector(horiz(az), h * R.range(0.15, 0.35));
    const pts = bezierPts(base, base.clone().setY(base.y + h * 0.4), top.clone().setY(top.y - h * 0.3), top, 4);
    addTube(c.B.stem, pts, clamp(H * 0.014, 0.002, 0.006), { seg: 3, color: stemC });
    const nodes = clampi(2 + h * 7, 2, lod ? 4 : 3);
    let rot = az + Math.PI / 4;
    for (let k = 0; k <= nodes; k++) {
      const f = k / nodes, p = pts[0].clone().lerp(top, 0.3 + 0.7 * f);
      const L = clamp(H * 0.36, 0.028, 0.1) * (1.1 - 0.45 * f) * R.range(0.9, 1.05);
      leafPair(p, rot, lerp(0.05, 0.75, f), L);
      if (k < nodes && k > 0 && lod) leafPair(p.clone().setY(p.y + L * 0.12), rot + Math.PI / 2, 0.9, L * 0.5); // Achseltriebe
      rot += Math.PI / 2;
    }
    leafPair(top.clone().setY(top.y + 0.004), rot, 1.15, clamp(H * 0.12, 0.012, 0.035));
  }
}

function bSmallLeafTree(c, opt) {
  // Birkenfeige / Olive: Stamm(e), Äste, viele kleine Blätter
  const { R, H, d, lod } = c;
  const bark = col(opt.bark), barkD = bark.clone().multiplyScalar(0.72);
  const th = H * opt.trunk, rt = clamp(d * opt.trunkR, 0.005, 0.04);
  const base = soilPt(c, 0, 0), top = new V3(R.sym(th * 0.06), c.soilY + th, R.sym(th * 0.06));
  const braid = opt.braid && H > 0.5 ? 3 : 1;
  for (let k = 0; k < braid; k++) {
    const pts = [];
    const rows = lod ? 8 : 5;
    for (let i = 0; i <= rows; i++) {
      const t = i / rows, a = k * TAU / braid + t * (braid > 1 ? 9 : 0);
      const w = (braid > 1 ? rt * 1.1 : 0) + Math.sin(t * 5 + k) * th * opt.gnarl;
      pts.push(base.clone().lerp(top, t).add(new V3(Math.cos(a) * w, 0, Math.sin(a) * w)));
    }
    addTube(c.B.stem, pts, (t) => (braid > 1 ? rt * 0.6 : rt) * (1.2 - t * 0.5), { seg: lod ? 6 : 4, colorFn: (o, t, ph, i, j) => o.copy(((i + j) % 3) ? bark : barkD) });
  }
  const crown = Math.max((H - th) * 0.55, d * 0.6);
  const nb = clampi(3 + H * 4, 3, lod ? 7 : 5);
  const branches = [];
  for (let b = 0; b < nb; b++) {
    const az = b * GOLD + R.sym(0.3);
    const o = { pos: top.clone().setY(top.y - th * 0.15 * R()), F: frameAE(az, R.range(opt.bEl[0], opt.bEl[1])), L: crown * R.range(0.8, 1.15), curl: R.range(opt.bCurl[0], opt.bCurl[1]) };
    const pts = arcPts(o, lod ? 4 : 3);
    addTube(c.B.stem, pts, (t) => rt * 0.55 * (1 - t * 0.75), { seg: 4, colorFn: (o2, t) => o2.copy(bark) });
    branches.push(o);
  }
  const nLeaves = clampi(opt.l0 + H * opt.l1, opt.l0, lod ? opt.lMax : Math.round(opt.lMax * 0.55));
  const T = diamondTpl(opt.wPos || 0.42);
  const L0 = clamp(H * opt.leafL, 0.018, 0.065);
  const ctr = top.clone().setY(top.y + crown * 0.5);
  const silver = col(0xb9c2a8);
  for (let i = 0; i < nLeaves; i++) {
    const o = branches[i % nb], t = R.range(0.25, 1.05);
    const p = leafPt(o, 0, t).add(new V3(R.sym(1), R.sym(1), R.sym(1)).multiplyScalar(crown * opt.cloud));
    const outD = p.clone().sub(ctr); const dist = outD.length() / crown; outD.normalize();
    const dir = outD.clone().multiplyScalar(0.6).add(new V3(R.sym(0.7), opt.leafUp + R.sym(0.5), R.sym(0.7)));
    const L = L0 * R.range(0.8, 1.15);
    const cc = vary(R, c.base, 0.14, 0.02).multiplyScalar(0.72 + 0.35 * clamp(dist, 0, 1) + 0.12 * clamp((p.y - ctr.y) / crown, -1, 1));
    if (opt.silver && R() < 0.3) cc.lerp(silver, 0.55);
    addLeaf(opt.gloss ? c.B.gloss : c.B.leaf, T, { pos: p, F: frameDir(dir, outD.clone().setY(outD.y + 0.8), R.sym(1)), L, W: L * opt.leafW, fold: 0.2, color: cc });
  }
}
function bBirkenfeige(c) {
  bSmallLeafTree(c, { bark: 0x9a8a72, trunk: 0.42, trunkR: 0.05, braid: true, gnarl: 0.0, bEl: [0.35, 1.0], bCurl: [0.7, 1.4], l0: 220, l1: 320, lMax: 560, tpl: 'tiny', leafL: 0.06, leafW: 0.5, cloud: 0.3, leafUp: -0.55, gloss: true });
}
function bOlive(c) {
  bSmallLeafTree(c, { bark: 0x7f786a, trunk: 0.45, trunkR: 0.07, braid: false, gnarl: 0.04, bEl: [0.6, 1.25], bCurl: [0.1, 0.5], l0: 220, l1: 320, lMax: 560, tpl: 'tiny', leafL: 0.085, leafW: 0.2, wPos: 0.5, cloud: 0.24, leafUp: 0.35, silver: true });
}

function bStemLeaves(c, opt) {
  // Gummibaum / Geigenfeige: aufrechter Stamm, große Blätter wechselständig
  const { R, H, d, lod } = c;
  const nst = d > 0.28 && H > 0.8 ? 2 : 1;
  const T = gridTpl(opt.tpl, opt.wfn, lod ? opt.rows : Math.ceil(opt.rows / 2), lod ? 4 : 2);
  const stemC = col(opt.stem);
  for (let s = 0; s < nst; s++) {
    const az0 = s * 2.6 + R(), base = soilPt(c, nst > 1 ? d * 0.12 : 0, az0);
    const h = (H + c.potH - c.soilY) * (s ? 0.65 : 0.82);
    const top = base.clone().add(new V3(0, h, 0)).addScaledVector(horiz(az0), h * 0.06);
    const pts = bezierPts(base, base.clone().setY(base.y + h * 0.35).addScaledVector(horiz(az0 + 1.5), h * 0.04), top.clone().setY(top.y - h * 0.3), top, lod ? 6 : 4);
    addTube(c.B.stem, pts, (t) => clamp(H * opt.stemR, 0.003, 0.025) * (1.1 - t * 0.5), { seg: lod ? 6 : 4, color: stemC });
    const at = (u) => { const k = u * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(k)); return pts[i].clone().lerp(pts[i + 1], k - i); };
    const nl = clampi(opt.n0 + H * opt.n1, opt.n0, lod ? opt.nMax : Math.round(opt.nMax * 0.6)) * (s ? 0.5 : 1);
    for (let i = 0; i < nl; i++) {
      const f = i / Math.max(1, nl - 1), az = i * GOLD + R.sym(0.25) + az0;
      const p = at(opt.start + (0.97 - opt.start) * f);
      const L = clamp(H * opt.leafL, 0.05, opt.leafMax) * (1.08 - 0.35 * f) * R.range(0.88, 1.05);
      const el = lerp(opt.el[0], opt.el[1], f) + R.sym(0.15);
      const pet = { pos: p, F: frameAE(az, el + 0.3), L: L * 0.14, curl: 0.3 };
      const pp = arcPts(pet, 2);
      addTube(c.B.stem, pp, clamp(H * 0.004, 0.0015, 0.005), { seg: 3, color: stemC });
      addLeaf(c.B.gloss, T, { pos: pp[2], F: frameAE(az, el, R.sym(0.15)), L, W: L * opt.w, curl: R.range(opt.curl[0], opt.curl[1]), fold: opt.fold, wave: opt.wave, color: vary(R, c.base, 0.08).multiplyScalar(opt.bright || 1), colorFn: opt.cf });
    }
    if (opt.sheath) {
      const tp = pts[pts.length - 1];
      addTube(c.B.stem, [tp, tp.clone().setY(tp.y + H * 0.04), tp.clone().setY(tp.y + H * 0.07)], [clamp(H * 0.01, 0.003, 0.012), clamp(H * 0.007, 0.002, 0.008), 0.0005], { seg: 4, color: col(opt.sheath) });
    }
  }
}
function bGummibaum(c) {
  bStemLeaves(c, { tpl: 'ellip', wfn: W.ellip, rows: 8, stem: 0x5d6b3e, stemR: 0.011, n0: 6, n1: 10, nMax: 18, start: 0.12, leafL: 0.3, leafMax: 0.34, el: [0.2, 0.75], w: 0.55, bright: 1.3, curl: [0.15, 0.4], fold: 0.08, wave: 0, cf: cfStd(0.35, 0.1, col(0xc9b88a)), sheath: 0xb4473e });
}
function bGeigenfeige(c) {
  const vein = col(0xc8d89a);
  bStemLeaves(c, {
    tpl: 'fiddle', wfn: W.fiddle, rows: 8, stem: 0x7a6a52, stemR: 0.012, n0: 6, n1: 11, nMax: 17, start: 0.25, leafL: 0.34, leafMax: 0.45, el: [0.2, 1.1], w: 0.7, curl: [0.05, 0.3], fold: -0.06, wave: 0.05,
    cf: (o, b, x, y, s) => { cfStd(0.4, 0.12, vein)(o, b, x, y, s); if (Math.abs(s) > 0.2 && Math.abs(s) < 0.8) o.lerp(vein, 0.12 * (0.5 + 0.5 * Math.cos(TAU * (y * 4 - Math.abs(s) * 0.6)))); },
  });
}

function bGenericBush(c) {
  const { R, H, d, lod } = c;
  const n = clampi(6 + H * 12 + d * 10, 6, lod ? 16 : 9);
  const T = gridTpl('oval', W.oval, lod ? 5 : 3, 2);
  for (let i = 0; i < n; i++) {
    const az = i * GOLD + R.sym(0.3);
    const pet = { pos: soilPt(c, R() * d * 0.12, az), F: frameAE(az, R.range(1.1, 1.45)), L: H * R.range(0.35, 0.6), curl: R.range(0.3, 0.6) };
    const pts = arcPts(pet, 3);
    addTube(c.B.stem, pts, clamp(H * 0.006, 0.0015, 0.005), { seg: 3, color: c.base.clone().multiplyScalar(1.2) });
    const L = clamp(H * 0.4, 0.04, 0.3) * R.range(0.8, 1.05);
    addLeaf(c.B.leaf, T, { pos: pts[3], F: frameAE(az, Math.asin(leafDir(pet, 1).y) - R.range(0.2, 0.6), R.sym(0.3)), L, W: L * 0.5, curl: 0.5, fold: 0.15, color: vary(R, c.base, 0.1), colorFn: cfStd() });
  }
}

/* ------------------------------------------------------------------ */
/* Artenregister                                                       */
/* ------------------------------------------------------------------ */
const SPECIES = {
  monstera: { fn: bMonstera, color: '#2f6b3a' },
  geigenfeige: { fn: bGeigenfeige, color: '#3b6e2e' },
  birkenfeige: { fn: bBirkenfeige, color: '#4f8a3c' },
  gummibaum: { fn: bGummibaum, color: '#1f4d2b' },
  bogenhanf: { fn: bSansevieria, color: '#4f7a3a' },
  gluecksfeder: { fn: bZamioculcas, color: '#2e6b2f' },
  efeutute: { fn: (c) => bHanging(c, true, false, 1.15), color: '#5c9a3a', norm: false },
  philodendron: { fn: (c) => bHanging(c, false, true, 0.85), color: '#3d7d34', norm: false },
  gruenlilie: { fn: bGruenlilie, color: '#8fbf5a' },
  einblatt: { fn: bEinblatt, color: '#2b6a3a' },
  calathea: { fn: bCalathea, color: '#4a7d4f' },
  strelitzie: { fn: bStrelitzie, color: '#4c7a5a' },
  kentia: { fn: (c) => bPalm(c, false), color: '#3a6b3f' },
  areca: { fn: (c) => bPalm(c, true), color: '#7aa84a' },
  yucca: { fn: bYucca, color: '#4d7f4a' },
  drachenbaum: { fn: bDrachenbaum, color: '#5b7a3c' },
  elefantenfuss: { fn: bElefantenfuss, color: '#6b8f4a' },
  aloe: { fn: bAloe, color: '#7fa37a' },
  echeverie: { fn: bEcheverie, color: '#8fb3a0', norm: false },
  kaktus: { fn: bKaktus, color: '#5f8f4e', norm: false },
  orchidee: { fn: bOrchidee, color: '#6c8f4e' },
  pilea: { fn: bPilea, color: '#6fae4a' },
  farn: { fn: bFarn, color: '#4f9a3f' },
  schefflera: { fn: bSchefflera, color: '#4a8a3a' },
  basilikum: { fn: bBasilikum, color: '#5fae3c' },
  olivenbaum: { fn: bOlive, color: '#8a9a6b' },
};
const ALIAS = {
  sansevieria: 'bogenhanf', zamioculcas: 'gluecksfeder', pothos: 'efeutute', ficuslyrata: 'geigenfeige', 'ficus-lyrata': 'geigenfeige',
  benjamina: 'birkenfeige', 'ficus-benjamina': 'birkenfeige', spathiphyllum: 'einblatt', strelitzia: 'strelitzie', olive: 'olivenbaum',
  olivenbaum: 'olivenbaum', elefantenfuß: 'elefantenfuss', beaucarnea: 'elefantenfuss', chlorophytum: 'gruenlilie', grünlilie: 'gruenlilie',
  phalaenopsis: 'orchidee', basilikum: 'basilikum', nephrolepis: 'farn', echeveria: 'echeverie', kaktus: 'kaktus', dracaena: 'drachenbaum',
};
const SHAPE_FALLBACK = {
  bush: { fn: bGenericBush }, tall: { fn: bGummibaum }, palm: { fn: (c) => bPalm(c, false) }, succulent: { fn: bEcheverie, norm: false },
  hanging: { fn: (c) => bHanging(c, false, true, 1), norm: false }, tree: { fn: bBirkenfeige },
};
export const SPECIES_IDS = Object.keys(SPECIES);

function resolveSpecies(plantId, shape) {
  const id = String(plantId || '').toLowerCase();
  if (SPECIES[id]) return { key: id, def: SPECIES[id] };
  if (ALIAS[id]) return { key: ALIAS[id], def: SPECIES[ALIAS[id]] };
  let sh = shape;
  if (!sh) {
    const list = (typeof globalThis !== 'undefined' && Array.isArray(globalThis.PLANTS)) ? globalThis.PLANTS : [];
    sh = (list.find((p) => p.id === plantId) || {}).shape;
  }
  sh = SHAPE_FALLBACK[sh] ? sh : 'bush';
  return { key: 'shape:' + sh, def: SHAPE_FALLBACK[sh] };
}

/* ------------------------------------------------------------------ */
/* Bau + Cache (referenzgezählte Pflanzengeometrien)                    */
/* ------------------------------------------------------------------ */
const GEO_CACHE = new Map(); // key -> { parts:[{geo, mat}], topY, refs }

function bucketGeo(b) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(b.c, 3));
  g.setIndex(b.i);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

function buildEntry(sp, d, H, potH, lod, color, hangBelow, seedStr) {
  const R = makeRng(hashStr(seedStr));
  const c = makeCtx(d, H, potH, R, lod, color, hangBelow);
  sp.def.fn(c);
  const keys = Object.keys(c.B).filter((k) => c.B[k].i.length);
  // Höhe normieren: Laubspitze = Topfrand + plantHeight (gleichmäßig um die Erdmitte skaliert)
  let maxY = -Infinity;
  for (const k of keys) { const p = c.B[k].p; for (let i = 1; i < p.length; i += 3) if (p[i] > maxY) maxY = p[i]; }
  if (sp.def.norm !== false && maxY > c.soilY + 0.005) {
    const s = clamp((potH + H - c.soilY) / (maxY - c.soilY), 0.7, 1.4), sy = c.soilY;
    for (const k of keys) { const p = c.B[k].p; for (let i = 0; i < p.length; i += 3) { p[i] *= s; p[i + 1] = sy + (p[i + 1] - sy) * s; p[i + 2] *= s; } }
    maxY = sy + (maxY - sy) * s;
  }
  const parts = keys.map((k) => ({ geo: bucketGeo(c.B[k]), mat: k }));
  return { parts, topY: Math.max(maxY, potH + 0.01), refs: 0 };
}

export function buildPlant(plantId, opts = {}) {
  const dCm = clamp(Number(opts.potDiameterCm) || 18, 4, 80);
  const hCm = clamp(Number(opts.plantHeightCm) || 50, 5, 300);
  const d = dCm / 100, H = hCm / 100, potH = potHeightFor(dCm);
  const sp = resolveSpecies(plantId, opts.shape);
  const lod = opts.lod != null ? (opts.lod ? 1 : 0) : (hCm < 28 && dCm < 16 ? 0 : 1);
  const color = opts.color || sp.def.color || '#4f7a5a';
  const hang = Math.max(0, Number(opts.hangBelowM) || 0);
  const seed = opts.seed != null ? String(opts.seed) : '';
  const key = [sp.key, dCm.toFixed(1), hCm.toFixed(1), lod, color, hang.toFixed(2), seed].join('|');
  let e = GEO_CACHE.get(key);
  if (!e) { e = buildEntry(sp, d, H, potH, lod, color, hang, plantId + '|' + key); GEO_CACHE.set(key, e); }
  e.refs++;

  const g = new THREE.Group();
  g.name = 'plant:' + sp.key;
  const pot = new THREE.Mesh(potGeo, potMaterial);
  pot.scale.set(d, potH, d); pot.castShadow = true; pot.name = 'pot'; pot.userData.part = 'pot';
  g.add(pot);
  const soil = new THREE.Mesh(soilGeo, soilMaterial);
  const sr = 0.462 * d + (0.47 - 0.462) * d * 0.5;
  soil.scale.set(sr, 1, sr); soil.position.y = potH * POT_SOIL_Y; soil.name = 'soil'; soil.userData.part = 'soil';
  g.add(soil);
  let tris = (potGeo.index ? potGeo.index.count : potGeo.attributes.position.count) / 3 + soilGeo.index.count / 3;
  for (const p of e.parts) {
    const m = new THREE.Mesh(p.geo, MATS[p.mat]);
    m.castShadow = false; m.receiveShadow = false; m.name = p.mat; m.userData.part = p.mat;
    g.add(m);
    tris += p.geo.index.count / 3;
  }
  g.userData.plantModelKey = key;
  g.userData.species = sp.key;
  g.userData.topY = e.topY;          // höchster Punkt (lokal, m über Topfboden)
  g.userData.potHeight = potH;       // Topfrand-Höhe
  g.userData.potRadius = 0.528 * d;  // Außenradius am Rand
  g.userData.triangles = Math.round(tris);
  return g;
}

export function disposePlant(group) {
  if (!group) return;
  const key = group.userData && group.userData.plantModelKey;
  if (key && !group.userData._pmDisposed) {
    group.userData._pmDisposed = true;
    const e = GEO_CACHE.get(key);
    if (e && --e.refs <= 0) { for (const p of e.parts) p.geo.dispose(); GEO_CACHE.delete(key); }
  }
}

export function countTriangles(obj) {
  let n = 0;
  obj.traverse((o) => { if (o.isMesh && o.geometry) n += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
  return Math.round(n);
}
export function clearPlantCache() { for (const e of GEO_CACHE.values()) for (const p of e.parts) p.geo.dispose(); GEO_CACHE.clear(); }
