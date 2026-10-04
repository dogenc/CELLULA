// CELLULA – schematische 3D-Modelle einer Tier- und einer Pflanzenzelle.
// Alle Formen werden im Browser erzeugt (keine externen Daten). Maßstab und Farben sind schematisch.
import * as THREE from 'three';
import {rng, mat, randomInSphere, randomUnit, wobble, curveTube} from './util.js';
import {organelles} from './knowledge.js';

const C = k => organelles[k].color;

// ── Bausteine, die auch die Abläufe verwenden ─────────────────────────────────

export function makeMitochondrion(len = 2.6, rad = 0.75, part = 'mitochondrium') {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.CapsuleGeometry(rad, len, 8, 24), mat(C('mitochondrium'), {opacity: 0.3, side: THREE.DoubleSide, roughness: 0.4}));
  outer.renderOrder = 2;
  const inner = new THREE.Mesh(new THREE.CapsuleGeometry(rad * 0.86, len * 0.96, 8, 20), mat('#f2b9a3', {opacity: 0.3, roughness: 0.6}));
  g.add(inner, outer);
  const cm = mat('#b8483a', {roughness: 0.5, side: THREE.DoubleSide});
  const n = Math.round(len * 2.3);
  for (let i = 0; i < n; i++) {
    const y = -len / 2 + (i + 0.5) * len / n;
    const side = i % 2 ? 1 : -1;
    const points=[];
    for(let j=0;j<=24;j++){
      const t=j/24, x=side*rad*(.78-1.48*Math.sin(Math.PI*t));
      points.push(new THREE.Vector3(x,y+rad*.13*Math.sin(2*Math.PI*t),rad*.55*Math.cos(Math.PI*t)));
    }
    const crista=curveTube(points,rad*.045,cm,4);
    // A thin membrane spans each folded rim; both faces remain visible.
    const vertices=[];
    for(let j=0;j<points.length-1;j++){
      const a=points[j],b=points[j+1],c=a.clone().add(new THREE.Vector3(0,rad*.10,0)),d=b.clone().add(new THREE.Vector3(0,rad*.10,0));
      for(const v of [a,b,c,b,d,c]) vertices.push(v.x,v.y,v.z);
    }
    const folded=new THREE.BufferGeometry();folded.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));folded.computeVertexNormals();
    g.add(new THREE.Mesh(folded,cm));
    g.add(crista);
  }
  g.traverse(o => { if (o.isMesh) o.userData.part = part; });
  return g;
}

export function makeChloroplast(part = 'chloroplast', scale = 1) {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), mat(C('chloroplast'), {opacity: 0.45, side: THREE.DoubleSide, roughness: 0.35}));
  outer.scale.set(1.7, 0.72, 0.95);
  outer.renderOrder = 2;
  g.add(outer);
  const stroma = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat('#bfe0a6', {opacity: 0.45}));
  stroma.scale.set(1.55, 0.62, 0.84);
  g.add(stroma);
  const tm = mat('#2f7a31', {roughness: 0.45});
  const disc = new THREE.CylinderGeometry(0.26, 0.26, 0.055, 18);
  const spots = [[-0.95, 0.1], [-0.35, -0.3], [0.25, 0.25], [0.85, -0.1], [-0.4, 0.38], [0.4, -0.38]];
  const lam = mat('#3f8d3c', {roughness: 0.5});
  spots.forEach(([x, z], k) => {
    const stack = 4 + (k % 3);
    for (let i = 0; i < stack; i++) {
      const d = new THREE.Mesh(disc, tm);
      d.position.set(x, -0.2 + i * 0.085 + (k % 2) * 0.04, z);
      g.add(d);
    }
    if (k) {
      const [px, pz] = spots[k - 1];
      const l = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(x - px, z - pz), 0.03, 0.12), lam);
      l.position.set((x + px) / 2, -0.05, (z + pz) / 2);
      l.rotation.y = -Math.atan2(z - pz, x - px);
      g.add(l);
    }
  });
  g.scale.setScalar(scale);
  g.traverse(o => { if (o.isMesh) o.userData.part = part; });
  return g;
}

