import * as THREE from "three/webgpu";
import { planets } from "./planets";
import type { Stage } from "./core";

/** Original procedural illustrations, not photographic planetary maps. */
function surface(index: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 256;
  const context = canvas.getContext("2d")!;
  const pixels = context.createImageData(canvas.width, canvas.height);
  const tint = new THREE.Color(planets[index].color).convertLinearToSRGB();
  let seed = index + 41;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    const u = x / canvas.width * Math.PI * 2, v = y / canvas.height * Math.PI;
    const turbulence = Math.sin(u * 7 + Math.sin(v * 19)) * 0.35 + Math.cos(u * 13 + v * 9) * 0.2;
    const bands = Math.sin(v * 34 + turbulence) * 0.08 + Math.sin(v * 79 + turbulence * 2) * 0.04 + Math.sin(v * 153 + Math.cos(u * 17)) * 0.018;
    const rock = Math.sin(u * 13 + Math.sin(v * 17) * 2) * Math.sin(v * 23 + Math.cos(u * 9)) * 0.18;
    const shade = index >= 4 ? 0.78 + bands * (index >= 6 ? 0.3 : 1) : 0.72 + rock + (random() - 0.5) * 0.1;
    const offset = (y * canvas.width + x) * 4;
    pixels.data[offset] = tint.r * shade * 255;
    pixels.data[offset + 1] = tint.g * shade * 255;
    pixels.data[offset + 2] = tint.b * shade * 255;
    pixels.data[offset + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  if (index === 0 || index === 3) {
    for (let i = 0; i < 95; i++) {
      const x = random() * 512, y = random() * 256, r = 1 + random() * 7;
      context.beginPath(); context.arc(x, y, r, 0, Math.PI * 2);
      context.fillStyle = "rgba(24, 14, 12, .14)"; context.fill();
      context.strokeStyle = "rgba(255, 233, 208, .12)"; context.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSolar(stage: Stage, earthMap: THREE.Texture) {
  const { scene, camera } = stage;
  const group = new THREE.Group();
  group.position.set(32, 17, -105);
  scene.add(group);
  const geometry = new THREE.SphereGeometry(1, stage.tier === "high" ? 64 : 32, 32);
  const sun = new THREE.Mesh(geometry, new THREE.MeshBasicNodeMaterial({ color: "#ffd493", transparent: true, depthWrite: false }));
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
    const body = new THREE.Mesh(geometry, new THREE.MeshStandardNodeMaterial({ map: index === 2 ? earthMap : surface(index), roughness: 1, transparent: true }));
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
  const rings = new THREE.Group();
  rings.rotation.x = -1.12; rings.rotation.y = -0.2;
  const ringCanvas = document.createElement("canvas");
  ringCanvas.width = ringCanvas.height = 512;
  const ringContext = ringCanvas.getContext("2d")!;
  for (let r = 139; r < 256; r++) {
    const gap = r > 223 && r < 230;
    ringContext.strokeStyle = `rgba(210, 194, 158, ${gap ? 0.04 : 0.35 + Math.sin(r * 1.7) * 0.12 + Math.sin(r * 0.15) * 0.2})`;
    ringContext.beginPath(); ringContext.arc(256, 256, r, 0, Math.PI * 2); ringContext.stroke();
  }
  const ringMap = new THREE.CanvasTexture(ringCanvas);
  ringMap.colorSpace = THREE.SRGBColorSpace;
  const ringMaterial = new THREE.MeshStandardNodeMaterial({ map: ringMap, side: THREE.DoubleSide, transparent: true, depthWrite: false, roughness: 1 });
  const ringMesh = new THREE.Mesh(new THREE.RingGeometry(1.3, 2.4, 128), ringMaterial);
  ringMesh.renderOrder = 1;
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
