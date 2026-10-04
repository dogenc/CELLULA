// CELLULA – Darstellung echter Molekülstrukturen aus der Protein Data Bank.
// Atome werden als „Impostor“ gezeichnet: ein Quadrat je Atom, im Fragment-Shader zur
// beleuchteten Kugel mit korrekter Tiefe gerechnet. So bleiben auch 37 000 Atome flüssig.
import * as THREE from 'three';
import {ribbonGeometry} from './cartoon.js';

const VDW = {C: 1.7, N: 1.55, O: 1.52, S: 1.8, P: 1.8, FE: 1.45, ZN: 1.39, MG: 1.73, X: 1.6};
const CPK = {C: '#8d9599', N: '#3f6fd8', O: '#e0473c', S: '#f0c43a', P: '#f08a2e', FE: '#c0602a', ZN: '#7d80b0', MG: '#4fae5a', X: '#d070c0'};
const BASES = {DA: '#e15759', DT: '#f2b134', DG: '#4e79a7', DC: '#59a14f', A: '#e15759', U: '#f2b134', G: '#4e79a7', C: '#59a14f'};
const HYDRO = new Set(['ALA', 'VAL', 'LEU', 'ILE', 'MET', 'PHE', 'TRP', 'PRO', 'GLY', 'CYS']);
const POS = new Set(['LYS', 'ARG', 'HIS']), NEG = new Set(['ASP', 'GLU']);
export const POLAR_LEGEND = [['#e0a43a', 'hydrophob'], ['#5fb3b3', 'polar'], ['#4a6fd8', 'positiv geladen'], ['#d9534f', 'negativ geladen']];
export const BASE_LEGEND = [['#e15759', 'Adenin'], ['#f2b134', 'Thymin'], ['#4e79a7', 'Guanin'], ['#59a14f', 'Cytosin'], ['#c9ced1', 'Zucker-Phosphat-Rückgrat']];
// Farben je Untereinheit (Entität)
const PALETTE = ['#4e79a7', '#e15759', '#59a14f', '#f28e2b', '#b07aa1', '#76b7b2', '#edc948', '#ff9da7', '#9c755f', '#6b8e23', '#d37295', '#86bcb6'];

