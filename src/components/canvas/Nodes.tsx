"use client";
import { useRef, useMemo } from "react";
import { Points, Float32BufferAttribute } from "three";
import { useFrame } from "@react-three/fiber";

export function Nodes() {
  const pointsRef = useRef<Points>(null);
  const count = 500;

  // ponytail: Instead of a complex instanced mesh with physics, we use a static Points cloud and rotate it slowly. Minimum that works.
  const [positions] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 20;
    }
    return [positions];
  }, [count]);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y -= 0.001;
      pointsRef.current.rotation.x += 0.0005;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#22d3ee" transparent opacity={0.6} sizeAttenuation={true} />
    </points>
  );
}
