// CELLULA – Animationen Zellatmung und Fotosynthese.
// Schematischer Schnitt durch die jeweilige Membran mit Proteinkomplexen, Elektronen (gelb) und Protonen (rot).
import * as THREE from 'three';
import {mat, seg, lerp, clamp, fade, label} from './util.js';
import {makeMitochondrion, makeChloroplast} from './cells.js';

export const ENERGY_LEGEND = [{color: '#f4c430', label: 'Elektron (e⁻)'}, {color: '#e0473c', label: 'Proton (H⁺)'}, {color: '#3a3f44', label: 'Kohlenstoffatom'}];

// Punkt entlang eines Polygonzugs, t ∈ [0, 1] nach Länge
function along(pts, t) {
  t = clamp(t);
  let total = 0;
  const L = [];
  for (let i = 1; i < pts.length; i++) { const d = pts[i].distanceTo(pts[i - 1]); L.push(d); total += d; }
  let s = t * total;
  for (let i = 0; i < L.length; i++) {
    if (s <= L[i]) return pts[i].clone().lerp(pts[i + 1], L[i] ? s / L[i] : 0);
    s -= L[i];
  }
  return pts[pts.length - 1].clone();
}
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);

function membrane(group, x0, x1, y, depth = 4.4) {
  const g = new THREE.Group();
  const w = x1 - x0;
  const heads = mat('#e7b47a', {roughness: 0.55});
  const tails = mat('#f6e2bf', {roughness: 0.8});
  for (const dy of [0.27, -0.27]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, depth), heads);
    h.position.set(x0 + w / 2, y + dy, 0);
    g.add(h);
  }
  const t = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, depth * 0.995), tails);
  t.position.set(x0 + w / 2, y, 0);
  g.add(t);
  group.add(g);
  return g;
}

function complex(group, x, y, s, color, name, tagY = 1.4) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), mat(color, {roughness: 0.45}));
  m.scale.set(...s);
  m.position.set(x, y, 0);
  group.add(m);
  if (name) {
    const t = label(name, {size: 0.36, bg: '#33494f'});
    t.position.set(x, y + tagY, 1.6);
    group.add(t);
    m.userData.tag = t;
  }
  return m;
}

function synthase(group, x, y, up = 1) {
  const g = new THREE.Group();
  g.position.set(x, y, 0);
  const rotor = new THREE.Group();
  const cm = mat('#c9a227', {roughness: 0.4});
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2;
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.9, 8), cm);
    c.position.set(Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62);
    rotor.add(c);
  }
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 10), mat('#b5651d'));
  stalk.position.y = up * 1.1;
  rotor.add(stalk);
  g.add(rotor);
  const head = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 12), mat(i % 2 ? '#d98c5f' : '#e9b98f', {roughness: 0.45}));
    s.position.set(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5);
    head.add(s);
  }
  head.position.y = up * 2.25;
  g.add(head);
  const stator = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.4, 8), mat('#8a6d50'));
  stator.position.set(1.05, up * 1.2, 0);
  const a = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.6), mat('#8a6d50'));
  a.position.set(0.95, 0, 0);
  g.add(stator, a);
  group.add(g);
  const t = label('ATP-Synthase', {size: 0.36, bg: '#33494f'});
  t.position.set(x, y + up * 3.3, 1.4);
  group.add(t);
  return {g, rotor, head, tag: t};
}

function particles(group, n, color, r) {
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 10, 8), mat(color, {roughness: 0.35, emissive: color === '#f4c430' ? '#5a4500' : '#000000'}), n);
  m.frustumCulled = false;
  group.add(m);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  return {
    mesh: m,
    set(i, p, scale = 1) { m.setMatrixAt(i, m4.compose(p, q, s.setScalar(Math.max(scale, 0.0001)))); },
    done() { m.instanceMatrix.needsUpdate = true; }
  };
}

// Molekül-Schild, das entlang eines Weges fliegt und dabei ein- und ausgeblendet wird
function token(group, text, bg, size = 0.42) {
  const s = label(text, {size, bg});
  group.add(s);
  return s;
}
function fly(sprite, pts, t, show = 1) {
  sprite.position.copy(along(pts, t));
  fade(sprite, show);
}

