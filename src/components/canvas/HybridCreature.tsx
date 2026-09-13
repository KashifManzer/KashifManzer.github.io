"use client";
import { useGLTF } from "@react-three/drei";
import { useRef } from "react";
import { Group } from "three";
import { useFrame } from "@react-three/fiber";

export function HybridCreature() {
  // ponytail: using a public placeholder GLTF until the actual model is provided. Minimum that works.
  const { scene } = useGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf");
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2;
      groupRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={2} position={[0, -1, 0]} />
    </group>
  );
}
