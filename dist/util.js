// CELLULA – gemeinsame Hilfsfunktionen für Zellen, Abläufe und Moleküle.
import * as THREE from 'three';

// Reproduzierbarer Zufall, damit Zellen bei jedem Laden gleich aussehen.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
// Abschnitt [a, b] einer Zeitachse auf 0…1 abbilden (weich).
export const seg = (u, a, b) => smooth((u - a) / (b - a));

export function mat(color, o = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    color, roughness: o.roughness ?? 0.48, metalness: 0,
    clearcoat: 0.22, clearcoatRoughness: 0.3,
    transparent: o.opacity !== undefined && o.opacity < 1, opacity: o.opacity ?? 1,
    side: o.side ?? THREE.FrontSide, depthWrite: o.depthWrite ?? !(o.opacity < 1),
    emissive: o.emissive ?? 0x000000, flatShading: !!o.flat
  });
  m.userData.baseOpacity = m.opacity;
  return m;
}

export function randomInSphere(r, R) {
  for (;;) {
    const v = new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1);
    if (v.lengthSq() <= 1) return v.multiplyScalar(R);
  }
}

export function randomUnit(r) {
  const z = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - z * z);
  return new THREE.Vector3(s * Math.cos(a), z, s * Math.sin(a));
}

// Glatte „Zufalls“-Verformung einer Kugeloberfläche (für Membranen und Vakuolen).
export function wobble(n, amp, seed = 0) {
  return 1 + amp * (Math.sin(2.1 * n.x + 1.3 + seed) * Math.sin(1.7 * n.y + 0.4 + seed * 0.7)
    + 0.8 * Math.sin(3.3 * n.z + 2 * n.y + seed * 1.3));
}

// Mehrere Zylinder zwischen frei setzbaren Punkten (Spindelfasern, Bindungen, Filamente).
export class Fibers {
  constructor(count, radius, material) {
    const g = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
    g.translate(0, 0.5, 0);
    this.mesh = new THREE.InstancedMesh(g, material, count);
    this.mesh.frustumCulled = false;
    this.radius = radius;
    this.m = new THREE.Matrix4();
    this.q = new THREE.Quaternion();
    this.d = new THREE.Vector3();
    this.s = new THREE.Vector3();
    this.up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < count; i++) this.hide(i);
  }
  set(i, a, b, r = this.radius) {
    this.d.subVectors(b, a);
    const len = this.d.length();
    if (len < 1e-5) return this.hide(i);
    this.q.setFromUnitVectors(this.up, this.d.divideScalar(len));
    this.m.compose(a, this.q, this.s.set(r, len, r));
    this.mesh.setMatrixAt(i, this.m);
  }
  hide(i) { this.m.makeScale(0, 0, 0); this.mesh.setMatrixAt(i, this.m); }
  done() { this.mesh.instanceMatrix.needsUpdate = true; }
}

// Textschild als Sprite (Moleküle wie ATP, Beschriftungen in Abläufen).
const spriteCache = new Map();
export function label(text, o = {}) {
  const key = [text, o.bg, o.color, o.size, o.bold].join('|');
  let tex = spriteCache.get(key);
  const fs = 64, pad = o.bg ? 26 : 8;
  const font = `${o.bold === false ? 500 : 650} ${fs}px Inter, -apple-system, "Segoe UI", sans-serif`;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2, h = fs + pad * (o.bg ? 1.2 : 1);
  if (!tex) {
    c.width = w; c.height = h;
    ctx.font = font;
    if (o.bg) {
      ctx.fillStyle = o.bg;
      const r = h / 2;
      ctx.beginPath(); ctx.roundRect(2, 2, w - 4, h - 4, r); ctx.fill();
    }
    ctx.fillStyle = o.color || (o.bg ? '#fff' : '#223137');
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (!o.bg) {
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.strokeText(text, w / 2, h / 2 + 3);
    }
    ctx.fillText(text, w / 2, h / 2 + 3);
    tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.userData = {w, h};
    spriteCache.set(key, tex);
  }
  const m = new THREE.SpriteMaterial({map: tex, transparent: true, depthTest: o.depthTest ?? true, depthWrite: false});
  const s = new THREE.Sprite(m);
  const size = o.size ?? 0.6;
  s.scale.set(size * tex.userData.w / tex.userData.h, size, 1);
  s.renderOrder = 10;
  s.userData.baseScale = s.scale.clone();
  return s;
}

// Deckkraft einer ganzen Gruppe setzen (Materialien werden beim ersten Aufruf geklont).
export function fade(obj, alpha) {
  obj.visible = alpha > 0.002;
  obj.traverse(o => {
    if (!o.material) return;
    if (!o.userData.ownMat) {
      o.material = o.material.clone();
      o.userData.ownMat = true;
      o.userData.alpha0 = o.material.opacity;
    }
    const a = o.userData.alpha0 * alpha;
    o.material.opacity = a;
    o.material.transparent = a < 0.999 || o.isSprite;
    if (!o.isSprite && !o.isLine) o.material.depthWrite = a > 0.6 && o.userData.alpha0 >= 0.999;
  });
}

export function curveTube(points, radius, material, seg = 4, closed = false) {
  const c = new THREE.CatmullRomCurve3(points, closed);
  return new THREE.Mesh(new THREE.TubeGeometry(c, Math.max(8, points.length * seg), radius, 6, closed), material);
}

