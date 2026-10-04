// CELLULA: lädt Strukturen aus der Protein Data Bank (wwPDB, CC0 1.0) und packt sie
// in kompakte Binärpakete für den Browser.
//
//   node scripts/prepare_molecules.mjs            # lädt von files.rcsb.org (Zwischenspeicher scripts/.cache-pdb/)
//
// Ausgabe: dist/assets/molecules.json (Katalog) und dist/assets/molecules/<key>.bin.gz
// Binärformat je Molekül (N Atome, little endian):
//   Int16[3N]  Koordinaten x,y,z in 1/20 Å, um den Schwerpunkt zentriert
//   Uint8[N]   Element (Index in ELEMENTS)
//   Uint8[N]   Kette (Index in chains; Kette + Entität, Liganden also getrennt vom Protein)
//   Uint8[N]   Rest (Index in residues)
//   Uint8[N]   Flags: 1 = HETATM, 2 = Spur-Atom (CA bzw. C4'), 4 = hervorgehobener Ligand,
//              8 = Seitenkette bzw. Base (nicht Teil des Rückgrats)
// Wasser, Wasserstoff, alternative Positionen (außer A) und weitere NMR-Modelle werden verworfen.
import {mkdirSync, readFileSync, writeFileSync, existsSync} from 'node:fs';
import {gzipSync, gunzipSync} from 'node:zlib';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, 'scripts', '.cache-pdb');
const OUT = join(ROOT, 'dist', 'assets');
const SCALE = 20;
const ELEMENTS = ['C', 'N', 'O', 'S', 'P', 'FE', 'ZN', 'MG', 'X'];
const BACKBONE = new Set(['N', 'CA', 'C', 'O', 'OXT', 'P', 'OP1', 'OP2', 'OP3', "O5'", "C5'", "C4'", "O4'", "C3'", "O3'", "C2'", "C1'"]);

// Auswahl, deutsche Bezeichnungen der Untereinheiten und hervorgehobene Liganden.
const MOLECULES = [
  {key: 'dna', pdb: '1BNA', entities: {1: 'DNA-Strang'}, highlight: []},
  {key: 'haemoglobin', pdb: '4HHB', entities: {1: 'α-Globin', 2: 'β-Globin', 3: 'Häm-Gruppe', 4: 'Phosphat'}, highlight: ['HEM']},
  {key: 'insulin', pdb: '3I40', entities: {1: 'A-Kette', 2: 'B-Kette'}, highlight: []},
  {key: 'antikoerper', pdb: '1IGT', entities: {1: 'Leichte Kette', 2: 'Schwere Kette', 3: 'Zuckerkette', 4: 'Zuckerkette'}, highlight: []},
  {key: 'atp-synthase', pdb: '6OQR', entities: {1: 'δ-Untereinheit', 2: 'α-Untereinheit', 3: 'b-Untereinheit (Stator)', 4: 'ε-Untereinheit', 5: 'γ-Untereinheit (Achse)', 6: 'β-Untereinheit', 7: 'c-Ring (Rotor)', 8: 'a-Untereinheit', 9: 'ATP', 10: 'Magnesium', 11: 'ADP', 12: 'Phosphat'}, highlight: ['ATP', 'ADP']}
];

function tokens(line) {
  const out = [];
  let i = 0;
  while (i < line.length) {
    while (line[i] === ' ' || line[i] === '\t') i++;
    if (i >= line.length) break;
    const q = line[i];
    if (q === '"' || q === "'") {
      // In mmCIF endet ein Zitat nur, wenn danach ein Leerzeichen oder das Zeilenende folgt.
      let j = i + 1;
      while (j < line.length && !(line[j] === q && (j + 1 === line.length || line[j + 1] === ' '))) j++;
      out.push(line.slice(i + 1, j));
      i = j + 1;
    } else {
      let j = i;
      while (j < line.length && line[j] !== ' ' && line[j] !== '\t') j++;
      out.push(line.slice(i, j));
      i = j;
    }
  }
  return out;
}

