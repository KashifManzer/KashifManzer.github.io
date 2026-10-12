import * as THREE from "three/webgpu";

export type Tier = "high" | "low";

export async function createStage(canvas: HTMLCanvasElement, onError: (error: unknown) => void) {
  const params = new URLSearchParams(location.search);
  const low = matchMedia("(pointer: coarse)").matches || innerWidth < 768 || (navigator.hardwareConcurrency ?? 4) <= 4;
  const tier: Tier = params.get("tier") === "high" ? "high" : params.get("tier") === "low" || low ? "low" : "high";
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, forceWebGL: params.has("webgl") });
  try { await renderer.init(); } catch (error) { renderer.dispose(); throw error; }
  canvas.dataset.renderer = "isWebGPUBackend" in renderer.backend && renderer.backend.isWebGPUBackend ? "webgpu" : "webgl";
  canvas.dataset.tier = tier;
  renderer.onDeviceLost = (info) => onError(new Error(info.message));
  renderer.setPixelRatio(Math.min(devicePixelRatio, tier === "high" ? 1.5 : 1.25));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#050a12");
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 800);
  let needsRender = true;
  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    needsRender = true;
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  const invalidate = () => { needsRender = true; };
  document.addEventListener("visibilitychange", invalidate);
  let disposed = false;
  const timer = new THREE.Timer();
  timer.connect(document);
  const lost = (event: Event) => { event.preventDefault(); onError(new Error("Graphics context lost")); };
  canvas.addEventListener("webglcontextlost", lost);
  return {
    renderer, scene, camera, tier, resize,
    start(frame: (dt: number) => boolean, draw = () => renderer.render(scene, camera)) {
      renderer.setAnimationLoop(() => {
        if (disposed || document.hidden) return;
        try {
          timer.update();
          const changed = frame(Math.min(timer.getDelta(), 0.05));
          if (changed || needsRender) { draw(); needsRender = false; }
        } catch (error) { renderer.setAnimationLoop(null); onError(error); }
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      renderer.setAnimationLoop(null);
      observer.disconnect();
      document.removeEventListener("visibilitychange", invalidate);
      timer.dispose();
      canvas.removeEventListener("webglcontextlost", lost);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      const textures = new Set<THREE.Texture>();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points || object instanceof THREE.Sprite)) return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          materials.add(material);
          for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
    },
  };
}

export type Stage = Awaited<ReturnType<typeof createStage>>;
