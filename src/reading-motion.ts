import * as THREE from 'three';

export type Pose={position:THREE.Vector3;quaternion:THREE.Quaternion};
export const pose=(o:THREE.Object3D):Pose=>({position:o.position.clone(),quaternion:o.quaternion.clone()});
const smooth=(t:number)=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*t*(t*(t*6-15)+10);};
export function blendPose(object:THREE.Object3D,a:Pose,b:Pose,t:number){object.position.lerpVectors(a.position,b.position,smooth(t));object.quaternion.slerpQuaternions(a.quaternion,b.quaternion,smooth(t));}

/** One physical selected cassette and at most one outgoing cassette. Camera is a snapshot,
 * not recomputed from each incoming page. No geometry/material/array changes live here. */
export class ReadingMotion {
 camera?:{position:THREE.Vector3;quaternion:THREE.Quaternion;fov:number};
 anchor?:Pose;
 kind:'idle'|'preview'|'wide-preview'|'enter'|'extract-next'|'rail-shift'|'settle-old'|'exit'='idle';
 presenting=false;
 elapsed=0;
 private operation:'none'|'preview'|'enter'|'step'|'exit'='none';
 private duration=0;
 private from?:Pose;
 private old?:{group:THREE.Group;from:Pose};
 private railFrom=0;
 private railTo=0;
 private direction=1;
 private wide=false;
 get busy(){return this.operation!=='none';}
 get controlledOld(){return this.old?.group;}
 lock(camera:THREE.PerspectiveCamera){if(!this.camera)this.camera={...pose(camera),fov:camera.fov};}
 clear(){this.camera=undefined;this.anchor=undefined;this.presenting=false;this.operation='none';this.kind='idle';this.old=undefined;}
 preview(camera:THREE.PerspectiveCamera,wide:boolean){this.lock(camera);this.operation='preview';this.wide=wide;this.elapsed=0;this.duration=wide?1.4:1.05;this.kind=wide?'wide-preview':'preview';}
 enter(camera:THREE.PerspectiveCamera,model:THREE.Group){
  this.lock(camera);this.presenting=true;this.from=pose(model);this.operation='enter';this.kind='enter';this.elapsed=0;this.duration=.95;
  const c=this.camera!;const fov=THREE.MathUtils.degToRad(c.fov);
  const distance=Math.max(6,Math.max(3.76/.80,5.05/(camera.aspect*.88))/(2*Math.tan(fov/2)));
  const center=new THREE.Vector3(0,0,-distance).applyQuaternion(c.quaternion).add(c.position);
  const offset=new THREE.Vector3(0,1.85,0).applyQuaternion(c.quaternion);
  this.anchor={position:center.sub(offset),quaternion:c.quaternion.clone()};
 }
 step(model:THREE.Group,old:THREE.Group|undefined,railFrom:number,railTo:number,direction:number){
  this.from=pose(model);this.old=old?{group:old,from:pose(old)}:undefined;
  this.railFrom=railFrom;this.railTo=railTo;this.direction=direction;
  this.elapsed=0;this.duration=1.65;this.operation='step';this.kind='extract-next';
 }
 exit(model:THREE.Group){this.from=pose(model);if(this.old)this.old.from=pose(this.old.group);this.presenting=false;this.operation='exit';this.kind='exit';this.elapsed=0;this.duration=.85;}
 advance(dt:number){if(!this.busy)return;this.elapsed=Math.min(this.duration,this.elapsed+dt);if(this.operation==='step')this.kind=this.elapsed<.35?'extract-next':this.elapsed<1.1?'rail-shift':'settle-old';}
 rail(){if(this.operation!=='step')return null;return THREE.MathUtils.lerp(this.railFrom,this.railTo,smooth((this.elapsed-.35)/.75));}
 applyCamera(camera:THREE.PerspectiveCamera){if(!this.camera)return;camera.position.copy(this.camera.position);camera.quaternion.copy(this.camera.quaternion);camera.fov=this.camera.fov;
  if(this.operation==='preview'&&this.wide){const t=this.elapsed/this.duration;camera.position.add(new THREE.Vector3(0,0,10*Math.sin(Math.PI*t)**2).applyQuaternion(this.camera.quaternion));}
 }
 apply(model:THREE.Group,oldHome:Pose|undefined){
  const natural=pose(model),op=this.operation,t=this.elapsed;
  if(op==='enter')blendPose(model,this.from!,this.anchor!,t/this.duration);
  else if(op==='step'){
   const lifted:Pose={position:this.from!.position.clone().add(new THREE.Vector3(0,1.15,0)),quaternion:this.from!.quaternion};
   // The entry leg is vertical in the viewer's frame. Align below the reading
   // area first; do not swing a full-size sheet around the left/rear of it.
   const below:Pose={position:this.anchor!.position.clone().add(new THREE.Vector3(0,-4.4,-.9).applyQuaternion(this.camera!.quaternion)),quaternion:this.anchor!.quaternion};
   if(t<.35)blendPose(model,this.from!,lifted,t/.35);
   else if(t<.575)blendPose(model,lifted,below,(t-.35)/.225);
   else blendPose(model,below,this.anchor!,(t-.575)/.525);
   if(this.old){
    // Give depth clearance while retaining the old page at the reading center.
    // It archives only after the new page has reached the anchor.
    const recessed:Pose={position:this.old.from.position.clone().add(new THREE.Vector3(0,0,-1.8).applyQuaternion(this.camera!.quaternion)),quaternion:this.old.from.quaternion};
    if(t<.35)blendPose(this.old.group,this.old.from,this.old.from,1);
    else if(t<1.1)blendPose(this.old.group,this.old.from,recessed,(t-.35)/.225);
    else if(oldHome)blendPose(this.old.group,recessed,oldHome,(t-1.1)/.55);
   }
  }else if(op==='exit'){
   blendPose(model,this.from!,natural,t/this.duration);
   if(this.old&&oldHome)blendPose(this.old.group,this.old.from,oldHome,t/this.duration);
  }else if(this.presenting&&this.anchor)blendPose(model,this.anchor,this.anchor,1);
  if(this.busy&&this.elapsed>=this.duration){this.operation='none';this.kind='idle';this.old=undefined;}
 }
}