function makeGolgi(seed) {
  const r = rng(seed);
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const geo = new THREE.SphereGeometry(1, 40, 12);
    const p = geo.attributes.position;
    const sx = 2.3 - i * 0.22, sz = 1.45 - i * 0.12;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k) * sx, z = p.getZ(k) * sz;
      p.setXYZ(k, x, p.getY(k) * 0.15 + 0.2 * (x * x + z * z) / 2.2, z);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat(i % 2 ? '#e6bd5c' : C('golgi'), {roughness: 0.45}));
    m.position.y = i * 0.4;
    m.userData.part = 'golgi';
    g.add(m);
  }
  // Vesikel, die sich an den Rändern abschnüren
  const vm = mat(C('vesikel'), {roughness: 0.4});
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2, y = r() * 1.8;
    const v = new THREE.Mesh(new THREE.SphereGeometry(0.17 + r() * 0.12, 14, 10), vm);
    v.position.set(Math.cos(a) * (2.2 - y * 0.2), y + 0.3, Math.sin(a) * (1.4 - y * 0.1));
    v.userData.part = 'vesikel';
    g.add(v);
  }
  return g;
}

function makeNucleus(R, seed, cutaway = true) {
  const r = rng(seed);
  const g = new THREE.Group();
  // Viertel vorne offen, damit Nukleolus und Chromatin sichtbar sind
  const env = new THREE.Mesh(
    cutaway ? new THREE.SphereGeometry(R, 64, 40, Math.PI * 0.75, Math.PI * 1.5) : new THREE.SphereGeometry(R, 64, 40),
    mat(C('zellkern'), {side: THREE.DoubleSide, roughness: 0.5}));
  const envIn = new THREE.Mesh(
    cutaway ? new THREE.SphereGeometry(R * 0.95, 48, 32, Math.PI * 0.75, Math.PI * 1.5) : new THREE.SphereGeometry(R * 0.95, 48, 32),
    mat('#b9b0dc', {side: THREE.DoubleSide, roughness: 0.7}));
  g.add(env, envIn);
  // Kernporen
  const poreGeo = new THREE.TorusGeometry(0.16, 0.06, 6, 14);
  const pores = new THREE.InstancedMesh(poreGeo, mat('#453a7a'), 70);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), z = new THREE.Vector3(0, 0, 1);
  let k = 0;
  while (k < 70) {
    const n = randomUnit(r);
    const phi = Math.atan2(n.z, -n.x);
    const ph = (phi + Math.PI * 2) % (Math.PI * 2);
    if (cutaway && ph > Math.PI * 0.25 && ph < Math.PI * 0.75) continue;
    q.setFromUnitVectors(z, n);
    m4.compose(n.clone().multiplyScalar(R * 1.005), q, new THREE.Vector3(1, 1, 1));
    pores.setMatrixAt(k++, m4);
  }
  g.add(pores);
  // Chromatin
  const cm = mat('#9b8fd0', {roughness: 0.6});
  for (let i = 0; i < 9; i++) {
    const pts = [];
    let p = randomInSphere(r, R * 0.6);
    for (let j = 0; j < 14; j++) {
      p = p.clone().add(randomUnit(r).multiplyScalar(0.55));
      if (p.length() > R * 0.82) p.multiplyScalar(0.8);
      pts.push(p);
    }
    g.add(curveTube(pts, 0.07, cm, 6));
  }
  g.traverse(o => { if (o.isMesh) o.userData.part = 'zellkern'; });
  const nuc = new THREE.Mesh(new THREE.SphereGeometry(R * 0.33, 32, 20), mat(C('nukleolus'), {roughness: 0.7}));
  nuc.position.set(R * 0.15, R * 0.12, R * 0.22);
  nuc.userData.part = 'nukleolus';
  g.add(nuc);
  return g;
}