async function load(pdb) {
  mkdirSync(CACHE, {recursive: true});
  const file = join(CACHE, `${pdb}.cif.gz`);
  if (!existsSync(file)) {
    const res = await fetch(`https://files.rcsb.org/download/${pdb}.cif.gz`);
    if (!res.ok) throw Error(`${pdb}: HTTP ${res.status}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return gunzipSync(readFileSync(file)).toString('utf8');
}

function field(text, name) {
  const m = text.match(new RegExp(`^${name.replace('.', '\\.')}\\s+(.+)$`, 'm'));
  return m ? tokens(m[1])[0] : null;
}

function parseAtoms(text) {
  const lines = text.split('\n');
  const start = lines.findIndex(l => l.startsWith('_atom_site.group_PDB'));
  const cols = [];
  let i = start;
  for (; lines[i].startsWith('_atom_site.'); i++) cols.push(lines[i].trim().slice(11));
  const c = Object.fromEntries(cols.map((n, k) => [n, k]));
  const atoms = [];
  for (; i < lines.length && (lines[i].startsWith('ATOM') || lines[i].startsWith('HETATM')); i++) {
    const t = tokens(lines[i]);
    if (t[c.pdbx_PDB_model_num] !== '1') continue;
    const alt = t[c.label_alt_id];
    if (alt !== '.' && alt !== 'A') continue;
    const el = t[c.type_symbol].toUpperCase();
    const res = t[c.label_comp_id];
    if (el === 'H' || el === 'D' || res === 'HOH') continue;
    atoms.push({
      het: t[c.group_PDB] === 'HETATM', el, name: t[c.label_atom_id], res,
      chain: t[c.auth_asym_id], entity: +t[c.label_entity_id], labelChain: t[c.label_asym_id], seq: +t[c.label_seq_id],
      x: +t[c.Cartn_x], y: +t[c.Cartn_y], z: +t[c.Cartn_z]
    });
  }
  return atoms;
}

// Author-assigned helices and sheets from the original mmCIF record.
function secondaryRanges(text) {
  const ranges = [];
  for (const [category, kind] of [['_struct_conf.', 'H'], ['_struct_sheet_range.', 'E']]) {
    const lines = text.split('\n');
    const start = lines.findIndex(l => l.startsWith(category));
    if (start < 0) continue;
    const cols = []; let i = start;
    for (; lines[i]?.startsWith(category); i++) cols.push(lines[i].trim().slice(category.length));
    // A single record may use key/value syntax instead of a loop.
    const rows = cols.some(c => /\s/.test(c))
      ? [Object.fromEntries(lines.slice(start,i).map(l => {const t=tokens(l); return [t[0].slice(category.length),t[1]];}))]
      : (() => {const result=[]; for (;i<lines.length && lines[i].trim() && !/^(#|_|loop_)/.test(lines[i]);i++) {
          const t=tokens(lines[i]); if(t.length===cols.length) result.push(Object.fromEntries(cols.map((c,k)=>[c,t[k]])));
        } return result;})();
    for (const row of rows) {
      if (kind === 'H' && !row.conf_type_id?.startsWith('HELX')) continue;
      const begin=+row.beg_label_seq_id, end=+row.end_label_seq_id;
      if (Number.isFinite(begin) && Number.isFinite(end)) ranges.push({chain:row.beg_label_asym_id,begin,end,kind});
    }
  }
  return ranges;
}

function principalAxes(atoms, cx, cy, cz) {
  // Längste Ausdehnung auf die y-Achse legen (Potenzmethode auf der Kovarianzmatrix).
  const m = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const a of atoms) {
    const d = [a.x - cx, a.y - cy, a.z - cz];
    for (let r = 0; r < 3; r++) for (let s = 0; s < 3; s++) m[r][s] += d[r] * d[s];
  }
  const mul = v => m.map(row => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
  const norm = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
  let a = norm([1, 0.3, 0.2]);
  for (let k = 0; k < 100; k++) a = norm(mul(a));
  let b = norm([0.2, 1, 0.3]);
  for (let k = 0; k < 100; k++) {
    b = mul(b);
    const d = b[0] * a[0] + b[1] * a[1] + b[2] * a[2];
    b = norm(b.map((x, j) => x - d * a[j]));
  }
  const c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  return [b, a, c]; // neue x-, y-, z-Achse
}

async function build(spec) {
  const text = await load(spec.pdb);
  const atoms = parseAtoms(text);
  const n = atoms.length;
  const ranges = secondaryRanges(text);
  const secondary = atoms.flatMap((a,i) => !a.het && a.name === 'CA' ? [[i, ranges.find(r => r.chain === a.labelChain && a.seq >= r.begin && a.seq <= r.end)?.kind || 'C']] : []);
  let cx = 0, cy = 0, cz = 0;
  for (const a of atoms) { cx += a.x; cy += a.y; cz += a.z; }
  cx /= n; cy /= n; cz /= n;
  const [ax, ay, az] = principalAxes(atoms, cx, cy, cz);
  const chains = [], chainIndex = new Map(), residues = [], resIndex = new Map();
  const buf = Buffer.alloc(n * 10);
  let radius = 0;
  atoms.forEach((a, k) => {
    const d = [a.x - cx, a.y - cy, a.z - cz];
    const p = [ax, ay, az].map(v => v[0] * d[0] + v[1] * d[1] + v[2] * d[2]);
    radius = Math.max(radius, Math.hypot(...p));
    p.forEach((v, j) => buf.writeInt16LE(Math.round(v * SCALE), (k * 3 + j) * 2));
    // Liganden (z. B. Häm) tragen die Kettenbezeichnung ihres Proteins, bilden hier aber eine eigene Gruppe.
    const ck = `${a.chain}|${a.entity}`;
    if (!chainIndex.has(ck)) { chainIndex.set(ck, chains.length); chains.push({id: a.chain, entity: a.entity, atoms: 0}); }
    const ci = chainIndex.get(ck);
    chains[ci].atoms++;
    if (!resIndex.has(a.res)) { resIndex.set(a.res, residues.length); residues.push(a.res); }
    const el = ELEMENTS.indexOf(a.el);
    const trace = !a.het && (a.name === 'CA' || a.name === "C4'");
    buf[n * 6 + k] = el < 0 ? ELEMENTS.length - 1 : el;
    buf[n * 7 + k] = ci;
    buf[n * 8 + k] = resIndex.get(a.res);
    buf[n * 9 + k] = (a.het ? 1 : 0) | (trace ? 2 : 0) | (spec.highlight.includes(a.res) ? 4 : 0) | (!a.het && !BACKBONE.has(a.name) ? 8 : 0);
  });
  if (chains.length > 255 || residues.length > 255) throw Error(`${spec.pdb}: zu viele Ketten oder Restarten`);
  const gz = gzipSync(buf, {level: 9});
  writeFileSync(join(OUT, 'molecules', `${spec.key}.bin.gz`), gz);
  const entities = {};
  for (const ch of chains) entities[ch.entity] ??= spec.entities[ch.entity] || `Entität ${ch.entity}`;
  const method = field(text, '_exptl.method');
  const res = field(text, '_refine.ls_d_res_high') || field(text, '_em_3d_reconstruction.resolution');
  console.log(`${spec.pdb} ${spec.key}: ${n} Atome, ${chains.length} Ketten, ${(gz.length / 1024).toFixed(0)} KB`);
  return {
    key: spec.key, pdb: spec.pdb, file: `molecules/${spec.key}.bin.gz`, atoms: n, scale: SCALE,
    radius: +radius.toFixed(1), title: field(text, '_struct.title'), method,
    resolution: res && res !== '.' && res !== '?' ? +res : null,
    deposited: field(text, '_pdbx_database_status.recvd_initial_deposition_date'),
    chains, entities, residues, secondary
  };
}

mkdirSync(join(OUT, 'molecules'), {recursive: true});
const catalog = {elements: ELEMENTS, source: 'RCSB PDB / wwPDB, CC0 1.0', molecules: []};
for (const spec of MOLECULES) catalog.molecules.push(await build(spec));
writeFileSync(join(OUT, 'molecules.json'), JSON.stringify(catalog));
console.log('fertig: dist/assets/molecules.json');

