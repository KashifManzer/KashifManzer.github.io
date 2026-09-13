"use client";
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const fragmentShader = `
varying vec3 vColor;
void main() {
  // Make it a soft circle instead of a harsh square pixel
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;
  
  // Soft glowing edge
  float alpha = 1.0 - (dist * 2.0);
  alpha = pow(alpha, 1.5);
  
  gl_FragColor = vec4(vColor, alpha);
}
`;

const vertexShader = `
uniform float uScroll;
uniform float uTime;

attribute vec3 position2;
attribute vec3 position3;
attribute vec3 randoms;

varying vec3 vColor;

void main() {
  vec3 pos1 = position;
  vec3 pos2 = position2;
  vec3 pos3 = position3;
  
  // uScroll goes from 0.0 (top) to 1.0 (bottom)
  // Phase 1: 0.0 -> 0.5 (Morph from Shape 1 to Shape 2)
  // Phase 2: 0.5 -> 1.0 (Morph from Shape 2 to Shape 3)
  float p1 = clamp((uScroll - 0.0) * 2.0, 0.0, 1.0);
  float p2 = clamp((uScroll - 0.5) * 2.0, 0.0, 1.0);
  
  // Smooth cubic easing for the transition
  float ease1 = p1 * p1 * (3.0 - 2.0 * p1);
  float ease2 = p2 * p2 * (3.0 - 2.0 * p2);
  
  // Chaos factor: particles explode outward during the middle of a transition
  float chaos1 = sin(p1 * 3.14159) * 2.0;
  float chaos2 = sin(p2 * 3.14159) * 2.0;
  
  // Interpolate positions
  vec3 currentPos = mix(pos1, pos2, ease1);
  currentPos = mix(currentPos, pos3, ease2);
  
  // Apply explosive chaos
  currentPos += randoms * (chaos1 + chaos2);
  
  // Ambient floating animation
  currentPos.y += sin(uTime * 1.5 + randoms.x * 20.0) * 0.1;
  currentPos.x += cos(uTime * 1.2 + randoms.y * 20.0) * 0.1;
  
  vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
  
  // Perspective size attenuation
  gl_PointSize = (15.0 / -mvPosition.z) * (0.5 + randoms.z);
  gl_Position = projectionMatrix * mvPosition;
  
  // Color Morphing (Cyan -> Purple -> Emerald)
  vec3 color1 = vec3(0.13, 0.83, 0.93) * 1.5;
  vec3 color2 = vec3(0.70, 0.20, 0.90) * 1.5;
  vec3 color3 = vec3(0.10, 0.95, 0.60) * 1.5;
  
  vec3 finalColor = mix(color1, color2, ease1);
  finalColor = mix(finalColor, color3, ease2);
  
  vColor = finalColor;
}
`;

export function MorphingSculpture() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const pointsRef = useRef<THREE.Points>(null);
  
  const particleCount = 50000;
  
  const { pos1, pos2, pos3, randoms } = useMemo(() => {
    const p1 = new Float32Array(particleCount * 3);
    const p2 = new Float32Array(particleCount * 3);
    const p3 = new Float32Array(particleCount * 3);
    const r = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random vectors for chaos explosion
      r[i3 + 0] = (Math.random() - 0.5) * 2;
      r[i3 + 1] = (Math.random() - 0.5) * 2;
      r[i3 + 2] = (Math.random() - 0.5) * 2;
      
      // SHAPE 1: The Brain/Sphere (Hero)
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r1 = 2.0 + (Math.random() * 0.2); // Brain surface noise
      p1[i3 + 0] = r1 * Math.sin(phi) * Math.cos(theta);
      p1[i3 + 1] = r1 * Math.sin(phi) * Math.sin(theta);
      p1[i3 + 2] = r1 * Math.cos(phi);
      
      // SHAPE 2: Distributed Node Network / Torus (Projects)
      const tTheta = Math.random() * Math.PI * 2;
      const tPhi = Math.random() * Math.PI * 2;
      const tRadius = 3.0;
      const tTube = 1.0 * Math.random();
      p2[i3 + 0] = (tRadius + tTube * Math.cos(tPhi)) * Math.cos(tTheta);
      p2[i3 + 1] = (tRadius + tTube * Math.cos(tPhi)) * Math.sin(tTheta);
      p2[i3 + 2] = tTube * Math.sin(tPhi);
      
      // SHAPE 3: DNA Double Helix (Skills)
      const strand = Math.random() > 0.5 ? 0 : Math.PI; // Two strands
      const hTheta = (i / particleCount) * Math.PI * 10; // 5 full turns
      const hRadius = 1.5 + (Math.random() * 0.2);
      const hY = ((i / particleCount) - 0.5) * 10.0;
      p3[i3 + 0] = hRadius * Math.cos(hTheta + strand);
      p3[i3 + 1] = hY;
      p3[i3 + 2] = hRadius * Math.sin(hTheta + strand);
    }
    
    return { pos1, pos2, pos3, randoms: r };
  }, [particleCount]);

  // Sync scroll to shader
  useEffect(() => {
    const handleScroll = () => {
      if (!materialRef.current) return;
      // Calculate scroll percentage (0.0 to 1.0)
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollY = window.scrollY;
      const scrollPercent = Math.min(Math.max(scrollY / maxScroll, 0.0), 1.0);
      
      materialRef.current.uniforms.uScroll.value = scrollPercent;
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Init
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    
    if (pointsRef.current) {
      // Base rotation that applies to all shapes
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      
      // Magnetic Mouse Parallax
      const targetX = (state.pointer.x * Math.PI) / 8;
      const targetY = (state.pointer.y * Math.PI) / 8;
      pointsRef.current.rotation.y += (targetX - pointsRef.current.rotation.y) * 0.05;
      pointsRef.current.rotation.x += (-targetY - pointsRef.current.rotation.x) * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={pos1} itemSize={3} />
        <bufferAttribute attach="attributes-position2" count={particleCount} array={pos2} itemSize={3} />
        <bufferAttribute attach="attributes-position3" count={particleCount} array={pos3} itemSize={3} />
        <bufferAttribute attach="attributes-randoms" count={particleCount} array={randoms} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uScroll: { value: 0 }
        }}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