const vert = `
#include <clipping_planes_pars_vertex>
attribute vec3 iPos; attribute float iRad; attribute vec3 iCol;
varying vec3 vCenter; varying vec3 vPos; varying float vRad; varying vec3 vCol;
void main() {
  vec4 c = modelViewMatrix * vec4(iPos, 1.0);
  float s = length(modelViewMatrix[0].xyz);
  float r = iRad * s;
  vec3 p = c.xyz + vec3(position.xy * r * 1.6, 0.0);
  p += normalize(-c.xyz) * r; // Quadrat vor die Kugel legen, damit nichts abgeschnitten wird
  vCenter = c.xyz; vPos = p; vRad = r; vCol = iCol;
  vec4 mvPosition = vec4(p, 1.0);
  #include <clipping_planes_vertex>
  gl_Position = projectionMatrix * mvPosition;
  if (iRad <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;
const frag = `
#include <clipping_planes_pars_fragment>
uniform float uSpec; uniform float uDim; uniform mat4 projectionMatrix;
varying vec3 vCenter; varying vec3 vPos; varying float vRad; varying vec3 vCol;
void main() {
  vec3 d = normalize(vPos);
  float b = dot(d, vCenter);
  float c = dot(vCenter, vCenter) - vRad * vRad;
  float h = b * b - c;
  if (h < 0.0) discard;
  float t = b - sqrt(h);
  vec3 P = d * t;
  vec3 cutNormal = vec3(0.0);
  #if NUM_CLIPPING_PLANES > 0
    for (int i = 0; i < NUM_CLIPPING_PLANES; i++) {
      if (dot(-P, clippingPlanes[i].xyz) > clippingPlanes[i].w) {
        vec3 n = clippingPlanes[i].xyz;
        float denominator = dot(-d, n);
        if (abs(denominator) < 0.000001) discard;
        float cutT = clippingPlanes[i].w / denominator;
        if (cutT < t || cutT > b + sqrt(h)) discard;
        P = d * cutT;
        cutNormal = n;
      }
    }
  #endif

  vec3 N = length(cutNormal) > 0.0 ? normalize(cutNormal) : normalize(P - vCenter);
  vec3 L = normalize(vec3(0.45, 0.65, 0.75));
  float diff = max(dot(N, L), 0.0);
  float fill = max(dot(N, normalize(vec3(-0.6, -0.2, 0.5))), 0.0);
  vec3 H = normalize(L - d);
  float spec = pow(max(dot(N, H), 0.0), 40.0) * uSpec;
  float rim = pow(1.0 - max(dot(N, -d), 0.0), 3.0);
  vec3 col = vCol * (0.34 + 0.62 * diff + 0.16 * fill) + spec * 0.35 - rim * 0.12 * vCol;
  gl_FragColor = vec4(col * uDim, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  vec4 clip = projectionMatrix * vec4(P, 1.0);
  gl_FragDepth = clip.z / clip.w * 0.5 + 0.5;
}`;

function sphereMesh(n) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('iRad', new THREE.InstancedBufferAttribute(new Float32Array(n), 1));
  g.setAttribute('iCol', new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3));
  g.instanceCount = n;
  const m = new THREE.ShaderMaterial({vertexShader: vert, fragmentShader: frag, uniforms: {uSpec: {value: 1}, uDim: {value: 1}}});
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false;
  return mesh;
}

async function gunzip(res) {
  const stream = res.body.pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function loadMolecule(meta, elements, extra = {}) {
  const res = await fetch('/assets/' + meta.file);
  if (!res.ok) throw Error(meta.file);
  // Manche Server liefern .gz bereits entpackt aus (Content-Encoding) – beides abfangen.
  let bytes = new Uint8Array(await res.clone().arrayBuffer());
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) bytes = await gunzip(res);
  const n = meta.atoms;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) pos[i] = dv.getInt16(i * 2, true) / meta.scale;
  const el = bytes.subarray(n * 6, n * 7), chain = bytes.subarray(n * 7, n * 8), res3 = bytes.subarray(n * 8, n * 9), flags = bytes.subarray(n * 9, n * 10);
  return new Molecule(meta, elements, {pos, el, chain, res: res3, flags}, extra);
}

export class Molecule {
  constructor(meta, elements, a, extra) {
    this.meta = meta;
    this.elements = elements;
    this.a = a;
    this.n = meta.atoms;
    this.group = new THREE.Group();
    this.rotorEntities = new Set(extra.rotor || []);
    this.nucleic = meta.residues.some(r => BASES[r] && r.length === 2);
    this.entityList = [...new Set(meta.chains.map(c => c.entity))];
    this.hidden = new Set();
    this.focus = null;
    this.mode = !this.nucleic && meta.secondary?.length ? 'cartoon' : 'kalotte';
    this.color = this.nucleic ? 'basen' : 'kette';
    this.angle = 0;
    this.computeAO();
    this.setupRotor();
    this.orientAntibody();
    this.build();
  }

  entityOf(i) { return this.meta.chains[this.a.chain[i]].entity; }
  elementOf(i) { return this.elements[this.a.el[i]]; }
  residueOf(i) { return this.meta.residues[this.a.res[i]]; }
  isRotor(i) { return this.rotorEntities.has(this.entityOf(i)); }

  entityColor(e) {
    const k = this.entityList.indexOf(+e);
    return PALETTE[k % PALETTE.length];
  }

  // Einfache Umgebungsverdeckung: Atome mit vielen Nachbarn liegen innen und werden dunkler.
  computeAO() {
    const {pos} = this.a, n = this.n, cell = 8, grid = new Map();
    const key = (x, y, z) => `${x},${y},${z}`;
    for (let i = 0; i < n; i++) {
      const k = key(Math.floor(pos[i * 3] / cell), Math.floor(pos[i * 3 + 1] / cell), Math.floor(pos[i * 3 + 2] / cell));
      (grid.get(k) || grid.set(k, []).get(k)).push(i);
    }
    const counts = new Float32Array(n);
    let max = 1;
    for (let i = 0; i < n; i++) {
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      const gx = Math.floor(x / cell), gy = Math.floor(y / cell), gz = Math.floor(z / cell);
      let c = 0;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
        const l = grid.get(key(gx + dx, gy + dy, gz + dz));
        if (!l) continue;
        for (const j of l) {
          const ex = pos[j * 3] - x, ey = pos[j * 3 + 1] - y, ez = pos[j * 3 + 2] - z;
          if (ex * ex + ey * ey + ez * ez < 64) c++;
        }
      }
      counts[i] = c;
      if (c > max) max = c;
    }
    this.ao = counts.map(c => 1 - 0.38 * Math.pow(c / max, 1.4));
    this.grid = {grid, cell, key};
  }

  setupRotor() {
    this.pivot = new THREE.Group();
    this.rotorInner = new THREE.Group();
    this.pivot.add(this.rotorInner);
    this.group.add(this.pivot);
    this.stator = new THREE.Group();
    this.group.add(this.stator);
    if (!this.rotorEntities.size) return;
    const c = new THREE.Vector3(), g = new THREE.Vector3();
    let nc = 0, ng = 0;
    const {pos} = this.a;
    for (let i = 0; i < this.n; i++) {
      const e = this.entityOf(i);
      if (e === 7) { c.x += pos[i * 3]; c.y += pos[i * 3 + 1]; c.z += pos[i * 3 + 2]; nc++; }
      if (e === 5) { g.x += pos[i * 3]; g.y += pos[i * 3 + 1]; g.z += pos[i * 3 + 2]; ng++; }
    }
    if(!nc || !ng) return;
    c.divideScalar(nc); g.divideScalar(ng);
    this.axis = g.clone().sub(c).normalize();
    // Present F1 above the membrane rotor, independent of the PDB axis sign.
    this.group.quaternion.setFromUnitVectors(this.axis,new THREE.Vector3(0,1,0));
    this.pivot.position.copy(c);
    this.rotorInner.position.copy(c).negate();
  }

  orientAntibody() {
    if(this.meta.key!=='antikoerper') return;
    const trace=new Map();
    for(let i=0;i<this.n;i++)if(this.a.flags[i]&2){const chain=this.a.chain[i];if(!trace.has(chain))trace.set(chain,[]);trace.get(chain).push(i);}
    const average=ids=>{const v=new THREE.Vector3();for(const i of ids)v.add(new THREE.Vector3().fromArray(this.a.pos,i*3));return v.divideScalar(ids.length);};
    const lights=[...trace].filter(([c])=>this.meta.chains[c].entity===1).map(([,ids])=>average(ids));
    const tail=[...trace].filter(([c])=>this.meta.chains[c].entity===2).flatMap(([,ids])=>ids.slice(Math.floor(ids.length/2)));
    if(lights.length!==2 || !tail.length) return;
    const y=lights[0].clone().add(lights[1]).multiplyScalar(.5).sub(average(tail)).normalize();
    const x=lights[1].clone().sub(lights[0]);x.addScaledVector(y,-x.dot(y)).normalize();
    const z=new THREE.Vector3().crossVectors(x,y).normalize();
    this.group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z).invert());
  }

  rotate(dt) {
    if (!this.axis) return;
    this.angle += dt;
    this.pivot.setRotationFromAxisAngle(this.axis, this.angle);
  }

  colorOf(i) {
    const e = this.elementOf(i), r = this.residueOf(i), f = this.a.flags[i];
    let hex;
    if (this.color === 'element') hex = CPK[e] || CPK.X;
    else if (this.color === 'basen') hex = BASES[r] && (f & 8) ? BASES[r] : (f & 1 ? CPK[e] : '#c9ced1');
    else if (this.color === 'polar') {
      if (f & 1) hex = CPK[e] || CPK.X;
      else hex = HYDRO.has(r) ? '#e0a43a' : POS.has(r) ? '#4a6fd8' : NEG.has(r) ? '#d9534f' : '#5fb3b3';
    } else {
      // Untereinheit; hervorgehobene Liganden (Häm, ATP) in Elementfarben
      hex = f & 4 ? (e === 'C' ? '#f2e2c4' : CPK[e]) : this.entityColor(this.entityOf(i));
    }
    return new THREE.Color(hex);
  }

  build() {
    for (const g of [this.rotorInner, this.stator]) while (g.children.length) {
      const o = g.children.pop();
      o.geometry?.dispose();
      o.material?.dispose?.();
    }
    this.sphereSets = [];
    const sel = [[], []];
    const {flags} = this.a;
    for (let i = 0; i < this.n; i++) {
      const f = flags[i];
      let show = true;
      if (['band','cartoon'].includes(this.mode)) show = (f & 1) || (this.nucleic && (f & 8));
      if (show) sel[this.isRotor(i) ? 1 : 0].push(i);
    }
    sel.forEach((idx, k) => {
      if (!idx.length) return;
      const mesh = sphereMesh(idx.length);
      mesh.userData.atoms = idx;
      (k ? this.rotorInner : this.stator).add(mesh);
      this.sphereSets.push(mesh);
    });
    if (['band','cartoon'].includes(this.mode)) this.buildTubes();
    if (this.mode === 'stab') this.buildBonds();
    this.refresh();
  }

  radiusOf(i) {
    if (this.hidden.has(this.entityOf(i))) return 0;
    const e = this.elementOf(i);
    if (this.mode === 'stab') return e === 'FE' || e === 'ZN' || e === 'MG' ? 0.7 : 0.38;
    if (['band','cartoon'].includes(this.mode)) return this.a.flags[i] & 1 ? VDW[e] * (e === 'MG' || e === 'ZN' ? 0.8 : 0.42) : 0.55;
    return VDW[e] || 1.6;
  }

  refresh() {
    const {pos} = this.a;
    const c = new THREE.Color(), grey = new THREE.Color('#d6dadc');
    for (const mesh of this.sphereSets) {
      const idx = mesh.userData.atoms;
      const P = mesh.geometry.attributes.iPos, R = mesh.geometry.attributes.iRad, Col = mesh.geometry.attributes.iCol;
      idx.forEach((i, k) => {
        P.array.set([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]], k * 3);
        R.array[k] = this.radiusOf(i);
        c.copy(this.colorOf(i));
        if (this.focus !== null && this.entityOf(i) !== this.focus) c.lerp(grey, 0.78);
        if (this.mode === 'kalotte') c.multiplyScalar(this.ao[i]);
        Col.array.set([c.r, c.g, c.b], k * 3);
      });
      P.needsUpdate = R.needsUpdate = Col.needsUpdate = true;
    }
    for (const t of this.tubes || []) {
      const e = t.userData.entity;
      t.visible = !this.hidden.has(e);
      const col = new THREE.Color(this.color === 'element' ? '#8d9599' : this.color === 'basen' ? '#c9ced1' : this.color === 'polar' ? '#b9c0c3' : this.entityColor(e));
      if (this.focus !== null && e !== this.focus) col.lerp(grey, 0.78);
      t.material.color.copy(col);
    }
    for (const b of this.bondMeshes || []) {
      const ids = b.userData.atoms, col = b.instanceColor;
      ids.forEach((i, k) => {
        c.copy(this.colorOf(i));
        if (this.focus !== null && this.entityOf(i) !== this.focus) c.lerp(grey, 0.78);
        col.setXYZ(k, c.r, c.g, c.b);
        if (this.hidden.has(this.entityOf(i))) b.setMatrixAt(k, new THREE.Matrix4().makeScale(0, 0, 0));
        else b.setMatrixAt(k, b.userData.matrices[k]);
      });
      col.needsUpdate = true;
      b.instanceMatrix.needsUpdate = true;
    }
  }

  buildTubes() {
    this.tubes = [];
    const {pos, flags, chain} = this.a;
    const byChain = new Map();
    for (let i = 0; i < this.n; i++) if (flags[i] & 2) (byChain.get(chain[i]) || byChain.set(chain[i], []).get(chain[i])).push(i);
    for (const [ci, ids] of byChain) {
      const entity = this.meta.chains[ci].entity;
      const rotor = this.rotorEntities.has(entity);
      const assignment = new Map(this.meta.secondary || []);
      const runs = [];let run=null,previous=null;
      for (const i of ids) {
        const v = new THREE.Vector3(pos[i*3],pos[i*3+1],pos[i*3+2]);
        const type=this.mode==='cartoon' && !this.nucleic ? assignment.get(i)||'C' : 'C';
        const gap=previous && previous.distanceTo(v)>(this.nucleic?8.5:4.4);
        if(!run || gap || run.type!==type){
          run={type,points:!gap && previous?[previous.clone()]:[]};runs.push(run);
        }
        run.points.push(v);previous=v;
      }
      const m = new THREE.MeshStandardMaterial({color:this.entityColor(entity),roughness:.42,metalness:.02,side:THREE.DoubleSide});
      for(const {points,type} of runs){
        if(points.length<2) continue;
        const geo=type==='C' ? new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,false,'centripetal'),points.length*5,this.nucleic?.9:this.mode==='cartoon'?.28:.75,8,false) : ribbonGeometry(points,type);
        const mesh=new THREE.Mesh(geo,m);mesh.userData.entity=entity;mesh.userData.chain=ci;mesh.userData.secondary=type;
        (rotor?this.rotorInner:this.stator).add(mesh);this.tubes.push(mesh);
      }
    }
  }

  buildBonds() {
    const {pos} = this.a, {grid, cell, key} = this.grid;
    const pairs = [[], []];
    for (let i = 0; i < this.n; i++) {
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      const ei = this.elementOf(i);
      const gx = Math.floor(x / cell), gy = Math.floor(y / cell), gz = Math.floor(z / cell);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
        const l = grid.get(key(gx + dx, gy + dy, gz + dz));
        if (!l) continue;
        for (const j of l) {
          if (j <= i) continue;
          const ej = this.elementOf(j);
          if ((ei === 'MG' || ei === 'ZN') || (ej === 'MG' || ej === 'ZN')) continue;
          const lim = ei === 'S' || ej === 'S' ? 2.15 : ei === 'FE' || ej === 'FE' ? 2.3 : 1.9;
          const ex = pos[j * 3] - x, ey = pos[j * 3 + 1] - y, ez = pos[j * 3 + 2] - z;
          const d2 = ex * ex + ey * ey + ez * ez;
          if (d2 < lim * lim && d2 > 0.16) pairs[this.isRotor(i) ? 1 : 0].push(i, j);
        }
      }
    }
    this.bondMeshes = [];
    const geo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
    geo.translate(0, 0.5, 0);
    const up = new THREE.Vector3(0, 1, 0), a = new THREE.Vector3(), b = new THREE.Vector3(), mid = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    pairs.forEach((p, k) => {
      const count = p.length; // je Bindung zwei Hälften
      if (!count) return;
      const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({roughness: 0.4}), count);
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
      const atoms = [], matrices = [];
      for (let t = 0; t < p.length; t += 2) {
        const i = p[t], j = p[t + 1];
        a.fromArray(pos, i * 3); b.fromArray(pos, j * 3); mid.addVectors(a, b).multiplyScalar(0.5);
        for (const [from, to, atom] of [[a, mid, i], [b, mid, j]]) {
          const d = to.clone().sub(from), len = d.length();
          q.setFromUnitVectors(up, d.divideScalar(len));
          const m4 = new THREE.Matrix4().compose(from, q, s.set(0.16, len, 0.16));
          matrices.push(m4);
          atoms.push(atom);
        }
      }
      matrices.forEach((m4, n) => mesh.setMatrixAt(n, m4));
      mesh.userData.atoms = atoms;
      mesh.userData.matrices = matrices;
      mesh.frustumCulled = false;
      (k ? this.rotorInner : this.stator).add(mesh);
      this.bondMeshes.push(mesh);
    });
  }

  setMode(m) { this.mode = m; this.tubes = []; this.bondMeshes = []; this.build(); }
  setColor(c) { this.color = c; this.refresh(); }
  setFocus(e) { this.focus = e; this.refresh(); }
  toggleEntity(e) { this.hidden.has(e) ? this.hidden.delete(e) : this.hidden.add(e); this.refresh(); }

  // Strahl gegen Atome testen (Kugeln) bzw. gegen das Rückgrat (Band-Modus).
  pick(ray, clipPlane = null) {
    let best = null, bestT = Infinity;
    const inv = new THREE.Matrix4(), r = new THREE.Ray(), c = new THREE.Vector3(), {pos} = this.a;
    const test = (obj, ids, radiusFn) => {
      inv.copy(obj.matrixWorld).invert();
      r.copy(ray).applyMatrix4(inv);
      for (const i of ids) {
        const rad = radiusFn(i);
        if (!rad) continue;
        c.fromArray(pos, i * 3);
        const t = r.origin.clone().sub(c);
        const b = t.dot(r.direction), cc = t.lengthSq() - rad * rad, h = b * b - cc;
        if (h < 0) continue;
        let d = -b - Math.sqrt(h);
        if (d > 0 && d < bestT) {
          if (clipPlane && clipPlane.distanceToPoint(r.at(d,new THREE.Vector3()).applyMatrix4(obj.matrixWorld))<0){
            const localPlane=clipPlane.clone().applyMatrix4(inv),hit=r.intersectPlane(localPlane,new THREE.Vector3());
            if(!hit || hit.distanceToSquared(c)>rad*rad) continue;
            d=hit.clone().sub(r.origin).dot(r.direction);if(d<0 || d>=bestT) continue;
          }
          bestT = d; best = i;
        }
      }
    };
    for (const m of this.sphereSets) test(m, m.userData.atoms, i => this.radiusOf(i));
    if (['band','cartoon'].includes(this.mode) && this.tubes?.length) {
      const trace = [[], []];
      for (let i = 0; i < this.n; i++) if (this.a.flags[i] & 2) trace[this.isRotor(i) ? 1 : 0].push(i);
      test(this.stator, trace[0], i => this.hidden.has(this.entityOf(i)) ? 0 : 1.6);
      test(this.rotorInner, trace[1], i => this.hidden.has(this.entityOf(i)) ? 0 : 1.6);
    }
    if (this.mode === 'stab') {
      const all = [[], []];
      for (let i = 0; i < this.n; i++) all[this.isRotor(i) ? 1 : 0].push(i);
      test(this.stator, all[0], i => this.hidden.has(this.entityOf(i)) ? 0 : 0.9);
      test(this.rotorInner, all[1], i => this.hidden.has(this.entityOf(i)) ? 0 : 0.9);
    }
    return best;
  }

  legend() {
    if (this.color === 'element') {
      const present = [...new Set(Array.from(this.a.el, e => this.elements[e]))];
      return present.map(e => ({color: CPK[e], key: 'el:' + e, element: e}));
    }
    if (this.color === 'basen') return BASE_LEGEND.map(([c, l]) => ({color: c, label: l}));
    if (this.color === 'polar') return POLAR_LEGEND.map(([c, l]) => ({color: c, label: l}));
    return this.entityList.map(e => ({color: this.entityColor(e), entity: e, label: this.meta.entities[e], count: this.meta.chains.filter(c => c.entity === e).length}));
  }

  dispose() {
    this.group.traverse(o => { o.geometry?.dispose(); o.material?.dispose?.(); });
  }
}