// Gefaltete ER-Zisternen um den Kern, optional mit Ribosomen besetzt.
function makeER(Rn, rough, seed, phiStart, phiLen, ribosomes = 500) {
  const r = rng(seed);
  const g = new THREE.Group();
  const sheets = [];
  for (let i = 0; i < 3; i++) {
    const R = Rn + 0.75 + i * 0.6;
    const geo = new THREE.SphereGeometry(R, 72, 28, phiStart + i * 0.12, phiLen - i * 0.25, 0.55 + i * 0.1, 2.0 - i * 0.15);
    const p = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let k = 0; k < p.count; k++) {
      v.fromBufferAttribute(p, k);
      const n = v.clone().normalize();
      const f = 1 + 0.06 * Math.sin(Math.atan2(n.z, n.x) * 9 + i) * Math.sin(n.y * 7 + i * 2);
      v.multiplyScalar(f);
      p.setXYZ(k, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat(rough ? C('rer') : C('ser'), {side: THREE.DoubleSide, roughness: 0.5}));
    m.userData.part = rough ? 'rer' : 'ser';
    sheets.push({geo, R});
    g.add(m);
    const edgeMat=mat(rough?'#8477b4':'#81bca2',{roughness:.55});
    const columns=73,rows=29;
    for(const row of [0,rows-1]){
      const points=[];for(let col=0;col<columns;col++)points.push(new THREE.Vector3().fromBufferAttribute(p,row*columns+col));
      const rim=curveTube(points,.045,edgeMat,4);rim.userData.part=rough?'rer':'ser';g.add(rim);
    }
  }
  if (rough && ribosomes) {
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 6, 5), mat(C('ribosom'), {roughness: 0.7}), ribosomes);
    const m4 = new THREE.Matrix4(), v = new THREE.Vector3();
    for (let k = 0; k < ribosomes; k++) {
      const s = sheets[k % 3];
      const pa = s.geo.attributes.position;
      v.fromBufferAttribute(pa, Math.floor(r() * pa.count));
      v.multiplyScalar(1 + 0.08 / s.R * (r() < 0.5 ? 1 : -1));
      im.setMatrixAt(k, m4.makeTranslation(v.x, v.y, v.z));
    }
    im.userData.part = 'ribosom';
    g.add(im);
  }
  return g;
}

function makeSmoothER(seed, R = 2) {
  const r = rng(seed);
  const g = new THREE.Group();
  const m = mat(C('ser'), {roughness: 0.45});
  for (let i = 0; i < 9; i++) {
    const pts = [];
    let p = randomInSphere(r, R * 0.6);
    for (let j = 0; j < 6; j++) {
      p = p.clone().add(randomUnit(r).multiplyScalar(0.9));
      if (p.length() > R) p.multiplyScalar(0.7);
      pts.push(p);
    }
    const t = curveTube(pts, 0.16, m, 8);
    t.userData.part = 'ser';
    g.add(t);
  }
  return g;
}

function makeCentrosome() {
  const g = new THREE.Group();
  const m = mat(C('zentrosom'), {roughness: 0.4});
  const tube = new THREE.CylinderGeometry(0.035, 0.035, 0.8, 6);
  [0, 1].forEach(j => {
    const c = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2;
      for (let t = 0; t < 3; t++) {
        const rr = 0.24 + t * 0.06;
        const mesh = new THREE.Mesh(tube, m);
        mesh.position.set(Math.cos(a + t * 0.18) * rr, 0, Math.sin(a + t * 0.18) * rr);
        c.add(mesh);
      }
    }
    if (j) { c.rotation.z = Math.PI / 2; c.position.set(0.55, 0.45, 0); }
    g.add(c);
  });
  g.traverse(o => { if (o.isMesh) o.userData.part = 'zentrosom'; });
  return g;
}

function scatterInstanced(geo, material, n, accept, r, part) {
  const im = new THREE.InstancedMesh(geo, material, n);
  const m4 = new THREE.Matrix4();
  let k = 0, guard = 0;
  while (k < n && guard++ < n * 200) {
    const p = accept(r);
    if (p) im.setMatrixAt(k++, m4.makeTranslation(p.x, p.y, p.z));
  }
  im.count = k;
  im.userData.part = part;
  return im;
}

