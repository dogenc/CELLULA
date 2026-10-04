// Actual triangle/plane intersections. Only closed contours receive a cap;
// intentionally open membranes keep their openings. Coordinates are world-space.
import * as THREE from 'three';
export function sectionGeometry(geometry, matrix, plane) {
  const p=geometry.attributes.position, ix=geometry.index;
  if (!p || !p.count) return null;
  const nodes=new Map(), edges=[];
  const scale=Math.max(1, geometry.boundingSphere?.radius || 1), epsilon=scale*1e-5;
  const key=v=>[v.x,v.y,v.z].map(x=>Math.round(x/epsilon)).join(',');
  const node=v=>{const k=key(v);if(!nodes.has(k)) nodes.set(k,{v,links:[]});return nodes.get(k);};
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  const count=ix?.count || p.count;
  for(let i=0;i<count;i+=3){
    const vs=[a,b,c];vs.forEach((v,j)=>v.fromBufferAttribute(p,ix?ix.getX(i+j):i+j).applyMatrix4(matrix));
    const ds=vs.map(v=>plane.distanceToPoint(v)-epsilon*3.7);
    if(ds.every(d=>d>=0)||ds.every(d=>d<=0)) continue;
    const hits=[];
    for(let j=0;j<3;j++){const k=(j+1)%3;if((ds[j]<0)!==(ds[k]<0)) hits.push(vs[j].clone().lerp(vs[k],ds[j]/(ds[j]-ds[k])));}
    if(hits.length!==2 || hits[0].distanceToSquared(hits[1])<epsilon*epsilon) continue;
    const n1=node(hits[0]),n2=node(hits[1]);const edge={a:n1,b:n2,used:false};
    n1.links.push(edge);n2.links.push(edge);edges.push(edge);
  }
  const normal=plane.normal.clone().negate();
  const u=new THREE.Vector3(Math.abs(normal.y)<.9?0:1,Math.abs(normal.y)<.9?1:0,0).cross(normal).normalize();
  const v=normal.clone().cross(u);
  const loops=[];
  for(const e of edges){
    if(e.used) continue;
    const start=e.a;let current=start,edge=e;const loop=[];let closed=false;
    for(let n=0;n<=edges.length;n++){
      loop.push(current.v);edge.used=true;current=edge.a===current?edge.b:edge.a;
      if(current===start){closed=true;break;}
      const available=current.links.filter(x=>!x.used);
      if(available.length!==1) break;
      edge=available[0];
    }
    if(closed && loop.length>=3){const flat=loop.map(p=>new THREE.Vector2(p.dot(u),p.dot(v)));loops.push({loop,flat,area:Math.abs(THREE.ShapeUtils.area(flat))});}
  }
  // Nested contours are holes (e.g. a cut through a torus).
  loops.sort((a,b)=>b.area-a.area);
  const inside=(p,poly)=>{let result=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x) result=!result;
  }return result;};
  loops.forEach((l,i)=>{l.parent=loops.slice(0,i).findLast(x=>inside(l.flat[0],x.flat));l.depth=l.parent?l.parent.depth+1:0;});
  const vertices=[];
  for(const l of loops){
    if(l.depth%2) continue;
    const holes=loops.filter(x=>x.parent===l && x.depth%2);
    const points=[...l.loop,...holes.flatMap(x=>x.loop)];
    for(const tri of THREE.ShapeUtils.triangulateShape(l.flat,holes.map(x=>x.flat))) for(const i of tri){
      const p=points[i];vertices.push(p.x+normal.x*epsilon,p.y+normal.y*epsilon,p.z+normal.z*epsilon);
    }
  }
  if(!vertices.length) return null;
  const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));result.computeVertexNormals();return result;
}
export class SectionCaps {
  constructor(){this.group=new THREE.Group();this.group.name='section-caps';}
  clear(){for(const o of [...this.group.children]){o.geometry.dispose();o.material.dispose();this.group.remove(o);}}
  update(root,plane,enabled){
    this.clear();if(!enabled) return;
    root.updateWorldMatrix(true,true);
    const local=new THREE.Matrix4(),world=new THREE.Matrix4();
    root.traverseVisible(o=>{
      if(!o.isMesh || !o.geometry || o.material?.isShaderMaterial || o.isSprite) return;
      const source=Array.isArray(o.material)?o.material[0]:o.material;
      if(!source || source.opacity<=.12) return;
      for(let i=0;i<(o.isInstancedMesh?o.count:1);i++){
        if(o.isInstancedMesh){o.getMatrixAt(i,local);world.multiplyMatrices(o.matrixWorld,local);}else world.copy(o.matrixWorld);
        const geo=sectionGeometry(o.geometry,world,plane);if(!geo) continue;
        const material=new THREE.MeshStandardMaterial({color:source.color || '#c3ccd7',roughness:.72,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
        const cap=new THREE.Mesh(geo,material);cap.userData.part=o.userData.part;this.group.add(cap);
      }
    });
  }
}
