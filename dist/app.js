// CELLULA – Hauptprogramm: 3D-Ansicht, Bereiche (Zellen, Abläufe, Moleküle), Auswahl, Quiz, Teilen.
import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {sources, organelles, cellInfo, processes, molecules, residueNames, elementNames} from './knowledge.js';
import {buildCell} from './cells.js';
import {mitosis, meiosis} from './division.js';
import {proteinSynthesis} from './synthesis.js';
import {respiration, photosynthesis} from './energy.js';
import {loadMolecule} from './molecules.js';
import {arrangeLabels} from './layout.js';
import {SectionCaps} from './sections.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 850px)');
const BUILDERS = {mitose: mitosis, meiose: meiosis, proteinbiosynthese: proteinSynthesis, zellatmung: respiration, fotosynthese: photosynthesis};
const STEP_SECONDS = 6;
const METHOD = {'X-RAY DIFFRACTION': 'Röntgenstrukturanalyse', 'ELECTRON MICROSCOPY': 'Kryo-Elektronenmikroskopie', 'SOLUTION NMR': 'NMR-Spektroskopie'};

const state = {
  mode: 'zelle', cellKind: 'tier', part: null, tab: 'text',
  proc: null, procKey: 'mitose', T: 0, playing: false, speed: 1, step: -1,
  molKey: 'haemoglobin', mol: null, atom: null,
  quiz: null
};

function toast(s) { $('toast').textContent = s; $('toast').hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => $('toast').hidden = true, 3800); }
function sourceLink(k) { const s = sources[k]; return s ? `<a class="source-link" href="${s[0]}" target="_blank" rel="noopener noreferrer">${esc(s[1])} ↗<small>${new URL(s[0]).hostname}</small></a>` : ''; }
const fmt = n => n.toLocaleString('de-DE');

// ── 3D-Grundgerüst ────────────────────────────────────────────────────────────
const host = $('scene');
const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: false});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.localClippingEnabled = true;
host.prepend(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 2000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = !reduced;
controls.dampingFactor = 0.08;
controls.autoRotateSpeed = 0.65;
controls.minDistance = 2;
controls.maxDistance = 650;
scene.add(new THREE.HemisphereLight('#f5faff', '#6c818b', 1.4));
const sun = new THREE.DirectionalLight('#fff4e9', 2.4);
sun.position.set(8, 12, 10);
const fill = new THREE.DirectionalLight('#b9dcff', 1.1);
fill.position.set(-10, -4, -6);
const rim = new THREE.DirectionalLight('#d3f3ff', 1.8);
rim.position.set(2, 8, -12);
camera.add(sun, fill, rim);
scene.add(camera);
const roots = {zelle: new THREE.Group(), ablauf: new THREE.Group(), molekuel: new THREE.Group()};
Object.values(roots).forEach(r => scene.add(r));
const sections = new SectionCaps();scene.add(sections.group);

let dirty = true;
const markDirty = () => { dirty = true; };
controls.addEventListener('change', markDirty);

function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if (views.home && (state.mode !== 'ablauf')) frameModel('perspective', true);
  dirty = true;
}
new ResizeObserver(resize).observe(host);

const views = {};
function setView(pos, target, save = true) {
  camera.position.set(...pos);
  controls.target.set(...target);
  controls.update();
  if (save) views.home = {pos: [...pos], target: [...target]};
  dirty = true;
}
function resetView() { if (views.home) setView(views.home.pos, views.home.target, false); }

// ── Zellen ───────────────────────────────────────────────────────────────────
const cells = {};
let cell = null;

function cellFor(kind) {
  if (!cells[kind]) {
    const c = buildCell(kind);
    c.mats = new Map();
    for (const m of c.meshes) {
      const p = m.userData.part;
      if (!c.mats.has(p)) c.mats.set(p, new Set());
      c.mats.get(p).add(m.material);
      m.material.userData.baseOpacity ??= m.material.opacity;
      m.material.userData.baseTransparent ??= m.material.transparent;
      m.material.userData.baseDepthWrite ??= m.material.depthWrite;
    }
    cells[kind] = c;
  }
  return cells[kind];
}

function showCell(kind) {
  state.cellKind = kind;
  roots.zelle.clear();
  cell = cellFor(kind);
  roots.zelle.add(cell.group);
  cell.setOpen(+$('open').value / 100);
  cell.setExplode(+$('explode').value / 100);
  document.querySelectorAll('#cell-kind button').forEach(b => b.classList.toggle('active', b.dataset.cell === kind));
  buildOrganelleList();
  buildTags();
  if (state.part && !cell.parts.includes(state.part)) state.part = null;
  $('focus-part').disabled = !state.part;
  highlight();
  setView(kind === 'pflanze' ? [21, 13, 43] : [17, 11, 34], [0, -0.5, 0]);
  $('view-label').textContent = cellInfo[kind].name;
  $('view-eyebrow').textContent = 'EUKARYOTISCHE ZELLE';
  frameModel('perspective', true);updateClip();
}

function buildOrganelleList() {
  $('organelle-list').innerHTML = cell.parts.map(k => `<button class="item" data-part="${k}"><span class="dot" style="background:${organelles[k].color}"></span><span>${esc(organelles[k].name)}</span></button>`).join('');
  $('organelle-list').querySelectorAll('button').forEach(b => b.onclick = () => selectPart(b.dataset.part === state.part ? null : b.dataset.part));
}

function highlight() {
  if (!cell) return;
  const sel = state.quiz?.mode === 'name' ? state.quiz.target : state.part;
  const iso = sel && ($('isolate').checked || state.quiz?.mode === 'name');
  for (const [p, set] of cell.mats) {
    for (const m of set) {
      const on = p === sel;
      m.emissive.set(on ? (state.quiz?.mode === 'name' ? '#7a5a10' : '#3c6a5c') : '#000000');
      const dim = iso && !on;
      m.opacity = dim ? Math.min(0.1, m.userData.baseOpacity) : m.userData.baseOpacity;
      m.transparent = dim || m.userData.baseTransparent;
      m.depthWrite = dim ? false : m.userData.baseDepthWrite;
      m.needsUpdate = true;
    }
  }
  document.querySelectorAll('#organelle-list .item').forEach(b => b.classList.toggle('active', b.dataset.part === state.part));
  document.querySelectorAll('.tag3d').forEach(t => {
    t.classList.toggle('active', t.dataset.part === state.part);
    t.classList.toggle('dim', !!(iso && t.dataset.part !== sel));
  });
  dirty = true;
}

function selectPart(p) {
  state.part = p;
  $('focus-part').disabled = !p;
  highlight();
  renderDetail();
  updateHash();
}

let tags = [];
function buildTags() {
  const layer = $('labels-layer');
  layer.innerHTML = '';
  tags = cell.parts.filter(k => cell.anchors[k]).map(k => {
    const el = document.createElement('button');
    el.className = 'tag3d';
    el.type = 'button';
    el.dataset.part = k;
    el.textContent = organelles[k].name;
    el.onclick = () => state.quiz ? null : selectPart(k);
    layer.appendChild(el);
    return {el, k, anchor: cell.anchors[k]};
  });
}

