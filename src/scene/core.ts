import * as THREE from "three/webgpu";

export type Tier = "high" | "low";

export interface Stage {
  renderer: THREE.WebGPURenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  tier: Tier;
  reducedMotion: boolean;
  /** Pointer in NDC (-1..1), smoothed. */
  pointer: THREE.Vector2;
  /** Raw pointer in NDC, updated on move. */
  pointerTarget: THREE.Vector2;
  /** Seconds since start. */
  time: number;
  onFrame(cb: (dt: number, stage: Stage) => void): void;
  /** Replace the default `renderer.render(scene, camera)` call, e.g. with a RenderPipeline. */
  setRender(fn: () => void): void;
}

/** Phones, low core counts and small screens get the light tier. `?tier=low|high` overrides for testing. */
function detectTier(): Tier {
  const forced = new URLSearchParams(location.search).get("tier");
  if (forced === "low" || forced === "high") return forced;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  return coarse || cores <= 4 || innerWidth < 768 ? "low" : "high";
}

/**
 * One renderer, one scene, one loop. Resolves to null when neither WebGPU nor WebGL2 is available,
 * so the caller can keep the static fallback.
 */
export async function createStage(canvas: HTMLCanvasElement, fov = 35): Promise<Stage | null> {
  const tier = detectTier();
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const forceWebGL = new URLSearchParams(location.search).has("webgl");

  const renderer = new THREE.WebGPURenderer({ canvas, antialias: tier === "high", forceWebGL });
  try {
    await renderer.init();
  } catch (err) {
    console.warn("[scene] renderer init failed", err);
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, tier === "high" ? 2 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 400);

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  const pointer = new THREE.Vector2();
  const pointerTarget = new THREE.Vector2();
  // Reduced motion: no pointer parallax, the pointer stays centred.
  if (!reducedMotion) {
    addEventListener(
      "pointermove",
      (e) => pointerTarget.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1),
      { passive: true },
    );
  }

  const callbacks: Array<(dt: number, s: Stage) => void> = [];
  let render = () => renderer.render(scene, camera);
  const timer = new THREE.Timer();
  timer.connect(document); // pauses delta while the tab is hidden

  const stage: Stage = {
    renderer,
    scene,
    camera,
    tier,
    reducedMotion,
    pointer,
    pointerTarget,
    time: 0,
    onFrame: (cb) => callbacks.push(cb),
    setRender: (fn) => (render = fn),
  };

  const step = (dt: number) => {
    stage.time += dt;
    pointer.lerp(pointerTarget, 1 - Math.exp(-dt * 6));
    for (const cb of callbacks) cb(dt, stage);
    render();
  };
  renderer.setAnimationLoop((t?: number) => {
    timer.update(t);
    step(Math.min(timer.getDelta(), 1 / 20));
  });

  // Dev only: advance frames without rAF, so screenshots work in a background/hidden tab.
  if (import.meta.env.DEV) {
    Object.assign(window, { __tick: (seconds = 1, fps = 30) => { for (let i = 0; i < seconds * fps; i++) step(1 / fps); } });
  }

  return stage;
}

/** Frame-rate independent exponential approach. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));
