import * as THREE from 'three/webgpu';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { loadMaps } from '../materials';
import { socials } from '../../data/profile';

const smooth = THREE.MathUtils.smoothstep;
const clamp = THREE.MathUtils.clamp;
/** A deterministic illustration: every fragment is a function of journey time. */
export async function createSocialAsteroids(low: boolean, signal: AbortSignal, parent: THREE.Scene) {
  const group = new THREE.Group(); group.name = 'social-asteroids'; parent.add(group);
  let seed = 41719;
  const random = () => { seed = seed * 16807 % 2147483647; return seed / 2147483647; };
  const maps = await loadMaps(Object.fromEntries(['diff', 'nor_gl', 'rough', 'ao'].map(id => [id, [`/textures/realism/rock-${id}.webp`, id === 'diff']])), signal);
  Object.values(maps).forEach(map => { map.wrapS = map.wrapT = THREE.RepeatWrapping; });
  const stone = new THREE.MeshStandardNodeMaterial({ color: '#82786c', map: maps.diff, normalMap: maps.nor_gl, normalScale: new THREE.Vector2(.65, .65), roughnessMap: maps.rough, aoMap: maps.ao, roughness: 1, vertexColors: true });
  const chipGeometry = new THREE.IcosahedronGeometry(1, 0);
  const chipMaterial = new THREE.MeshStandardNodeMaterial({ color: '#82786c', map: maps.diff, normalMap: maps.nor_gl, roughnessMap: maps.rough, roughness: 1 });
  const terrainMaterial = new THREE.MeshStandardNodeMaterial({ color: '#777b81', map: maps.diff, normalMap: maps.nor_gl, normalScale: new THREE.Vector2(.7, .7), roughnessMap: maps.rough, aoMap: maps.ao, roughness: 1, vertexColors: true });
  const ground = new THREE.Group(); ground.position.z = -460; group.add(ground);
  const light = new THREE.DirectionalLight('#cedef1', 2.2); light.position.set(-30, 40, 20); group.add(light);
  light.position.set(-25, 35, -435); light.target.position.set(0, 0, -460); group.add(light.target);
  light.castShadow = !low; light.shadow.autoUpdate = false; light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, { left:-24, right:24, top:20, bottom:-20, near:1, far:90 });
  light.shadow.normalBias = .08; light.shadow.bias = -.0003;
  const warm = new THREE.DirectionalLight('#ffb77d', 1.8); warm.position.set(20, 10, 8); group.add(warm);
  const fill = new THREE.HemisphereLight('#9cbbd8', '#1c100b', .5); group.add(fill);
  // Open spherical shell, with an actual missing front cap and a jagged inward lip.
  function shell(index: number) {
    const segments = low ? 24 : 40, rings = low ? 10 : 16;
    const positions: number[] = [], colors: number[] = [], uvs: number[] = [], indices: number[] = [];
    const edges = Array.from({ length: segments }, () => .78 + random() * .3);
    const proportions = [[1.12, .93, .8], [.94, 1.1, .87], [1.03, .97, 1.02], [1.16, .86, .95]][index];
    for (let r = 0; r <= rings; r++) for (let s = 0; s <= segments; s++) {
      const angle = s / segments * Math.PI * 2;
      const theta = r < 2 ? .82 + r * .16 : 1.02 + (r - 2) / (rings - 2) * (Math.PI - 1.02);
      const edge = edges[s % segments];
      const radius = r === 0 ? edge * .8 : r === 1 ? edge * 1.16 : 1 + .13 * Math.sin(angle * (3 + index) + r * 2.2) + .07 * Math.cos(angle * 7 - r);
      positions.push(Math.cos(angle) * Math.sin(theta) * radius * proportions[0], Math.sin(angle) * Math.sin(theta) * radius * proportions[1], (Math.cos(theta) * radius - (r === 0 ? .3 : 0)) * proportions[2]);
      const tint = r === 0 ? .32 : .65 + random() * .3; colors.push(tint, tint * .93, tint * .86); uvs.push(s / segments, r / rings);
      if (r < rings && s < segments) { const a = r * (segments + 1) + s, b = a + segments + 1; indices.push(a, b, a + 1, b, b + 1, a + 1); }
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
    const material = stone.clone(); material.side = THREE.DoubleSide;
    return new THREE.Mesh(geometry, material);
  }
  const rocks = socials.map((social, i) => {
    const rock = new THREE.Group(); rock.name = social.id; group.add(rock);
    const body = shell(i); body.castShadow = !low; body.receiveShadow = !low; rock.add(body);
    const interior = new THREE.Mesh(new THREE.SphereGeometry(.76, low ? 12 : 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardNodeMaterial({ color: '#292725', map: maps.diff, normalMap: maps.nor_gl, roughness: 1, side: THREE.DoubleSide, emissive: social.color, emissiveIntensity: low ? .025 : 0 }));
    interior.rotation.x = Math.PI / 2; interior.position.z = -.05; rock.add(interior);
    const logoMaterial = new THREE.MeshStandardNodeMaterial({ color: '#000000', metalness: 0, roughness: 1, envMapIntensity: 0, emissive: social.color, emissiveIntensity: .85, toneMapped: false });
    const cavityLight = low ? null : new THREE.PointLight(social.color, 1.1, 3, 2);
    if (cavityLight) { cavityLight.position.set(0, .2, .85); rock.add(cavityLight); }
    const rest = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.32 - i * .025, [-.12, .09, -.06, .15][i], [-.16, .12, -.08, .2][i]));
    const heatMaterial = new THREE.MeshBasicNodeMaterial({ color: '#ff792c', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const cracks = new THREE.InstancedMesh(chipGeometry, heatMaterial, 15);
    const dummy = new THREE.Object3D();
    for (let j = 0; j < 15; j++) { const a = j / 15 * Math.PI * 2; dummy.position.set(Math.cos(a) * .77, Math.sin(a) * .77, .53); dummy.scale.set(.035, .12 + random() * .09, .035); dummy.rotation.z = a; dummy.updateMatrix(); cracks.setMatrixAt(j, dummy.matrix); }
    rock.add(cracks);
    const trail = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 7), new THREE.MeshBasicNodeMaterial({ color: '#e6854b', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    trail.position.set(1.1, 3.5, -.4); trail.rotation.z = -.3; rock.add(trail);
    return { rock, body, rest, cavityLight, logoMaterial, heatMaterial, trail, hit: 19.15 + i * .38, destination: new THREE.Vector3(), flight: new THREE.Vector3() };
  });
  await Promise.all(rocks.map(async (entry, i) => {
    let geometry: THREE.ExtrudeGeometry | undefined;
    try {
      const response = await fetch(`/social/${socials[i].id}.svg`, { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const source = await response.text();
      if (signal.aborted) { entry.logoMaterial.dispose(); return; }
      const paths = new SVGLoader().parse(source).paths;
      geometry = new THREE.ExtrudeGeometry(paths.flatMap(path => path.toShapes()), { depth: 26, bevelEnabled: true, bevelSize: 2, bevelThickness: 2, bevelSegments: low ? 1 : 2, curveSegments: low ? 5 : 10 });
      geometry.computeBoundingBox();
      const bounds = geometry.boundingBox!, size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
      const dimension = Math.max(size.x, size.y);
      if (!Number.isFinite(dimension) || dimension <= 0) { throw new Error('Empty social artwork'); }
      geometry.translate(-center.x, -center.y, -center.z); geometry.scale(1.22 / dimension, -1.22 / dimension, 1.22 / dimension);
      if (socials[i].id === 'instagram') {
        const brand = await loadMaps({ instagram: ['/social/instagram-color.webp', true] }, signal);
        const pos = geometry.attributes.position;
        const uv = new Float32Array(pos.count * 2);
        for (let j = 0; j < pos.count; j++) { uv[j * 2] = pos.getX(j) / 1.22 + .5; uv[j * 2 + 1] = pos.getY(j) / 1.22 + .5; }
        geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        entry.logoMaterial.emissiveMap = brand.instagram;
      }
      if (signal.aborted) throw signal.reason;
      const logo = new THREE.Mesh(geometry, entry.logoMaterial); logo.position.set(0, .26, .4); entry.rock.add(logo);
    } catch { geometry?.dispose(); entry.logoMaterial.dispose(); /* The rock and permanent HTML link remain. */ }
  }));
  stone.dispose();
  if (signal.aborted) { chipMaterial.dispose(); terrainMaterial.dispose(); throw signal.reason; }
  // One continuous displaced surface: craters are depressions, not discs on a plane.
  const terrainGeometry = new THREE.PlaneGeometry(180, 130, low ? 72 : 128, low ? 52 : 96); terrainGeometry.rotateX(-Math.PI / 2);
  const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial); ground.add(terrain); terrain.receiveShadow = true;
  const terrainUV = terrainGeometry.attributes.uv;
  for (let i = 0; i < terrainUV.count; i++) terrainUV.setXY(i, terrainUV.getX(i) * 24, terrainUV.getY(i) * 18);
  const terrainBase = new Float32Array(terrainGeometry.attributes.position.array);
  const terrainColors = new Float32Array(terrainBase.length); terrainGeometry.setAttribute('color', new THREE.BufferAttribute(terrainColors, 3));
  // Radial fault lines hug the displaced rim and spread only after the hit.
  const fissurePositions = new Float32Array(4 * 9 * 5 * 2 * 3);
  const fissureGeometry = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(fissurePositions, 3));
  const fissures = new THREE.LineSegments(fissureGeometry, new THREE.LineBasicNodeMaterial({ color: '#08070a' }));
  fissures.frustumCulled = false; ground.add(fissures);
  const count = low ? 24 : 56;
  const debris = new THREE.InstancedMesh(chipGeometry, chipMaterial, count * 4); debris.frustumCulled = false; ground.add(debris);
  const fragments = Array.from({ length: count * 4 }, () => ({ angle: random() * Math.PI * 2, radius: 3 + random() * 4, height: 2 + random() * 6, size: .12 + random() * .55, spin: random() * 6 }));
  const smokeCanvas = document.createElement('canvas'); smokeCanvas.width = smokeCanvas.height = 128;
  const sc = smokeCanvas.getContext('2d')!, mist = sc.createImageData(128, 128);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const dx = (x - 64) / 64, dy = (y - 64) / 64;
    const turbulence = .6 + .2 * Math.sin(x * .21 + Math.sin(y * .15) * 3) + .2 * Math.sin(y * .37 + x * .12);
    const alpha = Math.pow(Math.max(0, 1 - Math.hypot(dx, dy)), 1.7) * turbulence;
    mist.data.set([220, 215, 209, alpha * 220], (y * 128 + x) * 4);
  }
  sc.putImageData(mist, 0, 0);
  const smokeMap = new THREE.CanvasTexture(smokeCanvas);
  rocks.forEach(entry => { entry.trail.material.map = smokeMap; });
  // Soft contact occlusion is bounded to each crater and stays stable on both tiers.
  const shadowMaterial = new THREE.MeshBasicNodeMaterial({ color: '#000000', map: smokeMap, transparent: true, opacity: .8, depthWrite: false });
  const shadows = rocks.map(() => { const shadow = new THREE.Mesh(new THREE.PlaneGeometry(7, 6), shadowMaterial); shadow.rotation.x = -Math.PI / 2; ground.add(shadow); return shadow; });
  const smokeCount = low ? 5 : 10;
  const smoke = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicNodeMaterial({ color: '#a49a91', map: smokeMap, transparent: true, opacity: .19, depthWrite: false }), smokeCount * 4); smoke.frustumCulled = false; ground.add(smoke);
  const embers = new THREE.InstancedMesh(chipGeometry, new THREE.MeshBasicNodeMaterial({ color: new THREE.Color('#ff9a42').multiplyScalar(2.5) }), count * 4); embers.frustumCulled = false; group.add(embers);
  const flames = new THREE.InstancedMesh(new THREE.PlaneGeometry(.65, 1.8), new THREE.MeshBasicNodeMaterial({ color: '#ff903b', map: smokeMap, transparent: true, opacity: .65, blending: THREE.AdditiveBlending, depthWrite: false }), 16); ground.add(flames);
  const dummy = new THREE.Object3D(), local = new THREE.Vector3(), world = new THREE.Vector3();
  let lastShadow = '', lastDebris = '', lastTerrain = '', terrainPortrait: boolean | undefined, highlighted: string | null = null;
  const craterDepths = rocks.map(() => new Float32Array(terrainBase.length / 3));
  const craterTints = rocks.map(() => new Float32Array(terrainBase.length / 3));
  function update(progress: number, elapsed: number, camera: THREE.PerspectiveCamera) {
    group.visible = true;
    const portrait = camera.aspect < 1;
    ground.visible = progress >= 18;
    // Keep the light layout constant. Toggling visibility changes the renderer's
    // lighting program during travel, even when all materials were compiled.
    light.intensity = progress >= 18 ? 1.5 : 0;
    warm.intensity = progress >= 18 ? .8 : 0;
    fill.intensity = progress >= 18 ? .5 : 0;
    const shadowKey = `${portrait}:${progress}`;
    if (progress >= 18 && shadowKey !== lastShadow) light.shadow.needsUpdate = true;
    lastShadow = shadowKey;
    rocks.forEach((entry, i) => entry.destination.set(portrait ? (i % 2 ? 5.5 : -5.5) : (i - 1.5) * 10.8, .45, portrait ? (i < 2 ? -8 : 8) : Math.sin(i * 2) * 1.6));
    const hits = rocks.map(entry => smooth(progress, entry.hit, entry.hit + .22));
    const key = `${portrait}:${hits.join(':')}:${rocks.map(entry => smooth(progress, entry.hit, entry.hit + .35)).join(':')}`;
    if (ground.visible && key !== lastTerrain) {
      lastTerrain = key;
      const positions = terrainGeometry.attributes.position;
      if (terrainPortrait !== portrait) {
        terrainPortrait = portrait;
        for (let i = 0; i < positions.count; i++) {
          const x = terrainBase[i * 3], z = terrainBase[i * 3 + 2];
          rocks.forEach((entry, j) => {
            const d = Math.hypot(x - entry.destination.x, z - entry.destination.z);
            craterDepths[j][i] = -1.5 * Math.exp(-d * d / 8) + .85 * Math.exp(-Math.pow(d - 3.8, 2) / .8);
            craterTints[j][i] = .38 * Math.exp(-d * d / 23);
          });
        }
      }
      for (let i = 0; i < positions.count; i++) {
        const x = terrainBase[i * 3], z = terrainBase[i * 3 + 2];
        let y = -.12 + .09 * Math.sin(x * 2.3) * Math.cos(z * 1.7), tint = .7;
        for (let j = 0; j < 4; j++) { y += hits[j] * craterDepths[j][i]; tint -= hits[j] * craterTints[j][i]; }
        positions.setY(i, y);
        terrainColors[i * 3] = terrainColors[i * 3 + 1] = tint; terrainColors[i * 3 + 2] = tint * 1.05;
      }
      let vertex = 0;
      rocks.forEach((entry, i) => {
        const spread = smooth(progress, entry.hit, entry.hit + .35);
        for (let ray = 0; ray < 9; ray++) for (let segment = 0; segment < 5; segment++) for (let end = 0; end < 2; end++) {
          const step = segment + end, radius = 2.5 + step * .8 * spread;
          const angle = ray / 9 * Math.PI * 2 + .055 * Math.sin(step * 7 + ray + i);
          const x = entry.destination.x + Math.cos(angle) * radius, z = entry.destination.z + Math.sin(angle) * radius;
          const y = spread ? -.1 + .09 * Math.sin(x * 2.3) * Math.cos(z * 1.7) - 1.5 * Math.exp(-radius * radius / 8) + .85 * Math.exp(-Math.pow(radius - 3.8, 2) / .8) : -3;
          fissurePositions.set([x, y + .04, z], vertex); vertex += 3;
        }
      });
      fissureGeometry.attributes.position.needsUpdate = true;
      positions.needsUpdate = true; terrainGeometry.attributes.color.needsUpdate = true; terrainGeometry.computeVertexNormals();
    }
    const debrisKey = `${portrait}:${rocks.map(entry => clamp((progress - entry.hit) / 1.25, 0, 1)).join(':')}`;
    const debrisChanged = debrisKey !== lastDebris;
    lastDebris = debrisKey;
    const heat = smooth(progress, 9.05, 9.8);
    rocks.forEach((entry, i) => {
      const age = clamp((progress - entry.hit) / 1.25, 0, 1), impact = smooth(progress, entry.hit - .6, entry.hit);
      // Camera-space flight coordinates preserve silhouettes across the world switch.
      const distance = THREE.MathUtils.lerp(280, 33, smooth(progress, 0, 12));
      const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
      let x = portrait ? [-.64, .48, -.28, .72][i] : [.1, .72, .49, .88][i];
      let y = portrait ? [.64, .67, .75, .58][i] : [.72, .5, .78, .12][i];
      // A quiet band between the mobile header and the approach/descent copy.
      const readingBand = portrait ? smooth(progress, 2, 3) * (1 - smooth(progress, 11.6, 12)) : 0;
      x = THREE.MathUtils.lerp(x, [-.64, -.21, .21, .64][i], readingBand);
      y = THREE.MathUtils.lerp(y, 1 - 2 * (84 + i % 2 * 3) / Math.max(1, innerHeight), readingBand);
      local.set(x * halfHeight * camera.aspect, (y - smooth(progress, 12, 18) * .12) * halfHeight, -distance);
      entry.flight.copy(local).applyQuaternion(camera.quaternion).add(camera.position);
      world.copy(entry.destination).add(ground.position);
      const landing = smooth(progress, 18, entry.hit);
      entry.rock.position.copy(entry.flight).lerp(world, landing);
      const physicalSize = THREE.MathUtils.lerp(2.8, portrait ? .46 : .65, smooth(progress, 9.5, 12));
      const size = THREE.MathUtils.lerp(physicalSize, Math.min(physicalSize, halfHeight * 32 / Math.max(1, innerHeight)), readingBand);
      entry.rock.scale.setScalar(THREE.MathUtils.lerp(size, 3.1, landing));
      entry.rock.quaternion.copy(camera.quaternion);
      entry.rock.rotateZ(.13 * Math.sin(progress * .7 + i) + i * .06);
      entry.rock.quaternion.slerp(entry.rest, landing);
      shadows[i].position.set(entry.destination.x, -.5, entry.destination.z); shadows[i].visible = age > 0;
      entry.logoMaterial.emissiveIntensity = highlighted === socials[i].id ? 1.1 : .85;
      if (entry.cavityLight) { entry.cavityLight.intensity = progress >= 18 ? (highlighted === socials[i].id ? 2.2 : 1.1) : 0; }
      entry.heatMaterial.opacity = heat * (1 - age * .88) * .7;
      entry.trail.material.opacity = heat * (1 - impact) * .22;
      entry.trail.scale.y = .4 + smooth(progress, 9, 11) * .6;
      for (let j = 0; j < count; j++) {
        const n = i * count + j, f = fragments[n], radius = j < 10 ? 3.65 + f.size : f.radius, travel = Math.sin(Math.min(age, 1) * Math.PI / 2);
        if (debrisChanged) {
        dummy.position.set(entry.destination.x + Math.cos(f.angle) * radius * travel, (j < 10 ? .7 : .12) + Math.sin(age * Math.PI) * f.height, entry.destination.z + Math.sin(f.angle) * radius * travel);
        dummy.rotation.set(f.spin + age * 4, f.angle, age * 3); dummy.scale.setScalar(progress >= entry.hit ? f.size : 0); dummy.updateMatrix(); debris.setMatrixAt(n, dummy.matrix);
        }
        const phase = (j / count + elapsed * .15) % 1;
        dummy.position.copy(entry.rock.position);
        if (progress < entry.hit) { local.set((randomless(n) - .5) * 2, phase * 10, -.5).applyQuaternion(camera.quaternion); dummy.position.add(local); }
        else { local.set(Math.cos(f.angle) * (3 + phase), phase * 5, Math.sin(f.angle) * 3); dummy.position.add(local); }
        dummy.rotation.set(f.spin, f.angle, 0);
        dummy.scale.setScalar(heat ? (j % 9 === 0 ? .095 : .035) * (1 - phase) * (progress < entry.hit ? .6 : 1) : 0); dummy.updateMatrix(); embers.setMatrixAt(n, dummy.matrix);
      }
      for (let j = 0; j < smokeCount; j++) {
        const phase = (j / smokeCount + elapsed * .035) % 1;
        dummy.position.set(entry.destination.x + Math.sin(j * 3) * (1 + age * 2) + phase * 2, .2 + phase * 7 * age, entry.destination.z + Math.cos(j * 4) * 2);
        dummy.quaternion.copy(camera.quaternion); dummy.scale.setScalar(progress >= entry.hit ? (1 + phase * 5) * Math.sin(phase * Math.PI) * Math.min(1, age * 6) : 0); dummy.updateMatrix(); smoke.setMatrixAt(i * smokeCount + j, dummy.matrix);
      }
      for (let j = 0; j < 4; j++) {
        dummy.position.set(entry.destination.x + Math.sin(j * 7 + i) * 3, .3, entry.destination.z + Math.cos(j * 7 + i) * 3);
        dummy.quaternion.copy(camera.quaternion); dummy.rotateZ(.15 * Math.sin(elapsed * 3 + j)); dummy.scale.set(1, .55 + .3 * Math.sin(elapsed * 4 + j * 3), 1).multiplyScalar(progress >= entry.hit ? 1 : 0); dummy.updateMatrix(); flames.setMatrixAt(i * 4 + j, dummy.matrix);
      }
    });
    if (debrisChanged) debris.instanceMatrix.needsUpdate = true;
    smoke.instanceMatrix.needsUpdate = embers.instanceMatrix.needsUpdate = flames.instanceMatrix.needsUpdate = true;
  }
  function randomless(n: number) { return (Math.sin(n * 127.1) * 43758.5453) % 1; }
  rocks.forEach(entry => entry.body.geometry.computeBoundingBox());
  const corner = new THREE.Vector3();
  function targets(camera: THREE.PerspectiveCamera, width: number, height: number, progress: number) {
    camera.updateMatrixWorld(); group.updateMatrixWorld(true);
    return rocks.map((entry, i) => {
      const box = entry.body.geometry.boundingBox!;
      let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
      for (let n = 0; n < 8; n++) {
        corner.set(n & 1 ? box.max.x : box.min.x, n & 2 ? box.max.y : -.38, n & 4 ? box.max.z : box.min.z).applyMatrix4(entry.body.matrixWorld).project(camera);
        const x = (corner.x + 1) * width / 2, y = (1 - corner.y) * height / 2;
        left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
      const w = Math.max(44, right - left), h = Math.max(44, bottom - top);
      return { id: socials[i].id, settled: progress >= 21.6, left: (left + right - w) / 2, top: (top + bottom - h) / 2, width: w, height: h };
    });
  }
  return { group, update, targets, highlight(id: string | null) { highlighted = id; }, dispose() { rocks.forEach(r => r.logoMaterial.dispose()); } };
}
