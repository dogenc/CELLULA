// CELLULA – Animation „DNA → RNA → Protein“ (Transkription, Prozessierung, Export, Translation).
// Rechts der Zellkern, links das Zytoplasma. Ein kurzes Beispielgen codiert Met-Ala-Trp-Lys-Gly-Phe.
import * as THREE from 'three';
import {mat, seg, lerp, clamp, fade, label} from './util.js';

const BASE = {A: '#e15759', T: '#f2b134', U: '#f2b134', G: '#4e79a7', C: '#59a14f'};
export const SYNTHESIS_LEGEND = [{color: BASE.A, label: 'Adenin (A)'}, {color: BASE.T, label: 'Thymin (T) · Uracil (U)'}, {color: BASE.G, label: 'Guanin (G)'}, {color: BASE.C, label: 'Cytosin (C)'}];
const COMP = {A: 'T', T: 'A', G: 'C', C: 'G'};
// codierender Strang: Flanke · Exon 1 · Intron · Exon 2 · Flanke
const FL = 'GCTA', EX1 = 'ATGGCTTGG', INTRON = 'GTCCAG', EX2 = 'AAAGGCTTCTAA', FR = 'CGAT';
const CODING = FL + EX1 + INTRON + EX2 + FR;
const N = CODING.length, D = 0.36, X0 = 2, Y0 = 1.5, HR = 0.75;
const TX0 = FL.length, TXN = EX1.length + INTRON.length + EX2.length;
const AAS = [['Met', '#8e6cc0'], ['Ala', '#e0a43a'], ['Trp', '#c0504d'], ['Lys', '#4a6fd8'], ['Gly', '#7aa36b'], ['Phe', '#d37295']];
const CODONS = ['AUG', 'GCU', 'UGG', 'AAA', 'GGC', 'UUC', 'UAA'];
const YM = -2.2;