// Membranhülle als hintere Hälfte und aufklappbarer vorderer Deckel.
function makeShell(shape, layers, hingeX) {
  const back = new THREE.Group(), lidPivot = new THREE.Group(), lid = new THREE.Group();
  lidPivot.position.x = hingeX;
  lid.position.x = -hingeX;
  lidPivot.add(lid);
  for (const L of layers) {
    for (const front of [false, true]) {
      const geo = new THREE.SphereGeometry(1, 96, 64, front ? 0 : Math.PI, Math.PI);
      const p = geo.attributes.position, v = new THREE.Vector3();
      for (let k = 0; k < p.count; k++) {
        v.fromBufferAttribute(p, k);
        shape(v, L.scale);
        p.setXYZ(k, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, mat(L.color, {side: THREE.DoubleSide, roughness: L.roughness ?? 0.6, opacity: L.opacity}));
      m.userData.part = L.part;
      m.renderOrder = L.opacity < 1 ? 3 : 0;
      (front ? lid : back).add(m);
    }
  }
  return {back, lidPivot};
}

// ── Tierzelle ──────────────────────────────────────────────────────────────────

function animalCell() {
  const r = rng(7);
  const root = new THREE.Group();
  const pieces = [];
  const add = (obj, dir, anchorPart) => {
    root.add(obj);
    obj.userData.home = obj.position.clone();
    obj.userData.dir = dir ? dir.clone().normalize() : obj.position.clone().normalize();
    pieces.push(obj);
    if (anchorPart) obj.userData.anchorFor = anchorPart;
    return obj;
  };
  const R = 10;
  const shape = (v, s) => { const n = v.clone().normalize(); v.copy(n.multiplyScalar(R * s * wobble(n, 0.03))); };
  const shell = makeShell(shape, [
    {scale: 1, color: '#e2a965', part: 'membran', roughness: 0.5},
    {scale: 0.975, color: '#f6e3c8', part: 'membran', roughness: 0.8}
  ], -R);

  const nucC = new THREE.Vector3(-1, 0.6, -0.5);
  const nucleus = makeNucleus(3.3, 11);
  nucleus.position.copy(nucC);
  add(nucleus, new THREE.Vector3(-0.4, 1, 0.3), 'zellkern');

  const rer = makeER(3.3, true, 12, Math.PI * 0.95, Math.PI * 1.15, 650);
  rer.position.copy(nucC);
  add(rer, new THREE.Vector3(0.2, -1, -0.6), 'rer');
  rer.userData.anchorPoint = new THREE.Vector3(3.4, -2.4, -1.8);

  const ser = makeSmoothER(13, 1.9);
  ser.position.set(-5.2, -3.4, -1.8);
  add(ser, null, 'ser');

  const golgi = makeGolgi(14);
  golgi.position.set(4.3, -2.2, 1.2);
  golgi.rotation.set(0.3, 0.6, 1.0);
  add(golgi, null, 'golgi');

  const mitoAnchor = [];
  const mitos = [];
  for (let i = 0, guard = 0; i < 8 && guard < 500; guard++) {
    const p = randomInSphere(r, 8.1);
    if (p.distanceTo(nucC) < 5.6 || p.distanceTo(golgi.position) < 3 || mitos.some(m => m.distanceTo(p) < 3)) continue;
    const m = makeMitochondrion(1.8 + r() * 1.2, 0.62 + r() * 0.15);
    m.position.copy(p);
    m.rotation.set(r() * 3, r() * 3, r() * 3);
    add(m);
    mitos.push(p);
    if (!i) m.userData.anchorFor = 'mitochondrium';
    mitoAnchor.push(m);
    i++;
  }

  const lysos = [];
  for (let i = 0, guard = 0; i < 6 && guard < 500; guard++) {
    const p = randomInSphere(r, 8.4);
    if (p.distanceTo(nucC) < 5 || mitos.some(m => m.distanceTo(p) < 2.2) || lysos.some(m => m.distanceTo(p) < 2)) continue;
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.5 + r() * 0.25, 20, 14), mat(C('lysosom'), {roughness: 0.35}));
    l.position.copy(p);
    l.userData.part = 'lysosom';
    add(l, null, i ? null : 'lysosom');
    lysos.push(p);
    i++;
  }

  const centro = makeCentrosome();
  centro.position.set(2.6, 3.4, 1.6);
  centro.rotation.set(0.5, 0.3, 0.2);
  add(centro, null, 'zentrosom');

  // Mikrotubuli strahlen vom Zentrosom aus
  const cyto = new THREE.Group();
  const cm = mat(C('zytoskelett'), {opacity: 0.75, roughness: 0.4});
  for (let i = 0; i < 34; i++) {
    const end = randomUnit(r).multiplyScalar(R * 0.93);
    const start = centro.position.clone();
    const mid = start.clone().lerp(end, 0.5).add(randomUnit(r).multiplyScalar(1.2));
    if (mid.distanceTo(nucC) < 3.8) mid.add(mid.clone().sub(nucC).setLength(2.5));
    const t = curveTube([start, mid, end], 0.035, cm, 10);
    t.userData.part = 'zytoskelett';
    cyto.add(t);
  }
  root.add(cyto);
  cyto.userData.anchorFor = 'zytoskelett';
  cyto.userData.anchorPoint = new THREE.Vector3(5.5, 5.5, 2);

  // Freie Ribosomen und Vesikel
  const ribo = scatterInstanced(new THREE.SphereGeometry(0.085, 6, 5), mat(C('ribosom'), {roughness: 0.7}), 420, rr => {
    const p = randomInSphere(rr, 9.2);
    return p.distanceTo(nucC) > 4 && !mitos.some(m => m.distanceTo(p) < 1.5) ? p : null;
  }, r, 'ribosom');
  root.add(ribo);
  ribo.userData.anchorFor = 'ribosom';
  ribo.userData.anchorPoint = new THREE.Vector3(3.5, 2.2, 6.5);

  const ves = scatterInstanced(new THREE.SphereGeometry(0.28, 14, 10), mat(C('vesikel'), {roughness: 0.35}), 16, rr => {
    const p = randomInSphere(rr, 9);
    return p.length() > 6.5 && p.distanceTo(nucC) > 5 ? p : null;
  }, r, 'vesikel');
  add(ves, new THREE.Vector3(0.3, -0.6, 0.6));
  ves.userData.anchorFor = 'vesikel';
  ves.userData.anchorPoint = new THREE.Vector3(6, -5.5, 5);

  return {root, shell, pieces, R, parts: ['membran', 'zellkern', 'nukleolus', 'rer', 'ser', 'golgi', 'mitochondrium', 'ribosom', 'lysosom', 'zentrosom', 'zytoskelett', 'vesikel']};
}

