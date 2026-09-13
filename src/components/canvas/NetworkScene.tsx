"use client";
import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { Nodes } from "./Nodes";
import { AnimatedRobot } from "./AnimatedRobot";
import { Suspense } from "react";

export function NetworkScene() {
  return (
    <div className="fixed inset-0 -z-10 w-full h-full bg-background pointer-events-none">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Nodes />
        <Suspense fallback={null}>
          <AnimatedRobot />
          {/* Environment gives the robot's metal and glass highly realistic PBR reflections */}
          <Environment preset="city" />
          {/* ContactShadows grounds the robot so it doesn't look like it's pasted on the screen */}
          <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4} color="#000000" />
        </Suspense>
      </Canvas>
    </div>
  );
}
