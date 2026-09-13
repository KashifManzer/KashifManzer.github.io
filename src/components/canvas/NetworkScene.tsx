"use client";
import { Canvas } from "@react-three/fiber";
import { Nodes } from "./Nodes";
import { MorphingSculpture } from "./MorphingSculpture";
import { Suspense } from "react";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

export function NetworkScene() {
  return (
    <div className="fixed inset-0 -z-10 w-full h-full bg-background pointer-events-none">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        {/* Post-Processing Pipeline */}
        <EffectComposer disableNormalPass>
          <Bloom 
            luminanceThreshold={0.5} 
            mipmapBlur 
            intensity={1.5} 
          />
        </EffectComposer>
        
        <Nodes />
        <Suspense fallback={null}>
          <MorphingSculpture />
        </Suspense>
      </Canvas>
    </div>
  );
}