// Kohlenstoffgerüst (Kugeln), z. B. Glucose = 6 C
function carbons(group, n) {
  const g = new THREE.Group();
  const m = mat('#3a3f44', {roughness: 0.4});
  const balls = [];
  for (let i = 0; i < n; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), m); g.add(b); balls.push(b); }
  group.add(g);
  return {g, balls};
}
function ring(balls, center, r, count, phase = 0) {
  balls.forEach((b, i) => {
    if (i < count) {
      const a = phase + i / count * Math.PI * 2;
      b.position.set(center.x + Math.cos(a) * r, center.y + Math.sin(a) * r, center.z);
      b.visible = true;
    } else b.visible = false;
  });
}

function overview(group, model, eq) {
  const g = new THREE.Group();
  model.position.set(0, 0.6, 0);
  g.add(model);
  const e = label(eq, {size: 0.62, color: '#223137'});
  e.position.set(0, -4.2, 0);
  g.add(e);
  group.add(g);
  return g;
}

// ── Zellatmung ─────────────────────────────────────────────────────────────────
export function respiration() {
  const group = new THREE.Group();
  const mito = makeMitochondrion(5, 2.1, null);
  mito.rotation.z = Math.PI / 2;
  mito.rotation.x = 0.35;
  const ov = overview(group, mito, 'C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + ATP');

  const sch = new THREE.Group();
  group.add(sch);
  const outer = new THREE.Mesh(new THREE.CapsuleGeometry(5.6, 10, 8, 32), mat('#d0674f', {opacity: 0.16, side: THREE.DoubleSide, roughness: 0.3}));
  outer.rotation.z = Math.PI / 2;
  outer.scale.z = 0.45;
  outer.position.set(6, -0.2, 0);
  outer.renderOrder = 5;
  sch.add(outer);
  membrane(sch, -1.5, 13.5, -2.6);
  [['Zytoplasma', -8.5, 4.6], ['Mitochondrium · Matrix', 6, 4.6], ['Intermembranraum', 4.5, -4.75], ['innere Membran', 14.9, -2.6]].forEach(([t, x, y]) => {
    const s = label(t, {size: 0.42, color: '#55666c', bold: false});
    s.position.set(x, y, 0.4);
    sch.add(s);
  });
  const c1 = complex(sch, 0.4, -2.6, [0.9, 1.2, 1.1], '#6f8fb3', 'I');
  const c2 = complex(sch, 2.6, -2.35, [0.55, 0.7, 0.7], '#8fb3a1', 'II', 1.1);
  const c3 = complex(sch, 5.4, -2.6, [0.85, 1.1, 1], '#6f8fb3', 'III');
  const c4 = complex(sch, 8.4, -2.6, [0.8, 1.05, 1], '#6f8fb3', 'IV');
  const q = complex(sch, 3.9, -2.6, [0.28, 0.28, 0.28], '#f2d36b');
  const cytc = complex(sch, 6.9, -3.4, [0.3, 0.3, 0.3], '#d97f6a');
  const atps = synthase(sch, 11.6, -2.6, 1);

  // Kohlenstoff: Glucose → 2 Pyruvat → Acetyl
  const glc = carbons(sch, 6), pyrA = carbons(sch, 3), pyrB = carbons(sch, 3);
  const cyc = carbons(sch, 6);
  const tGlc = token(sch, 'Glucose', '#3a3f44', 0.4);
  const tPyr = [token(sch, 'Pyruvat', '#5d6469', 0.36), token(sch, 'Pyruvat', '#5d6469', 0.36)];
  const tAc = token(sch, 'Acetyl-CoA', '#5d6469', 0.36);
  const tCit = label('Citratzyklus', {size: 0.48, color: '#7a4a2a'});
  tCit.position.set(6, 1.5, 0);
  sch.add(tCit);
  const ringC = V(6, 1.5);
  const cycleRing = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.05, 8, 80), mat('#c99a6a'));
  cycleRing.position.copy(ringC);
  sch.add(cycleRing);
  const stations = [];
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 2 - i / 8 * Math.PI * 2;
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), mat('#a8653a'));
    s.position.set(ringC.x + Math.cos(a) * 2.2, ringC.y + Math.sin(a) * 2.2, 0);
    sch.add(s);
    stations.push(s.position.clone());
  }
  const ATP = '#c9a227', NADH = '#5a7fb0', CO2 = '#7d8a8f';
  const glyTok = [token(sch, 'ATP', ATP), token(sch, 'ATP', ATP), token(sch, 'NADH', NADH), token(sch, 'NADH', NADH)];
  const decTok = [token(sch, 'CO₂', CO2), token(sch, 'NADH', NADH)];
  const cycTok = [['NADH', NADH, 2], ['CO₂', CO2, 3], ['NADH', NADH, 3.6], ['CO₂', CO2, 4], ['ATP', ATP, 4.6], ['FADH₂', '#7f6bb0', 5.6], ['NADH', NADH, 7]].map(([t, c, st]) => ({s: token(sch, t, c, 0.36), st}));
  const eTok = token(sch, 'NADH', NADH, 0.38), oTok = token(sch, 'O₂', '#6aa2c8', 0.38), wTok = token(sch, 'H₂O', '#6aa2c8', 0.38);
  const atpOut = [0, 1, 2, 3].map(() => token(sch, 'ATP', ATP, 0.38));
  const bal = [label('Glykolyse: 2 ATP', {size: 0.46, bg: '#33494f'}), label('Citratzyklus: 2 ATP', {size: 0.46, bg: '#33494f'}), label('Atmungskette: ≈ 26–28 ATP', {size: 0.46, bg: '#33494f'}), label('≈ 30–32 ATP pro Glucose', {size: 0.75, bg: '#a8812a'})];
  bal.forEach((b, i) => { b.position.set(i < 3 ? [-3.5, 3.5, 10.5][i] : 3.5, i < 3 ? 5.9 : 7.3, 1.5); sch.add(b); });

  const el = particles(sch, 12, '#f4c430', 0.13);
  const pr = particles(sch, 60, '#e0473c', 0.12);
  const ePath = [V(0.4, -1.4), V(0.4, -2.6), V(3.9, -2.6), V(5.4, -2.6), V(6.9, -3.4), V(8.4, -2.6), V(8.6, -1.5)];
  const pumps = [0.4, 5.4, 8.4];
  // feste Lagen der Protonen im Intermembranraum
  const ims = [];
  for (let i = 0; i < 40; i++) ims.push(V(-0.8 + (i * 7.31 % 13.5), -3.35 - (i * 3.7 % 1.7), -1.6 + (i * 2.9 % 3.2)));

  function update(T, time) {
    const show = seg(T, 0.85, 1.15);
    fade(ov, 1 - show);
    ov.rotation.y = time * 0.15;
    fade(sch, show);
    if (show < 0.01) return;
    // Glykolyse
    const split = seg(T, 1.2, 1.7), moveIn = seg(T, 2, 2.5), decarb = seg(T, 2.45, 2.8);
    const gC = V(-8, 1);
    ring(glc.balls, gC, 0.62, 6, Math.PI / 6);
    glc.g.visible = split < 0.5 && T < 2;
    fade(glc.g, 1 - seg(T, 1.2, 1.35));
    tGlc.position.set(-8, 2.2, 0.5);
    fade(tGlc, 1 - seg(T, 1.15, 1.3));
    const pyrPos = [V(-8, lerp(1, 2.3, split)), V(-8, lerp(1, -0.3, split))].map((p, k) => p.lerp(V(1.2, k ? -0.2 : 1.8), moveIn));
    [pyrA, pyrB].forEach((py, k) => {
      const n = decarb > 0.5 ? 2 : 3;
      py.balls.forEach((b, i) => { b.position.set(pyrPos[k].x + (i - 1) * 0.5, pyrPos[k].y, 0); b.visible = i < n; });
      fade(py.g, seg(T, 1.25, 1.45) * (1 - seg(T, 3.05, 3.3)));
      tPyr[k].position.copy(pyrPos[k]).add(V(0, 0.65, 0.4));
      fade(tPyr[k], seg(T, 1.35, 1.55) * (1 - seg(T, 2.45, 2.6)));
    });
    tAc.position.set(1.2, 2.6, 0.4);
    fade(tAc, seg(T, 2.6, 2.8) * (1 - seg(T, 3.05, 3.2)));
    glyTok.forEach((t, i) => fly(t, [V(-8, 1), V(-6.5 + (i % 2) * 1.9, i < 2 ? 3 : -1)], seg(T, 1.5 + i * 0.06, 1.8 + i * 0.06), seg(T, 1.5, 1.6) * (1 - seg(T, 2.85, 3))));
    fly(decTok[0], [V(1.2, 1.8), V(2.5, 3.6)], seg(T, 2.45, 2.9), seg(T, 2.45, 2.55) * (1 - seg(T, 2.85, 3)));
    fly(decTok[1], [V(1.2, 0), V(-0.5, -0.8)], seg(T, 2.5, 2.9), seg(T, 2.5, 2.6) * (1 - seg(T, 2.85, 3)));
    // Citratzyklus: zwei Umläufe
    const u3 = clamp(T - 3);
    const turn = u3 * 2, f = turn % 1;
    const a = Math.PI / 2 - f * Math.PI * 2;
    const n = f < 3 / 8 ? 6 : f < 4 / 8 ? 5 : 4;
    const cp = V(ringC.x + Math.cos(a) * 2.2, ringC.y + Math.sin(a) * 2.2, 0.3);
    ring(cyc.balls, cp, 0.42, n, time);
    fade(cyc.g, seg(T, 3, 3.1) * (1 - seg(T, 3.95, 4.05)));
    fade(tCit, seg(T, 2.9, 3.1));
    fade(cycleRing, seg(T, 2.9, 3.1));
    cycTok.forEach(({s, st}) => {
      const local = (turn % 1) * 8 - st;
      const p = stations[Math.floor(st) % 8];
      const out = p.clone().sub(ringC).setLength(1.6).add(p);
      fly(s, [p, out], seg(local, 0, 1), T >= 3 && T < 4 && local > 0 && local < 1.4 ? 1 - seg(local, 1, 1.4) : 0);
    });
    // Atmungskette
    const u4 = seg(T, 4, 4.15);
    const chainOn = u4;
    for (let i = 0; i < 12; i++) {
      const ph = (time * 0.18 + i / 12) % 1;
      el.set(i, along(ePath, ph), chainOn);
    }
    el.done();
    fade(eTok, chainOn * (1 - seg(T, 5.9, 6)));
    eTok.position.set(-0.8, -0.6, 0.6);
    fade(oTok, chainOn); oTok.position.set(9.4, -0.9, 0.6);
    fade(wTok, chainOn); wTok.position.set(9.8, 0.3, 0.6);
    [c1, c2, c3, c4, q, cytc].forEach(c => { fade(c, seg(T, 3.9, 4.1)); if (c.userData.tag) fade(c.userData.tag, seg(T, 3.9, 4.1)); });
    // gepumpte und zurückströmende Protonen
    const pool = Math.round(lerp(0, 40, seg(T, 4, 4.8)));
    let k = 0;
    for (let i = 0; i < 40; i++) pr.set(k++, ims[i], i < pool ? 1 : 0);
    for (let i = 0; i < 12; i++) {
      const ph = (time * 0.35 + i / 12) % 1;
      const x = pumps[i % 3];
      pr.set(k++, along([V(x - 0.3, -0.9), V(x - 0.3, -3.9)], ph), chainOn * (T < 6.5 ? 1 : 0.6));
    }
    const flow = seg(T, 5, 5.2);
    for (let i = 0; i < 8; i++) {
      const ph = (time * 0.5 + i / 8) % 1;
      pr.set(k++, along([V(11, -4.2), V(11.0, -2.6), V(11.6, -1.2), V(12.6, 0.4)], ph), flow);
    }
    pr.done();
    atps.rotor.rotation.y = time * 6 * flow;
    fade(atps.g, seg(T, 3.9, 4.1)); fade(atps.tag, seg(T, 3.9, 4.1));
    atpOut.forEach((t, i) => {
      const ph = (time * 0.3 + i / 4) % 1;
      fly(t, [V(11.6, 0), V(12.8 + (i % 2), 3.5)], ph, flow * (1 - seg(ph, 0.8, 1)));
    });
    bal.forEach((b, i) => fade(b, seg(T, 6.05 + i * 0.12, 6.25 + i * 0.12)));
  }
  function view(T) {
    return V(0, 0, 0).lerp(V(-5, 1, 0), seg(T, 0.9, 1.3)).lerp(V(1.5, 0.5, 0), seg(T, 1.9, 2.4)).lerp(V(5.5, -0.5, 0), seg(T, 3.8, 4.2)).lerp(V(3.5, 0, 0), seg(T, 5.9, 6.2));
  }
  return {group, steps: 7, update, view, legend: ENERGY_LEGEND, viewOffset: [0, 3, 30]};
}

