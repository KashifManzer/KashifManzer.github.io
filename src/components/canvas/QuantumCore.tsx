"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

export function QuantumCore() {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const swarmRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Math for 2000 orbiting data particles
  const particleCount = 2000;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < particleCount; i++) {
      const radius = 2.5 + Math.random() * 2.5;
      const angle = Math.random() * Math.PI * 2;
      const yOffset = (Math.random() - 0.5) * 3;
      const speed = 0.2 + Math.random() * 0.8;
      temp.push({ radius, angle, yOffset, speed });
    }
    return temp;
  }, [particleCount]);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    
    // Rotate the gyroscopic rings
    if (outerRingRef.current) {
      outerRingRef.current.rotation.x = time * 0.2;
      outerRingRef.current.rotation.y = time * 0.3;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.y = -time * 0.5;
      innerRingRef.current.rotation.z = time * 0.4;
    }
    if (coreRef.current) {
      coreRef.current.rotation.x = time * 0.1;
      coreRef.current.rotation.y = time * 0.8;
      
      // Pulse the core's scale slightly like a beating heart
      const scale = 1 + Math.sin(time * 4) * 0.05;
      coreRef.current.scale.set(scale, scale, scale);
    }

    // Animate the Instanced Data Swarm (Calculated on CPU but rendered in 1 draw call)
    if (swarmRef.current) {
      particles.forEach((particle, i) => {
        // Orbit around the center
        particle.angle += delta * particle.speed * 0.2;
        
        const x = Math.cos(particle.angle) * particle.radius;
        const z = Math.sin(particle.angle) * particle.radius;
        // Weave up and down
        const y = particle.yOffset + Math.sin(time * particle.speed + i) * 0.5;

        dummy.position.set(x, y, z);
        dummy.rotation.x = time * particle.speed;
        dummy.rotation.y = time * particle.speed;
        
        // Pulse individual particle sizes
        const s = 0.02 + Math.sin(time * 3 + i) * 0.015;
        dummy.scale.set(s, s, s);

        dummy.updateMatrix();
        swarmRef.current!.setMatrixAt(i, dummy.matrix);
      });
      swarmRef.current.instanceMatrix.needsUpdate = true;
    }
    
    // Magnetic Mouse Parallax (Follows cursor)
    if (groupRef.current) {
      const targetX = (state.pointer.x * Math.PI) / 6;
      const targetY = (state.pointer.y * Math.PI) / 6;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -targetY, 0.05);
    }
  });

  // Calculate high-intensity glowing color for the Bloom post-processing
  // Base cyan is 0x22d3ee (R:34, G:211, B:238) -> normalized: [0.133, 0.827, 0.933]
  // Multiplying it pushes it past 1.0, triggering the Bloom threshold
  const glowColor = new THREE.Color(0.133 * 4, 0.827 * 4, 0.933 * 4);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1} floatingRange={[-0.2, 0.2]}>
        
        {/* Outer Ring */}
        <mesh ref={outerRingRef}>
          <torusGeometry args={[2.5, 0.02, 16, 100]} />
          <meshBasicMaterial color="#333333" wireframe={true} />
        </mesh>
        
        {/* Inner Ring (Glowing) */}
        <mesh ref={innerRingRef}>
          <torusGeometry args={[1.8, 0.04, 16, 100]} />
          <meshBasicMaterial color={glowColor} toneMapped={false} />
        </mesh>

        {/* The Core Matrix (Glowing Wireframe Icosahedron) */}
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[1.2, 1]} />
          <meshBasicMaterial color={glowColor} toneMapped={false} wireframe={true} />
        </mesh>
        
        {/* The Core Inner Mass (Dark Obsidian to block background lines) */}
        <mesh scale={[1.15, 1.15, 1.15]}>
          <icosahedronGeometry args={[1.2, 2]} />
          <meshBasicMaterial color="#020617" />
        </mesh>

        {/* The Data Swarm */}
        <instancedMesh ref={swarmRef} args={[undefined, undefined, particleCount]}>
          <boxGeometry args={[1, 1, 1]} />
          {/* ToneMapped = false allows the color to exceed 1.0 and bloom */}
          <meshBasicMaterial color={glowColor} toneMapped={false} />
        </instancedMesh>

      </Float>
    </group>
  );
}
