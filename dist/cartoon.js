// A closed rectangular ribbon following the backbone. Helices retain their
// helical trace; author-assigned sheet runs end in an arrow. Loops stay tubes.
import * as THREE from 'three';
export function ribbonGeometry(points,type){
  const curve=new THREE.CatmullRomCurve3(points,false,'centripetal');
  const steps=Math.max(8,(points.length-1)*6), frames=curve.computeFrenetFrames(steps,false);
  const positions=[],indices=[];
  for(let i=0;i<=steps;i++){
    const t=i/steps,p=curve.getPoint(t);
    let width=type==='E'?1.5:1.1;
    if(type==='E' && t>.75) width=t<.80?2.3:Math.max(.04,2.3*(1-t)/.2);
    for(const [s,h] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
      const v=p.clone().addScaledVector(frames.normals[i],s*width).addScaledVector(frames.binormals[i],h*.16);
      positions.push(v.x,v.y,v.z);
    }
    if(i<steps)for(let j=0;j<4;j++){const a=i*4+j,b=i*4+(j+1)%4,c=b+4,d=a+4;indices.push(a,b,d,b,c,d);}
  }
  indices.push(0,2,1,0,3,2);const end=steps*4;indices.push(end,end+1,end+2,end,end+2,end+3);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
