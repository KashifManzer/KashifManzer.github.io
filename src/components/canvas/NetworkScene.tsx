"use client";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Nodes } from "./Nodes";
import { ChimpHologram } from "./ChimpHologram";
import { Suspense } from "react";

export function NetworkScene() {
  return (
    <div className="fixed inset-0 -z-10 w-full h-full bg-background">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Nodes />
        <Suspense fallback={null}>
          <ChimpHologram />
        </Suspense>
      </Canvas>
    </div>
  );
}
