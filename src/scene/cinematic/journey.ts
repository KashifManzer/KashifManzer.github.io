import * as THREE from 'three/webgpu';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { pass, mrt, output, emissive } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { createStage, type Stage } from '../core';
import { createCinematicWorld } from './world';
import { createLogoInspection } from './inspection';

const root = document.documentElement;
const canvas = document.querySelector<HTMLCanvasElement>('#journey-canvas')!;
const chapters = [...document.querySelectorAll<HTMLElement>('.chapter')];
const copies = chapters.map(chapter => chapter.querySelector<HTMLElement>('.chapter-copy')!);
const contact = document.querySelector<HTMLElement>('#contact')!;
const veil = document.querySelector<HTMLElement>('#cloud-veil')!;
const motion = document.querySelector<HTMLButtonElement>('#reduce-motion')!;
const hud = document.querySelector<HTMLElement>('.flight-hud')!;
const bar = document.querySelector<HTMLElement>('#flight-progress')!;
const label = document.querySelector<HTMLElement>('#flight-chapter')!;
const percent = document.querySelector<HTMLElement>('#flight-percent')!;
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const abort = new AbortController();
const bootStarted = performance.now();
const still = new URLSearchParams(location.search).has('still');
const audit = new URLSearchParams(location.search).has('audit');
let reduced = preference.matches;
let stage: Stage | undefined;
let pipeline: THREE.RenderPipeline | undefined;
let scenePass: ReturnType<typeof pass> | undefined;
let glow: ReturnType<typeof bloom> | undefined;
let disposed = false, dirty = true;
let lenis: Lenis | undefined;
let layout: { top: number; height: number; time: number; span: number }[] = [];
let contactTop = 0;
let progress = 0, target = 0, active = 0;
let lastAspect = 0;
let viewportWidth = innerWidth, viewportHeight = innerHeight;
let inspection: ReturnType<typeof createLogoInspection> | undefined;
let disposeWorld: (() => void) | undefined;
const nativeScrollRestoration = history.scrollRestoration;

root.classList.add('journey-ready');
root.classList.toggle('reduced', reduced);
function refreshLayout() {
  layout = chapters.map(chapter => ({ top: chapter.offsetTop, height: chapter.offsetHeight, time: Number(chapter.dataset.time), span: Number(chapter.dataset.span) }));
  contactTop = contact.getBoundingClientRect().top + scrollY;
  lenis?.resize();
  measure();
}
function configureScroll() {
  lenis?.destroy(); lenis = undefined;
  if (!reduced && stage && !disposed) {
    lenis = new Lenis({ autoRaf: false, syncTouch: false, lerp: .1, smoothWheel: true });
    lenis.on('scroll', measure);
  }
}
function measure() {
  if (inspection?.open || !layout.length) return;
  // WebKit can dispatch scroll anchoring before resize. Keep the old timeline
  // until the resize handler reconstructs its position in the new layout.
  if (innerWidth !== viewportWidth || innerHeight !== viewportHeight) return;
  // Native keyboard, scrollbar, history or programmatic jumps cancel wheel inertia.
  if (lenis?.isScrolling === 'smooth' && Math.abs(scrollY - lenis.animatedScroll) > 2) {
    lenis.scrollTo(scrollY, { immediate: true, force: true });
  }
  active = 0;
  for (let i = 0; i < layout.length; i++) if (scrollY + 1 >= layout[i].top) active = i;
  const chapter = layout[active];
  const local = THREE.MathUtils.clamp((scrollY - chapter.top) / chapter.height, 0, 1);
  target = scrollY >= contactTop - 1 ? 22 : chapter.time + local * chapter.span;
  root.dataset.chapter = target >= 22 ? 'contact' : chapters[active].id;
  dirty = true;
}
function jump(id: string, focus = true, animate = false) {
  inspection?.close();
  if (id === 'work') id = 'career';
  const element = document.getElementById(id);
  if (!element) return;
  const top = element.getBoundingClientRect().top + scrollY;
  const complete = () => { if (focus) { element.tabIndex = -1; element.focus({ preventScroll: true }); } measure(); };
  if (lenis) {
    // A browser may scroll a focused/clicked anchor into view before its click event.
    lenis.scrollTo(scrollY, { immediate: true, force: true });
    lenis.scrollTo(top, { immediate: !animate || id === 'contact', onComplete: complete, force: true });
  }
  else { window.scrollTo({ top, behavior: 'instant' }); complete(); }
  measure();
}
for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
  link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    history.pushState(null, '', link.hash);
    jump(link.hash.slice(1), true, true);
  }, { signal: abort.signal });
}
copies.forEach((copy, index) => copy.addEventListener('focusin', () => {
  if (!reduced && active !== index) jump(chapters[index].id, false);
}, { signal: abort.signal }));
window.addEventListener('popstate', () => jump(location.hash.slice(1) || 'opening', false), { signal: abort.signal });
window.addEventListener('hashchange', () => jump(location.hash.slice(1) || 'opening', false), { signal: abort.signal });
window.addEventListener('scroll', measure, { passive: true, signal: abort.signal });
window.addEventListener('resize', () => {
  viewportWidth = innerWidth; viewportHeight = innerHeight;
  if (inspection?.open) { dirty = true; return; }
  const saved = target, index = active;
  refreshLayout();
  {
    const chapter = layout[index];
    const y = saved >= 22 ? contactTop : chapter.top + (saved - chapter.time) / chapter.span * chapter.height;
    if (lenis) lenis.scrollTo(y, { immediate: true }); else scrollTo({ top: y, behavior: 'instant' });
  }
  measure();
}, { signal: abort.signal });
const observer = new ResizeObserver(() => {
  if (innerWidth === viewportWidth && innerHeight === viewportHeight) refreshLayout();
});
observer.observe(document.querySelector('main')!);
void document.fonts.ready.then(() => { if (!disposed) refreshLayout(); });
function setReduced(value: boolean) {
  inspection?.close();
  const chapter = contact.getBoundingClientRect().top <= innerHeight * .5 ? contact : chapters[active];
  reduced = value;
  root.classList.toggle('reduced', reduced);
  motion.setAttribute('aria-pressed', String(reduced));
  copies.forEach(copy => { copy.style.opacity = '1'; copy.style.pointerEvents = ''; });
  configureScroll(); refreshLayout(); jump(chapter.id, false);
}
motion.addEventListener('click', () => setReduced(!reduced), { signal: abort.signal });
preference.addEventListener('change', () => setReduced(preference.matches), { signal: abort.signal });
motion.setAttribute('aria-pressed', String(reduced));
refreshLayout();

