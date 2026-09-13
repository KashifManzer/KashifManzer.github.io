"use client";
import { useEffect, useRef } from "react";
import { useGLTF, useAnimations, Float } from "@react-three/drei";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export function AnimatedRobot() {
  const group = useRef<THREE.Group>(null);
  
  // Load the 3.1MB High-End GLTF model
  const { scene, animations } = useGLTF('/BrainStem.glb');
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // Play the first animation (which is the main idle/scanning animation)
    if (actions && Object.keys(actions).length > 0) {
      const actionName = Object.keys(actions)[0];
      const action = actions[actionName];
      if (action) {
        action.reset().fadeIn(0.5).play();
      }
    }
  }, [actions]);

  useFrame((state) => {
    if (group.current) {
      // Magnetic Mouse Parallax (Follows cursor)
      const targetX = (state.pointer.x * Math.PI) / 8;
      const targetY = (state.pointer.y * Math.PI) / 8;
      
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetX, 0.05);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -targetY, 0.05);
    }
  });

  return (
    <Float 
      speed={2} 
      rotationIntensity={0.2} 
      floatIntensity={0.5} 
      floatingRange={[-0.1, 0.1]}
    >
      <group ref={group} position={[0, -1.2, 0]} scale={[1.2, 1.2, 1.2]}>
        <primitive object={scene} />
      </group>
    </Float>
  );
}

// Preload the model so it doesn't pop in late
useGLTF.preload('/BrainStem.glb');