// ── Fotosynthese ───────────────────────────────────────────────────────────────
export function photosynthesis() {
  const group = new THREE.Group();
  const chl = makeChloroplast(null, 2.6);
  chl.rotation.x = 0.5;
  const ov = overview(group, chl, '6 CO₂ + 6 H₂O + Licht → C₆H₁₂O₆ + 6 O₂');

  const sch = new THREE.Group();
  group.add(sch);
  membrane(sch, -10, 10, 0);
  membrane(sch, -10, 10, -3.8);
  const lumen = new THREE.Mesh(new THREE.BoxGeometry(20, 3.2, 4.3), mat('#cfe6c4', {opacity: 0.25}));
  lumen.position.set(0, -1.9, 0);
  sch.add(lumen);
  [['Stroma', -7.5, 5.2], ['Thylakoidinnenraum (Lumen)', -3.5, -2.1], ['Thylakoidmembran', 12, 0]].forEach(([t, x, y]) => {
    const s = label(t, {size: 0.42, color: '#55666c', bold: false});
    s.position.set(x, y, 0.4);
    sch.add(s);
  });
  const ps2 = complex(sch, -7, 0, [1.2, 1.25, 1.2], '#3f8d3c', 'Fotosystem II');
  const pq = complex(sch, -5, 0, [0.28, 0.28, 0.28], '#f2d36b');
  const b6f = complex(sch, -3, 0, [0.85, 1.1, 1], '#6f8fb3', 'Cytochrom b₆f');
  const pc = complex(sch, -1, -0.95, [0.3, 0.3, 0.3], '#5c86c9');
  const ps1 = complex(sch, 1.2, 0, [1.1, 1.2, 1.1], '#2f7a31', 'Fotosystem I');
  const fnr = complex(sch, 3.7, 0.95, [0.5, 0.4, 0.5], '#7aa36b', 'NADP⁺-Reduktase', 1.0);
  const atps = synthase(sch, 7.5, 0, 1);

  // Licht als Wellen
  const waves = [0, 1].map(() => {
    const pts = [];
    for (let i = 0; i <= 60; i++) pts.push(V(i / 60 * 3, Math.sin(i / 60 * Math.PI * 8) * 0.18, 0));
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.05, 6), mat('#f4c430', {emissive: '#806000'}));
    sch.add(m);
    return m;
  });
  const lightTag = label('Licht', {size: 0.42, color: '#a8812a'});
  sch.add(lightTag);

  const ATP = '#c9a227', NADPH = '#5a7fb0', O2 = '#6aa2c8', CO2 = '#7d8a8f';
  const h2o = token(sch, '2 H₂O', O2, 0.4), o2 = token(sch, 'O₂', O2, 0.4);
  const nadph = [0, 1, 2].map(() => token(sch, 'NADPH', NADPH, 0.38));
  const atp = [0, 1, 2, 3].map(() => token(sch, 'ATP', ATP, 0.38));
  const el = particles(sch, 12, '#f4c430', 0.13);
  const pr = particles(sch, 64, '#e0473c', 0.12);
  const ePath = [V(-7, -0.9), V(-7, 0.2), V(-5, 0), V(-3, 0), V(-1, -0.95), V(1.2, -0.3), V(1.2, 0.6), V(3.7, 0.95)];
  const lum = [];
  for (let i = 0; i < 44; i++) lum.push(V(-9.5 + (i * 7.31 % 19), -0.9 - (i * 3.7 % 2), -1.6 + (i * 2.9 % 3.2)));

  // Calvin-Zyklus
  const cc = V(1.5, 5);
  const cRing = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.05, 8, 80), mat('#7aa36b'));
  cRing.position.copy(cc);
  sch.add(cRing);
  const cTags = [['Calvin-Zyklus', 0, 0, 0.48, '#2f7a31'], ['1 Fixierung (RuBisCO)', 0, 2.75, 0.36, '#55666c'], ['2 Reduktion', 3.1, -1.1, 0.36, '#55666c'], ['3 Regeneration', -3.2, -1.1, 0.36, '#55666c']].map(([t, x, y, s, c]) => {
    const l = label(t, {size: s, color: c});
    l.position.set(cc.x + x, cc.y + y, 0.3);
    sch.add(l);
    return l;
  });
  const co2 = [0, 1, 2].map(() => token(sch, 'CO₂', CO2, 0.36));
  const g3p = token(sch, 'G3P → Glucose', '#3a3f44', 0.4);
  const cyc = carbons(sch, 6);

  function update(T, time) {
    const show = seg(T, 0.85, 1.15);
    fade(ov, 1 - show);
    ov.rotation.y = time * 0.15;
    fade(sch, show);
    if (show < 0.01) return;
    // Licht
    const light = seg(T, 1, 1.2);
    waves.forEach((w, i) => {
      const ph = (time * 0.6 + i * 0.5) % 1;
      const target = i ? ps1.position : ps2.position;
      const start = target.clone().add(V(-3.2, 4.2, 0));
      w.position.copy(start.clone().lerp(target.clone().add(V(-0.6, 0.9, 0)), ph));
      w.rotation.z = -Math.atan2(4.2, 3.2) + 0.0;
      fade(w, light * (i ? seg(T, 3, 3.2) : 1) * (1 - seg(ph, 0.85, 1)));
    });
    lightTag.position.set(-9.5, 4.2, 0.4);
    fade(lightTag, light);
    // Fotolyse
    const lys = seg(T, 2, 2.2);
    fly(h2o, [V(-8.6, -2.4), V(-7.4, -1.2)], seg((time * 0.3) % 1, 0, 0.7), lys * (1 - seg((time * 0.3) % 1, 0.7, 0.85)));
    fly(o2, [V(-7, -1.4), V(-9.2, -3.2)], seg((time * 0.3 + 0.4) % 1, 0, 0.8), lys * (1 - seg((time * 0.3 + 0.4) % 1, 0.8, 1)));
    // Elektronen
    const chain = seg(T, 3, 3.2);
    for (let i = 0; i < 12; i++) {
      const ph = (time * 0.18 + i / 12) % 1;
      const before = ph < 0.62;
      el.set(i, along(ePath, ph), (light * (T < 3 ? (ph < 0.18 ? 1 : 0) : 1)) * (before || chain ? 1 : 0));
    }
    el.done();
    nadph.forEach((t, i) => { const ph = (time * 0.25 + i / 3) % 1; fly(t, [V(3.9, 1.6), V(4.2 + i * 0.3, 3.2)], ph, chain * (1 - seg(ph, 0.75, 1)) * (T < 5 ? 1 : 0.3)); });
    // Protonen im Lumen
    const pool = Math.round(lerp(0, 44, seg(T, 2, 3.8)));
    let k = 0;
    for (let i = 0; i < 44; i++) pr.set(k++, lum[i], i < pool ? 1 : 0);
    for (let i = 0; i < 10; i++) {
      const ph = (time * 0.35 + i / 10) % 1;
      pr.set(k++, along([V(-3.3, 1.2), V(-3.3, -1.3)], ph), chain);
    }
    const flow = seg(T, 4, 4.2);
    for (let i = 0; i < 10; i++) {
      const ph = (time * 0.5 + i / 10) % 1;
      pr.set(k++, along([V(7, -1.6), V(7, 0), V(7.6, 1.4), V(8.6, 2.8)], ph), flow);
    }
    pr.done();
    atps.rotor.rotation.y = time * 6 * flow;
    atp.forEach((t, i) => { const ph = (time * 0.3 + i / 4) % 1; fly(t, [V(7.5, 2.6), V(6 - i * 0.4, 4.4)], ph, flow * (1 - seg(ph, 0.8, 1)) * (T < 5 ? 1 : 0.3)); });
    // Calvin-Zyklus
    const calvin = seg(T, 5, 5.2);
    fade(cRing, calvin); cTags.forEach(t => fade(t, calvin));
    const f = (time * 0.12) % 1;
    const a = Math.PI / 2 - f * Math.PI * 2;
    ring(cyc.balls, V(cc.x + Math.cos(a) * 2.1, cc.y + Math.sin(a) * 2.1, 0.3), 0.4, 5 + (f < 0.1 ? 1 : 0) - (f > 0.55 && f < 0.7 ? 1 : 0), time);
    fade(cyc.g, calvin);
    co2.forEach((t, i) => { const ph = (time * 0.2 + i / 3) % 1; fly(t, [V(cc.x - 3.5 + i * 0.6, cc.y + 4), V(cc.x, cc.y + 2.2)], ph, calvin * (1 - seg(ph, 0.8, 1))); });
    const ph = (time * 0.15) % 1;
    fly(g3p, [V(cc.x + 1.9, cc.y - 1), V(cc.x + 5.5, cc.y + 1.5)], ph, calvin * (1 - seg(ph, 0.85, 1)));
    // Feste Teile einblenden
    [ps2, pq, b6f, pc, ps1, fnr].forEach(c => { fade(c, show); if (c.userData.tag) fade(c.userData.tag, show); });
  }
  function view(T) {
    return V(0, 0, 0).lerp(V(-5.5, 0.5, 0), seg(T, 0.9, 1.3)).lerp(V(-2, 0.5, 0), seg(T, 2.8, 3.2)).lerp(V(3.5, 0.5, 0), seg(T, 3.8, 4.2)).lerp(V(2, 2.6, 0), seg(T, 4.8, 5.2));
  }
  return {group, steps: 6, update, view, legend: ENERGY_LEGEND, viewOffset: [0, 3, 29]};
}
