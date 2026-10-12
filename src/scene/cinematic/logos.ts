import * as THREE from 'three/webgpu';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { technologies, type TechnologyId } from './technologies';

/** Preserve the source paths and gradient fills; depth and metal edges are our presentation. */
export async function loadLogos(low: boolean, signal: AbortSignal) {
  const logos = new Map<TechnologyId, THREE.Group>();
  await Promise.all((Object.keys(technologies) as TechnologyId[]).map(async id => {
    const group = new THREE.Group();
    try {
      const response = await fetch(`/logos/${id}.svg`, { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const source = new SVGLoader().parse(await response.text());
      const bounds = new THREE.Box2();
      const paths = source.paths.filter(path => {
        const style = path.userData?.style as { fill?: string; opacity?: number } | undefined;
        return style?.fill !== 'none' && Number(style?.opacity ?? 1) >= 0.9;
      });
      paths.forEach(path => path.subPaths.forEach(sub => sub.getPoints().forEach(point => bounds.expandByPoint(point))));
      const size = bounds.getSize(new THREE.Vector2());
      const dimension = Math.max(size.x, size.y);
      if (!Number.isFinite(dimension) || dimension <= 0) throw new Error('Empty logo geometry');
      paths.forEach((path, index) => {
        const fill = SVGLoader.createFillMaterial(path);
        if (!fill) return;
        const face = new THREE.MeshStandardNodeMaterial({ color: fill.color, map: fill.map, roughness: 0.26, metalness: 0.18, emissive: fill.color, emissiveMap: fill.map, emissiveIntensity: 0.12 });
        const edge = new THREE.MeshStandardNodeMaterial({ color: fill.color, roughness: 0.24, metalness: 0.65 });
        fill.dispose();
        const shapes = path.toShapes();
        if (!shapes.length) { face.map?.dispose(); face.dispose(); edge.dispose(); return; }
        const geometry = new THREE.ExtrudeGeometry(shapes, {
          depth: dimension * 0.085, bevelEnabled: true, bevelSegments: low ? 1 : 3,
          bevelSize: dimension * 0.0014, bevelThickness: dimension * 0.0014,
          curveSegments: low ? 6 : 12, steps: 1,
        });
        const mesh = new THREE.Mesh(geometry, [face, edge]);
        mesh.position.z = index * dimension * 0.00035;
        mesh.castShadow = true; mesh.receiveShadow = true;
        group.add(mesh);
      });
      group.scale.set(1 / dimension, -1 / dimension, 1 / dimension);
      group.position.set(-(bounds.min.x + size.x / 2) / dimension, (bounds.min.y + size.y / 2) / dimension, -0.0425);
      const normalized = new THREE.Group(); normalized.name = id; normalized.userData.technology = id; normalized.add(group);
      if (signal.aborted) { disposeLogo(normalized); return; }
      logos.set(id, normalized);
    } catch (error) {
      disposeLogo(group);
      if (!signal.aborted) console.warn(`[logos] ${id} unavailable; its experience remains readable.`, error);
    }
  }));
  if (signal.aborted) { logos.forEach(disposeLogo); logos.clear(); }
  return logos;
}

function disposeLogo(group: THREE.Group) {
  group.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      (material as THREE.MeshStandardNodeMaterial).map?.dispose(); material.dispose();
    }
  });
}
