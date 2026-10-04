// CELLULA – Animationen der Zellteilung: Mitose und Meiose (2n = 4).
// update(T): T läuft von 0 bis Anzahl der Schritte; Schritt s wird während T ∈ [s, s+1] gezeigt.
import * as THREE from 'three';
import {rng, mat, seg, lerp, Fibers, fade, curveTube, randomInSphere, randomUnit, label} from './util.js';

const MOM = '#d9534f', DAD = '#4a7bd0', MOM2 = '#ef9a8f', DAD2 = '#93b4ec';
export const DIVISION_LEGEND = [{color: MOM, label: 'mütterliche Chromosomen'}, {color: DAD, label: 'väterliche Chromosomen'}, {color: '#7aa36b', label: 'Spindelapparat'}];

// Zelle, die sich strecken und in der Mitte einschnüren kann.
class DividingCell {
  constructor(R, axis = 'x') {
    this.R = R;
    this.axis = axis;
    this.geo = new THREE.SphereGeometry(R, 72, 48);
    this.base = this.geo.attributes.position.array.slice();
    this.mesh = new THREE.Mesh(this.geo, mat('#f0c48c', {opacity: 0.28, side: THREE.DoubleSide, roughness: 0.35}));
    this.mesh.renderOrder = 5;
    const edge = new THREE.Mesh(this.geo, mat('#d79a55', {opacity: 0.18, side: THREE.BackSide}));
    this.mesh.add(edge);
    this.last = null;
  }
  update(elong, pinch) {
    const key = elong.toFixed(4) + pinch.toFixed(4);
    if (key === this.last) return;
    this.last = key;
    const p = this.geo.attributes.position.array, b = this.base, ax = this.axis === 'x' ? 0 : 1, o1 = ax === 0 ? 1 : 0, o2 = 2;
    for (let i = 0; i < p.length; i += 3) {
      const a = b[i + ax] * (1 + 0.32 * elong);
      const f = 1 - pinch * Math.exp(-Math.pow(a / (this.R * 0.55), 2));
      p[i + ax] = a;
      p[i + o1] = b[i + o1] * f;
      p[i + o2] = b[i + o2] * f;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.computeVertexNormals();
  }
}

// Ein Chromatid: oberer und unterer Arm (für die Farben nach dem Crossing-over).
class Chromatid {
  constructor(L, color) {
    this.obj = new THREE.Group();
    const r = 0.16;
    this.top = new THREE.Mesh(new THREE.CapsuleGeometry(r, L * 0.55, 6, 12), mat(color, {roughness: 0.45}));
    this.top.position.y = L * 0.55 / 2 + 0.05;
    this.bot = new THREE.Mesh(new THREE.CapsuleGeometry(r, L * 0.4, 6, 12), mat(color, {roughness: 0.45}));
    this.bot.position.y = -L * 0.4 / 2 - 0.05;
    this.obj.add(this.top, this.bot);
    this.base = new THREE.Color(color);
  }
}

class Chromosome {
  constructor(group, L, color) {
    this.L = L;
    this.color = color;
    this.a = new Chromatid(L, color);
    this.b = new Chromatid(L, color);
    group.add(this.a.obj, this.b.obj);
    this.kin = [new THREE.Vector3(), new THREE.Vector3()];
  }
  // c: Zentromer-Mitte, theta: Drehung um z, sep: Abstand der Schwestern, offA/offB: eigene Verschiebung je Chromatid
  place(c, theta, sep, offA = null, offB = null, cond = 1) {
    const dir = new THREE.Vector3(Math.cos(theta), Math.sin(theta), 0);
    const s = 0.17 + sep;
    [[this.a, -1, offA, 0], [this.b, 1, offB, 1]].forEach(([ch, sg, off, k]) => {
      const p = c.clone().addScaledVector(dir, sg * s);
      if (off) p.add(off);
      ch.obj.position.copy(p);
      ch.obj.rotation.set(0, 0, theta - sg * 0.12 * cond);
      ch.obj.scale.set(lerp(0.45, 1, cond), lerp(1.6, 1, cond), lerp(0.45, 1, cond));
      this.kin[k].copy(p);
    });
  }
  alpha(a) { fade(this.a.obj, a); fade(this.b.obj, a); }
}

function centrosome(group) {
  const g = new THREE.Group();
  const m = mat('#5d8a4e', {roughness: 0.4});
  const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.42, 12), m);
  const c2 = c1.clone();
  c2.rotation.z = Math.PI / 2;
  c2.position.set(0.2, 0.2, 0);
  g.add(c1, c2);
  group.add(g);
  return g;
}