export function proteinSynthesis() {
  const group = new THREE.Group();

  // Kernhülle mit Pore
  const env = new THREE.Mesh(new THREE.SphereGeometry(40, 64, 32, Math.PI - 0.32, 0.64, Math.PI / 2 - 0.3, 0.6), mat('#8c7fc4', {opacity: 0.22, side: THREE.DoubleSide}));
  env.position.x = 40;
  env.renderOrder = 4;
  group.add(env);
  const pore = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.16, 10, 28), mat('#5a4c9a', {roughness: 0.5}));
  pore.rotation.y = Math.PI / 2;
  pore.position.set(0.02, 0.3, 0);
  group.add(pore);
  const tags = [
    [label('Zellkern', {size: 0.55, color: '#5a4c9a'}), 9, 5.6],
    [label('Zytoplasma', {size: 0.55, color: '#55666c'}), -7.5, 3.4],
    [label('Kernpore', {size: 0.38, color: '#5a4c9a', bold: false}), 1.4, -0.9],
    [label('codogener Strang (Matrize)', {size: 0.36, color: '#55666c', bold: false}), 8.2, Y0 - 1.75]
  ];
  tags.forEach(([s, x, y]) => { s.position.set(x, y, 0.5); group.add(s); });

  // DNA: Rückgrat-Röhren werden je Bild neu erzeugt, Basen als Instanzen
  const bbMat = [mat('#d7dde0', {roughness: 0.4}), mat('#aab4b8', {roughness: 0.4})];
  const backbones = [new THREE.Mesh(new THREE.BufferGeometry(), bbMat[0]), new THREE.Mesh(new THREE.BufferGeometry(), bbMat[1])];
  group.add(...backbones);
  const rodGeo = new THREE.CylinderGeometry(0.09, 0.09, 1, 8);
  rodGeo.translate(0, 0.5, 0);
  const rods = new THREE.InstancedMesh(rodGeo, mat('#ffffff', {roughness: 0.5}), N * 2);
  const col = new THREE.Color();
  for (let k = 0; k < N; k++) {
    rods.setColorAt(k, col.set(BASE[CODING[k]]));
    rods.setColorAt(N + k, col.set(BASE[COMP[CODING[k]]]));
  }
  group.add(rods);

  const poly = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), mat('#9b7fd1', {opacity: 0.55, roughness: 0.3}));
  poly.scale.set(1.5, 1.35, 1.35);
  poly.renderOrder = 6;
  group.add(poly);
  const polyTag = label('RNA-Polymerase', {size: 0.4, bg: '#7a62b0'});
  group.add(polyTag);

  // mRNA-Perlen: Kappe · Exon 1 · Intron · Exon 2 · Poly-A
  const beads = [{type: 'cap', base: null}];
  for (const b of EX1) beads.push({type: 'ex', base: b === 'T' ? 'U' : b});
  for (const b of INTRON) beads.push({type: 'in', base: b === 'T' ? 'U' : b});
  for (const b of EX2) beads.push({type: 'ex', base: b === 'T' ? 'U' : b});
  for (let i = 0; i < 8; i++) beads.push({type: 'polyA', base: 'A'});
  beads.forEach((b, i) => { b.tx = b.type === 'cap' || b.type === 'polyA' ? -1 : i - 1; });
  const beadMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 12, 9), mat('#ffffff', {roughness: 0.45}), beads.length);
  beads.forEach((b, i) => beadMesh.setColorAt(i, col.set(b.type === 'cap' ? '#2f3b44' : BASE[b.base])));
  beadMesh.frustumCulled = false;
  group.add(beadMesh);
  const capTag = label('5′-Kappe', {size: 0.34, color: '#2f3b44', bold: false});
  const tailTag = label('Poly-A-Schwanz', {size: 0.34, color: '#a84446', bold: false});
  const intronTag = label('Intron', {size: 0.36, bg: '#7d8a8f'});
  const end5 = label('5′', {size: 0.4, color: '#2f3b44'}), end3 = label('3′', {size: 0.4, color: '#2f3b44'});
  group.add(capTag, tailTag, intronTag, end5, end3);

  // Weg der mRNA vom Gen durch die Kernpore ins Zytoplasma
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(15, 3.7, 0), new THREE.Vector3(8, 3.7, 0), new THREE.Vector3(2.4, 3.6, 0), new THREE.Vector3(0.7, 2.3, 0),
    new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(-0.8, -1.5, 0), new THREE.Vector3(-2.6, YM, 0), new THREE.Vector3(-8, YM, 0), new THREE.Vector3(-20, YM, 0)
  ], false, 'centripetal');
  const PL = path.getLength();
  const at = s => path.getPointAt(clamp(s / PL, 0, 1));
  const findS = (x, from, to) => { let a = from, b = to; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; (at(m).x > x) === (at(a).x > x) ? a = m : b = m; } return (a + b) / 2; };
  const sHead0 = findS(X0 + TX0 * D, 0, 13);
  const sHeadEnd = findS(-14.2, PL * 0.5, PL);

  // Ribosom, tRNAs, Freisetzungsfaktor
  const small = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), mat('#d9a066', {opacity: 0.72, roughness: 0.5}));
  small.scale.set(1.75, 0.55, 1.1);
  const large = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), mat('#c27b4a', {opacity: 0.5, roughness: 0.5}));
  large.scale.set(2.05, 1.1, 1.35);
  small.renderOrder = large.renderOrder = 6;
  group.add(small, large);
  const riboTag = label('Ribosom', {size: 0.42, bg: '#a8653a'});
  group.add(riboTag);
  const siteTags = ['E', 'P', 'A'].map(s => { const t = label(s, {size: 0.34, color: '#7a4a2a'}); group.add(t); return t; });

  const trnas = AAS.map(([name, c]) => {
    const g = new THREE.Group();
    const body = mat('#7fae8a', {roughness: 0.5});
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.15, 10), body);
    stem.position.y = 1.05;
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.6, 4, 8), body);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(0, 1.2, 0);
    const anti = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.22), mat('#5a8a66'));
    anti.position.y = 0.42;
    g.add(stem, arm, anti);
    group.add(g);
    const aa = new THREE.Mesh(new THREE.SphereGeometry(0.27, 18, 12), mat(c, {roughness: 0.4}));
    group.add(aa);
    const tag = label(name, {size: 0.32, color: c});
    group.add(tag);
    return {g, aa, tag};
  });
  const rf = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.9, 6, 12), mat('#c05a7a', {roughness: 0.45}));
  const rfTag = label('Freisetzungsfaktor', {size: 0.32, bg: '#a04462'});
  group.add(rf, rfTag);
  const codonTags = CODONS.map(c => { const t = label(c, {size: 0.34, color: '#2f3b44'}); group.add(t); return t; });

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const pts = [[], []];
  let lastDNA = null;

  function strandPoint(k, strand, open, spin) {
    const phi = k * 0.6 + spin + (strand ? 2.4 : 0);
    const r = HR * (1 - 0.35 * open);
    return new THREE.Vector3(X0 + k * D, Y0 + r * Math.cos(phi) + (strand ? -1 : 1) * 0.95 * open, r * Math.sin(phi));
  }

  function updateDNA(kp, active, spin) {
    const key = kp.toFixed(3) + active.toFixed(3) + spin.toFixed(3);
    if (key === lastDNA) return;
    lastDNA = key;
    for (let s = 0; s < 2; s++) pts[s].length = 0;
    for (let k = 0; k < N; k++) {
      const open = active * Math.exp(-Math.pow((k - kp) / 2.4, 2));
      const a = strandPoint(k, 0, open, spin), b = strandPoint(k, 1, open, spin);
      pts[0].push(a); pts[1].push(b);
      const mid = a.clone().lerp(b, 0.5);
      for (const [from, idx] of [[a, k], [b, N + k]]) {
        const target = from.clone().lerp(mid, 1 - open * 0.55);
        v.subVectors(target, from);
        const len = v.length();
        q.setFromUnitVectors(up, v.divideScalar(len || 1));
        rods.setMatrixAt(idx, m4.compose(from, q, sc.set(1, len, 1)));
      }
    }
    rods.instanceMatrix.needsUpdate = true;
    backbones.forEach((m, s) => {
      m.geometry.dispose();
      m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts[s]), N * 5, 0.13, 7, false);
    });
  }

  const codonX = (c, x5) => x5 + (3 * c + 1) * D;

  function update(T, time) {
    // Schritt 1: Transkription
    const tx = seg(T, 1.05, 1.9);
    const kp = lerp(TX0 - 2.5, TX0 + TXN + 1.5, tx);
    const polyA = seg(T, 1, 1.12) * (1 - seg(T, 1.88, 2));
    updateDNA(kp, polyA, T < 1 ? time * 0.25 % (Math.PI * 2) : 0);
    poly.position.set(X0 + kp * D, Y0, 0);
    fade(poly, polyA);
    polyTag.position.set(X0 + kp * D, Y0 + 1.9, 0);
    fade(polyTag, polyA);

    // Schritt 2: Prozessierung
    const u2 = clamp(T - 2);
    const wCap = seg(u2, 0, 0.25);
    const lift = seg(u2, 0.25, 0.5);
    const wIn = 1 - seg(u2, 0.5, 0.8);
    // Schritt 3: Export
    const sHead = lerp(sHead0, sHeadEnd, seg(T, 3.05, 3.95));

    let off = 0, inIdx = 0;
    const pos = [];
    beads.forEach((b, i) => {
      let w = 1, p;
      if (b.type === 'cap') w = wCap;
      if (b.type === 'in') w = wIn;
      if (b.type === 'polyA') w = seg(u2, 0.75 + (i - 34) * 0.025, 0.8 + (i - 34) * 0.025);
      if (b.type === 'cap') p = at(sHead + D * w);
      else {
        if (i > 1) off += D * w;
        p = at(sHead - off);
      }
      let scale = w;
      if (b.tx >= 0) {
        // während der Transkription aus der Matrize aufsteigen
        const born = clamp((kp - (TX0 + b.tx)) / 2.2);
        if (T < 2) {
          const k = TX0 + b.tx;
          const tmpl = strandPoint(k, 1, polyA * Math.exp(-Math.pow((k - kp) / 2.4, 2)), 0);
          tmpl.y += 0.5;
          p = tmpl.lerp(p, seg(born, 0.35, 1));
          scale = born > 0.02 ? 1 : 0;
        }
      }
      if (b.type === 'in') {
        p = p.clone();
        p.y += Math.sin(Math.PI * (inIdx + 1) / 7) * 1.5 * lift;
        p.z += 0.4 * lift;
        inIdx++;
      }
      pos.push(p);
      beadMesh.setMatrixAt(i, m4.compose(p, q.identity(), sc.setScalar(Math.max(scale, 0.0001))));
    });
    beadMesh.instanceMatrix.needsUpdate = true;
    const first = pos[1], last = pos[beads.length - 1], lastTx = pos[1 + TXN - 1];
    capTag.position.copy(pos[0]).add(v.set(-0.2, 0.6, 0));
    fade(capTag, seg(u2, 0.1, 0.25) * (1 - seg(T, 3, 3.3)));
    tailTag.position.copy(last).add(v.set(0, 0.6, 0));
    fade(tailTag, seg(u2, 0.85, 0.95) * (1 - seg(T, 3, 3.3)));
    intronTag.position.copy(pos[1 + EX1.length + 2]).add(v.set(0, 2.2 * lift, 0.4));
    fade(intronTag, lift * wIn);
    end5.position.copy(wCap > 0.5 ? pos[0] : first).add(v.set(-0.5, 0.25, 0));
    end3.position.copy(seg(u2, 0.75, 1) > 0.2 ? last : lastTx).add(v.set(0.5, 0.25, 0));
    const ends = seg(T, 1.3, 1.6);
    fade(end5, ends); fade(end3, ends);

    // Schritte 4–6: Translation
    const x5 = pos[1].x;
    const init = clamp(T - 4), cyc = (T - 5) * 5 + 1, term = clamp(T - 6);
    let p = 0;
    if (T >= 5) for (let i = 1; i <= 5; i++) p = Math.max(p, (i - 1) + seg(cyc - i, 0.6, 0.9));
    const xP = codonX(p, x5);
    const smallIn = seg(init, 0, 0.35), largeIn = seg(init, 0.6, 1);
    const apart = seg(term, 0.6, 1);
    small.position.set(xP + 0.55, YM - 0.62 - 3 * (1 - smallIn) - 1.8 * apart, 0);
    large.position.set(xP + 0.55, YM + 1.25 + 3.5 * (1 - largeIn) + 2.2 * apart, 0);
    fade(small, smallIn * (1 - apart));
    fade(large, largeIn * (1 - apart));
    riboTag.position.set(xP + 0.55, YM + 2.75 + 3.5 * (1 - largeIn), 0);
    fade(riboTag, largeIn * (1 - seg(T, 5.05, 5.25)) * (1 - apart));
    siteTags.forEach((t, k) => { t.position.set(codonX(p + k - 1, x5), YM + 0.75, 1.4); fade(t, largeIn * (1 - apart) * (1 - seg(T, 5.4, 5.6))); });
    codonTags.forEach((t, c) => { t.position.set(codonX(c, x5), YM - 1.55, 0.3); fade(t, seg(T, 3.8, 4.1)); });

    const top = i => new THREE.Vector3(codonX(i, x5), YM + 1.9, 0);
    let H = 0;
    if (T >= 5) for (let j = 1; j <= 5; j++) H = Math.max(H, (j - 1) + seg(cyc - j, 0.4, 0.55));
    const chainOff = n => new THREE.Vector3(-0.22 * n, 0.5 * n, 0.25 * Math.sin(n * 1.3));
    trnas.forEach((t, i) => {
      const arrive = i === 0 ? seg(init, 0.3, 0.65) : seg(cyc - i, 0, 0.35);
      const leave = i < 5 ? seg(cyc, i + 1.85, i + 2.25) : seg(term, 0.4, 0.7);
      const home = new THREE.Vector3(codonX(i, x5), YM + 0.1, 0);
      const away = new THREE.Vector3(codonX(i, x5) - 2.5, YM + 5.5, 2.5);
      const gp = away.clone().lerp(home, arrive);
      if (leave > 0) gp.lerp(new THREE.Vector3(codonX(i, x5) - 3, YM + 5.5, -2.5), leave);
      t.g.position.copy(gp);
      fade(t.g, arrive * (1 - leave));
      // Aminosäure: zuerst auf der eigenen tRNA, dann Teil der Kette
      // H: welche tRNA die Kette trägt (stetig, springt bei jeder Peptidbindung um 1 weiter)
      let ap = gp.clone().add(v.set(0, 1.8, 0));
      const h0 = Math.min(Math.floor(H), 4), fr = H - h0;
      if (T >= 5 && (i <= h0 || H >= 5)) {
        const hh = H >= 5 ? 5 : h0;
        ap = H >= 5 ? top(5).add(chainOff(5 - i)) : top(hh).add(chainOff(hh - i)).lerp(top(hh + 1).add(chainOff(hh + 1 - i)), fr);
      }
      // Termination: Kette löst sich und faltet sich
      const fold = seg(term, 0.35, 0.85);
      if (fold > 0) {
        const a = i * 1.75, fp = new THREE.Vector3(codonX(5, x5) - 1 + Math.cos(a) * 0.5, YM + 5 + i * 0.16, Math.sin(a) * 0.5);
        ap.lerp(fp, fold);
      }
      t.aa.position.copy(ap);
      const vis = i === 0 ? seg(init, 0.3, 0.65) : seg(cyc - i, 0, 0.35);
      fade(t.aa, vis);
      t.tag.position.copy(ap).add(v.set(0.55, 0.15, 0));
      fade(t.tag, vis);
    });
    rf.position.set(codonX(6, x5), YM + 1.2 + 4 * (1 - seg(term, 0, 0.3)), 0);
    fade(rf, seg(term, 0, 0.3) * (1 - seg(term, 0.7, 0.95)));
    rfTag.position.copy(rf.position).add(v.set(1.6, 0.7, 0));
    fade(rfTag, seg(term, 0.1, 0.3) * (1 - seg(term, 0.6, 0.8)));
    tags.forEach(([s], k) => fade(s, k === 3 ? seg(T, 0.2, 0.5) * (1 - seg(T, 1.9, 2.1)) : 1));
  }

  function view(T) {
    const x5 = -14.2;
    let p = 0;
    const cyc = (T - 5) * 5 + 1;
    if (T >= 5) for (let i = 1; i <= 5; i++) p = Math.max(p, (i - 1) + seg(cyc - i, 0.6, 0.9));
    const tx = new THREE.Vector3(8.5, 2.2, 0);
    const exp = new THREE.Vector3(-4, 0.2, 0);
    const tr = new THREE.Vector3(codonX(p, x5) + 1, -0.2, 0);
    const t = tx.clone().lerp(exp, seg(T, 3, 3.8)).lerp(tr, seg(T, 3.6, 4.4));
    return t;
  }
  return {group, steps: 7, update, view, legend: SYNTHESIS_LEGEND, viewOffset: [0, 2.5, 25]};
}
