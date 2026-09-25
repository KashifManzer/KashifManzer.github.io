import * as THREE from "three/webgpu";
import {
  Fn, positionLocal, normalLocal, instanceIndex, hash, uniform, vec2, vec3, float, abs, floor, fract, step, mix,
  smoothstep, length, uv, select, color,
} from "three/tsl";

/**
 * SettleMint chapter: a night city. It first exists as a white line sketch, then a front
 * sweeps out from the centre and the city "develops": towers rise, windows switch on,
 * traffic starts to flow. `sketch` and `develop` run 0..1.
 */

const CELL = 3; // lot pitch in world units
const STREET_EVERY = 5; // every 5th row/column is a street
const WARM = new THREE.Color("#ffb46b");
const COOL = new THREE.Color("#cfe2ff");

export function createCity(tier: "high" | "low") {
  const half = tier === "high" ? 22 : 16; // cells from centre to edge
  const span = half * 2 * CELL;
  const maxR = half * CELL * 1.45;
  const group = new THREE.Group();

  const uDevelop = uniform(0);
  const uSketch = uniform(0);
  const uTime = uniform(0);

  // Shared growth factor: 1 behind the develop front, 0 ahead of it.
  const growth = (p: THREE.Node<"vec3">) => {
    const front = uDevelop.mul(maxR + 12);
    return smoothstep(front, front.sub(10), length(p.xz));
  };

  // Lots: deterministic so the skyline is the same every visit.
  const rand = (() => {
    let s = 20211;
    return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  })();
  const mats: THREE.Matrix4[] = [];
  for (let gx = -half; gx <= half; gx++) {
    for (let gz = -half; gz <= half; gz++) {
      if (gx % STREET_EVERY === 0 || gz % STREET_EVERY === 0) continue;
      const x = gx * CELL;
      const z = gz * CELL;
      const d = Math.hypot(x, z);
      const downtown = Math.exp(-((d / 26) ** 2));
      const r = rand();
      if (d > maxR || rand() < 0.08 + (d / maxR) * 0.25) continue; // gaps thin out the edge
      const h = 0.8 + r ** 3 * 4 + downtown * (5 + rand() * 20);
      const w = 1.5 + rand() * 1.1;
      const dd = 1.5 + rand() * 1.1;
      mats.push(new THREE.Matrix4().compose(new THREE.Vector3(x, h / 2, z), new THREE.Quaternion(), new THREE.Vector3(w, h, dd)));
    }
  }

  // Towers.
  const towerMat = new THREE.MeshStandardNodeMaterial({ color: "#07090d", roughness: 0.3, metalness: 0.7, envMapIntensity: 0.3 });
  const towerGrowth = growth(positionLocal);
  towerMat.positionNode = vec3(positionLocal.x, positionLocal.y.mul(towerGrowth), positionLocal.z);
  towerMat.emissiveNode = Fn(() => {
    const p = positionLocal;
    const n = normalLocal;
    const side = step(abs(n.y), 0.5); // 0 on roofs
    const u = select(abs(n.x).greaterThan(0.5), p.z, p.x);
    const g = vec2(u.div(0.42), p.y.div(0.55));
    const cell = floor(g);
    const inside = step(fract(g.x), 0.5).mul(step(fract(g.y), 0.44)).mul(step(0.6, p.y));
    const id = instanceIndex.toFloat();
    const key = cell.x.mul(127.1).add(cell.y.mul(311.7)).add(id.mul(74.7));
    // About a fifth of windows lit, like a real city at night; a slow hash flip switches a few over time.
    const lit = step(0.78, hash(key.add(floor(uTime.mul(0.15).add(hash(key).mul(9))))));
    const tint = mix(color(WARM), color(COOL), step(0.8, hash(key.add(17.3))));
    // Lights come on a beat after the tower has risen.
    const front = uDevelop.mul(maxR + 12);
    const on = smoothstep(front.sub(8), front.sub(22), length(p.xz));
    return tint.mul(inside).mul(lit).mul(side).mul(on).mul(1.7);
  })();
  const towers = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0, 0), towerMat, mats.length);
  mats.forEach((m, i) => towers.setMatrixAt(i, m));
  towers.frustumCulled = false;
  group.add(towers);

  // Sketch: every tower's edges as one white line set, drawn in from the centre.
  const box = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
  const edge = box.getAttribute("position");
  const linePos = new Float32Array(mats.length * edge.count * 3);
  const v = new THREE.Vector3();
  mats.forEach((m, i) => {
    for (let k = 0; k < edge.count; k++) {
      v.fromBufferAttribute(edge, k).applyMatrix4(m);
      linePos.set([v.x, v.y, v.z], (i * edge.count + k) * 3);
    }
  });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
  const lineMat = new THREE.LineBasicNodeMaterial({ color: "#efe9df", transparent: true, depthWrite: false });
  const sketchFront = uSketch.mul(maxR + 10);
  lineMat.opacityNode = smoothstep(sketchFront, sketchFront.sub(14), length(positionLocal.xz))
    .mul(float(1).sub(growth(positionLocal)))
    .mul(0.42);
  group.add(new THREE.LineSegments(lineGeo, lineMat));

  // Ground with faint amber street lines that light up behind the front.
  const groundMat = new THREE.MeshStandardNodeMaterial({ color: "#07080b", roughness: 0.85, metalness: 0.1 });
  groundMat.emissiveNode = Fn(() => {
    const p = positionLocal;
    const pitch = float(CELL * STREET_EVERY);
    const dx = abs(fract(p.x.div(pitch).add(0.5)).sub(0.5)).mul(pitch);
    const dz = abs(fract(p.y.div(pitch).add(0.5)).sub(0.5)).mul(pitch); // plane is rotated: local y is world -z
    const line = smoothstep(0.9, 0.2, dx).max(smoothstep(0.9, 0.2, dz));
    return color(WARM).mul(line).mul(growth(vec3(p.x, 0, p.y))).mul(0.12);
  })();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(span * 1.8, span * 1.8), groundMat);
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  // Traffic: pure vertex animation, no buffers. Each sprite picks a street, lane and speed by hash.
  const cars = tier === "high" ? 5000 : 1800;
  const streets = Math.floor((half * 2) / STREET_EVERY) + 1;
  const firstStreet = -Math.floor(half / STREET_EVERY) * STREET_EVERY * CELL;
  const trafficMat = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const i = instanceIndex.toFloat();
  const alongX = step(0.5, hash(i));
  const dir = step(0.5, hash(i.add(2))).mul(2).sub(1);
  const street = floor(hash(i.add(1)).mul(streets));
  const lane = street.mul(CELL * STREET_EVERY).add(firstStreet).add(dir.mul(0.4));
  const speed = hash(i.add(4)).mul(0.5).add(0.35);
  const along = fract(hash(i.add(3)).add(uTime.mul(speed).mul(dir).div(span / 9))).sub(0.5).mul(span);
  const carPos = mix(vec3(lane, 0.12, along), vec3(along, 0.12, lane), alongX);
  trafficMat.positionNode = carPos;
  trafficMat.scaleNode = float(0.16);
  const head = dir.greaterThan(0);
  trafficMat.colorNode = select(head, vec3(1.0, 0.86, 0.62).mul(3.2), vec3(1.0, 0.16, 0.08).mul(3.2));
  trafficMat.opacityNode = smoothstep(0.5, 0.1, length(uv().sub(0.5))).mul(growth(carPos));
  const traffic = new THREE.Sprite(trafficMat);
  traffic.count = cars;
  traffic.frustumCulled = false;
  group.add(traffic);

  return {
    group,
    set(sketch: number, develop: number, time: number) {
      uSketch.value = sketch;
      uDevelop.value = develop;
      uTime.value = time;
    },
  };
}