const tmpV = new THREE.Vector3();
function updateTags() {
  const show = state.mode === 'zelle' && $('labels').checked && !state.quiz;
  $('labels-layer').hidden = !show;
  $('label-lines').style.display = show ? '' : 'none';
  if (!show) return;
  const w = host.clientWidth, h = host.clientHeight;
  const candidates = [];
  for (const t of tags) {
    t.el.style.display = '';
    t.el.style.maxWidth = `${Math.max(70, (w - 14 - (mobile.matches ? 58 : 72) - 20) / 2)}px`;
    t.anchor.getWorldPosition(tmpV);
    const clipped = clipAxis !== 'off' && clipPlane.distanceToPoint(tmpV) < 0;
    tmpV.project(camera);
    const visible = !clipped && tmpV.z > -1 && tmpV.z < 1 && Math.abs(tmpV.x) < 0.98 && Math.abs(tmpV.y) < 0.98;
    if (visible) candidates.push({t, x: (tmpV.x * 0.5 + 0.5) * w, y: (-tmpV.y * 0.5 + 0.5) * h,
      width: t.el.offsetWidth, height: t.el.offsetHeight, selected: t.k === state.part});
  }
  const priority=['zellkern','mitochondrium','chloroplast','zellmembran','vakuole','rer','golgi'];
  candidates.sort((a,b)=>Number(b.selected)-Number(a.selected) || (priority.indexOf(a.t.k)<0?99:priority.indexOf(a.t.k))-(priority.indexOf(b.t.k)<0?99:priority.indexOf(b.t.k)));
  const placed = arrangeLabels(candidates.slice(0,mobile.matches?4:8), w, h, {top: mobile.matches ? 125 : 145, bottom: 78, gap: 7, right: mobile.matches ? 58 : 72});
  const shown = new Set(placed.map(i => i.t));
  for (const t of tags) t.el.style.display = shown.has(t) ? '' : 'none';
  const paths = [];
  for (const i of placed) {
    i.t.el.style.transform = `translate(${i.labelX}px, ${i.labelY}px)`;
    const endX = i.side < 0 ? i.labelX + i.width : i.labelX;
    const endY = i.labelY + i.height / 2;
    paths.push(`<path class="${i.selected ? 'selected' : ''}" d="M${i.x},${i.y} L${endX},${endY}"/><circle cx="${i.x}" cy="${i.y}" r="2"/>`);
  }
  $('label-lines').setAttribute('viewBox', `0 0 ${w} ${h}`);
  $('label-lines').innerHTML = paths.join('');
}

// ── Abläufe ──────────────────────────────────────────────────────────────────
function showProcess(key, step = 0) {
  if (state.proc) { roots.ablauf.remove(state.proc.group); state.proc.group.traverse(o => { o.geometry?.dispose(); }); }
  state.procKey = key;
  state.proc = BUILDERS[key]();
  roots.ablauf.add(state.proc.group);
  state.T = step>0 ? Math.min(state.proc.steps-.0001,step+.5) : 0;
  state.step = -1;
  state.playing = false;
  const p = state.proc;
  if (p.view && typeof p.view === 'object' && p.view.pos) setView(p.view.pos, p.view.target);
  else {
    const t = procTarget(p);
    const off = p.viewOffset;
    setView([t.x + off[0], t.y + off[1], t.z + off[2]], [t.x, t.y, t.z]);
  }
  document.querySelectorAll('#process-list .item').forEach(b => b.classList.toggle('active', b.dataset.proc === key));
  $('step-list').innerHTML = processes[key].steps.map((s, i) => `<li><button data-step="${i}">${esc(s.name)}</button></li>`).join('');
  $('step-list').querySelectorAll('button').forEach(b => b.onclick = () => gotoStep(+b.dataset.step));
  $('view-label').textContent = processes[key].name;
  $('view-eyebrow').textContent = 'ABLAUF · ANIMATION';
  updateClip();
  applyProcess(0);
  renderDetail();
  updateHash();
}

function gotoStep(i) {
  const n = state.proc.steps;
  // A manual station shows its midpoint; preserve play/pause instead of
  // freezing on the preceding phase at the exact transition boundary.
  state.T = Math.max(0, Math.min(n - 0.0001, i + .5));
  applyProcess(time);
  syncPlayer();
  dirty = true;
}

function applyProcess(time) {
  const p = state.proc;
  if (!p) return;
  p.update(state.T, time);
  const s = Math.min(p.steps - 1, Math.floor(state.T));
  if (s !== state.step) {
    state.step = s;
    document.querySelectorAll('#step-list li').forEach((li, i) => { li.classList.toggle('active', i === s); li.classList.toggle('done', i < s); });
    $('p-step').textContent = processes[state.procKey].steps[s].name;
    $('p-count').textContent = `Schritt ${s + 1} von ${p.steps}`;
    if (state.mode === 'ablauf') { renderDetail(); updateHash(); }
  }
  $('p-time').value = Math.round(state.T / p.steps * 1000);
}

function syncPlayer() {
  $('p-play').textContent = state.playing ? '❚❚' : '▶';
  $('p-play').setAttribute('aria-label', state.playing ? 'Pause' : 'Abspielen');
}

// Ziel etwas tiefer legen, damit der Abspieler unten nichts verdeckt
const procTarget = p => p.view(state.T).add(new THREE.Vector3(0, -1.6, 0));
function followCamera(dt) {
  const p = state.proc;
  if (!p || typeof p.view !== 'function' || !$('follow').checked) return;
  const t = procTarget(p);
  const k = reduced ? 1 : 1 - Math.exp(-dt * 3);
  const d = t.clone().sub(controls.target).multiplyScalar(k);
  if (d.lengthSq() < 1e-8) return;
  controls.target.add(d);
  camera.position.add(d);
}

// ── Moleküle ─────────────────────────────────────────────────────────────────
let catalog = null;
const molCache = {};
let moleculeRequest = 0;
async function showMolecule(key) {
  const request = ++moleculeRequest;
  state.molKey = key;
  state.atom = null;
  document.querySelectorAll('#molecule-list .item').forEach(b => b.classList.toggle('active', b.dataset.mol === key));
  $('view-label').textContent = molecules[key].name;
  $('view-eyebrow').textContent = 'MOLEKÜL · PDB ' + (catalog?.molecules.find(m => m.key === key)?.pdb || '');
  renderDetail();
  updateHash();
  roots.molekuel.clear();
  state.mol = null;
  try {
    if (!catalog) catalog = await (await fetch('/assets/molecules.json')).json();
    const meta = catalog.molecules.find(m => m.key === key);
    $('view-eyebrow').textContent = 'MOLEKÜL · PDB ' + meta.pdb;
    if (!molCache[key]) {
      loading(true, 'Das Molekül wird geladen.', `${fmt(meta.atoms)} Atome aus PDB ${meta.pdb} …`);
      molCache[key] = await loadMolecule(meta, catalog.elements, {rotor: molecules[key].rotor});
    }
    if (request !== moleculeRequest || state.mode !== 'molekuel') return;
    loading(false);
    const mol = state.mol = molCache[key];
    roots.molekuel.add(mol.group);
    setView([mol.meta.radius * 1.1, mol.meta.radius * 0.5, mol.meta.radius * 3.3], [0, 0, 0]);
    syncMolControls();
    frameModel('perspective', true);
    updateClip();
    renderDetail();
  } catch (e) {
    if (request !== moleculeRequest || state.mode !== 'molekuel') return;
    loading(false);
    console.error(e);
    toast('Das Molekül konnte nicht geladen werden.');
  }
  dirty = true;
}

