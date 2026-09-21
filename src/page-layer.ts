import * as THREE from 'three';
import {records} from './data';
import {contentLibrary} from './content-library';
type Slot={mesh:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;key:string;identity:string;generation:number};
// Content only: receives the exact upstream box matrix. No scene/camera geometry parameters are changed.
function statusCanvas(label:string){const c=document.createElement("canvas");c.width=640;c.height=360;const x=c.getContext("2d")!;x.fillStyle="#efede7";x.fillRect(0,0,640,360);x.fillStyle="#232a28";x.font="24px MiSans,sans-serif";x.fillText(label,32,175);return c;}
export class PageLayer {
 private slots:Slot[]=[];private used=new Set<Slot>();
 private prepared=new Map<string,HTMLCanvasElement>();
 prepare(index:number,canvas:HTMLCanvasElement){const p=records[index]?.page;if(p){this.prepared.set(`${p.pageId}/${p.version}`,canvas);while(this.prepared.size>3)this.prepared.delete(this.prepared.keys().next().value!);}}
 constructor(private scene:THREE.Scene){}
 begin(){this.used.clear();}
 draw(index:number,matrix:THREE.Matrix4,high=false){
  const page=records[index]?.page;if(!page||this.used.size>=512)return;
  const identity=`${page.pageId}/${page.version}`;
  // Ownership follows the real page, not the order selected/outgoing/instances are drawn.
  // Never steal a keyed slot: its page may be drawn later in this same frame.
  let slot=this.slots.find(s=>s.identity===identity)??this.slots.find(s=>!s.key);
  if(!slot&&this.slots.length>=512)return;
  if(!slot){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false,side:THREE.FrontSide}));mesh.matrixAutoUpdate=false;mesh.raycast=()=>{};this.scene.add(mesh);slot={mesh,key:'',identity:'',generation:0};this.slots.push(slot);}
  slot.identity=identity;this.used.add(slot);
  const key=`${page.pageId}/${page.version}/${high}`;
  if(slot.key!==key){const samePage=slot.key.split("/").slice(0,-1).join("/")===key.split("/").slice(0,-1).join("/");slot.key=key;const generation=++slot.generation;if(!samePage){slot.mesh.material.map?.dispose();slot.mesh.material.map=new THREE.CanvasTexture(statusCanvas(`加载中 · 第 ${page.number} 页`));}slot.mesh.material.needsUpdate=true;
   const current=()=>slot.generation===generation&&slot.key===key;
   const install=(canvas:HTMLCanvasElement)=>{if(!current())return;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;slot.mesh.material.map?.dispose();slot.mesh.material.map=texture;slot.mesh.material.needsUpdate=true;};const prepared=this.prepared.get(identity);if(prepared)install(prepared);else void contentLibrary.render(page,high,current).then(install).catch(e=>{if(current()&&String(e)!=='Error: STALE'){page.state='failed';page.error=String(e);slot.mesh.material.map?.dispose();slot.mesh.material.map=new THREE.CanvasTexture(statusCanvas(`加载失败 · 第 ${page.number} 页`));slot.mesh.material.needsUpdate=true;}});
  }
  // GLB interior spans x=-2.5..2.5, y=0..3.7. Keep margins inside existing frame.
  const fit=Math.min(4.48/page.width,3.10/page.height);
  const local=new THREE.Matrix4().compose(new THREE.Vector3(0,1.83,.258),new THREE.Quaternion(),new THREE.Vector3(page.width*fit,page.height*fit,1));
  slot.mesh.matrix.multiplyMatrices(matrix,local);slot.mesh.visible=Boolean(slot.mesh.material.map);
 }
 end(){for(const s of this.slots){if(this.used.has(s))continue;s.mesh.visible=false;if(s.key){s.key='';s.identity='';s.generation++;s.mesh.material.map?.dispose();s.mesh.material.map=null;}}}
 dispose(){for(const s of this.slots){s.generation++;s.mesh.material.map?.dispose();s.mesh.material.dispose();s.mesh.geometry.dispose();this.scene.remove(s.mesh);}this.slots=[];}
}
