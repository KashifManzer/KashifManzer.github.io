import * as THREE from 'three/webgpu';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { positionWorld, texture, vec2 } from 'three/tsl';
import { loadLogos } from './logos';
import type { TechnologyId } from './technologies';

/** Fictional architectural installations, not actual employer premises. */
export async function createCity(low: boolean, signal: AbortSignal) {
  const group = new THREE.Group();
  const library = await loadLogos(low, signal);
  if (signal.aborted) throw signal.reason;
  const sculptures: THREE.Group[] = [];
  const box = new THREE.BoxGeometry(1, 1, 1);
  const rounded = new RoundedBoxGeometry(1, 1, 1, low ? 1 : 2, 0.045);
  const batches = new Map<THREE.Material, THREE.Matrix4[]>();
  const transform = new THREE.Object3D();
  const steel = new THREE.MeshStandardNodeMaterial({ color: '#526572', roughness: 0.38, metalness: 0.8 });
  const stone = new THREE.MeshStandardNodeMaterial({ color: '#202c37', roughness: 0.62, metalness: 0.18 });
  const dark = new THREE.MeshStandardNodeMaterial({ color: '#0b1721', roughness: 0.3, metalness: 0.65 });
  const glass = new THREE.MeshPhysicalNodeMaterial({ color: '#234858', roughness: 0.13, metalness: 0.65, clearcoat: 1, clearcoatRoughness: 0.08 });
  const warm = new THREE.MeshBasicNodeMaterial({ color: new THREE.Color('#f8d5a2').multiplyScalar(2) });
  function block(mat: THREE.Material, x:number,y:number,z:number,w:number,h:number,d:number,angle=0) {
    transform.position.set(x,y,z); transform.scale.set(w,h,d); transform.rotation.set(0,angle,0); transform.updateMatrix();
    if (!batches.has(mat)) batches.set(mat,[]);
    batches.get(mat)!.push(transform.matrix.clone());
  }
  function object(geometry:THREE.BufferGeometry, mat:THREE.Material, x:number,y:number,z:number) {
    const mesh=new THREE.Mesh(geometry,mat); mesh.position.set(x,y,z); mesh.castShadow=true; mesh.receiveShadow=true; group.add(mesh); return mesh;
  }
  function sculpture(id:TechnologyId,x:number,y:number,z:number,size:number,angle=0) {
    const source=library.get(id); if(!source) return;
    const sculpture=source.clone(true); sculpture.scale.setScalar(size);sculpture.position.set(x,y,z);sculpture.rotation.y=angle;
    sculpture.userData.baseY=y; sculpture.userData.district=z < -200 ? 2 : z < -100 ? 1 : 0; group.add(sculpture);sculptures.push(sculpture);
    object(new THREE.CylinderGeometry(size*.43,size*.45,.45,64),dark,x,.25,z);
  }
  // Sparse background skyline; all near-camera architecture below is explicitly composed.
  let seed=179;
  const random=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
  const windowCanvas=document.createElement('canvas');windowCanvas.width=256;windowCanvas.height=512;
  const wc=windowCanvas.getContext('2d')!;wc.fillStyle='#08121c';wc.fillRect(0,0,256,512);
  for(let y=0;y<512;y+=16)for(let x=0;x<256;x+=16){wc.fillStyle=random()>.88?'#665f50':random()>.65?'#192c39':'#0e1c28';wc.fillRect(x+3,y+3,7,9);}
  const windowMap=new THREE.CanvasTexture(windowCanvas);windowMap.colorSpace=THREE.SRGBColorSpace;windowMap.wrapS=windowMap.wrapT=THREE.RepeatWrapping;
  const facade=new THREE.MeshStandardNodeMaterial({map:windowMap,roughness:.3,metalness:.6});
  const windows=texture(windowMap,vec2(positionWorld.x.add(positionWorld.z).mul(.024),positionWorld.y.mul(.025)));
  facade.colorNode=windows;facade.emissiveNode=windows.rgb.mul(.18);
  for(let row=0;row<(low?9:15);row++)for(const side of [-1,1]){
    const x=side*(64+random()*26),z=50-row*34,h=30+random()*90,w=12+random()*15;
    block(facade,x,h/2,z,w,h,18,side*.12);
    block(steel,x,h+1,z,w+1,1.2,19,side*.12);
  }
  // Ground: quiet stone slabs with fine surface grain.
  const floorCanvas=document.createElement('canvas');floorCanvas.width=floorCanvas.height=256;
  const fc=floorCanvas.getContext('2d')!;fc.fillStyle='#90999e';fc.fillRect(0,0,256,256);
  for(let i=0;i<5500;i++){fc.fillStyle=`rgba(20,35,45,${random()*.15})`;fc.fillRect(random()*256,random()*256,1,1);}
  fc.fillStyle='#25343e';fc.fillRect(0,0,1,256);fc.fillRect(0,0,256,1);
  const floorMap=new THREE.CanvasTexture(floorCanvas);floorMap.wrapS=floorMap.wrapT=THREE.RepeatWrapping;floorMap.repeat.set(80,80);floorMap.colorSpace=THREE.SRGBColorSpace;
  const groundMat=new THREE.MeshStandardNodeMaterial({map:floorMap,color:'#283844',roughness:.24,metalness:.55});
  const ground=object(new THREE.PlaneGeometry(1200,800),groundMat,0,-.1,5);ground.rotation.x=-Math.PI/2;
  // One sculpture per stop, with unbroken stone behind its silhouette. The
  // surrounding skyline stays distant; the HTML chapter owns all typography.
  const districts = [
    { id: 'go', x: 20, y: 15, z: -19, size: 22, angle: -.16 },
    { id: 'kubernetes', x: 21, y: 15, z: -138, size: 17, angle: -.2 },
    { id: 'python', x: 19, y: 14, z: -254, size: 17, angle: -.15 },
  ] as const;
  for (const district of districts) {
    const { id, x, y, z, size, angle } = district;
    // A low terrace and one offset glass wing give depth without framing the logo.
    block(stone, x, .04, z - 4, 43, .12, 40);
    block(dark, x + 3, 24, z - 39, 43, 48, 5);
    block(glass, x + 30, 29, z - 47, 12, 58, 15);
    block(steel, x + 24, 29, z - 39, .3, 58, .4);
    block(warm, x + 24.3, 20, z - 38.7, .055, 24, .05);
    sculpture(id, x, y, z, size, angle);
  }
  // Source meshes own all nine shared logo resources, including those shown only
  // in the inspector. Core disposal traverses this hidden group exactly once.
  const assets = new THREE.Group();
  assets.visible = false;
  for (const source of library.values()) assets.add(source);
  group.add(assets);
  for(const [material,matrices] of batches){
    const mesh=new THREE.InstancedMesh(material===steel?rounded:box,material,matrices.length);
    matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.computeBoundingSphere();mesh.receiveShadow=true;
    // One shadowed key only; distant instances don't enter the shadow pass.
    mesh.castShadow=material===steel;group.add(mesh);
  }
  const moonlight=new THREE.DirectionalLight('#aacbdf',1.1);moonlight.position.set(-30,65,35);group.add(moonlight);
  group.add(new THREE.HemisphereLight('#abc4d4','#202635',0.6));
  const key=new THREE.SpotLight('#ffe6c5',450,130,.65,.7,1.5);key.castShadow=!low;
  key.shadow.mapSize.set(low?512:1024,low?512:1024);key.shadow.bias=-.0003;key.shadow.normalBias=.025;
  group.add(key,key.target);
  const rim=new THREE.PointLight('#74bce2',180,100,1.7);group.add(rim);
  return {
    group, library, sculptures,
    animate(time:number,reading:boolean,progress:number){
      const z=THREE.MathUtils.lerp(THREE.MathUtils.lerp(-20,-138,THREE.MathUtils.smoothstep(progress,13,14)),-254,THREE.MathUtils.smoothstep(progress,15,16));
      key.position.set(5,35,z+20);key.target.position.set(22,9,z);rim.position.set(35,19,z-15);
      sculptures.forEach(s=>{
        s.position.y=s.userData.baseY+(reading?0:Math.sin(time*.45)*.06);
        const districtProgress=Math.max(0,(progress-12.5)/2);
        s.visible=Math.abs(districtProgress-s.userData.district)<.85;
      });
    },
  };
}