function syncMolControls() {
  const mol = state.mol;
  if (!mol) return;
  const opts = [['kette', 'Untereinheit']];
  if (mol.nucleic) opts.push(['basen', 'Basen']); else opts.push(['polar', 'Polarität']);
  opts.push(['element', 'Element']);
  $('mol-color').innerHTML = opts.map(([k, l]) => `<button data-mcolor="${k}" class="${mol.color === k ? 'active' : ''}">${l}</button>`).join('');
  $('mol-color').querySelectorAll('button').forEach(b => b.onclick = () => { mol.setColor(b.dataset.mcolor); syncMolControls(); updateClip(); dirty = true; });
  document.querySelectorAll('#mol-mode button').forEach(b => b.classList.toggle('active', b.dataset.mmode === mol.mode));
  $('rotor-row').hidden = !mol.axis;
  const items = mol.legend();
  $('mol-legend').innerHTML = items.map(it => it.entity !== undefined
    ? `<button data-entity="${it.entity}" class="${mol.focus === it.entity ? 'focus' : ''} ${mol.hidden.has(it.entity) ? 'off' : ''}" title="Antippen: hervorheben · Doppelt: aus-/einblenden"><i style="background:${it.color}"></i>${esc(it.label)}<small>${it.count > 1 ? it.count + '×' : ''}</small></button>`
    : `<div><i style="background:${it.color}"></i>${esc(it.label || elementNames[it.element] + ' (' + it.element.charAt(0) + it.element.slice(1).toLowerCase() + ')')}</div>`).join('');
  $('mol-legend').querySelectorAll('button').forEach(b => {
    const e = +b.dataset.entity;
    b.onclick = () => { mol.setFocus(mol.focus === e ? null : e); syncMolControls(); renderDetail(); dirty = true; };
    b.ondblclick = () => { mol.toggleEntity(e); mol.setFocus(null); syncMolControls(); updateClip(); dirty = true; };
  });
}

// ── Detailspalte ─────────────────────────────────────────────────────────────
function currentEntry() {
  if (state.mode === 'zelle') {
    if (state.part) return {key: 'o:' + state.part, ...organelles[state.part], eyebrow: cellInfo[state.cellKind].name.toUpperCase()};
    return {key: 'c:' + state.cellKind, ...cellInfo[state.cellKind], eyebrow: 'ZELLTYP'};
  }
  if (state.mode === 'ablauf') return {key: 'p:' + state.procKey, ...processes[state.procKey], eyebrow: 'ABLAUF'};
  return {key: 'm:' + state.molKey, ...molecules[state.molKey], eyebrow: 'MOLEKÜL'};
}

