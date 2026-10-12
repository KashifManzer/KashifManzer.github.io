import * as THREE from "three/webgpu";
import { planets } from "./planets";
import type { PlanetaryMaterials } from "./materials";
import type { Stage } from "./core";

export function createSolar(stage: Stage, materials: PlanetaryMaterials) {
  const { scene, camera } = stage;
  const group = new THREE.Group();
  group.position.set(32, 17, -105);
  scene.add(group);
  const geometry = new THREE.SphereGeometry(1, stage.tier === "high" ? 64 : 32, 32);
  const sun = new THREE.Mesh(geometry, materials.sun());
  sun.material.transparent = true; sun.material.depthWrite = false;
  sun.scale.setScalar(4);
  group.add(sun);
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 128;
  const context = glowCanvas.getContext("2d")!;
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255, 215, 145, .8)");
  gradient.addColorStop(0.2, "rgba(255, 185, 92, .3)");
  gradient.addColorStop(1, "rgba(255, 160, 70, 0)");
  context.fillStyle = gradient; context.fillRect(0, 0, 128, 128);
  const halo = new THREE.Sprite(new THREE.SpriteNodeMaterial({ map: new THREE.CanvasTexture(glowCanvas), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.set(24, 24, 1);
  group.add(halo);
  const orbitMaterial = new THREE.LineBasicMaterial({ color: "#678297", transparent: true, depthWrite: false, opacity: 0.2 });
  const bodies = planets.map((planet, index) => {
    const body = new THREE.Mesh(geometry, materials.surface(planet.name));
    body.material.transparent = true;
    body.scale.setScalar(planet.radius);
    body.userData.planet = index;
    group.add(body);
    const points = Array.from({ length: 129 }, (_, i) => {
      const angle = i / 128 * Math.PI * 2;
      return new THREE.Vector3(Math.cos(angle) * planet.orbit, Math.sin(angle) * planet.orbit * 0.12, Math.sin(angle) * planet.orbit);
    });
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), orbitMaterial));
    return body;
  });
  const earthClouds = new THREE.Mesh(geometry, materials.clouds());
  earthClouds.scale.setScalar(1.008); bodies[2].add(earthClouds);
  const earthAir = new THREE.Mesh(geometry, materials.atmosphere());
  earthAir.scale.setScalar(1.015); bodies[2].add(earthAir);
  const rings = new THREE.Group();
  rings.rotation.x = -1.12; rings.rotation.y = -0.2;
  const ringMesh = materials.ring();
  const ringMaterial = ringMesh.material;
  rings.add(ringMesh);
  // Rings inherit Saturn's radius but remain tilted as the planet spins.
  bodies[5].add(rings);

  const stars = new Float32Array(600 * 3);
  for (let i = 0; i < 600; i++) {
    const y = 1 - (i + 0.5) / 600 * 2;
    const radius = Math.sqrt(1 - y * y) * 350;
    stars[i * 3] = Math.cos(i * 2.399963) * radius;
    stars[i * 3 + 1] = y * 350;
    stars[i * 3 + 2] = Math.sin(i * 2.399963) * radius;
  }
  group.add(new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(stars, 3)), new THREE.PointsNodeMaterial({ color: "#afbed2", size: 0.3, transparent: true, opacity: 0.6 })));

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const position = new THREE.Vector3();
  const target = new THREE.Vector3();
  const destination = new THREE.Vector3();
  const from = new THREE.Vector3();
  const fromAim = new THREE.Vector3();
  const aim = new THREE.Vector3();
  const labels = [...document.querySelectorAll<HTMLElement>("[data-planet-label]")];
  const dialog = document.querySelector<HTMLDialogElement>("#solar-system")!;
  let active = false;
  let selected = -1;
  let elapsed = 3;
  let lastAspect = camera.aspect;

  function travel(index: number, reduced: boolean) {
    selected = index;
    from.copy(camera.position);
    camera.getWorldDirection(fromAim).multiplyScalar(20).add(camera.position);
    elapsed = reduced ? 3 : 0;
    dialog.dataset.travel = reduced ? "arrived" : "travelling";
  }
  return {
    group,
    activate(value: boolean, reduced: boolean) { active = value; if (value) travel(-1, reduced); },
    travel,
    update(time: number, dt: number, reduced: boolean) {
      group.scale.setScalar(active ? 1 : 0.42 * Math.min(1, camera.aspect));
      if (!active) group.position.set(camera.aspect < 1 ? 0 : 32, camera.aspect < 1 ? 14 : 17, -105);
      const focus = active && selected >= 0;
      const backgroundOpacity = focus ? 0.06 : 1;
      sun.material.opacity = halo.material.opacity = backgroundOpacity;
      orbitMaterial.opacity = focus ? 0.025 : 0.2;
      ringMaterial.opacity = focus && selected !== 5 ? 0.06 : 1;
      earthClouds.visible = earthAir.visible = !focus || selected === 2;
      earthClouds.rotation.y = .025 + time * .0008;
      bodies.forEach((body, i) => {
        const planet = planets[i];
        const angle = planet.phase + time * 0.045 / (1 + i * 0.65);
        body.position.set(Math.cos(angle) * planet.orbit, Math.sin(angle) * planet.orbit * 0.12, Math.sin(angle) * planet.orbit);
        body.rotation.y = time * 0.04;
        body.material.opacity = focus && i !== selected ? 0.06 : 1;
        body.material.depthWrite = !focus || i === selected;
      });
      if (!active) return;
      if (selected < 0) {
        target.copy(group.position);
        const distance = (camera.aspect < 1 ? 185 : 132) / Math.min(camera.aspect, 1);
        destination.copy(target).addScaledVector(position.set(0, 0.7, 1).normalize(), distance);
      } else {
        bodies[selected].getWorldPosition(target);
        const radius = planets[selected].radius * (selected === 5 ? 2.4 : 1);
        const distance = radius * (camera.aspect < 1 ? 6.5 : 5.5);
        destination.copy(target).add(position.set(0, radius * 0.5, distance));
        if (camera.aspect >= 1) target.x -= radius * 0.8;
        else { target.y -= radius * 0.65; destination.y -= radius * 0.65; }
      }
      if (camera.aspect !== lastAspect || reduced) elapsed = 3;
      lastAspect = camera.aspect;
      elapsed = Math.min(3, elapsed + dt);
      const p = elapsed / 3;
      const ease = p * p * p * (p * (p * 6 - 15) + 10);
      camera.position.lerpVectors(from, destination, ease);
      aim.lerpVectors(fromAim, target, ease);
      camera.lookAt(aim);
      if (elapsed === 3) dialog.dataset.travel = "arrived";
      camera.updateMatrixWorld();
      const { width, height } = stage.renderer.domElement.getBoundingClientRect();
      labels.forEach((label, i) => {
        bodies[i].getWorldPosition(position).project(camera);
        label.hidden = selected >= 0 || position.z < -1 || position.z > 1 || Math.abs(position.x) > 0.95 || Math.abs(position.y) > 0.92;
        label.style.transform = `translate(${(position.x + 1) * width / 2}px, ${(1 - position.y) * height / 2}px)`;
      });
    },
    pick(x: number, y: number) {
      const bounds = stage.renderer.domElement.getBoundingClientRect();
      pointer.set((x - bounds.left) / bounds.width * 2 - 1, -(y - bounds.top) / bounds.height * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(bodies, false)[0]?.object.userData.planet as number | undefined;
    },
  };
}