// ── Pflanzenzelle ──────────────────────────────────────────────────────────────

function plantCell() {
  const r = rng(21);
  const root = new THREE.Group();
  const pieces = [];
  const add = (obj, dir, anchorPart) => {
    root.add(obj);
    obj.userData.home = obj.position.clone();
    obj.userData.dir = dir ? dir.clone().normalize() : obj.position.clone().normalize();
    pieces.push(obj);
    if (anchorPart) obj.userData.anchorFor = anchorPart;
    return obj;
  };
  const H = new THREE.Vector3(12.5, 8.2, 8.2);
  const sgnPow = (x, e) => Math.sign(x) * Math.pow(Math.abs(x), e);
  const box = (v, s, e = 0.32) => {
    const n = v.clone().normalize();
    v.set(sgnPow(n.x, e) * H.x * s, sgnPow(n.y, e) * H.y * s, sgnPow(n.z, e) * H.z * s);
  };
  const shell = makeShell(box, [
    {scale: 1, color: '#9fbd6a', part: 'zellwand', roughness: 0.85},
    {scale: 0.94, color: '#b9d08c', part: 'zellwand', roughness: 0.9},
    {scale: 0.925, color: '#e2a965', part: 'membran', roughness: 0.5},
    {scale: 0.91, color: '#eef3dc', part: 'membran', roughness: 0.8}
  ], -H.x);
  // Plasmodesmen: Kanäle durch die Wand (hintere Hälfte)
  const pdm = mat(C('plasmodesmen'), {roughness: 0.5});
  const pg = new THREE.Group();
  for (let i = 0; i < 26; i++) {
    const n = randomUnit(r);
    if (n.z > -0.05) n.z = -Math.abs(n.z) - 0.05;
    const a = n.clone(), b = n.clone();
    box(a, 0.9); box(b, 1.012);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, a.distanceTo(b), 8), pdm);
    t.position.copy(a).lerp(b, 0.5);
    t.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    t.userData.part = 'plasmodesmen';
    pg.add(t);
  }
  shell.back.add(pg);
  pg.userData.anchorFor = 'plasmodesmen';
  pg.userData.anchorPoint = new THREE.Vector3(0, H.y * 0.96, -3);

  // Zentralvakuole
  const vg = new THREE.SphereGeometry(1, 64, 40);
  const vp = vg.attributes.position, v = new THREE.Vector3();
  for (let k = 0; k < vp.count; k++) {
    v.fromBufferAttribute(vp, k);
    const n = v.clone().normalize();
    const w = wobble(n, 0.035, 2);
    v.set(sgnPow(n.x, 0.55) * 8.6 * w, sgnPow(n.y, 0.55) * 5.4 * w, sgnPow(n.z, 0.55) * 5.2 * w);
    vp.setXYZ(k, v.x, v.y, v.z);
  }
  vg.computeVertexNormals();
  const vac = new THREE.Mesh(vg, mat(C('vakuole'), {opacity: 0.32, side: THREE.DoubleSide, roughness: 0.15}));
  vac.position.set(1.9, -0.3, -0.6);
  vac.userData.part = 'vakuole';
  vac.renderOrder = 4;
  add(vac, new THREE.Vector3(0.3, 0, -1), 'vakuole');

  const nucC = new THREE.Vector3(-8.6, 1.6, 1.2);
  const nucleus = makeNucleus(2.5, 22);
  nucleus.position.copy(nucC);
  add(nucleus, new THREE.Vector3(-1, 0.5, 0.4), 'zellkern');

  const rer = makeER(2.5, true, 23, Math.PI * 0.95, Math.PI * 1.1, 420);
  rer.position.copy(nucC);
  rer.scale.setScalar(0.85);
  add(rer, new THREE.Vector3(-1, -0.6, -0.5), 'rer');
  rer.userData.anchorPoint = new THREE.Vector3(3, -2.2, -1.5);

  const ser = makeSmoothER(24, 1.4);
  ser.position.set(-9.2, -5, -2.5);
  add(ser, new THREE.Vector3(-1, -1, -0.3), 'ser');

  const golgi = makeGolgi(25);
  golgi.position.set(-7.4, -4.6, 3.6);
  golgi.rotation.set(0.2, 0.4, 0.5);
  golgi.scale.setScalar(0.75);
  add(golgi, new THREE.Vector3(-0.6, -1, 0.5), 'golgi');

  // Chloroplasten im Randbereich zwischen Vakuole und Wand
  const chl = [];
  for (let i = 0, guard = 0; i < 18 && guard < 4000; guard++) {
    const n = randomUnit(r);
    const p = n.clone();
    box(p, 0.8, 0.38);
    if (p.distanceTo(nucC) < 4.2 || p.distanceTo(golgi.position) < 3 || chl.some(c => c.distanceTo(p) < 3.2)) continue;
    const c = makeChloroplast();
    c.position.copy(p);
    // Längsachse tangential zur Wand
    c.lookAt(p.clone().add(n));
    c.rotateX(Math.PI / 2);
    c.rotateY(r() * Math.PI);
    add(c, null, i ? null : 'chloroplast');
    chl.push(p);
    i++;
  }

  const mitos = [];
  for (let i = 0, guard = 0; i < 6 && guard < 4000; guard++) {
    const n = randomUnit(r);
    const p = n.clone();
    box(p, 0.78, 0.4);
    if (p.distanceTo(nucC) < 4 || chl.some(c => c.distanceTo(p) < 2.4) || mitos.some(c => c.distanceTo(p) < 3)) continue;
    const m = makeMitochondrion(1.5 + r() * 0.8, 0.55);
    m.position.copy(p);
    m.rotation.set(r() * 3, r() * 3, r() * 3);
    add(m, null, i ? null : 'mitochondrium');
    mitos.push(p);
    i++;
  }

  const ribo = scatterInstanced(new THREE.SphereGeometry(0.085, 6, 5), mat(C('ribosom'), {roughness: 0.7}), 320, rr => {
    const n = randomUnit(rr), p = n.clone();
    box(p, 0.72 + rr() * 0.17, 0.4);
    return p.distanceTo(nucC) > 3 ? p : null;
  }, r, 'ribosom');
  root.add(ribo);
  ribo.userData.anchorFor = 'ribosom';
  ribo.userData.anchorPoint = new THREE.Vector3(-4, -6.4, 4.5);

  const ves = scatterInstanced(new THREE.SphereGeometry(0.24, 12, 9), mat(C('vesikel'), {roughness: 0.35}), 12, rr => {
    const p = new THREE.Vector3(-7 + rr() * 5, -6.5 + rr() * 2.5, -1 + rr() * 5);
    return p;
  }, r, 'vesikel');
  add(ves, new THREE.Vector3(-0.3, -1, 0.5));
  ves.userData.anchorFor = 'vesikel';
  ves.userData.anchorPoint = new THREE.Vector3(-4.5, -6.2, 2.5);

  return {root, shell, pieces, R: H.x, parts: ['zellwand', 'membran', 'vakuole', 'zellkern', 'nukleolus', 'chloroplast', 'mitochondrium', 'rer', 'ser', 'golgi', 'ribosom', 'vesikel', 'plasmodesmen']};
}