function renderDetail() {
  const e = currentEntry();
  $('detail-eyebrow').textContent = e.eyebrow;
  $('detail-term').textContent = e.term || '';
  $('detail-title').textContent = e.name;
  let meta = '';
  if (state.mode === 'zelle' && state.part) meta = `Vorkommen: ${organelles[state.part].cells.map(c => cellInfo[c].name).join(' und ')}`;
  if (state.mode === 'zelle' && !state.part) meta = 'Wähle einen Zellbestandteil im Modell oder im Explorer.';
  if (state.mode === 'ablauf') meta = `${processes[state.procKey].steps.length} Schritte · schematische Animation`;
  const mm = catalog?.molecules.find(m => m.key === state.molKey);
  if (state.mode === 'molekuel' && mm) meta = `PDB ${mm.pdb} · ${METHOD[mm.method] || mm.method}${mm.resolution ? ' · ' + String(mm.resolution).replace('.', ',') + ' Å' : ''} · ${fmt(mm.atoms)} Atome`;
  $('detail-meta').textContent = meta;
  document.querySelectorAll('.detail-tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === state.tab));
  let html = '';
  if (state.tab === 'text') {
    if (state.mode === 'ablauf' && state.step >= 0) {
      const s = processes[state.procKey].steps[state.step];
      html += `<div class="step-box"><b>${state.step + 1}. ${esc(s.name)}</b>${esc(s.text)}</div>`;
      html += `<p class="muted small">${esc(e.intro)}</p>`;
      if (state.proc?.legend) html += `<div class="legend">${state.proc.legend.map(l => `<div><i style="background:${l.color}"></i>${esc(l.label)}</div>`).join('')}</div>`;
    } else {
      if (state.mode === 'molekuel' && state.atom !== null && state.mol) html += pickInfo();
      if (e.facts?.[0]) html += `<div class="key-insight"><span class="eyebrow">AUF EINEN BLICK</span><p>${esc(e.facts[0])}</p></div>`;
      html += `<div class="reading-copy">${String(e.text || '').split(/(?<=\.)\s+(?=[A-ZÄÖÜ])/).reduce((out, sentence, i) => { if (i % 3 === 0) out.push([]); out[out.length - 1].push(sentence); return out; }, []).map(lines => `<p>${esc(lines.join(' '))}</p>`).join('')}</div>`;
      if (state.mode === 'molekuel' && state.mol) html += `<p class="small muted">Farben und Darstellung links ändern. Einträge der Legende antippen, um Untereinheiten hervorzuheben; doppelt antippen blendet sie aus.</p>`;
    }
  } else if (state.tab === 'facts') {
    html = `<ul>${(e.facts || []).map(f => `<li>${esc(f)}</li>`).join('')}</ul>`;
    if (state.mode === 'ablauf') html += `<ol class="small">${processes[state.procKey].steps.map(s => `<li><b>${esc(s.name)}</b></li>`).join('')}</ol>`;
  } else if (state.tab === 'sources') {
    if (state.mode === 'molekuel' && mm) {
      html += `<div class="cite">${esc(e.cite)} DOI: <a href="https://doi.org/${esc(e.doi)}" target="_blank" rel="noopener noreferrer">${esc(e.doi)}</a></div>`;
      html += `<a class="source-link" href="https://www.rcsb.org/structure/${mm.pdb}" target="_blank" rel="noopener noreferrer">RCSB PDB · Eintrag ${mm.pdb} ↗<small>Strukturdaten: wwPDB, CC0 1.0 (gemeinfrei)</small></a>`;
    }
    html += (e.src || []).map(sourceLink).join('');
    html += `<p class="small muted">Texte: eigene Zusammenfassungen auf Grundlage von OpenStax Biology 2e (Clark, Douglas, Choi), lizenziert unter <a href="https://creativecommons.org/licenses/by/4.0/deed.de" target="_blank" rel="noopener">CC BY 4.0</a>. Übersetzt, gekürzt und neu formuliert. ${state.mode === 'zelle' ? 'Das 3D-Modell ist schematisch; Größen und Farben sind nicht maßstäblich.' : state.mode === 'ablauf' ? 'Die Animation ist schematisch vereinfacht.' : ''}</p>`;
  } else if (state.tab === 'notes') {
    const notes = store.get('cellula-notes', {});
    html = `<textarea id="note" placeholder="Eigene Merksätze, Eselsbrücken, Prüfungsfragen …">${esc(notes[e.key] || '')}</textarea><p class="small muted">Wird automatisch nur auf diesem Gerät gespeichert.</p>`;
  }
  $('detail-content').innerHTML = html;
  const note = $('note');
  if (note) note.oninput = () => { const n = store.get('cellula-notes', {}); n[e.key] = note.value; if (!note.value) delete n[e.key]; store.set('cellula-notes', n); };
}

function pickInfo() {
  const mol = state.mol, i = state.atom;
  const ch = mol.meta.chains[mol.a.chain[i]], r = mol.residueOf(i), el = mol.elementOf(i);
  return `<div class="pick-box"><b>${esc(mol.meta.entities[ch.entity])}</b> · Kette ${esc(ch.id)}<br>${esc(residueNames[r] || r)} · ${esc(elementNames[el] || el)}</div>`;
}

document.querySelectorAll('.detail-tabs button').forEach(b => b.onclick = () => { state.tab = b.dataset.tab; renderDetail(); });

// ── Bereichswechsel ──────────────────────────────────────────────────────────
function setMode(mode, opts = {}) {
  if (state.quiz && mode !== 'zelle') stopQuiz();
  state.mode = mode;
  if (mode !== 'molekuel') { moleculeRequest++; loading(false); }
  document.body.dataset.mode = mode;
  $('focus-part').disabled = mode !== 'zelle' || !state.part;
  $('model-status').textContent = mode === 'molekuel' ? 'EXPERIMENTELLE STRUKTUR · PDB' : mode === 'ablauf' ? 'SCHEMATISCHE ANIMATION' : 'SCHEMATISCHES MODELL';
  document.querySelectorAll('.modes button').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  document.querySelectorAll('.side section[data-for]').forEach(s => s.hidden = s.dataset.for !== mode);
  Object.entries(roots).forEach(([k, r]) => r.visible = k === mode);
  $('player').hidden = mode !== 'ablauf';
  $('labels-layer').hidden = mode !== 'zelle';
  $('label-lines').style.display = mode === 'zelle' ? '' : 'none';
  $('side-eyebrow').textContent = {zelle: 'EXPLORER', ablauf: 'ANIMATIONEN', molekuel: 'PROTEIN DATA BANK'}[mode];
  $('hint').textContent = mode === 'ablauf' ? 'Leertaste: abspielen · ← →: Schritte · Ziehen: drehen' : mode === 'molekuel' ? 'Ziehen: drehen · Scrollen: zoomen · Atom antippen: erklären' : 'Ziehen: drehen · Zwei Finger: zoomen · Antippen: erklären';
  state.tab = state.tab === 'notes' || state.tab === 'sources' ? state.tab : 'text';
  if (mode === 'zelle') showCell(opts.cell || state.cellKind), opts.part !== undefined && selectPart(opts.part);
  if (mode === 'ablauf') showProcess(opts.proc || state.procKey, opts.step || 0);
  if (mode === 'molekuel') showMolecule(opts.mol || state.molKey);
  updateClip();
  renderDetail();
  updateHash();
  if (mobile.matches) $('side-panel').classList.remove('open');
}

// ── Auswahl per Klick ────────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let down = null;
renderer.domElement.addEventListener('pointerdown', e => { down = {x: e.clientX, y: e.clientY}; });
renderer.domElement.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
  const r = renderer.domElement.getBoundingClientRect();
  pointer.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  if (state.mode === 'zelle' && cell) {
    const hits = raycaster.intersectObjects([...cell.meshes,...sections.group.children], false).filter(h => h.object.material.opacity > 0.15 && isVisible(h.object) && (clipAxis === 'off' || clipPlane.distanceToPoint(h.point) >= 0));
    const part = hits[0]?.object.userData.part || null;
    if (state.quiz) return quizAnswer(part);
    selectPart(part);
  } else if (state.mode === 'molekuel' && state.mol) {
    const i = state.mol.pick(raycaster.ray, clipAxis === 'off' ? null : clipPlane);
    state.atom = i;
    state.mol.setFocus(i === null ? null : state.mol.entityOf(i));
    state.tab = 'text';
    syncMolControls();
    renderDetail();
    dirty = true;
  }
});
function isVisible(o) { for (; o; o = o.parent) if (!o.visible) return false; return true; }

// ── Quiz ─────────────────────────────────────────────────────────────────────
let progress = store.get('cellula-progress', {});
function quizStand() {
  const all = Object.keys(organelles), known = all.filter(k => (progress[k] || 0) >= 3).length;
  $('quiz-stand').textContent = `Gemeistert: ${known} von ${all.length} Bestandteilen`;
}
function startQuiz() {
  state.quiz = {mode: state.quiz?.mode || store.get('cellula-quizmode', 'name'), right: 0, total: 0};
  $('quiz-panel').hidden = false;
  $('quiz').setAttribute('aria-pressed', 'true');
  selectPart(null);
  nextQuestion();
}
function stopQuiz() {
  state.quiz = null;
  $('quiz-panel').hidden = true;
  $('quiz').setAttribute('aria-pressed', 'false');
  highlight();
  updateTags();
}
function nextQuestion() {
  const q = state.quiz;
  const pool = cell.parts;
  // Leitner: schwächere Bestandteile häufiger
  const weights = pool.map(k => 1 / (1 + (progress[k] || 0) * 1.5));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0), target = pool[0];
  for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) { target = pool[i]; break; } }
  if (target === q.target && pool.length > 1) target = pool[(pool.indexOf(target) + 1) % pool.length];
  q.target = target;
  q.done = false;
  document.querySelectorAll('.quiz .segmented button').forEach(b => b.classList.toggle('active', b.dataset.qmode === q.mode));
  $('quiz-feedback').textContent = '';
  if (q.mode === 'name') {
    $('quiz-question').textContent = 'Welcher Bestandteil ist markiert?';
    const opts = [target, ...pool.filter(k => k !== target).sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
    $('quiz-options').innerHTML = opts.map(k => `<button data-k="${k}">${esc(organelles[k].name)}</button>`).join('');
    $('quiz-options').querySelectorAll('button').forEach(b => b.onclick = () => quizAnswer(b.dataset.k, b));
  } else {
    $('quiz-question').textContent = `Tippe auf: ${organelles[target].name}`;
    $('quiz-options').innerHTML = '';
  }
  $('quiz-score').textContent = `${q.right} / ${q.total}`;
  highlight();
}
function quizAnswer(k, btn) {
  const q = state.quiz;
  if (!q || q.done || !k) return;
  q.done = true;
  q.total++;
  const ok = k === q.target;
  if (ok) q.right++;
  progress[q.target] = ok ? Math.min(5, (progress[q.target] || 0) + 1) : 0;
  store.set('cellula-progress', progress);
  quizStand();
  if (btn) {
    btn.classList.add(ok ? 'right' : 'wrong');
    if (!ok) $('quiz-options').querySelector(`[data-k="${q.target}"]`)?.classList.add('right');
  }
  $('quiz-feedback').innerHTML = ok ? `✓ Richtig: <b>${esc(organelles[q.target].name)}</b>` : `✗ Das war ${esc(organelles[k]?.name || '–')}. Gesucht: <b>${esc(organelles[q.target].name)}</b>`;
  $('quiz-score').textContent = `${q.right} / ${q.total}`;
  if (q.mode === 'find') { state.part = q.target; highlight(); }
  setTimeout(() => { if (state.quiz === q) { state.part = null; nextQuestion(); } }, ok ? 1300 : 2600);
}
$('quiz').onclick = () => state.quiz ? stopQuiz() : startQuiz();
$('quiz-close').onclick = stopQuiz;
document.querySelectorAll('.quiz .segmented button').forEach(b => b.onclick = () => { state.quiz.mode = b.dataset.qmode; store.set('cellula-quizmode', b.dataset.qmode); nextQuestion(); });