function chromatin(group, R, seed, colors) {
  const r = rng(seed);
  const g = new THREE.Group();
  colors.forEach(col => {
    const m = mat(col, {roughness: 0.6});
    for (let i = 0; i < 2; i++) {
      const pts = [];
      let p = randomInSphere(r, R * 0.5);
      for (let j = 0; j < 16; j++) {
        p = p.clone().add(randomUnit(r).multiplyScalar(0.45));
        if (p.length() > R * 0.85) p.multiplyScalar(0.75);
        pts.push(p);
      }
      g.add(curveTube(pts, 0.05, m, 6));
    }
  });
  group.add(g);
  return g;
}

function nucleusShell(group, R) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), mat('#8c7fc4', {opacity: 0.3, side: THREE.DoubleSide, roughness: 0.4}));
  m.renderOrder = 4;
  group.add(m);
  return m;
}

function spindle(group) {
  const m = new THREE.MeshStandardMaterial({color: '#7aa36b', roughness: 0.5, transparent: true, opacity: 0.85});
  const f = new Fibers(80, 0.025, m);
  group.add(f.mesh);
  return f;
}

// Astral- und Polfasern: kurze Strahlen und Fasern zur Mitte
function poleFibers(f, start, pole, other, grow, seed) {
  const r = rng(seed);
  let k = start;
  const dir = other.clone().sub(pole).normalize();
  for (let i = 0; i < 7; i++) {
    const d = randomUnit(r);
    if (d.dot(dir) > 0.3) d.addScaledVector(dir, -1.2).normalize();
    f.set(k++, pole, pole.clone().addScaledVector(d, 1.2 * grow));
  }
  for (let i = 0; i < 4; i++) {
    const off = new THREE.Vector3(0, (i - 1.5) * 0.5, (i % 2 ? 0.4 : -0.4));
    const end = pole.clone().lerp(other, 0.58 * grow).add(off.multiplyScalar(grow));
    f.set(k++, pole, end);
  }
  return k;
}

