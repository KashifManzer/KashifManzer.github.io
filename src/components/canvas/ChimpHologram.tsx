"use client";
import { useRef, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

export function ChimpHologram() {
  const meshRef = useRef<THREE.Group>(null);
  
  // Load the true 3D OBJ asset
  const obj = useLoader(OBJLoader, '/suzanne.obj');

  // Extract the geometry from the OBJ
  const geometry = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null;
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        geo = (child as THREE.Mesh).geometry;
      }
    });
    return geo;
  }, [obj]);

  useFrame((state) => {
    if (meshRef.current) {
      // Magnetic Mouse Parallax (Follows cursor)
      const targetX = (state.pointer.x * Math.PI) / 4;
      const targetY = (state.pointer.y * Math.PI) / 4;
      
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetX, 0.05);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, -targetY, 0.05);
      
      // Add a subtle floating animation
      meshRef.current.position.y = -0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  if (!geometry) return null;

  return (
    <group ref={meshRef} position={[0, -0.5, 0]} scale={[2.5, 2.5, 2.5]}>
      {/* Layer 1: Dark Obsidian/Metal interior to give it physical mass */}
      <mesh geometry={geometry}>
        <meshPhysicalMaterial 
          color={0x020617} 
          metalness={0.9} 
          roughness={0.1} 
          clearcoat={1.0}
        />
      </mesh>
      
      {/* Layer 2: Glowing Holographic Wireframe shell (The "AI" component) */}
      <mesh geometry={geometry} scale={[1.02, 1.02, 1.02]}>
        <meshBasicMaterial 
          color={0x22d3ee} 
          wireframe={true} 
          transparent={true} 
          opacity={0.3} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