// ── Suche ────────────────────────────────────────────────────────────────────
const index = [
  ...Object.entries(cellInfo).map(([k, v]) => ({label: v.name, sub: 'Zelltyp', go: () => setMode('zelle', {cell: k, part: null})})),
  ...Object.entries(organelles).map(([k, v]) => ({label: v.name, sub: `Organell · ${v.term}`, go: () => setMode('zelle', {cell: v.cells.includes(state.cellKind) ? state.cellKind : v.cells[0], part: k})})),
  ...Object.entries(processes).flatMap(([k, v]) => [{label: v.name, sub: `Ablauf · ${v.term}`, go: () => setMode('ablauf', {proc: k})}, ...v.steps.map((s, i) => ({label: s.name, sub: `${v.name} · Schritt ${i + 1}`, go: () => setMode('ablauf', {proc: k, step: i})}))]),
  ...Object.entries(molecules).map(([k, v]) => ({label: v.name, sub: `Molekül · ${v.term}`, go: () => setMode('molekuel', {mol: k})}))
];
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
let hits = [], hl = 0;
function search() {
  const q = norm($('search').value.trim());
  if (!q) { $('results').hidden = true; return; }
  hits = index.filter(i => norm(i.label + ' ' + i.sub).includes(q)).slice(0, 12);
  hl = 0;
  $('results').innerHTML = hits.length ? hits.map((h, i) => `<button data-i="${i}" class="${i ? '' : 'hl'}">${esc(h.label)}<small>${esc(h.sub)}</small></button>`).join('') : '<p>Nichts gefunden.</p>';
  $('results').querySelectorAll('button').forEach(b => b.onclick = () => choose(+b.dataset.i));
  $('results').hidden = false;
}
function choose(i) { const h = hits[i]; if (!h) return; $('search').value = ''; $('results').hidden = true; $('search').blur(); h.go(); }
$('search').addEventListener('input', search);
$('search').addEventListener('keydown', e => {
  if (e.key === 'Enter') choose(hl);
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    hl = (hl + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % Math.max(1, hits.length);
    $('results').querySelectorAll('button').forEach((b, i) => b.classList.toggle('hl', i === hl));
  }
  if (e.key === 'Escape') { $('search').value = ''; $('results').hidden = true; $('search').blur(); }
});
document.addEventListener('click', e => { if (!e.target.closest('.search-wrap')) $('results').hidden = true; });

// ── Bild speichern ───────────────────────────────────────────────────────────
function credit() {
  if (state.mode === 'molekuel') {
    const mm = catalog?.molecules.find(m => m.key === state.molKey);
    const c = molecules[state.molKey].cite;
    return `Struktur: PDB ${mm?.pdb} · ${c.split(',')[0]} et al. (${c.match(/\((\d{4})\)/)?.[1]}) · RCSB PDB, CC0`;
  }
  if (state.mode === 'ablauf') return 'Schematische Animation · Texte nach OpenStax Biology 2e (CC BY 4.0)';
  return 'Schematisches 3D-Modell · nicht maßstäblich';
}
function titleText() {
  if (state.mode === 'ablauf') return `${processes[state.procKey].name} · ${processes[state.procKey].steps[state.step].name}`;
  if (state.mode === 'molekuel') return molecules[state.molKey].name;
  return state.part ? `${organelles[state.part].name} · ${cellInfo[state.cellKind].name}` : cellInfo[state.cellKind].name;
}

