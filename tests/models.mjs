import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
const require = createRequire(import.meta.url);
const {createCanvas} = require('@napi-rs/canvas');
globalThis.document = {createElement: () => createCanvas(1, 1)};
const {buildCell} = await import('../dist/cells.js');
const {mitosis, meiosis} = await import('../dist/division.js');
const {proteinSynthesis} = await import('../dist/synthesis.js');
const {respiration, photosynthesis} = await import('../dist/energy.js');
const {loadMolecule} = await import('../dist/molecules.js');
const {arrangeLabels} = await import('../dist/layout.js');
function valid(group) {
  group.updateMatrixWorld(true);
  group.traverse(o => {
    assert.ok(o.matrixWorld.elements.every(Number.isFinite), 'Non-finite transform');
    if (o.geometry?.attributes.position) assert.ok(o.geometry.attributes.position.array.every(Number.isFinite), 'Invalid vertex');
  });
}
for (const kind of ['tier', 'pflanze']) {
  const cell = buildCell(kind);
  for (const open of [0, .7, 1]) for (const explode of [0, .5, 1]) {cell.setOpen(open); cell.setExplode(explode); valid(cell.group);}
  for (const part of cell.parts) assert.ok(cell.anchors[part], `Missing label anchor: ${part}`);
  console.log('PASS cell geometry:', kind);
}
for (const builder of [mitosis, meiosis, proteinSynthesis, respiration, photosynthesis]) {
  const process = builder();
  for (let t=0;t<process.steps;t+=.5) {process.update(t, t); valid(process.group);}
  console.log('PASS process geometry:', builder.name);
}
const catalog = JSON.parse(await readFile('dist/assets/molecules.json', 'utf8'));
globalThis.fetch = async url => new Response(gunzipSync(await readFile('dist' + url)));
for (const meta of catalog.molecules) {
  const mol = await loadMolecule(meta, catalog.elements, {rotor:meta.key === 'atp-synthase' ? [4,5,7] : []});
  for (const [i,type] of meta.secondary || []) {assert.ok(i>=0 && i<mol.n && (mol.a.flags[i]&2),'Secondary assignment must reference a backbone atom');assert.ok(['H','E','C'].includes(type));}
  for (const mode of ['kalotte','cartoon','band','stab']) {mol.setMode(mode); valid(mol.group);assert.ok(mol.sphereSets.length || mol.tubes.length);}
  if(meta.secondary?.some(x=>x[1]==='E')) {mol.setMode('cartoon');assert.ok(mol.tubes.some(m=>m.userData.secondary==='E'),'Missing sheet arrows');}
  if(meta.secondary?.some(x=>x[1]==='H')) {mol.setMode('cartoon');assert.ok(mol.tubes.some(m=>m.userData.secondary==='H'),'Missing helix ribbons');}
  console.log('PASS molecule:', meta.key, mol.n, 'atoms');
}
for (const [width,height] of [[390,460],[760,700],[1080,1060]]) {
  const input=Array.from({length:15},(_,k)=>({x:k%2?width*.6:width*.4,y:height*.5,width:Math.min(150,width/2-28),height:28,selected:k===4}));
  const result=arrangeLabels(input,width,height);
  assert.ok(result.some(i=>i.selected),'Selected label must be retained');
  for (const side of [-1,1]) {
    const column=result.filter(i=>i.side===side).sort((a,b)=>a.labelY-b.labelY);
    for (let i=0;i<column.length;i++) {
      const item=column[i];assert.ok(item.labelY>=105 && item.labelY+item.height<=height-74);
      assert.ok(item.labelX>=0 && item.labelX+item.width<=width);
      if (i) assert.ok(column[i-1].labelY+column[i-1].height+8<=item.labelY);
    }
  }
}
console.log('PASS label collisions: mobile, desktop and export');

const THREE=await import('three');
const {sectionGeometry,SectionCaps}=await import('../dist/sections.js');
const identity=new THREE.Matrix4(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),0);
const cap=sectionGeometry(new THREE.BoxGeometry(2,2,2),identity,plane);
assert.ok(cap,'Cube must have a closed section');
let area=0;const pa=cap.attributes.position;
for(let i=0;i<pa.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(pa,i),b=new THREE.Vector3().fromBufferAttribute(pa,i+1),c=new THREE.Vector3().fromBufferAttribute(pa,i+2);area+=b.sub(a).cross(c.sub(a)).length()/2;}
assert.ok(Math.abs(area-4)<.001,'Cube cap must fill the correct area');
const ring=sectionGeometry(new THREE.TorusGeometry(2,.5,16,48),identity,plane);
assert.ok(ring,'Torus must receive an annular section');
const rp=ring.attributes.position;
// Triangles must leave the central torus opening empty.
for(let i=0;i<rp.count;i+=3){const center=new THREE.Vector3();for(let j=0;j<3;j++)center.add(new THREE.Vector3().fromBufferAttribute(rp,i+j));assert.ok(center.divideScalar(3).length()>1.45,'A section must preserve holes');}
const capped=new SectionCaps();const source=new THREE.Group();source.add(new THREE.Mesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshStandardMaterial()));capped.update(source,plane,true);assert.ok(capped.group.children.length);capped.update(source,plane,false);assert.equal(capped.group.children.length,0);
console.log('PASS closed cuts, preserved holes and cap disposal');
