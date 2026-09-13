"use client";
import { useRef, useMemo, useEffect } from "react";
import { Points, Color } from "three";
import { useFrame } from "@react-three/fiber";

export function Nodes() {
  const pointsRef = useRef<Points>(null);
  const count = 500;
  const cyanColor = useMemo(() => new Color(0x22d3ee), []);

  // ponytail: Instead of a complex instanced mesh with physics, we use a static Points cloud and rotate it slowly. Minimum that works.
  const [positions] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 20;
    }
    return [positions];
  }, [count]);

  const speedRef = useRef(1);

  useEffect(() => {
    const handleBurst = () => {
      speedRef.current = 15; // Spike the speed
      if (pointsRef.current) {
        // Temporarily brighten the color to white
        (pointsRef.current.material as any).color.setHex(0xffffff);
      }
    };
    
    window.addEventListener('network-burst', handleBurst);
    return () => window.removeEventListener('network-burst', handleBurst);
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      // Decay the burst speed back to normal smoothly
      speedRef.current += (1 - speedRef.current) * 0.05;
      
      pointsRef.current.rotation.y -= 0.001 * speedRef.current;
      pointsRef.current.rotation.x += 0.0005 * speedRef.current;
      
      // Decay color back to cyan (#22d3ee is 0x22d3ee)
      if (speedRef.current > 1.1) {
        (pointsRef.current.material as any).color.lerp(cyanColor, 0.05);
      }
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