function snapshot(insta) {
  const W = insta ? 1080 : Math.round(host.clientWidth * 2), H = insta ? 1350 : Math.round(host.clientHeight * 2);
  const imgH = insta ? 1060 : H;
  const prevPR = renderer.getPixelRatio(), prevW = host.clientWidth, prevH = host.clientHeight;
  const camPos = camera.position.clone();
  // Preserve orientation and prevent cropping when switching to the export aspect.
  if (insta) {
    const factor = Math.max(1, Math.min(1, camera.aspect) / Math.min(1, W / imgH));
    camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);
  }
  renderer.setPixelRatio(1);
  renderer.setSize(W, imgH, false);
  camera.aspect = W / imgH;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(W / 2, imgH * 0.42, 50, W / 2, imgH * 0.42, Math.max(W, imgH) * 0.75);
  g.addColorStop(0, '#fafcfd'); g.addColorStop(0.55, '#edf3f6'); g.addColorStop(1, '#dde8ef');
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  x.drawImage(renderer.domElement, 0, insta ? 90 : 0);
  // Beschriftungen mitzeichnen
  if (state.mode === 'zelle' && $('labels').checked && !state.quiz) {
    x.font = `600 ${insta ? 22 : 24}px Inter, -apple-system, "Segoe UI", sans-serif`;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const entries = tags.map(t => {
      t.anchor.getWorldPosition(tmpV); const clipped=clipAxis!=='off' && clipPlane.distanceToPoint(tmpV)<0; tmpV.project(camera);
      return {t, x: (tmpV.x * 0.5 + 0.5) * W, y: (-tmpV.y * 0.5 + 0.5) * imgH,
        z: clipped?2:tmpV.z, width: x.measureText(t.el.textContent).width + 28, height: 34, selected: t.k === state.part};
    }).filter(i => i.z > -1 && i.z < 1 && i.x > 0 && i.x < W && i.y > 0 && i.y < imgH);
    for (const i of arrangeLabels(entries, W, imgH, {top: 100, bottom: 110, gap: 12})) {
      const py = i.labelY + (insta ? 90 : 0), cy = py + 17;
      x.strokeStyle = '#8ba6b5'; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(i.x, i.y + (insta ? 90 : 0)); x.lineTo(i.side < 0 ? i.labelX + i.width : i.labelX, cy); x.stroke();
      x.fillStyle = i.selected ? '#345966' : 'rgba(255,255,255,.96)';
      x.beginPath(); x.roundRect(i.labelX, py, i.width, 34, 8); x.fill(); x.stroke();
      x.fillStyle = i.selected ? '#fff' : '#223137';
      x.fillText(i.t.el.textContent, i.labelX + i.width / 2, cy);
    }
  }
  x.textAlign = 'left'; x.textBaseline = 'alphabetic';
  if (insta) {
    x.fillStyle = '#24493f';
    x.font = '600 30px Inter, -apple-system, "Segoe UI", sans-serif';
    x.fillText('C E L L U L A', 60, 70);
    x.fillStyle = '#6f807b';
    x.font = 'italic 26px Georgia, serif';
    x.textAlign = 'right';
    x.fillText('Omnis cellula e cellula', W - 60, 70);
    x.textAlign = 'left';
    x.fillStyle = '#213430';
    x.font = '600 52px Inter, -apple-system, "Segoe UI", sans-serif';
    x.fillText(titleText(), 60, 1220, W - 120);
    x.fillStyle = '#6f807b';
    x.font = '24px Inter, -apple-system, "Segoe UI", sans-serif';
    x.fillText(credit(), 60, 1275, W - 120);
    x.fillText('Zellbiologie in 3D · DGKN@Labs · Atlas 02', 60, 1310, W - 120);
  } else {
    x.fillStyle = 'rgba(255,255,255,.88)';
    x.fillRect(0, H - 92, W, 92);
    x.fillStyle = '#213430';
    x.font = '600 34px Inter, -apple-system, "Segoe UI", sans-serif';
    x.fillText(titleText(), 36, H - 48, W - 72);
    x.fillStyle = '#6f807b';
    x.font = '22px Inter, -apple-system, "Segoe UI", sans-serif';
    x.fillText(`CELLULA · ${credit()}`, 36, H - 16, W - 72);
  }
  camera.position.copy(camPos);
  renderer.setPixelRatio(prevPR);
  renderer.setSize(prevW, prevH);
  camera.aspect = prevW / prevH;
  camera.updateProjectionMatrix();
  dirty = true;
  c.toBlob(b => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `cellula-${norm(titleText()).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}${insta ? '-4x5' : ''}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, 'image/png');
}
$('snapshot').onclick = () => snapshot(false);
$('insta').onclick = () => snapshot(true);

// ── Links und Teilen ─────────────────────────────────────────────────────────
function hashFor() {
  if (state.mode === 'zelle') return `#zelle/${state.cellKind}${state.part ? '/' + state.part : ''}`;
  if (state.mode === 'ablauf') return `#ablauf/${state.procKey}/${Math.max(0, state.step) + 1}`;
  return `#molekuel/${state.molKey}`;
}
function updateHash() { const h = hashFor(); if (location.hash !== h) history.replaceState(null, '', h); }
function parseHash() {
  const [mode, a, b] = decodeURIComponent(location.hash.slice(1)).split('/');
  if (mode === 'zelle' && cellInfo[a]) return ['zelle', {cell: a, part: organelles[b]?.cells.includes(a) ? b : null}];
  if (mode === 'ablauf' && processes[a]) return ['ablauf', {proc: a, step: Math.max(0, Math.min(processes[a].steps.length - 1, (+b || 1) - 1))}];
  if (mode === 'molekuel' && molecules[a]) return ['molekuel', {mol: a}];
  return ['zelle', {cell: 'tier'}];
}
$('share').onclick = async () => {
  updateHash();
  const url = location.href;
  try {
    if (navigator.share && mobile.matches) await navigator.share({title: 'CELLULA · ' + titleText(), url});
    else { await navigator.clipboard.writeText(url); toast('Link kopiert.'); }
  } catch {}
};

// ── Oberfläche ───────────────────────────────────────────────────────────────
function loading(on, title, detail) {
  $('load-state').hidden = !on;
  if (title) $('load-title').textContent = title;
  if (detail) $('load-detail').textContent = detail;
}
document.querySelectorAll('.modes button').forEach(b => b.onclick = () => setMode(b.dataset.mode));
document.querySelectorAll('#cell-kind button').forEach(b => b.onclick = () => { stopQuizIfAny(); showCell(b.dataset.cell); renderDetail(); updateHash(); });
function stopQuizIfAny() { if (state.quiz) stopQuiz(); }
$('open').oninput = () => { $('open-value').textContent = $('open').value + ' %'; cell?.setOpen($('open').value / 100); dirty = true; };
$('explode').oninput = () => { $('explode-value').textContent = $('explode').value + ' %'; cell?.setExplode($('explode').value / 100); dirty = true; };
$('labels').onchange = () => { updateTags(); dirty = true; };
$('isolate').onchange = highlight;

$('process-list').innerHTML = Object.entries(processes).map(([k, p]) => `<button class="item" data-proc="${k}"><span>${esc(p.name)}</span><small>${esc(p.term)} · ${p.steps.length} Schritte</small></button>`).join('');
$('process-list').querySelectorAll('button').forEach(b => b.onclick = () => { showProcess(b.dataset.proc); if (mobile.matches) $('side-panel').classList.remove('open'); });
$('molecule-list').innerHTML = Object.entries(molecules).map(([k, m]) => `<button class="item" data-mol="${k}"><span>${esc(m.name)}</span><small>${esc(m.term)}</small></button>`).join('');
$('molecule-list').querySelectorAll('button').forEach(b => b.onclick = () => { showMolecule(b.dataset.mol); if (mobile.matches) $('side-panel').classList.remove('open'); });
document.querySelectorAll('#mol-mode button').forEach(b => b.onclick = () => { if (!state.mol) return; loading(true, 'Darstellung wird berechnet.', ' '); setTimeout(() => { state.mol.setMode(b.dataset.mmode); updateClip(); syncMolControls(); loading(false); dirty = true; }, 30); });

$('p-play').onclick = () => {
  if (!state.proc) return;
  if (state.T >= state.proc.steps - 0.001) state.T = 0;
  state.playing = !state.playing;
  syncPlayer();
};
$('p-prev').onclick = () => gotoStep(Math.max(0,state.step-1));
$('p-next').onclick = () => gotoStep(Math.min(state.proc.steps - 1, state.step + 1));
$('p-time').oninput = () => { state.T = $('p-time').value / 1000 * (state.proc.steps - 0.0001); state.playing = false; syncPlayer(); };
$('speed').oninput = () => { state.speed = $('speed').value / 100; $('speed-value').textContent = String(state.speed).replace('.', ',') + '×'; };
$('rotor').onchange = markDirty;
$('rotate').onclick = () => { controls.autoRotate = !controls.autoRotate; $('rotate').setAttribute('aria-pressed', controls.autoRotate); };
$('zoom-in').onclick = () => { camera.position.lerp(controls.target, 0.2); controls.update(); };
$('zoom-out').onclick = () => { camera.position.sub(controls.target).multiplyScalar(1.25).add(controls.target); controls.update(); };
$('reset').onclick = resetView;
$('open-side').onclick = () => $('side-panel').classList.add('open');
$('close-side').onclick = () => $('side-panel').classList.remove('open');

