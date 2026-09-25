import * as THREE from "three/webgpu";
import {
  Fn, instancedArray, instanceIndex, hash, uniform, vec3, float, mx_noise_vec3, mod, mix, smoothstep, length, uv, color,
} from "three/tsl";
import { EMBER } from "./crystal";

/**
 * Ember dust: GPU particles drifting on a noise field. The volume is centred on the camera
 * and wraps around it, so the dust never runs out wherever the film travels.
 * `rush` bends the field into a stream along the camera's travel direction.
 */
export function createDust(renderer: THREE.WebGPURenderer, count: number) {
  const SIZE = 26; // edge length of the wrapping volume
  const positions = instancedArray(count, "vec3");
  const seeds = instancedArray(count, "float");

  const uTime = uniform(0);
  const uDt = uniform(0);
  const uCenter = uniform(new THREE.Vector3());
  const uRush = uniform(0);
  const uDir = uniform(new THREE.Vector3(0, -1, 0));

  const init = Fn(() => {
    const i = instanceIndex;
    const p = vec3(hash(i), hash(i.add(7919)), hash(i.add(104729))).sub(0.5).mul(SIZE);
    positions.element(i).assign(p);
    seeds.element(i).assign(hash(i.add(1299709)));
  })().compute(count);

  const update = Fn(() => {
    const i = instanceIndex;
    const p = positions.element(i);
    const drift = mx_noise_vec3(p.mul(0.12).add(vec3(0, uTime.mul(0.05), 0))).mul(0.35);
    const vel = drift.add(uDir.mul(uRush.mul(22)));
    const next = p.add(vel.mul(uDt));
    // Wrap into the camera-centred cube.
    const rel = next.sub(uCenter).add(SIZE / 2);
    p.assign(mod(rel, SIZE).sub(SIZE / 2).add(uCenter));
  })().compute(count);

  const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  material.positionNode = positions.toAttribute();
  const seed = seeds.toAttribute();
  // Small and many; a few are bright sparks. Streaks lengthen while rushing.
  material.scaleNode = vec3(
    mix(float(0.012), float(0.05), seed.pow(6)),
    mix(float(0.012), float(0.05), seed.pow(6)).mul(uRush.mul(9).add(1)),
    1,
  );
  const soft = smoothstep(0.5, 0.0, length(uv().sub(0.5)));
  const twinkle = hash(instanceIndex.toFloat().add(uTime.mul(3).floor())).mul(0.4).add(0.6);
  material.colorNode = color(EMBER).mul(mix(float(1.5), float(6), seed.pow(8))).mul(twinkle);
  material.opacityNode = soft.mul(mix(float(0.35), float(1), seed));

  const sprite = new THREE.Sprite(material);
  sprite.count = count;
  sprite.frustumCulled = false;

  let initialized = false;
  const step = (dt: number, time: number, center: THREE.Vector3, rush: number, dir: THREE.Vector3) => {
    if (!initialized) {
      renderer.compute(init);
      initialized = true;
    }
    uDt.value = dt;
    uTime.value = time;
    uCenter.value.copy(center);
    uRush.value = rush;
    uDir.value.copy(dir);
    renderer.compute(update);
  };

  return { sprite, step };
}