function dispose() {
  if (disposed) return;
  disposed = true;
  abort.abort(); observer.disconnect();
  history.scrollRestoration = nativeScrollRestoration;
  inspection?.dispose(); lenis?.destroy(); disposeWorld?.();
  pipeline?.dispose(); glow?.dispose(); scenePass?.dispose(); stage?.dispose();
}
function fail(error: unknown) {
  if (disposed) return;
  console.warn('[journey] Illustrated portfolio retained:', error);
  inspection?.close();
  const chapter = contact.getBoundingClientRect().top <= innerHeight * .5 ? contact : chapters[active];
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
    if (disposed) { world.dispose(); return; }
    refreshLayout();
    if (location.hash === '#work') jump('career', false);
    progress = target;
    world.travel(reduced ? 7 : progress, 0, false);
    if (stage.tier === 'high') {
      scenePass = pass(stage.scene, stage.camera);
      scenePass.setMRT(mrt({ output, emissive }));
      const sceneColor = scenePass.getTextureNode('output');
      glow = bloom(scenePass.getTextureNode('emissive'), .18, .35, .65);
      pipeline = new THREE.RenderPipeline(stage.renderer);
      pipeline.outputNode = sceneColor.add(glow);
    }
    const textureStart = performance.now();
    const textures = new Set<THREE.Texture>();
    stage.scene.traverse(object => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points || object instanceof THREE.Sprite)) return;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
      }
    });
    textures.forEach(map => stage!.renderer.initTexture(map));
    if (audit) root.dataset.textureUploadMs = String(performance.now() - textureStart);
    const compileStart = performance.now();
    await (scenePass ? scenePass.compileAsync(stage.renderer) : stage.renderer.compileAsync(stage.scene, stage.camera));
    if (audit) root.dataset.initialCompileMs = String(performance.now() - compileStart);
    if (disposed) return;
    // Compile future light/material variants before starting the sole render loop.
    // Static HTML/posters remain readable; no concurrent compile/render race.
    // WebGL drivers can serialize these compiles. Keep fallback startup bounded;
    // WebGPU can prepare each reading stop asynchronously before the loop starts.
    const milestones = canvas.dataset.renderer === 'webgpu' ? [0, 4, 7, 12, 14, 16, 19, 22] : [12, 19, 22];
    for (const milestone of milestones) {
      if (performance.now() - bootStarted > 12000) break;
      world.travel(milestone, 0, false);
      const started = performance.now();
      await (scenePass ? scenePass.compileAsync(stage.renderer) : stage.renderer.compileAsync(stage.scene, stage.camera));
      if (audit) root.dataset[`compile${milestone}Ms`] = String(performance.now() - started);
      if (disposed) return;
    }
    // Compilation creates shadow textures before their framebuffer attachments.
    // Initialize those attachments outside a submitted frame, so WebGPU cannot
    // replace a depth texture while an earlier draw still references it.
    stage.scene.traverse(object => {
      if (object instanceof THREE.DirectionalLight || object instanceof THREE.SpotLight || object instanceof THREE.PointLight) {
        if (object.shadow.map) stage!.renderer.initRenderTarget(object.shadow.map);
      }
    });
    world.travel(reduced ? (target >= 18 ? 22 : layout[active].time) : target, 0, false);
    // Fragment navigation is owned by jump(); prevent a later browser restoration
    // from overwriting its destination while a Lenis travel is interrupted.
    history.scrollRestoration = 'manual';
    motion.hidden = false;
    configureScroll();
    inspection = createLogoInspection(stage, world, () => { dirty = true; }, open => {
      if (disposed) return;
      if (open) lenis?.stop();
      else { lenis?.start(); lenis?.scrollTo(scrollY, { immediate: true }); refreshLayout(); }
    });
    for (const link of document.querySelectorAll<HTMLElement>('[data-social]')) {
      const highlight = () => { world.highlightSocial(link.dataset.social!); root.dataset.social = link.dataset.social!; dirty = true; };
      const clear = () => { world.highlightSocial(null); delete root.dataset.social; dirty = true; };
      link.addEventListener('pointerenter', highlight, { signal: abort.signal });
      link.addEventListener('focus', highlight, { signal: abort.signal });
      link.addEventListener('pointerleave', () => { if (document.activeElement !== link) clear(); }, { signal: abort.signal });
      link.addEventListener('blur', clear, { signal: abort.signal });
    }
    const socialLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-social]')];
    let projectedAt = '', renderedFrames = 0;
    const currentStage = stage;
    stage.start(dt => {
      if (lenis?.isScrolling === 'smooth' && Math.abs(scrollY - lenis.animatedScroll) > 2) measure();
      lenis?.raf(performance.now());
      const resized = lastAspect !== currentStage.camera.aspect;
      lastAspect = currentStage.camera.aspect;
      if (inspection?.open) { const changed = dirty || resized; dirty = false; return changed; }
      const previous = progress;
      progress = target;
      const changed = dirty || resized || previous !== progress || !reduced && !still;
      if (!changed) return false;
      dirty = false;
      const cloud = world.travel(reduced ? (target >= 18 ? 22 : layout[active].time) : progress, dt, !reduced && !still);
      const projectionKey = `${progress}:${canvas.clientWidth}:${canvas.clientHeight}:${reduced}`;
      if (projectionKey !== projectedAt) {
        projectedAt = projectionKey;
        const targets = world.socialTargets(currentStage.camera, canvas.clientWidth, canvas.clientHeight, progress);
        root.dataset.contactTargets = String(progress >= 22 && !reduced);
        for (const bounds of targets) {
          const link = socialLinks.find(link => link.dataset.social === bounds.id)!;
          link.style.setProperty('--rock-x', `${bounds.left}px`);
          link.style.setProperty('--rock-y', `${bounds.top}px`);
          link.style.setProperty('--rock-w', `${bounds.width}px`);
          link.style.setProperty('--rock-h', `${bounds.height}px`);
        }
      }
      veil.style.opacity = String(reduced ? 0 : cloud);
      for (let i = 0; i < chapters.length; i++) {
        const local = (progress - layout[i].time) / layout[i].span;
        const opacity = reduced ? 1 : (local < 0 || local >= 1 ? 0 : 1 - THREE.MathUtils.smoothstep(local, 0.56, 0.82)) * (1 - cloud);
        copies[i].style.opacity = String(opacity);
        copies[i].style.pointerEvents = opacity < 0.05 ? 'none' : '';
      }
      bar.style.transform = `scaleX(${Math.min(progress / 22, 1)})`;
      percent.textContent = String(Math.round(Math.min(progress / 22, 1) * 100)).padStart(2, '0');
      label.textContent = target < 3 ? 'SOLAR SYSTEM' : target < 7 ? 'EARTH APPROACH' : target < 9 ? 'EARTH ORBIT' : target < 12 ? 'DESCENT' : target < 18 ? 'ENGINEERING JOURNEY' : target < 22 ? 'COMMON GROUND' : 'LET’S CONNECT';
      hud.style.opacity = progress >= 22 ? '0' : '1';
      root.dataset.progress = progress.toFixed(4);
      return true;
    }, () => {
      if (pipeline && !inspection?.open) {
        glow!.strength.value = progress >= 18 ? .16 : .22;
        pipeline.render();
      } else currentStage.renderer.render(currentStage.scene, currentStage.camera);
      if (audit) {
        root.dataset.renderCount = String(++renderedFrames);
        root.dataset.geometries = String(currentStage.renderer.info.memory.geometries);
        root.dataset.textures = String(currentStage.renderer.info.memory.textures);
        root.dataset.drawCalls = String(currentStage.renderer.info.render.drawCalls);
        root.dataset.triangles = String(currentStage.renderer.info.render.triangles);
      }
      root.dataset.graphics = 'ready';
      root.dataset.renderedFrame = root.dataset.chapter;
    });
  } catch (error) { fail(error); }
  finally { clearTimeout(timeout); }
}
void boot();
window.addEventListener('pagehide', event => { if (!event.persisted) { clearTimeout(timeout); dispose(); } });