const modal = html => { $('modal-content').innerHTML = html; $('modal').showModal(); };
$('close-modal').onclick = () => $('modal').close();
$('modal').addEventListener('click', e => { if (e.target === $('modal')) $('modal').close(); });
$('about').onclick = () => modal(`<h2>Zellbiologie zum Anfassen.</h2>
<p>CELLULA zeigt Zellen, Lebensvorgänge und echte Moleküle in 3D – auf Deutsch, im Browser, ohne Konto. Gedacht für den Biologieunterricht, besonders Leistungskurse, für Studium und Lehre.</p>
<h3>Was enthalten ist</h3>
<p><b>Zellen:</b> schematische Modelle einer Tier- und einer Pflanzenzelle mit ${Object.keys(organelles).length} Bestandteilen, aufklappbar und entfaltbar. Größen und Farben sind nicht maßstäblich.<br>
<b>Abläufe:</b> ${Object.values(processes).map(p => p.name).join(', ')} – als schematische Schritt-Animationen.<br>
<b>Moleküle:</b> ${Object.values(molecules).map(m => m.name).join(', ')} – echte, experimentell bestimmte Atomkoordinaten.</p>
<h3>Quellen &amp; Lizenzen</h3>
<p class="small"><b>Texte:</b> eigene, frei formulierte Zusammenfassungen auf Grundlage von <a href="https://openstax.org/details/books/biology-2e" target="_blank" rel="noopener">Biology 2e</a> von Mary Ann Clark, Matthew Douglas und Jung Choi, OpenStax (Rice University), lizenziert unter <a href="https://creativecommons.org/licenses/by/4.0/deed.de" target="_blank" rel="noopener">CC BY 4.0</a>. Kostenlos verfügbar unter openstax.org. Änderungen: übersetzt, gekürzt, neu formuliert und ergänzt. Jeder Eintrag nennt unter „Quellen“ die verwendeten Kapitel. OpenStax und Rice University sind nicht mit CELLULA verbunden und billigen es nicht ausdrücklich.</p>
<p class="small"><b>Moleküle:</b> Atomkoordinaten aus der <a href="https://www.wwpdb.org" target="_blank" rel="noopener">Worldwide Protein Data Bank</a> über <a href="https://www.rcsb.org" target="_blank" rel="noopener">RCSB PDB</a>. Die PDB-Daten sind gemeinfrei (<a href="https://creativecommons.org/publicdomain/zero/1.0/deed.de" target="_blank" rel="noopener">CC0 1.0</a>). Die Original-Veröffentlichung jeder Struktur steht unter „Quellen“. Änderungen: Wasser und Wasserstoff entfernt, Koordinaten zentriert und gedreht, binär gepackt.</p>
<p class="small"><b>Programm:</b> CELLULA ist Open Source (MIT-Lizenz). 3D-Bibliothek: three.js (MIT). Zell- und Ablaufmodelle sind eigene Arbeit.</p>
<h3>Hinweise</h3>
<p class="small">Die Texte wurden KI-unterstützt erstellt und sind fachlich nicht redaktionell abgenommen. Modelle und Animationen vereinfachen stark. Bitte für Prüfungen das jeweilige Lehrbuch bzw. die Vorgaben der Lehrkraft heranziehen. Quellenabgleich: Oktober 2026.</p>
<h3>Datenschutz</h3>
<p class="small">Keine Cookies, kein Tracking, keine Werbung, keine externen Dienste. Notizen und Quiz-Lernstand bleiben ausschließlich im Speicher dieses Browsers.</p>
<h3>Tastenkürzel</h3>
<p class="small"><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> Zellen · Abläufe · Moleküle &nbsp; <kbd>/</kbd> Suche &nbsp; <kbd>Leertaste</kbd> abspielen &nbsp; <kbd>←</kbd> <kbd>→</kbd> Schritte &nbsp; <kbd>L</kbd> Beschriftungen &nbsp; <kbd>Q</kbd> Quiz &nbsp; <kbd>B</kbd> Bild &nbsp; <kbd>R</kbd> zurücksetzen &nbsp; <kbd>Esc</kbd> abbrechen</p>`);

document.addEventListener('keydown', e => {
  if (e.target.matches('input[type=search], textarea') || e.metaKey || e.ctrlKey || e.altKey || $('modal').open) return;
  const k = e.key.toLowerCase();
  if (k === '/') { e.preventDefault(); $('search').focus(); }
  else if (k === '1') setMode('zelle');
  else if (k === '2') setMode('ablauf');
  else if (k === '3') setMode('molekuel');
  else if (k === 'r') resetView();
  else if (k === 'b') snapshot(false);
  else if (k === 'l') { $('labels').checked = !$('labels').checked; updateTags(); dirty = true; }
  else if (k === 'q' && state.mode === 'zelle') $('quiz').click();
  else if (k === 'escape') { if (state.quiz) stopQuiz(); else if (state.mode === 'zelle') selectPart(null); }
  else if (state.mode === 'ablauf' && k === ' ') { e.preventDefault(); $('p-play').click(); }
  else if (state.mode === 'ablauf' && k === 'arrowright') $('p-next').click();
  else if (state.mode === 'ablauf' && k === 'arrowleft') $('p-prev').click();
});

// ── Offline ──────────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
  navigator.serviceWorker.addEventListener('message', e => {
    const d = e.data || {};
    if (d.type === 'offline-progress') $('offline-status').textContent = `${d.done} von ${d.total} Dateien gespeichert …`;
    if (d.type === 'offline-ready') $('offline-status').textContent = '✓ CELLULA ist jetzt offline verfügbar.';
    if (d.type === 'offline-error') $('offline-status').textContent = 'Speichern fehlgeschlagen. Bitte erneut versuchen.';
  });
} else $('offline').hidden = true;
$('offline').onclick = async () => {
  const reg = await navigator.serviceWorker.ready;
  const cat = catalog || await (await fetch('/assets/molecules.json')).json();
  reg.active?.postMessage({type: 'cache-all', urls: cat.molecules.map(m => '/assets/' + m.file)});
  $('offline-status').textContent = 'Wird gespeichert …';
};

