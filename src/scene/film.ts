import * as THREE from "three/webgpu";
import { uv, length, smoothstep, color } from "three/tsl";
import { damp, type Stage } from "./core";
import type { ScrollState } from "./scroll";
import { studioEnvironment } from "./env";
import { createCrystal, EMBER } from "./crystal";
import { createDust } from "./dust";
import { createCity } from "./city";
import { createPipeline } from "./post";

/**
 * The film. Scroll stop 0: the core in the void. Stop 1: the dive, the city appears as a
 * sketch. Stop 2: the city develops around the core.
 */

const CITY_Y = -70;
const ss = THREE.MathUtils.smoothstep;

// Camera rig, sampled along a spline by scroll: u = stop / 2.
const PATH = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0.3, 7.5),
  new THREE.Vector3(0.5, -9, 11),
  new THREE.Vector3(0, -32, 30),
  new THREE.Vector3(30, -30, 62),
  new THREE.Vector3(52, -27, 72),
]);
const AIM = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-1.7, 0, 0),
  new THREE.Vector3(0, -14, -2),
  new THREE.Vector3(0, -66, -6),
  new THREE.Vector3(0, -70, -4),
  new THREE.Vector3(-8, -72, -6),
]);

export async function film(stage: Stage, scroll: ScrollState, progress: (p: number) => void) {
  const { scene, camera, renderer, tier, reducedMotion } = stage;
  scene.background = new THREE.Color("#030305");
  scene.fog = new THREE.FogExp2("#05060a", 0.0105);
  scene.environment = studioEnvironment(renderer);
  progress(0.35);

  const core = createCrystal(tier);
  scene.add(core.group);

  // A dim ember glow far behind the core: something for the glass to bend.
  const glowMat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  glowMat.colorNode = color(EMBER).mul(smoothstep(0.5, 0.0, length(uv().sub(0.5))).pow(2.6)).mul(0.1);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(15, 15), glowMat);
  glow.position.set(1.5, -1, -12);
  scene.add(glow);

  const dust = createDust(renderer, tier === "high" ? 24000 : 8000);
  scene.add(dust.sprite);

  const city = createCity(tier);
  city.group.position.y = CITY_Y;
  scene.add(city.group);
  progress(0.55);

  const pipeline = createPipeline(renderer, scene, camera, tier);
  stage.setRender(() => pipeline.render());

  // Compile every material now, behind the loader, instead of hitching mid-scroll.
  camera.position.copy(PATH.getPoint(0));
  camera.lookAt(AIM.getPoint(0));
  await renderer.compileAsync(scene, camera);
  progress(0.9);

  const camPos = PATH.getPoint(0);
  const camAim = AIM.getPoint(0);
  const tmp = new THREE.Vector3();
  const travel = new THREE.Vector3(0, -1, 0);
  const coreRest = new THREE.Vector3(0, 0.45, 0);
  const coreCity = new THREE.Vector3(0, CITY_Y + 15, 0);
  let spin = 0;
  let u = 0;

  stage.onFrame((dt, s) => {
    const stop = Math.min(scroll.stop, 2);
    const lambda = reducedMotion ? 60 : 2.6;
    u = damp(u, stop / 2, lambda, dt);

    // Camera along the rig, with a little parallax from the pointer.
    PATH.getPoint(u, tmp);
    tmp.x += s.pointer.x * 0.6 * (1 - u * 0.5);
    tmp.y += s.pointer.y * 0.35;
    camPos.copy(tmp);
    AIM.getPoint(u, camAim);
    // Portrait screens: centre the core above the name instead of beside it, then hand
    // back to the shared path as the dive begins.
    const k = camera.aspect < 0.8 ? Math.max(0, 1 - u * 2) : 0;
    camPos.z += 4 * k;
    camAim.x += 1.7 * k;
    camAim.y -= 0.9 * k;
    camera.position.copy(camPos);
    camera.lookAt(camAim);
    PATH.getTangent(Math.min(u + 0.02, 1), travel);

    const t = u * 2; // back to stop units, smoothed
    // The core leads the dive, then hangs over the city as its light source.
    const dive = ss(t, 0.12, 1.05);
    core.group.position.lerpVectors(coreRest, coreCity, dive);
    core.group.scale.setScalar(THREE.MathUtils.lerp(1, 0.75, dive));
    if (!reducedMotion) spin += dt * (0.22 + dive * 0.6);
    core.shell.rotation.set(0.25 + s.pointer.y * 0.25, spin + s.pointer.x * 0.4, 0.1);
    glow.position.y = -1 + core.group.position.y;
    glow.lookAt(camera.position);

    const rush = ss(t, 0.15, 0.55) * (1 - ss(t, 0.85, 1.35));
    // Reduced motion: frozen clock, so traffic, window flips and dust twinkle hold still.
    const time = reducedMotion ? 0 : s.time;
    dust.step(reducedMotion ? 0 : dt, time, camera.position, rush, travel);
    city.set(ss(t, 0.3, 1.1), ss(t, 1.0, 1.95), time);
    // Nothing of the city shows before the sketch starts at t = 0.3; skip drawing it.
    city.group.visible = t > 0.25;
  });

  progress(1);
}
