import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Stage } from '../core';
import type { createCinematicWorld } from './world';
import { technologies, type TechnologyId } from './technologies';

type World = Awaited<ReturnType<typeof createCinematicWorld>>;
export function createLogoInspection(stage:Stage, world:World, invalidate:()=>void, onOpenChange:(open:boolean)=>void = () => {}) {
  const root=document.documentElement;
  const canvas=stage.renderer.domElement;
  const home=canvas.parentElement!;
  const dialog=document.querySelector<HTMLDialogElement>('#logo-inspection')!;
  const viewport=dialog.querySelector<HTMLElement>('.logo-viewport')!;
  const closeButton=dialog.querySelector<HTMLButtonElement>('.logo-close')!;
  const buttons=[...document.querySelectorAll<HTMLButtonElement>('[data-technology]')];
  const abort=new AbortController(),options={signal:abort.signal};
  const controls=new OrbitControls(stage.camera);
  controls.enablePan=false;controls.enableDamping=false;controls.minDistance=1.15;controls.maxDistance=6;
  controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI-.15;
  controls.addEventListener('change',invalidate);
  let origin:HTMLElement|undefined, savedScroll=0, savedNear=.1;
  let savedChapter:HTMLElement|null=null, savedLocal=0;
  let pointerStart:{x:number;y:number;scroll:number}|undefined;
  const ray=new THREE.Raycaster();const pointer=new THREE.Vector2();
  function close() {
    if(!dialog.open)return;
    controls.disconnect();dialog.close();home.prepend(canvas);root.classList.remove('logo-inspecting');
    stage.camera.near=savedNear;world.inspect(null);stage.resize();
    const restore = savedChapter ? savedChapter.offsetTop + savedLocal * savedChapter.offsetHeight : savedScroll;
    scrollTo({top:restore,behavior:'instant'});
    origin?.focus({preventScroll:true});onOpenChange(false);invalidate();
  }
  function open(id:TechnologyId,trigger:HTMLElement) {
    if(dialog.open||!world.available.includes(id))return;
    if (!trigger.matches('button,a')) trigger.tabIndex = -1;
    origin=trigger;savedScroll=scrollY;savedNear=stage.camera.near;
    savedChapter=document.querySelector<HTMLElement>(`.chapter[id="${root.dataset.chapter}"]`);
    savedLocal=savedChapter?(savedScroll-savedChapter.offsetTop)/savedChapter.offsetHeight:0;
    onOpenChange(true);
    dialog.querySelector('#logo-title')!.textContent=technologies[id].name;
    dialog.querySelector('#logo-description')!.textContent=technologies[id].use;
    dialog.dataset.technology=id;
    root.classList.add('logo-inspecting');dialog.showModal();viewport.prepend(canvas);stage.resize();world.inspect(id);
    controls.target.set(0,0,0);controls.connect(canvas);controls.update();controls.saveState();
    closeButton.focus();invalidate();
  }
  for(const button of buttons){
    const id=button.dataset.technology as TechnologyId;
    button.hidden=!world.available.includes(id);
    button.addEventListener('click',()=>open(id,button),options);
  }
  closeButton.addEventListener('click',close,options);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();},options);
  dialog.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const last=dialog.querySelector<HTMLButtonElement>('[data-logo-action="reset"]')!;
    if(event.shiftKey&&document.activeElement===closeButton){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();closeButton.focus();}
  },options);
  dialog.addEventListener('click',event=>{
    const action=(event.target as HTMLElement).closest<HTMLElement>('[data-logo-action]')?.dataset.logoAction;
    if(action==='left')controls.rotateLeft(.25);
    if(action==='right')controls.rotateLeft(-.25);
    if(action==='up')controls.rotateUp(.2);
    if(action==='down')controls.rotateUp(-.2);
    if(action==='in')controls.dollyIn(.85);
    if(action==='out')controls.dollyOut(.85);
    if(action==='reset')controls.reset();
    if(action){controls.update();invalidate();}
  },options);
  function pick(event:PointerEvent):TechnologyId|undefined {
    if(dialog.open||!world.city.visible||Number(root.dataset.progress)>=18)return;
    if((event.target as HTMLElement).closest('a,button,.chapter-copy,dialog'))return;
    pointer.set(event.clientX/innerWidth*2-1,1-event.clientY/innerHeight*2);
    ray.setFromCamera(pointer,stage.camera);
    const hit=ray.intersectObject(world.city,true).find(hit=>{
      let node:THREE.Object3D|null=hit.object;
      while(node){if(!node.visible)return false;node=node.parent;}return true;
    });
    let object:THREE.Object3D|null=hit?.object??null;
    while(object){if(object.userData.technology)return object.userData.technology as TechnologyId;object=object.parent;}
  }
  window.addEventListener('pointerdown',event=>{pointerStart={x:event.clientX,y:event.clientY,scroll:scrollY};},options);
  window.addEventListener('pointerup',event=>{
    const start=pointerStart;pointerStart=undefined;
    if(!start||Math.hypot(event.clientX-start.x,event.clientY-start.y)>8||Math.abs(scrollY-start.scroll)>2)return;
    const id=pick(event);if(!id)return;
    const trigger=buttons.find(b=>b.dataset.technology===id&&b.closest('.chapter')?.id===root.dataset.chapter)??document.getElementById(root.dataset.chapter!)!;
    open(id,trigger);
  },options);
  window.addEventListener('pointercancel',()=>{pointerStart=undefined;},options);
  window.addEventListener('pagehide',close,options);
  return {get open(){return dialog.open;},close,dispose(){close();abort.abort();if(controls.domElement)controls.dispose();buttons.forEach(b=>b.hidden=true);}};
}
