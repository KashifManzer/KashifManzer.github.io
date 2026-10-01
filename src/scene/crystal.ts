import * as THREE from "three/webgpu";
import type { Tier } from "./core";

export const EMBER = new THREE.Color("#ff8a3d");

/**
 * The core: a faceted glass crystal. Dispersion splits the studio highlights and the ember
 * glow behind it into spectral edges as it turns. The low tier keeps the transmission but skips
 * dispersion and iridescence, the costliest parts of the shader.
 */
export function createCrystal(tier: Tier) {
  const group = new THREE.Group();

  const geo = new THREE.OctahedronGeometry(1, 1); // polyhedra are non-indexed: flat facets
  geo.scale(0.95, 1.55, 0.95);
  geo.computeVertexNormals();

  const high = tier === "high";
  const glass = new THREE.MeshPhysicalNodeMaterial({
    color: "#ffffff",
    metalness: 0,
    roughness: 0.04,
    transmission: 1,
    thickness: 1.6,
    ior: 1.8,
    dispersion: high ? 6 : 0,
    iridescence: high ? 0.6 : 0,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [180, 620],
    specularIntensity: 1,
    envMapIntensity: 2.2,
  });
  const shell = new THREE.Mesh(geo, glass);
  group.add(shell);

  return { group, shell };
}