// ── Studio: framing, orthogonal views and clipping ──────────────────────────
const clipPlane = new THREE.Plane();
let clipAxis = 'off';
function modelBounds(objects = [roots[state.mode]]) {
  const box = new THREE.Box3();
  for (const root of objects) {
    root.updateWorldMatrix(true, true);
    root.traverseVisible(o => {
      if (!o.geometry) return;
      if (o.isInstancedMesh) {
        o.computeBoundingBox();
        box.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld));
      } else {
        o.geometry.computeBoundingBox();
        box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
      }
    });
  }
  // Shader impostors have quad geometry; their atom positions live in attributes.
  if (state.mode === 'molekuel' && state.mol) {
    box.makeEmpty();const mol=state.mol, point=new THREE.Vector3();
    for(let i=0;i<mol.n;i++){
      if(mol.hidden.has(mol.entityOf(i))) continue;
      point.fromArray(mol.a.pos,i*3);
      point.applyMatrix4((mol.rotorEntities.has(mol.entityOf(i))?mol.rotorInner:mol.stator).matrixWorld);
      box.expandByPoint(point);
    }
    box.expandByScalar(2);
  }
  return box;
}
function frameModel(view = 'perspective', save = false, objects) {
  const box = modelBounds(objects);
  if (box.isEmpty()) return;
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const direction = new THREE.Vector3(...({perspective:[.45,.25,1],front:[0,0,1],top:[0,1,.001],side:[1,0,0]}[view])).normalize();
  const right=new THREE.Vector3().crossVectors(camera.up,direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right);
  const tanV=Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*.78,tanH=Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect*.88;
  let distance=0;
  const corner=new THREE.Vector3(),local=new THREE.Matrix4(),world=new THREE.Matrix4();
  const fit=p=>{corner.copy(p).sub(sphere.center);const depth=corner.dot(direction);distance=Math.max(distance,Math.abs(corner.dot(right))/tanH+depth,Math.abs(corner.dot(up))/tanV+depth);};
  if(state.mode==='molekuel' && state.mol){
    const mol=state.mol;
    for(let i=0;i<mol.n;i++){
      if(mol.hidden.has(mol.entityOf(i))) continue;
      const p=new THREE.Vector3().fromArray(mol.a.pos,i*3).applyMatrix4((mol.rotorEntities.has(mol.entityOf(i))?mol.rotorInner:mol.stator).matrixWorld);
      fit(p);
    }
    distance+=2/Math.min(tanH,tanV);
  }else for(const root of objects || [roots[state.mode]]) root.traverseVisible(o=>{
    const p=o.geometry?.attributes.position;if(!p || o.isSprite || o.material?.opacity<=.12) return;
    for(let i=0;i<(o.isInstancedMesh?o.count:1);i++){
      if(o.isInstancedMesh){o.getMatrixAt(i,local);world.multiplyMatrices(o.matrixWorld,local);}else world.copy(o.matrixWorld);
      for(let j=0;j<p.count;j++) fit(new THREE.Vector3().fromBufferAttribute(p,j).applyMatrix4(world));
    }
  });
  const pos=direction.multiplyScalar(Math.max(2,distance)*1.035).add(sphere.center);
  setView(pos.toArray(), sphere.center.toArray(), save);
  document.querySelectorAll('#camera-presets button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
}
function updateClip() {
  const enabled = clipAxis !== 'off';
  $('clip-controls').hidden = !enabled;
  const box = modelBounds();
  if (enabled && !box.isEmpty()) {
    const normal = new THREE.Vector3(); normal[clipAxis] = $('clip-flip').checked ? -1 : 1;
    const point = new THREE.Vector3();
    point[clipAxis] = THREE.MathUtils.lerp(box.min[clipAxis], box.max[clipAxis], +$('clip-position').value / 100);
    clipPlane.setFromNormalAndCoplanarPoint(normal, point);
  }
  Object.values(roots).forEach(root => root.traverse(o => {
    for (const m of (Array.isArray(o.material) ? o.material : o.material ? [o.material] : [])) {
      if (o.isSprite) continue;
      m.clippingPlanes = enabled ? [clipPlane] : [];
      if (m.isShaderMaterial) m.clipping = true;
      m.needsUpdate = true;
    }
  }));
  sections.update(roots[state.mode],clipPlane,enabled);
  $('clip-value').textContent = $('clip-position').value + ' %';
  dirty = true;
}
document.querySelectorAll('#camera-presets button').forEach(b => b.onclick = () => {
  if (state.mode === 'ablauf') $('follow').checked = false;
  frameModel(b.dataset.view);
});
$('focus-part').onclick = () => { if (state.mode === 'zelle' && state.part) frameModel('perspective', false, cell.meshes.filter(m => m.userData.part === state.part)); };
$('studio-dark').checked = store.get('cellula-dark-stage', false);
document.body.classList.toggle('dark-stage', $('studio-dark').checked);
if (reduced) $('rotor').checked = false;
$('studio-dark').onchange = () => { document.body.classList.toggle('dark-stage', $('studio-dark').checked); store.set('cellula-dark-stage', $('studio-dark').checked); };
document.querySelectorAll('#clip-axis button').forEach(b => b.onclick = () => {
  clipAxis = b.dataset.axis;
  document.querySelectorAll('#clip-axis button').forEach(x => x.classList.toggle('active', x === b));
  updateClip();
});
$('clip-position').oninput = $('clip-flip').onchange = updateClip;
for (const id of ['open', 'explode']) {
  const prior = $(id).oninput;
  $(id).oninput = e => { prior?.(e); if (id === 'explode') frameModel('perspective', true); updateClip(); };
}

// Rendering scale follows sustained frame time, with hysteresis. Saved manual
// settings are respected. Slow devices can keep the full scientific geometry.
let quality=store.get('cellula-quality','auto'),autoScale=mobile.matches?1:Math.min(devicePixelRatio,1.5);
let qualityFrames=0,qualityTime=0,qualityLast=0;
$('quality').value=['auto','low','high'].includes(quality)?quality:'auto';quality=$('quality').value;
function applyQuality(){
  const scale=quality==='low'?1:quality==='high'?Math.min(devicePixelRatio,2):autoScale;
  renderer.setPixelRatio(scale);renderer.setSize(host.clientWidth,host.clientHeight);
  $('quality-status').textContent=(quality==='auto'?'Automatisch · ':quality==='low'?'Sparsam · ':'Hoch · ')+`${Math.round(scale*100)} % Renderauflösung`;
  dirty=true;
}
$('quality').onchange=()=>{quality=$('quality').value;store.set('cellula-quality',quality);qualityFrames=0;qualityTime=0;applyQuality();};
applyQuality();
let lastSectionTime=0;
// ── Bildschleife ─────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let time = 0;
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.1);
  time += dt;
  if(quality==='auto' && !document.hidden && dt<.1){
    qualityFrames++;qualityTime+=dt;
    if(qualityTime>3 && time-qualityLast>5){
      const fps=qualityFrames/qualityTime,prior=autoScale;
      if(fps<32) autoScale=Math.max(.75,autoScale-.25);
      else if(fps>55) autoScale=Math.min(mobile.matches?1.5:Math.min(devicePixelRatio,2),autoScale+.25);
      if(prior!==autoScale) applyQuality();qualityFrames=0;qualityTime=0;qualityLast=time;
    }
  }
  let animate = controls.autoRotate;
  if (state.mode === 'ablauf' && state.proc) {
    if (state.playing) {
      state.T += dt * state.speed / STEP_SECONDS;
      if (state.T >= state.proc.steps) { state.T = state.proc.steps - 0.0001; state.playing = false; syncPlayer(); }
    }
    applyProcess(time);
    followCamera(dt);
    animate = true;
  }
  if (state.mode === 'molekuel' && state.mol?.axis && $('rotor').checked) { state.mol.rotate(dt * 1.6); animate = true; }
  if (state.quiz?.mode === 'name' && cell) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 5);
    for (const m of cell.mats.get(state.quiz.target) || []) m.emissive.setRGB(0.45 * pulse, 0.32 * pulse, 0.05 * pulse);
    animate = true;
  }
  if(clipAxis!=='off' && animate && time-lastSectionTime>.12){
    sections.update(roots[state.mode],clipPlane,true);lastSectionTime=time;
  }
  if (controls.update() || animate || dirty) {
    renderer.render(scene, camera);
    if (state.mode === 'zelle') updateTags();
    dirty = false;
  }
}

// ── Start ────────────────────────────────────────────────────────────────────
resize();
quizStand();
fetch('/assets/molecules.json').then(r => r.json()).then(c => { catalog = c; if (state.mode === 'molekuel') renderDetail(); }).catch(() => {});
const [m0, o0] = parseHash();
setMode(m0, o0);
if (state.mode !== 'molekuel') loading(false);
frame();
addEventListener('hashchange', () => { if (location.hash !== hashFor()) { const [m, o] = parseHash(); setMode(m, o); } });

