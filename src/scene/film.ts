import * as THREE from "three/webgpu";
import { planetaryMaterials } from "./materials";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createSatellite } from "./satellite";
import { createSolar } from "./solar";
import type { Stage } from "./core";
import type { Scroll } from "./scroll";

export async function film(stage: Stage, scroll: Scroll, signal: AbortSignal) {
  const { scene, camera, renderer, tier } = stage;
  const materials = await planetaryMaterials(tier, signal);
  const world = new THREE.Group();
  world.position.set(0, -7, -3);
  scene.add(world);
  const sphere = new THREE.SphereGeometry(5.8, tier === "high" ? 96 : 48, tier === "high" ? 64 : 32);
  const earth = new THREE.Mesh(sphere, materials.surface("earth"));
  earth.rotation.set(0.12, 2.2, -0.2);
  world.add(earth);
  const solar = createSolar(stage, materials);
  const clouds = new THREE.Mesh(sphere, materials.clouds());
  clouds.scale.setScalar(1.008); clouds.rotation.copy(earth.rotation); world.add(clouds);
  const atmosphereMaterial = materials.atmosphere();
  const atmosphere = new THREE.Mesh(sphere, atmosphereMaterial);
  atmosphere.scale.setScalar(1.012);
  world.add(atmosphere);

  const sun = new THREE.DirectionalLight("#fff0d9", 3.2);
  sun.position.set(-8, 12, 10);
  scene.add(sun, new THREE.HemisphereLight("#a7c9ff", "#060912", .45));
  const rim = new THREE.DirectionalLight("#c7dcf0", .35);
  rim.position.set(8, 1, -5);
  scene.add(rim);
  const satellite = createSatellite();
  scene.add(satellite);

  const orbitPoint = (angle: number, radius = 8.7) => new THREE.Vector3(
    Math.sin(angle) * radius, Math.cos(angle) * radius * 0.92, Math.cos(angle) * radius * 0.39,
  );
  const orbit = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: 181 }, (_, i) => orbitPoint(i / 180 * Math.PI * 2))),
    new THREE.LineBasicMaterial({ color: "#74a6c2", transparent: true, opacity: 0.3 }),
  );
  world.add(orbit);
  const connections = new THREE.Group();
  world.add(connections);
  const origin = orbitPoint(0.36);
  const linkMaterial = new THREE.LineBasicMaterial({ color: "#81c8e4", transparent: true, opacity: 0.38 });
  const pulseMaterial = new THREE.MeshBasicNodeMaterial({ color: "#bdeafa" });
  const pulseGeometry = new THREE.SphereGeometry(0.045, 8, 6);
  const links = [new THREE.Vector3(-3.7, 3.4, 2.9), new THREE.Vector3(1.2, 4.2, 3.8), new THREE.Vector3(4.3, 1.7, 3.5)].map((target) => {
    target.normalize().multiplyScalar(5.83);
    const midpoint = origin.clone().lerp(target, 0.5).normalize().multiplyScalar(8.2);
    const curve = new THREE.QuadraticBezierCurve3(origin, midpoint, target);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)), linkMaterial);
    line.frustumCulled = false; // Three short, moving links; avoid stale geometry bounds.
    connections.add(line);
    const station = new THREE.Mesh(pulseGeometry, pulseMaterial);
    station.position.copy(target);
    connections.add(station);
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    connections.add(pulse);
    return { curve, line, pulse };
  });

  // Deterministic, sparse stars; no per-frame allocations or particle simulation.
  const stars = new Float32Array(240 * 3);
  let seed = 23;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < stars.length; i += 3) {
    stars[i] = (random() - 0.5) * 100;
    stars[i + 1] = (random() - 0.5) * 65;
    stars[i + 2] = -45 - random() * 20;
  }
  const starfield = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(stars, 3)),
    new THREE.PointsNodeMaterial({ color: "#abb9cd", size: 0.045, transparent: true, opacity: 0.5 }));
  scene.add(starfield);

  const controls = new OrbitControls(camera);
  controls.enablePan = false;
  controls.enableDamping = false;
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = Math.PI - 0.2;
  let inspecting = false;
  let exploring = false;
  let dirty = true;
  controls.addEventListener("change", () => { dirty = true; });
  let reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let time = 0;
  let lastAspect = camera.aspect;
  const aim = new THREE.Vector3();
  const initialRotation = new THREE.Euler(0.15, -0.55, -0.28);
  const satelliteRest = origin.clone().add(world.position);
  const portraitRest = new THREE.Vector3(0.3, 1.5, 0).sub(world.position);
  const orbitAxis = new THREE.Vector3(0, 0.39, -0.92).normalize();
  const linkPoint = new THREE.Vector3();
  function framePage() {
    solar.update(time, 0, reduced);
    const p = reduced ? 0 : THREE.MathUtils.smoothstep(scroll.state.progress, 0, 1);
    const portrait = camera.aspect < 1;
    // Illustrative speeds: satellite completes an orbit in four minutes; Earth in eight.
    const angle = time * Math.PI * 2 / 240;
    origin.set(Math.sin(0.36 + angle) * 8.7, Math.cos(0.36 + angle) * 8.7 * 0.92, Math.cos(0.36 + angle) * 8.7 * 0.39);
    satelliteRest.copy(origin).add(world.position);
    satellite.position.copy(satelliteRest);
    satellite.rotation.copy(initialRotation);
    satellite.scale.setScalar(0.56);
    if (portrait) {
      satellite.position.copy(portraitRest).applyAxisAngle(orbitAxis, angle).add(world.position).lerp(satelliteRest, p);
      satellite.scale.setScalar(0.46 - p * 0.1);
      camera.position.set(p * 1.5, 1 - p * 1.5, 18 + p * 7);
      aim.set(p * 1.5, -1.6 - p * 2, 0);
    } else {
      camera.position.set(p * 1.8, 1 - p * 1.7, 14 + p * 10);
      aim.set(0, -p * 3.3, -p);
    }
    camera.lookAt(aim);
    earth.rotation.y = 2.2 + time * Math.PI * 2 / 480;
    clouds.rotation.y = earth.rotation.y + .025 + time * .0008;
    orbit.visible = p > 0.05;
    connections.visible = p > 0.8;
    orbit.material.opacity = p * 0.28;
    linkMaterial.opacity = THREE.MathUtils.smoothstep(p, 0.8, 1) * 0.45;
    if (connections.visible) {
      // Keep every signal attached to the moving satellite, including the portrait transition.
      linkPoint.copy(satellite.position).sub(world.position);
      links.forEach(({ curve, line, pulse }, i) => {
        curve.v0.copy(linkPoint);
        curve.v1.copy(curve.v0).lerp(curve.v2, 0.5).normalize().multiplyScalar(8.2);
        const positions = line.geometry.getAttribute("position");
        for (let j = 0; j < positions.count; j++) {
          curve.getPoint(j / (positions.count - 1), pulse.position);
          positions.setXYZ(j, pulse.position.x, pulse.position.y, pulse.position.z);
        }
        positions.needsUpdate = true;
        curve.getPoint((time * 0.11 + i / 3) % 1, pulse.position);
      });
    }
  }
  function resetInspection() {
    const distance = Math.max(12, 14.5 / camera.aspect);
    controls.minDistance = distance * 0.65;
    controls.maxDistance = distance * 1.8;
    camera.position.set(0, 1.3, distance);
    controls.target.set(0, 0, 0);
    controls.update();
  }
  framePage();
  await renderer.compileAsync(scene, camera);
  if (signal.aborted) throw signal.reason;
  renderer.render(scene, camera);
  stage.start((dt) => {
    const resized = lastAspect !== camera.aspect;
    if (exploring) {
      if (!reduced) time += dt;
      solar.update(time, dt, reduced);
    } else if (inspecting) {
      if (resized) resetInspection();
    } else {
      if (reduced && !dirty && !resized) return false;
      if (!reduced) time += dt;
      framePage();
    }
    const render = dirty || resized || (!reduced && !inspecting);
    dirty = false;
    lastAspect = camera.aspect;
    return render;
  });
  return {
    setReducedMotion(value: boolean) { reduced = value; dirty = true; if (!inspecting && !exploring) framePage(); },
    explore(value: boolean) {
      exploring = value;
      dirty = true;
      world.visible = satellite.visible = !value;
      solar.activate(value, reduced);
      if (!value) framePage();
    },
    travel(index: number) { solar.travel(index, reduced); dirty = true; },
    pickPlanet(x: number, y: number) { return solar.pick(x, y); },
    inspect(value: boolean) {
      inspecting = value;
      dirty = true;
      world.visible = starfield.visible = !value;
      solar.group.visible = !value;
      if (value) {
        satellite.position.set(0, 0, 0);
        satellite.scale.setScalar(1);
        satellite.rotation.set(-0.12, -0.25, -0.16);
        controls.connect(renderer.domElement);
        resetInspection();
      } else { controls.disconnect(); framePage(); }
      lastAspect = camera.aspect;
    },
    control(action: string) {
      if (!inspecting) return;
      if (action === "left") controls.rotateLeft(0.2);
      if (action === "right") controls.rotateLeft(-0.2);
      if (action === "up") controls.rotateUp(0.15);
      if (action === "down") controls.rotateUp(-0.15);
      if (action === "in") controls.dollyIn(0.85);
      if (action === "out") controls.dollyOut(0.85);
      if (action === "reset") resetInspection();
    },
    snap() { dirty = true; framePage(); },
    dispose() { if (controls.domElement) controls.dispose(); },
  };
}

export type Film = Awaited<ReturnType<typeof film>>;
