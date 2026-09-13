"use client";
import { Canvas } from "@react-three/fiber";
import { Nodes } from "./Nodes";
import { QuantumCore } from "./QuantumCore";
import { Suspense } from "react";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

export function NetworkScene() {
  return (
    <div className="fixed inset-0 -z-10 w-full h-full bg-background pointer-events-none">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        {/* Post-Processing Pipeline */}
        <EffectComposer disableNormalPass>
          <Bloom 
            luminanceThreshold={1} 
            mipmapBlur 
            intensity={1.5} 
          />
        </EffectComposer>
        
        <Nodes />
        <Suspense fallback={null}>
          <QuantumCore />
        </Suspense>
      </Canvas>
    </div>
  );
}
