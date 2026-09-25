import * as THREE from "three/webgpu";
import { pass, float, screenUV, smoothstep, length, vec2, vec4, Fn } from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { chromaticAberration } from "three/addons/tsl/display/ChromaticAberrationNode.js";
import { film as grain } from "three/addons/tsl/display/FilmNode.js";
import type { Tier } from "./core";

/** The film finish: bloom on embers and windows, a touch of lens fringing, grain, vignette. */
export function createPipeline(renderer: THREE.WebGPURenderer, scene: THREE.Scene, camera: THREE.Camera, tier: Tier) {
  const pipeline = new THREE.RenderPipeline(renderer);
  const color = pass(scene, camera).getTextureNode();

  const bloomed = color.add(bloom(color, tier === "high" ? 0.85 : 0.7, 0.55, 0.55));
  // The center must be explicit: r186 documents `null` as "screen center" but passes it on unbuilt.
  // @types/three types these two effect nodes as bare classes; at runtime they are vec4 nodes.
  const finished = (
    tier === "high" ? grain(chromaticAberration(bloomed, float(0.06), vec2(0.5, 0.5), float(1.01)), float(0.12)) : bloomed
  ) as unknown as THREE.Node<"vec4">;
  const vignette = Fn(() => float(1).sub(smoothstep(0.35, 0.95, length(screenUV.sub(0.5)).mul(1.25)).mul(0.65)));
  pipeline.outputNode = vec4(finished.rgb.mul(vignette()), 1);
  return pipeline;
}