// ── Öffentliche Schnittstelle ─────────────────────────────────────────────────

export function buildCell(kind) {
  const c = kind === 'pflanze' ? plantCell() : animalCell();
  const group = new THREE.Group();
  const hull = new THREE.Group();
  hull.add(c.shell.back, c.shell.lidPivot);
  group.add(hull, c.root);
  const meshes = [];
  group.traverse(o => { if (o.isMesh && o.userData.part) meshes.push(o); });
  // Ankerpunkte für Beschriftungen
  const anchors = {};
  const box = new THREE.Box3();
  group.updateMatrixWorld(true);
  group.traverse(o => {
    const k = o.userData.anchorFor;
    if (!k || anchors[k]) return;
    const a = new THREE.Object3D();
    // anchorPoint ist in Koordinaten des Objekts angegeben (diese Objekte liegen im Ursprung)
    if (o.userData.anchorPoint) a.position.copy(o.userData.anchorPoint);
    else a.position.copy(o.worldToLocal(box.setFromObject(o).getCenter(new THREE.Vector3())));
    o.add(a);
    anchors[k] = a;
  });
  // Membran und Zellwand: Anker auf der Hülle oben hinten
  const hullAnchors = kind === 'pflanze' ? {zellwand: [6.5, 8.1, -2], membran: [-6.5, 7.4, -2.5]} : {membran: [-3.5, 9.3, -2.5]};
  for (const [k, p] of Object.entries(hullAnchors)) {
    const a = new THREE.Object3D();
    a.position.set(...p);
    hull.add(a);
    anchors[k] = a;
  }
  if (!anchors.nukleolus) {
    const n = meshes.find(m => m.userData.part === 'nukleolus');
    const a = new THREE.Object3D();
    n.add(a);
    anchors.nukleolus = a;
  }
  let open = 0, explode = 0;
  const apply = () => {
    c.shell.lidPivot.rotation.y = open * 1.95; // Deckel schwenkt nach hinten weg
    const e = explode;
    hull.scale.setScalar(1 + e * 0.55);
    for (const p of c.pieces) p.position.copy(p.userData.home).addScaledVector(p.userData.dir, e * c.R * 0.55);
  };
  return {
    group, meshes, anchors, parts: c.parts, radius: c.R,
    setOpen(v) { open = v; apply(); },
    setExplode(v) { explode = v; apply(); }
  };
}

