import * as THREE from 'three/webgpu';
import { cameraPosition, color, float, normalWorld, positionWorld, texture, vec3 } from 'three/tsl';
import type { Tier } from './core';

/** One owner per scene; textures are shared, mutable materials never are. */
export async function loadMaps(paths: Record<string, [string, boolean]>, signal: AbortSignal) {
  const owned: THREE.Texture[] = [];
  const release = () => owned.splice(0).forEach(map => map.dispose());
  signal.addEventListener('abort', release, { once: true });
  const entries = await Promise.allSettled(Object.entries(paths).map(async ([id, [path, srgb]]) => {
    const response = await fetch(path, { signal });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    const bitmap = await createImageBitmap(await response.blob(), { imageOrientation: 'flipY' });
    if (signal.aborted) { bitmap.close(); throw signal.reason; }
    const map = new THREE.Texture(bitmap);
    map.addEventListener('dispose', () => bitmap.close());
    map.flipY = false; map.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    map.needsUpdate = true; owned.push(map);
    return [id, map] as const;
  }));
  const failed = entries.find(entry => entry.status === 'rejected');
  if (failed || signal.aborted) { release(); throw failed?.reason ?? signal.reason; }
  return Object.fromEntries(entries.map(entry => (entry as PromiseFulfilledResult<readonly [string, THREE.Texture]>).value));
}
export async function planetaryMaterials(tier: Tier, signal: AbortSignal) {
  const paths: Record<string, [string, boolean]> = {
    earth: [`/textures/earth-${tier === 'high' ? 4096 : 2048}.webp`, true],
    moon: ['/textures/cinematic/moon-color.webp', true],
    moonHeight: ['/textures/cinematic/moon-height.webp', false],
    jupiter: ['/textures/cinematic/jupiter.webp', true],
    clouds: ['/textures/cinematic/earth-clouds.webp', false],
  };
  for (const id of ['mercury', 'venus_atmosphere', 'mars', 'saturn', 'uranus', 'neptune', 'sun', 'saturn_ring', 'earth_specular_map']) paths[id] = [`/textures/realism/${id}.webp`, id !== 'earth_specular_map'];
  const maps = await loadMaps(paths, signal);
  return {
    maps,
    surface(name: string) {
      const id = name.toLowerCase() === 'venus' ? 'venus_atmosphere' : name.toLowerCase();
      const material = new THREE.MeshStandardNodeMaterial({ map: maps[id], roughness: 1 });
      if (id === 'earth') {
        // Source ocean specularity inverted at asset conversion: water is smooth,
        // continents rough. The map is data, never sRGB.
        material.roughnessNode = texture(maps.earth_specular_map).r.mul(.72).add(.22);
      }
      if (id === 'moon') { material.bumpMap = maps.moonHeight; material.bumpScale = .025; }
      return material;
    },
    sun() { return new THREE.MeshBasicNodeMaterial({ map: maps.sun, color: new THREE.Color(1.25, 1.25, 1.25) }); },
    clouds() { return new THREE.MeshStandardNodeMaterial({ alphaMap: maps.clouds, transparent: true, opacity: .3, depthWrite: false, roughness: 1 }); },
    atmosphere() {
      const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const facing = normalWorld.dot(cameraPosition.sub(positionWorld).normalize()).clamp(0, 1);
      const lit = normalWorld.dot(vec3(-.6, .4, .7).normalize()).smoothstep(-.18, .55);
      material.colorNode = color('#409fee');
      material.opacityNode = float(1).sub(facing).pow(4).mul(lit.mul(.65).add(.015));
      return material;
    },
    ring() {
      const geometry = new THREE.RingGeometry(1.3, 2.4, tier === 'high' ? 128 : 64);
      const positions = geometry.attributes.position, uv = geometry.attributes.uv;
      for (let i = 0; i < positions.count; i++) uv.setXY(i, (Math.hypot(positions.getX(i), positions.getY(i)) - 1.3) / 1.1, .5);
      const ring = new THREE.Mesh(geometry, new THREE.MeshStandardNodeMaterial({ map: maps.saturn_ring, transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 1 }));
      ring.renderOrder = 1; return ring;
    },
  };
}
export type PlanetaryMaterials = Awaited<ReturnType<typeof planetaryMaterials>>;
