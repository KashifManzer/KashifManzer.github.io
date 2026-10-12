import * as THREE from "three/webgpu";
import { cameraPosition, color, float, normalWorld, positionWorld, vec3 } from "three/tsl";
import { createSatellite } from "../satellite";
import { createCity } from "./city";
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { TechnologyId } from './technologies';
import type { Stage } from "../core";

export async function createCinematicWorld(stage: Stage, signal: AbortSignal) {
  const { scene, camera, tier, renderer } = stage;
  const loaded: THREE.Texture[] = [];
  const texture = async (path: string, srgb = true) => {
    const response = await fetch(path, { signal });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    const bitmap = await createImageBitmap(await response.blob(), { imageOrientation: "flipY" });
    if (signal.aborted) { bitmap.close(); throw signal.reason; }
    const map = new THREE.Texture(bitmap);
    map.addEventListener("dispose", () => bitmap.close());
    map.flipY = false; map.needsUpdate = true;
    if (srgb) map.colorSpace = THREE.SRGBColorSpace;
    loaded.push(map);
    return map;
  };
  // Settle every request before cleanup so a late decode cannot leak after a sibling fails.
  const results = await Promise.allSettled([
    texture(`/textures/earth-${tier === "high" ? 4096 : 2048}.webp`),
    texture("/textures/cinematic/moon-color.webp"),
    texture("/textures/cinematic/moon-height.webp", false),
    texture("/textures/cinematic/jupiter.webp"),
    texture("/textures/cinematic/earth-clouds.webp", false),
  ]);
  const failed = results.find(result => result.status === "rejected");
  if (failed || signal.aborted) { loaded.forEach(map => map.dispose()); throw failed?.reason ?? signal.reason; }
  const [earthMap, moonMap, moonHeight, jupiterMap, cloudsMap] = results.map(result => (result as PromiseFulfilledResult<THREE.Texture>).value);

  const space = new THREE.Group();
  scene.add(space);
  const sphere = new THREE.SphereGeometry(1, tier === "high" ? 96 : 48, tier === "high" ? 64 : 32);
  const earthSystem = new THREE.Group(); earthSystem.position.set(0, -7, 0); space.add(earthSystem);
  const earth = new THREE.Mesh(sphere, new THREE.MeshStandardNodeMaterial({ map: earthMap, roughness: 0.68, metalness: 0.03 }));
  earth.scale.setScalar(6); earth.rotation.set(0.12, 2.1, -0.18); earthSystem.add(earth);
  const clouds = new THREE.Mesh(sphere, new THREE.MeshStandardNodeMaterial({ color: "#ffffff", alphaMap: cloudsMap, transparent: true, opacity: 0.12, depthWrite: false, roughness: 1 }));
  clouds.scale.setScalar(6.035); clouds.rotation.copy(earth.rotation); clouds.rotation.y += 0.035; earthSystem.add(clouds);
  const atmosphereMaterial = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const facing = normalWorld.dot(cameraPosition.sub(positionWorld).normalize()).clamp(0, 1);
  const lit = normalWorld.dot(vec3(-0.6, 0.4, 0.7).normalize()).smoothstep(-0.25, 0.6);
  atmosphereMaterial.colorNode = color("#409fee");
  atmosphereMaterial.opacityNode = float(1).sub(facing).pow(4.2).mul(lit.mul(0.8).add(0.025));
  const atmosphere = new THREE.Mesh(sphere, atmosphereMaterial); atmosphere.scale.setScalar(6.09); earthSystem.add(atmosphere);
  const moon = new THREE.Mesh(sphere, new THREE.MeshStandardNodeMaterial({ map: moonMap, bumpMap: moonHeight, bumpScale: 0.035, roughness: 1 }));
  moon.scale.setScalar(1.63); moon.position.set(-10, 6, -19); moon.rotation.y = 2.4; space.add(moon);
  const satellite = createSatellite(); satellite.position.set(4, 1.3, 3.5); satellite.scale.setScalar(0.64); satellite.rotation.set(0.15, -0.55, -0.28); space.add(satellite);

  const solar = new THREE.Group(); space.add(solar);
  const sunCanvas = document.createElement("canvas"); sunCanvas.width = 512; sunCanvas.height = 256;
  const sunContext = sunCanvas.getContext("2d")!;
  const granules = sunContext.createImageData(512, 256);
  for (let i = 0; i < 512 * 256; i++) {
    const x = i % 512, y = Math.floor(i / 512);
    const detail = (Math.sin(x * 1.7 + y * 2.3) + Math.sin(x * 0.14 - y * 0.19)) * 0.5;
    granules.data.set([255, 150 + detail * 35, 54 + detail * 16, 255], i * 4);
  }
  sunContext.putImageData(granules, 0, 0);
  const sunMap = new THREE.CanvasTexture(sunCanvas); sunMap.colorSpace = THREE.SRGBColorSpace;
  const sun = new THREE.Mesh(sphere, new THREE.MeshBasicNodeMaterial({ map: sunMap, color: new THREE.Color(1.5, 1.5, 1.5) }));
  sun.scale.setScalar(15); sun.position.set(-50, -5, -65); solar.add(sun);
  const glowCanvas = document.createElement("canvas"); glowCanvas.width = glowCanvas.height = 256;
  const context = glowCanvas.getContext("2d")!;
  const glow = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  glow.addColorStop(0, "rgba(255, 212, 143, .5)"); glow.addColorStop(0.18, "rgba(245, 159, 66, .16)"); glow.addColorStop(1, "rgba(200, 100, 40, 0)");
  context.fillStyle = glow; context.fillRect(0, 0, 256, 256);
  const halo = new THREE.Sprite(new THREE.SpriteNodeMaterial({ map: new THREE.CanvasTexture(glowCanvas), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.set(80, 80, 1); halo.position.copy(sun.position); solar.add(halo);
  const bodies: [number, number, number, number, string, THREE.Texture?][] = [
    [-47, -5, -42, 0.85, "#938c83", moonMap],
    [-25, -5, -25, 1.75, "#d4bb8d"],
    [50, -5, -15, 1.1, "#b57552", moonMap],
    [75, -5, -157, 9, "#ffffff", jupiterMap],
    [-228, -5, 36, 8, "#c7b995"],
    [105, -5, 131, 4.7, "#92c5cf"],
    [-264, -5, -260, 4.65, "#345caa"],
  ];
  const planets: { body: THREE.Mesh; radius: number; angle: number }[] = [];
  bodies.forEach(([x, y, z, radius, tint, map], index) => {
    const body = new THREE.Mesh(sphere, new THREE.MeshStandardNodeMaterial({ color: tint, map: map ?? null, roughness: 1 }));
    body.position.set(x, y, z); body.scale.setScalar(radius); body.rotation.y = 0.7;
    solar.add(body);
    planets.push({ body, radius: Math.hypot(x + 50, z + 65), angle: Math.atan2(z + 65, x + 50) });
    if (index === 4) {
      const ring = new THREE.Group(); ring.rotation.set(-1.1, 0.3, -0.2);
      for (let i = 0; i < 24; i++) {
        const inner = 1.34 + i * 0.04;
        const material = new THREE.MeshStandardNodeMaterial({ color: i % 3 ? "#b7a68b" : "#d5c8ad", side: THREE.DoubleSide, transparent: true, opacity: i === 15 ? 0.06 : 0.45 + i % 4 * 0.1, depthWrite: false });
        const band = new THREE.Mesh(new THREE.RingGeometry(inner, inner + 0.036, 96), material); band.renderOrder = 1; ring.add(band);
      }
      body.add(ring);
    }
  });
  // Orbital structure makes the opening read as one system rather than scattered spheres.
  const orbitMaterial = new THREE.LineBasicNodeMaterial({ color: "#99b1ca", transparent: true, opacity: 0.2, depthWrite: false });
  for (const radius of [23, 47, 82, 112, 155, 205, 250, 290]) {
    const points = Array.from({ length: 193 }, (_, i) => {
      const angle = i / 192 * Math.PI * 2;
      return new THREE.Vector3(-50 + Math.cos(angle) * radius, -7, -65 + Math.sin(angle) * radius);
    });
    solar.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), orbitMaterial));
  }
  const fadingMaterials = new Map<THREE.Material, number>();
  solar.traverse(object => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite) {
      const material = object.material as THREE.Material;
      material.transparent = true;
      fadingMaterials.set(material, material.opacity);
    }
  });
  const stars = new Float32Array(1100 * 3);
  for (let i = 0; i < 1100; i++) {
    const y = 1 - (i + 0.5) / 1100 * 2, r = Math.sqrt(1 - y * y) * 850;
    stars[i * 3] = Math.cos(i * 2.399963) * r; stars[i * 3 + 1] = y * 850; stars[i * 3 + 2] = Math.sin(i * 2.399963) * r;
  }
  const starfield = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(stars, 3)), new THREE.PointsNodeMaterial({ color: "#b7c7de", size: 0.44, transparent: true, opacity: 0.62 }));
  space.add(starfield);
  const key = new THREE.DirectionalLight("#e4eeff", 4.2); key.position.set(-30, 20, 40); space.add(key);
  space.add(new THREE.HemisphereLight("#799ac8", "#02030b", 0.7));

  const { group: city, animate: animateCity, library, sculptures } = await createCity(tier === "low", signal); scene.add(city);
  const room = new RoomEnvironment();
  const generator = new THREE.PMREMGenerator(stage.renderer);
  const environment = generator.fromScene(room, 0.04);
  room.dispose(); generator.dispose();
  stage.renderer.shadowMap.enabled = tier === 'high';
  const studio = new THREE.Group(); studio.visible = false; scene.add(studio);
  const studioKey = new THREE.DirectionalLight('#fff3e0', 1.6); studioKey.position.set(-3, 5, 6); studio.add(studioKey);
  const studioRim = new THREE.DirectionalLight('#b4dfff', 1.2); studioRim.position.set(4, 1, -2); studio.add(studioRim);
  studio.add(new THREE.HemisphereLight('#e8f3ff', '#343e50', 0.5));
  let inspected: THREE.Group | undefined;
  camera.far = 5000;
  const spaceColor = new THREE.Color("#020409"), cityColor = new THREE.Color("#0c1320");
  const cityFog = new THREE.FogExp2("#172335", 0.006);
  const position = new THREE.Vector3(), target = new THREE.Vector3();
  const from = new THREE.Vector3(), to = new THREE.Vector3();
  type Stop = [number, number[], number[]];
  const orbitVector = new THREE.Vector3(), orbitAxis = new THREE.Vector3(0.3, 0.5, 1).normalize();
  let elapsed = 0;
  let pathPortrait: boolean | undefined;
  let cityStops: Stop[] = [], spaceStops: Stop[] = [];
  function travel(progress: number, dt: number, moving: boolean) {
    if (inspected) return 0;
    if (moving) elapsed += dt;
    const portrait = camera.aspect < 1;
    const urban = progress >= 10.15;
    space.visible = !urban; city.visible = urban;
    const fade = 1 - THREE.MathUtils.smoothstep(progress, 2, 3.4);
    solar.visible = fade > 0;
    fadingMaterials.forEach((opacity, material) => { material.opacity = opacity * fade; });
    moon.visible = true; satellite.visible = true;
    scene.background = urban ? cityColor : spaceColor; scene.fog = urban ? cityFog : null;
    scene.environment = urban ? environment.texture : null;
    scene.environmentIntensity = 0.35;
    camera.fov = urban ? 48 : 42;
    // Keep the opening system out of the reading lane on short screens.
    const { clientWidth: width, clientHeight: height } = renderer.domElement;
    const openingShift = 1 - THREE.MathUtils.smoothstep(progress, 0.8, 3);
    if (height < 650 && openingShift > 0) {
      camera.setViewOffset(width, height, portrait ? 0 : -width * .2 * openingShift, portrait ? height * .23 * openingShift : 0, width, height);
    } else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    // Coordinates are artistic, not astronomical scale. Hold periods preserve reading time.
    if (pathPortrait !== portrait) {
      pathPortrait = portrait;
      cityStops = [
      [10.15, [0, 150, 135], [0, 25, -110]],
      [12, [portrait ? 13 : -8, portrait ? 11 : 9, portrait ? 60 : 45], [portrait ? 19 : 3, portrait ? 1 : 13, -23]],
      [13, [portrait ? 13 : -8, portrait ? 11 : 9, portrait ? 60 : 45], [portrait ? 19 : 3, portrait ? 1 : 13, -23]],
      [13.5, [-4, 16, -50], [20, 13, -121]],
      [14, [portrait ? 16 : -6, portrait ? 10 : 9, portrait ? -63 : -72], [portrait ? 21 : 4, portrait ? 0 : 14, -141]],
      [15, [portrait ? 16 : -6, portrait ? 10 : 9, portrait ? -63 : -72], [portrait ? 21 : 4, portrait ? 0 : 14, -141]],
      [15.5, [0, 17, -168], [20, 15, -243]],
      [16, [portrait ? 12 : -9, portrait ? 10 : 8, portrait ? -175 : -187], [portrait ? 20 : 4, portrait ? 0 : 13, -258]],
      [18, [portrait ? 12 : -9, portrait ? 10 : 8, portrait ? -175 : -187], [portrait ? 20 : 4, portrait ? 0 : 13, -258]],
      ];
      spaceStops = [
      [0, [160, portrait ? 650 : 250, portrait ? 1450 : 590], [-50, portrait ? -100 : -45, -65]],
      [0.8, [140, portrait ? 600 : 225, portrait ? 1300 : 540], [-50, portrait ? -100 : -45, -65]],
      [3, [14, 12, portrait ? 66 : 48], [portrait ? 0 : -6, -4, 0]],
      [5, [10, 8, portrait ? 43 : 30], [portrait ? 0 : -5, -4, 0]],
      [7, [0, 1.5, portrait ? 24 : 15], [0, -1.9, 0]],
      [8.8, [0, 1.5, portrait ? 24 : 15], [0, -1.9, 0]],
      [10.15, [0, -0.5, 7.5], [0, -6, 0]],
    ];
    }
    const stops = urban ? cityStops : spaceStops;
    const index = Math.max(0, stops.findIndex((_, i) => i < stops.length - 1 && progress < stops[i + 1][0]));
    const a = progress >= stops.at(-1)![0] ? stops.at(-1)! : stops[index];
    const b = stops[Math.min(stops.indexOf(a) + 1, stops.length - 1)];
    let t = THREE.MathUtils.clamp((progress - a[0]) / Math.max(0.001, b[0] - a[0]), 0, 1);
    t = t * t * (3 - 2 * t);
    target.fromArray(a[2]).lerp(to.fromArray(b[2]), t);
    from.fromArray(a[1]).sub(position.fromArray(a[2]));
    to.fromArray(b[1]).sub(position.fromArray(b[2]));
    const distance = Math.exp(THREE.MathUtils.lerp(Math.log(from.length()), Math.log(to.length()), t));
    position.copy(from.normalize()).lerp(to.normalize(), t).normalize().multiplyScalar(distance).add(target);
    camera.position.copy(position); camera.lookAt(target);
    starfield.position.copy(camera.position);
    for (const planet of planets) {
      const angle = planet.angle + elapsed * 0.0003 * 155 / planet.radius;
      planet.body.position.set(-50 + Math.cos(angle) * planet.radius, -5, -65 + Math.sin(angle) * planet.radius);
      planet.body.rotation.y = 0.7 + elapsed * 0.015;
    }
    animateCity(elapsed, !moving || progress >= 12 && (progress - 12) % 2 < 1, progress);
    earth.rotation.y = 2.1 + elapsed * Math.PI / 240;
    clouds.rotation.y = earth.rotation.y + 0.035 + elapsed * 0.0008;
    satellite.scale.setScalar(portrait ? 0.48 : 0.5);
    orbitVector.set(portrait ? 0.3 : 3.6, portrait ? 9.9 : 7.6, 0.5).applyAxisAngle(orbitAxis, elapsed * Math.PI / 120);
    satellite.position.copy(earthSystem.position).add(orbitVector);
    satellite.rotation.y = -0.55 + Math.sin(elapsed * 0.025) * 0.12;
    moon.position.set(portrait ? -4 : -8, portrait ? 5.2 : 2, -19);
    cityFog.density = THREE.MathUtils.lerp(0.003, 0.0045, THREE.MathUtils.smoothstep(progress, 10.15, 12));
    return Math.max(0, 1 - Math.abs(progress - 10.15) / 0.85);
  }
  return {
    travel, sculptures, city, available: [...library.keys()],
    inspect(id: TechnologyId | null) {
      if (inspected) { studio.remove(inspected); inspected = undefined; }
      studio.visible = !!id;
      if (!id) return;
      const source = library.get(id); if (!source) return;
      inspected = source.clone(true); studio.add(inspected);
      space.visible = city.visible = false;
      scene.background = new THREE.Color('#101c29'); scene.fog = null;
      scene.environment = environment.texture; scene.environmentIntensity = 0.35;
      camera.fov = 36; camera.near = 0.05; camera.updateProjectionMatrix();
      camera.position.set(0.55, 0.2, camera.aspect < 1 ? 3.4 : 2.1); camera.lookAt(0, 0, 0);
    },
    dispose() { environment.dispose(); },
  };
}
