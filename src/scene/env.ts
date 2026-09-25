import * as THREE from "three/webgpu";

/**
 * A black studio with softboxes and a ring of strips, baked to a PMREM. It is all glass and metal can
 * reflect, so it decides how the core catches light. No download: built at runtime.
 */
export function studioEnvironment(renderer: THREE.WebGPURenderer) {
  const room = new THREE.Scene();
  room.background = new THREE.Color("#020203");

  const softbox = (w: number, h: number, color: string, intensity: number, pos: [number, number, number]) => {
    const mat = new THREE.MeshBasicNodeMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    room.add(m);
  };
  softbox(10, 3, "#fff3e6", 7, [0, 10, 2]); // key, overhead
  softbox(6, 1, "#ff8a3d", 2.5, [0, -8, 5]); // ember bounce, floor
  // A ring of strip lights, as in jewellery photography: every facet finds one as it turns,
  // so the stone reads as alternating bright and dark planes instead of a flat tint.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const warm = i % 3 === 0;
    softbox(0.7, 7, warm ? "#ffc89a" : "#eef3ff", i % 2 ? 2.2 : 5, [Math.cos(a) * 9, 0.5, Math.sin(a) * 9]);
  }
  softbox(14, 0.35, "#ffffff", 4, [0, 3.5, -9]); // thin back line along the horizon

  const pmrem = new THREE.PMREMGenerator(renderer);
  return pmrem.fromScene(room, 0.02).texture;
}
