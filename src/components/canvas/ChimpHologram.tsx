"use client";
import { useRef, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
uniform float uTime;
uniform sampler2D uTexture;
varying vec2 vUv;
varying float vElevation;

void main() {
  vUv = uv;
  vec4 texColor = texture2D(uTexture, vUv);
  
  // Calculate brightness (luminance)
  float luma = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
  
  // Displace Z based on brightness. Black = backward, White = forward.
  float elevation = (luma * 4.0) - 2.0;
  
  // Add a subtle wave based on time for the "hologram" pulse
  elevation += sin(position.x * 5.0 + uTime) * 0.1;
  
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
  vec3 finalColor = mix(texColor.rgb, cyan * luma * 1.5, 0.5);
  
  // Fade out the edges so it blends perfectly into the black background
  float dist = distance(vUv, vec2(0.5));
  float alpha = smoothstep(0.5, 0.2, dist) * (luma + 0.1);

  gl_FragColor = vec4(finalColor, alpha);
}
`;

export function ChimpHologram() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const texture = useLoader(THREE.TextureLoader, '/chimp-ai.jpg');

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
      const targetX = (state.pointer.x * Math.PI) / 6;
      const targetY = (state.pointer.y * Math.PI) / 6;
      
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetX, 0.05);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, -targetY, 0.05);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, -1, 0]} scale={[1.2, 1.2, 1.2]}>
      {/* High segment count is crucial for vertex displacement. 256x256 = 65k vertices */}
      <planeGeometry args={[8, 8, 256, 256]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        wireframe={false}
      />
    </mesh>
  );
}
