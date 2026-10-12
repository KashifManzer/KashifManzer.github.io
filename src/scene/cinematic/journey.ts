import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { createStage, type Stage } from '../core';
import { createCinematicWorld } from './world';
import { createLogoInspection } from './inspection';

const root = document.documentElement;
const canvas = document.querySelector<HTMLCanvasElement>('#journey-canvas')!;
const chapters = [...document.querySelectorAll<HTMLElement>('.chapter')];
const copies = chapters.map(chapter => chapter.querySelector<HTMLElement>('.chapter-copy')!);
const work = document.querySelector<HTMLElement>('#work')!;
const contact = document.querySelector<HTMLElement>('#contact')!;
const veil = document.querySelector<HTMLElement>('#cloud-veil')!;
const motion = document.querySelector<HTMLButtonElement>('#reduce-motion')!;
const hud = document.querySelector<HTMLElement>('.flight-hud')!;
const bar = document.querySelector<HTMLElement>('#flight-progress')!;
const label = document.querySelector<HTMLElement>('#flight-chapter')!;
const percent = document.querySelector<HTMLElement>('#flight-percent')!;
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const abort = new AbortController();
const still = new URLSearchParams(location.search).has('still');
const audit = new URLSearchParams(location.search).has('audit');
let reduced = preference.matches;
let stage: Stage | undefined;
let pipeline: THREE.RenderPipeline | undefined;
let scenePass: ReturnType<typeof pass> | undefined;
let glow: ReturnType<typeof bloom> | undefined;
let disposed = false, snap = true, dirty = true;
let progress = 0, target = 0, active = 0;
let measuredY = scrollY, lastAspect = 0;
let inspection: ReturnType<typeof createLogoInspection> | undefined;
let disposeWorld: (() => void) | undefined;

root.classList.add('journey-ready');
root.classList.toggle('reduced', reduced);
function measure() {
  if (inspection?.open) return;
  measuredY = scrollY;
  active = 0;
  for (let i = 0; i < chapters.length; i++) if (scrollY + 1 >= chapters[i].offsetTop) active = i;
  const chapter = chapters[active];
  const local = THREE.MathUtils.clamp((scrollY - chapter.offsetTop) / chapter.offsetHeight, 0, 1);
  target = Number(chapter.dataset.time) + local * Number(chapter.dataset.span);
  if (scrollY >= work.offsetTop) target = 18;
  root.dataset.chapter = chapter.id;
  dirty = true;
}
function jump(id: string, focus = true) {
  inspection?.close();
  const element = document.getElementById(id);
  if (!element) return;
  snap = true;
  window.scrollTo({ top: element.getBoundingClientRect().top + scrollY, behavior: 'instant' });
  if (focus) { element.tabIndex = -1; element.focus({ preventScroll: true }); }
  measure();
}
for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
  link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    history.pushState(null, '', link.hash);
    jump(link.hash.slice(1));
  }, { signal: abort.signal });
}
copies.forEach((copy, index) => copy.addEventListener('focusin', () => {
  if (!reduced && active !== index) jump(chapters[index].id, false);
}, { signal: abort.signal }));
window.addEventListener('hashchange', () => jump(location.hash.slice(1), false), { signal: abort.signal });
window.addEventListener('scroll', measure, { passive: true, signal: abort.signal });
window.addEventListener('resize', () => {
  if (inspection?.open) { dirty = true; return; }
  if (target < 18 && scrollY === measuredY) {
    const chapter = chapters[active];
    window.scrollTo({ top: chapter.offsetTop + (target - Number(chapter.dataset.time)) / Number(chapter.dataset.span) * chapter.offsetHeight, behavior: 'instant' });
  }
  measure(); snap = true;
}, { signal: abort.signal });
function setReduced(value: boolean) {
  inspection?.close();
  const chapter = contact.getBoundingClientRect().top <= innerHeight * .5 ? contact : scrollY >= work.offsetTop ? work : chapters[active];
  reduced = value;
  root.classList.toggle('reduced', reduced);
  motion.setAttribute('aria-pressed', String(reduced));
  copies.forEach(copy => { copy.style.opacity = '1'; copy.style.pointerEvents = ''; });
  jump(chapter.id, false);
}
motion.addEventListener('click', () => setReduced(!reduced), { signal: abort.signal });
preference.addEventListener('change', () => setReduced(preference.matches), { signal: abort.signal });
motion.setAttribute('aria-pressed', String(reduced));
measure();

