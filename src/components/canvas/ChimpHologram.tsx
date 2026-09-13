"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

const vertexShader = `
uniform float uTime;
varying vec2 vUv;
varying float vElevation;

void main() {
  vUv = uv;
  
  // Create a mathematical wave distortion instead of vertex texture fetching (which causes crashes on some Macs)
  float elevation = sin(position.x * 2.0 + uTime * 2.0) * 0.2 + cos(position.y * 2.0 + uTime) * 0.2;
  vElevation = elevation;

  vec3 newPosition = position;
  newPosition.z += elevation;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D uTexture;
varying vec2 vUv;
varying float vElevation;

void main() {
  vec4 texColor = texture2D(uTexture, vUv);
  
  // Calculate luminance
  float luma = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
  
  // Neon Cyan color: #22d3ee
  vec3 cyan = vec3(34.0/255.0, 211.0/255.0, 238.0/255.0);
  
  // Blend original color with our cyberpunk tint
  vec3 finalColor = mix(texColor.rgb, cyan * luma * 2.0, 0.8);
  
  // Fade out the edges so it blends perfectly into the black background
  float dist = distance(vUv, vec2(0.5));
  float alpha = smoothstep(0.5, 0.2, dist) * (luma + 0.1);

  gl_FragColor = vec4(finalColor, alpha);
}
`;

export function ChimpHologram() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // useTexture handles suspense more safely in Next.js
  const texture = useTexture('/chimp-ai.jpg');

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTexture: { value: texture }
    }),
    [texture]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    
    if (meshRef.current) {
      // Magnetic Mouse Parallax (Follows cursor)
      const targetX = (state.pointer.x * Math.PI) / 8;
      const targetY = (state.pointer.y * Math.PI) / 8;
      
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetX, 0.05);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, -targetY, 0.05);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} scale={[1.5, 1.5, 1.5]}>
      <planeGeometry args={[8, 8, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        wireframe={false}
      />
    </mesh>
  );
}