// ── Mitose ──────────────────────────────────────────────────────────────────────
export function mitosis() {
  const group = new THREE.Group();
  const cell = new DividingCell(5.2);
  group.add(cell.mesh);
  const nuc = nucleusShell(group, 2.5);
  const chrom = chromatin(group, 2.5, 3, [MOM, DAD, MOM2, DAD2]);
  const daughters = [-1, 1].map(s => {
    const g = new THREE.Group();
    g.position.x = s * 3.5;
    nucleusShell(g, 1.75);
    chromatin(g, 1.75, 5 + s, [MOM, DAD, MOM2, DAD2]);
    group.add(g);
    return g;
  });
  const specs = [[1.7, MOM], [1.7, DAD], [1.05, MOM2], [1.05, DAD2]];
  const cg = new THREE.Group();
  group.add(cg);
  const chromosomes = specs.map(([L, c]) => new Chromosome(cg, L, c));
  const pro = [[-0.9, 0.7, 0.3, 0.6], [0.9, 0.8, -0.4, -0.9], [-0.6, -0.9, -0.2, 1.9], [0.8, -0.8, 0.5, -0.3]];
  const meta = [[0, 2.0, 0.3], [0, 0.1, -0.3], [0, -1.35, 0.3], [0, -2.55, -0.3]];
  const cs = [centrosome(group), centrosome(group)];
  const fib = spindle(group);
  const tags = {
    platte: label('Äquatorialebene', {size: 0.42, color: '#55666c', bold: false}),
    pol1: label('Spindelpol', {size: 0.42, color: '#4f7a45', bold: false})
  };
  tags.platte.position.set(0, -3.1, 0);
  tags.pol1.position.set(-4.6, 1.0, 0);
  group.add(tags.platte, tags.pol1);

  function update(T) {
    const cond = seg(T, 1, 1.8);
    const sep = seg(T, 1, 2);
    const env = 1 - seg(T, 2, 2.6);
    const attach = seg(T, 2.15, 2.9);
    const toPlate = seg(T, 2.3, 3.7);
    const ana = seg(T, 4, 4.85);
    const elong = seg(T, 4, 5.2);
    const pinch = seg(T, 5.15, 5.95) * 0.985;
    const decond = seg(T, 5.35, 5.95);
    const spindleA = seg(T, 1.1, 1.9) * (1 - seg(T, 5.1, 5.7));
    cell.update(elong, pinch);
    fade(nuc, env);
    fade(chrom, 1 - cond);
    daughters.forEach(d => fade(d, seg(T, 5.3, 5.9)));
    const poleX = lerp(0.45, 4.3, sep) + 0.6 * elong;
    const angle = lerp(Math.PI / 2 - 0.15, 0, sep);
    const p1 = new THREE.Vector3(-Math.cos(angle) * poleX, lerp(3.0, 0, sep), 0);
    const p2 = new THREE.Vector3(Math.cos(angle) * poleX, lerp(3.0, 0, sep), 0);
    cs[0].position.copy(p1);
    cs[1].position.copy(p2);
    chromosomes.forEach((ch, i) => {
      const [px, py, pz, pt] = pro[i], [mx, my, mz] = meta[i];
      const c = new THREE.Vector3(lerp(px, mx, toPlate), lerp(py, my, toPlate), lerp(pz, mz, toPlate));
      const theta = lerp(pt, Math.PI / 2, toPlate) - Math.PI / 2;
      const d = ana * 3.05 + decond * 0.4;
      const offA = new THREE.Vector3(-d, -c.y * 0.25 * ana, 0), offB = new THREE.Vector3(d, -c.y * 0.25 * ana, 0);
      ch.place(c, theta, 0, offA, offB, cond * (1 - decond * 0.6));
      // Chromatiden lehnen sich in der Anaphase hinter dem Zentromer zurück (V-Form)
      ch.a.obj.rotation.z += ana * (1 - decond) * 0.5 * Math.sign(c.y || 1) * -1;
      ch.b.obj.rotation.z += ana * (1 - decond) * 0.5 * Math.sign(c.y || 1);
      ch.alpha(cond * (1 - decond));
    });
    // Spindelfasern
    let k = 0;
    k = poleFibers(fib, k, p1, p2, spindleA, 1);
    k = poleFibers(fib, k, p2, p1, spindleA, 2);
    chromosomes.forEach(ch => {
      [[p1, ch.kin[0]], [p2, ch.kin[1]]].forEach(([p, kin]) => {
        if (attach * spindleA > 0.01) fib.set(k, p, p.clone().lerp(kin, attach)); else fib.hide(k);
        k++;
      });
    });
    while (k < 80) fib.hide(k++);
    fib.done();
    fib.mesh.material.opacity = 0.85 * spindleA;
    fib.mesh.visible = spindleA > 0.01;
    fade(tags.platte, seg(T, 3.1, 3.4) * (1 - seg(T, 3.85, 4.05)));
    fade(tags.pol1, seg(T, 1.6, 1.9) * (1 - seg(T, 2.6, 2.9)));
  }
  return {group, steps: 6, update, legend: DIVISION_LEGEND, view: {pos: [5, 4, 25], target: [0, -0.6, 0]}};
}