function dispose() {
  if (disposed) return;
  disposed = true;
  abort.abort();
  inspection?.dispose(); disposeWorld?.();
  pipeline?.dispose(); glow?.dispose(); scenePass?.dispose(); stage?.dispose();
}
function fail(error: unknown) {
  if (disposed) return;
  console.warn('[journey] Illustrated portfolio retained:', error);
  inspection?.close();
  const chapter = contact.getBoundingClientRect().top <= innerHeight * .5 ? contact : scrollY >= work.offsetTop ? work : chapters[active];
  root.dataset.graphics = 'fallback';
  root.classList.remove('journey-ready');
  copies.forEach(copy => { copy.style.opacity = '1'; copy.style.pointerEvents = ''; });
  veil.style.opacity = '0'; motion.hidden = true;
  document.querySelector('#journey-status')!.textContent = 'Showing the illustrated portfolio.';
  window.scrollTo({ top: chapter.getBoundingClientRect().top + scrollY, behavior: 'instant' });
  dispose();
}
const timeout = setTimeout(() => fail(new Error('Graphics load timed out')), 20000);
async function boot() {
  try {
    const created = await createStage(canvas, fail);
    if (disposed) { created.dispose(); return; }
    stage = created;
    const world = await createCinematicWorld(stage, abort.signal);
    disposeWorld = world.dispose;
    if (disposed) return;
    measure(); progress = target;
    world.travel(reduced ? 7 : progress, 0, false);
    await stage.renderer.compileAsync(stage.scene, stage.camera);
    if (disposed) return;
    if (stage.tier === 'high') {
      scenePass = pass(stage.scene, stage.camera);
      const output = scenePass.getTextureNode('output');
      glow = bloom(output, 0.32, 0.5, 1.1);
      pipeline = new THREE.RenderPipeline(stage.renderer);
      pipeline.outputNode = output.add(glow);
    }
    motion.hidden = false;
    inspection = createLogoInspection(stage, world, () => { dirty = true; });
    const currentStage = stage;
    stage.start(dt => {
      const resized = lastAspect !== currentStage.camera.aspect;
      lastAspect = currentStage.camera.aspect;
      if (inspection?.open) { const changed = dirty || resized; dirty = false; return changed; }
      const previous = progress;
      progress = snap ? target : THREE.MathUtils.damp(progress, target, 9, dt);
      snap = false;
      if (Math.abs(progress - target) < 0.0001) progress = target;
      const changed = dirty || resized || previous !== progress || !reduced && !still && target < 18;
      if (!changed) return false;
      dirty = false;
      const cloud = world.travel(reduced ? 7 : progress, dt, !reduced && !still && target < 18);
      veil.style.opacity = String(reduced ? 0 : cloud);
      for (let i = 0; i < chapters.length; i++) {
        const local = (scrollY - chapters[i].offsetTop) / chapters[i].offsetHeight;
        const opacity = reduced ? 1 : (local < 0 || local >= 1 ? 0 : 1 - THREE.MathUtils.smoothstep(local, 0.56, 0.82)) * (1 - cloud);
        copies[i].style.opacity = String(opacity);
        copies[i].style.pointerEvents = opacity < 0.05 ? 'none' : '';
      }
      bar.style.transform = `scaleX(${Math.min(target / 18, 1)})`;
      percent.textContent = String(Math.round(Math.min(target / 18, 1) * 100)).padStart(2, '0');
      label.textContent = target < 3 ? 'SOLAR SYSTEM' : target < 7 ? 'EARTH APPROACH' : target < 9 ? 'EARTH ORBIT' : target < 12 ? 'DESCENT' : 'ENGINEERING JOURNEY';
      hud.style.opacity = target >= 18 ? '0' : '1';
      root.dataset.progress = progress.toFixed(4);
      return true;
    }, () => {
      if (pipeline && !inspection?.open) {
        glow!.strength.value = !reduced && progress >= 10 ? 0.12 : 0.32;
        pipeline.render();
      } else currentStage.renderer.render(currentStage.scene, currentStage.camera);
      if (audit) {
        root.dataset.drawCalls = String(currentStage.renderer.info.render.drawCalls);
        root.dataset.triangles = String(currentStage.renderer.info.render.triangles);
      }
      root.dataset.graphics = 'ready';
      root.dataset.renderedFrame = chapters[active].id;
    });
  } catch (error) { fail(error); }
  finally { clearTimeout(timeout); }
}
void boot();
window.addEventListener('pagehide', event => { if (!event.persisted) { clearTimeout(timeout); dispose(); } });
