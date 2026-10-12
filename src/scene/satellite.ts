import * as THREE from "three/webgpu";

/** Original illustrative hardware, not a model of an operational spacecraft. */
export function createSatellite() {
  const group = new THREE.Group();
  const gold = new THREE.MeshStandardNodeMaterial({ color: "#cda351", metalness: 0.7, roughness: 0.48 });
  const silver = new THREE.MeshStandardNodeMaterial({ color: "#bdc8d2", metalness: 0.65, roughness: 0.3 });
  const dark = new THREE.MeshStandardNodeMaterial({ color: "#202b38", metalness: 0.5, roughness: 0.5 });
  const cells = new THREE.MeshStandardNodeMaterial({ color: "#153b6b", metalness: 0.5, roughness: 0.27 });
  const box = new THREE.BoxGeometry(1, 1, 1);
  function block(material: THREE.Material, size: [number, number, number], at: [number, number, number]) {
    const mesh = new THREE.Mesh(box, material);
    mesh.scale.set(...size);
    mesh.position.set(...at);
    group.add(mesh);
    return mesh;
  }
  block(gold, [1.05, 1.4, 0.95], [0, 0, 0]);
  block(silver, [1.12, 0.06, 1.02], [0, 0.72, 0]);
  block(silver, [1.12, 0.06, 1.02], [0, -0.72, 0]);
  const foil = new THREE.PlaneGeometry(1.04, 1.38, 14, 18).toNonIndexed();
  const positions = foil.getAttribute("position");
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i);
    positions.setZ(i, Math.sin(x * 93 + y * 47) * Math.cos(y * 61) * 0.005);
  }
  foil.computeVertexNormals();
  for (const side of [-1, 1]) {
    const blanket = new THREE.Mesh(foil, gold);
    blanket.position.z = side * 0.482;
    blanket.rotation.y = side === -1 ? Math.PI : 0;
    group.add(blanket);
    block(silver, [0.65, 0.09, 0.09], [side * 0.8, 0, 0]);
    for (let panel = 0; panel < 3; panel++) {
      const x = side * (1.58 + panel * 0.99);
      block(silver, [0.97, 1.64, 0.035], [x, 0, 0]);
      block(dark, [0.91, 1.58, 0.042], [x, 0, 0]);
    }
  }
  // ponytail: one instanced draw for all cells; no external model or texture loader.
  const solar = new THREE.InstancedMesh(box, cells, 2 * 3 * 4 * 9);
  const transform = new THREE.Object3D();
  let index = 0;
  for (const side of [-1, 1]) for (let panel = 0; panel < 3; panel++) {
    for (let row = 0; row < 9; row++) for (let col = 0; col < 4; col++) {
      transform.position.set(side * (1.58 + panel * 0.99) + (col - 1.5) * 0.218, (row - 4) * 0.172, 0.031);
      transform.scale.set(0.204, 0.156, 0.012);
      transform.updateMatrix();
      solar.setMatrixAt(index++, transform.matrix);
    }
  }
  group.add(solar);
  function rod(from: THREE.Vector3, to: THREE.Vector3, radius = 0.016) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, from.distanceTo(to), 6), silver);
    mesh.position.copy(from).add(to).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    group.add(mesh);
  }
  const profile = Array.from({ length: 17 }, (_, i) => {
    const r = i / 16 * 0.56;
    return new THREE.Vector2(r, r * r * 0.7);
  });
  const dishMaterial = new THREE.MeshStandardNodeMaterial({ color: "#d9dee1", roughness: 0.45, metalness: 0.4, side: THREE.DoubleSide });
  for (const side of [-1, 1]) {
    const size = side === 1 ? 1 : 0.65;
    const center = new THREE.Vector3(side * 0.58, side === 1 ? 0.6 : -0.18, 0.62);
    const dish = new THREE.Mesh(new THREE.LatheGeometry(profile, 40), dishMaterial);
    dish.rotation.x = Math.PI / 2;
    dish.scale.setScalar(size);
    dish.position.copy(center);
    group.add(dish);
    const tip = center.clone().add(new THREE.Vector3(0, 0, 0.52 * size));
    for (const angle of [0, 2.094, 4.189]) rod(center.clone().add(new THREE.Vector3(Math.cos(angle) * 0.5 * size, Math.sin(angle) * 0.5 * size, 0.2 * size)), tip);
    block(dark, [0.1, 0.1, 0.16], [tip.x, tip.y, tip.z]);
    rod(new THREE.Vector3(side * 0.4, -0.6, 0), new THREE.Vector3(side * 0.67, -1.35, 0.15), 0.011);
  }
  for (let i = 0; i < 6; i++) block(silver, [0.12, 0.055, 0.018], [-0.33 + (i % 3) * 0.33, -0.35 - Math.floor(i / 3) * 0.12, 0.505]);
  return group;
}