// ── Meiose ──────────────────────────────────────────────────────────────────────
export function meiosis() {
  const group = new THREE.Group();
  const cell = new DividingCell(5.2);
  group.add(cell.mesh);
  const halves = [-1, 1].map(s => {
    const c = new DividingCell(3.3, 'y');
    c.mesh.position.x = s * 3.55;
    group.add(c.mesh);
    return c;
  });
  const nuc = nucleusShell(group, 2.6);
  const chrom = chromatin(group, 2.6, 9, [MOM, DAD, MOM2, DAD2]);
  const finals = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const n = nucleusShell(group, 0.95);
    n.position.set(sx * 3.55, sy * 2.35, 0);
    finals.push(n);
  }
  const cg = new THREE.Group();
  group.add(cg);
  // m1, p1 (lang), m2, p2 (kurz)
  const specs = [[1.7, MOM], [1.7, DAD], [1.05, MOM2], [1.05, DAD2]];
  const chromosomes = specs.map(([L, c]) => new Chromosome(cg, L, c));
  const cs = [0, 1, 2, 3].map(() => centrosome(group));
  const fib = spindle(group);
  const tag = label('Crossing-over', {size: 0.45, bg: '#2f5b68'});
  tag.position.set(0, 2.3, 0.6);
  group.add(tag);
  const tag2 = label('Tetrade', {size: 0.4, color: '#55666c', bold: false});
  tag2.position.set(1.4, -1.6, 0.4);
  group.add(tag2);

  // Startlagen (Prophase), Paarung (Ende Prophase I), Metaphase I
  const pre = [[-1.0, 0.8, 0.3, 0.7], [0.9, 0.6, -0.4, -0.8], [-0.7, -1.0, -0.2, 1.7], [0.9, -0.9, 0.4, -0.4]];
  const pair = [[-0.42, 0.75, 0.2, 0.3], [0.42, 0.75, 0.2, 0.3], [0.42, -1.05, -0.2, -0.5], [-0.42, -1.05, -0.2, -0.5]];
  const met1 = [[-0.45, 0.95, 0.3], [0.45, 0.95, 0.3], [0.45, -0.95, -0.3], [-0.45, -0.95, -0.3]];
  const side1 = [-1, 1, 1, -1]; // Pol in Meiose I (Mutter und Vater zufällig verteilt)
  const base = new THREE.Color(), tmp = new THREE.Color();

  function update(T) {
    const cond = seg(T, 1, 1.5);
    const syn = seg(T, 1.15, 1.6);
    const cross = seg(T, 1.6, 1.95);
    const sep = seg(T, 1, 2);
    const env = 1 - seg(T, 1.7, 2.3);
    const toPlate = seg(T, 2, 2.7);
    const attach = seg(T, 2.1, 2.8);
    const ana1 = seg(T, 3, 3.85);
    const elong1 = seg(T, 3, 4.1);
    const pinch1 = seg(T, 4.05, 4.85) * 0.985;
    const split = T >= 4.9;
    const met2 = seg(T, 5, 5.7);
    const sep2 = seg(T, 5, 5.6);
    const ana2 = seg(T, 6, 6.85);
    const elong2 = seg(T, 6, 7.1);
    const pinch2 = seg(T, 7.05, 7.85) * 0.985;
    const decond = seg(T, 7.4, 7.95);
    const spindle1 = seg(T, 1.3, 2) * (1 - seg(T, 4, 4.5));
    const spindle2 = seg(T, 5, 5.5) * (1 - seg(T, 7.1, 7.6));

    cell.update(elong1, pinch1);
    cell.mesh.visible = !split;
    halves.forEach(h => { h.mesh.visible = split; h.update(elong2, pinch2); });
    fade(nuc, env);
    fade(chrom, 1 - cond);
    finals.forEach(n => fade(n, seg(T, 7.45, 7.95)));
    fade(tag, seg(T, 1.6, 1.75) * (1 - seg(T, 1.95, 2.1)));
    fade(tag2, seg(T, 1.5, 1.65) * (1 - seg(T, 1.95, 2.1)));

    // Pole Meiose I
    const px = lerp(0.45, 4.3, sep) + 0.6 * elong1;
    const ang = lerp(Math.PI / 2 - 0.15, 0, sep);
    const P1 = new THREE.Vector3(-Math.cos(ang) * px, lerp(3, 0, sep), 0);
    const P2 = new THREE.Vector3(Math.cos(ang) * px, lerp(3, 0, sep), 0);
    // Pole Meiose II: je Tochterzelle oben und unten
    const poles2 = [[-3.55, 1], [-3.55, -1], [3.55, 1], [3.55, -1]].map(([x, s]) => new THREE.Vector3(x, s * (lerp(0.3, 2.55, sep2) + 0.6 * elong2), 0));
    if (T < 5) {
      cs[0].position.copy(P1); cs[1].position.copy(P2);
      cs[2].position.copy(P1); cs[3].position.copy(P2);
    } else cs.forEach((c, i) => c.position.copy(poles2[i]));
    cs.forEach(c => { c.visible = T > 0.2; });

    chromosomes.forEach((ch, i) => {
      // Farben: innere Nicht-Schwesterchromatiden tauschen den unteren Arm
      const partner = chromosomes[i ^ 1];
      const inner = side1[i] < 0 ? ch.b : ch.a; // zum Partner zeigendes Chromatid
      base.set(ch.color);
      inner.bot.material.color.copy(base).lerp(tmp.set(partner.color), cross);
      // Lage
      let c, theta;
      if (T < 2) {
        const [ax, ay, az, at] = pre[i], [bx, by, bz, bt] = pair[i];
        c = new THREE.Vector3(lerp(ax, bx, syn), lerp(ay, by, syn), lerp(az, bz, syn));
        theta = lerp(at, bt, syn);
      } else {
        const [ax, ay, az, at] = pair[i], [mx, my, mz] = met1[i];
        c = new THREE.Vector3(lerp(ax, mx, toPlate), lerp(ay, my, toPlate), lerp(az, mz, toPlate));
        theta = lerp(at, 0, toPlate);
        c.x += side1[i] * ana1 * 2.75;
        c.y *= 1 - 0.3 * ana1;
      }
      // Meiose II: in der Tochterzelle neu ausrichten (Längsachse waagerecht)
      const cx = side1[i] * 3.55;
      const long = i < 2;
      if (T >= 5) {
        const tgt = new THREE.Vector3(cx + (long ? -0.85 : 0.75), 0, long ? 0.2 : -0.2);
        c.lerp(tgt, met2);
        theta = lerp(theta, Math.PI / 2, met2);
      }
      const d = ana2 * 1.75 + decond * 0.25;
      const offA = new THREE.Vector3(0, -d, 0), offB = new THREE.Vector3(0, d, 0);
      ch.place(c, theta, 0, T >= 6 ? offA : null, T >= 6 ? offB : null, cond * (1 - decond * 0.5));
      ch.alpha(cond * (1 - decond * 0.75));
    });

    // Spindel
    let k = 0;
    if (spindle1 > 0.01) {
      k = poleFibers(fib, k, P1, P2, spindle1, 3);
      k = poleFibers(fib, k, P2, P1, spindle1, 4);
      chromosomes.forEach((ch, i) => {
        const P = side1[i] < 0 ? P1 : P2;
        for (const kin of ch.kin) { fib.set(k++, P, P.clone().lerp(kin, attach)); }
      });
    }
    if (spindle2 > 0.01) {
      for (let c = 0; c < 2; c++) {
        k = poleFibers(fib, k, poles2[c * 2], poles2[c * 2 + 1], spindle2, 5 + c);
        k = poleFibers(fib, k, poles2[c * 2 + 1], poles2[c * 2], spindle2, 7 + c);
      }
      chromosomes.forEach((ch, i) => {
        const c = side1[i] < 0 ? 0 : 1;
        fib.set(k++, poles2[c * 2 + 1], poles2[c * 2 + 1].clone().lerp(ch.kin[0], met2));
        fib.set(k++, poles2[c * 2], poles2[c * 2].clone().lerp(ch.kin[1], met2));
      });
    }
    while (k < 80) fib.hide(k++);
    fib.done();
    const sp = Math.max(spindle1, spindle2);
    fib.mesh.material.opacity = 0.85 * sp;
    fib.mesh.visible = sp > 0.01;
  }
  return {group, steps: 8, update, legend: DIVISION_LEGEND, view: {pos: [4, 4, 27], target: [0, -0.6, 0]}};
}
