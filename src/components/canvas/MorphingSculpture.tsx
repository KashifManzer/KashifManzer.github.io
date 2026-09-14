"use client";
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const fragmentShader = `
varying vec3 vColor;
varying float vQuantized;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  
  if (vQuantized > 0.4) {
    // QUANTIZED MODE: Render as a sharp, hard-edged data square
    if (abs(coord.x) > 0.48 || abs(coord.y) > 0.48) discard;
    gl_FragColor = vec4(vColor, 1.0);
  } else {
    // ORGANIC MODE: Render as a soft, fluid glowing orb
    float dist = length(coord);
    if (dist > 0.5) discard;
    float alpha = pow(1.0 - (dist * 2.0), 1.5);
    gl_FragColor = vec4(vColor, alpha);
  }
}
`;

const vertexShader = `
uniform float uScroll;
uniform float uTime;
uniform vec3 uMouse;

attribute vec3 position2;
attribute vec3 position3;
attribute vec3 randoms;

varying vec3 vColor;
varying float vQuantized;

void main() {
  vec3 pos1 = position;
  vec3 pos2 = position2;
  vec3 pos3 = position3;
  
  // uScroll goes from 0.0 (top) to 1.0 (bottom)
  float p1 = clamp((uScroll - 0.0) * 2.0, 0.0, 1.0);
  float p2 = clamp((uScroll - 0.5) * 2.0, 0.0, 1.0);
  
  // Smooth cubic easing for the transition
  float ease1 = p1 * p1 * (3.0 - 2.0 * p1);
  float ease2 = p2 * p2 * (3.0 - 2.0 * p2);
  
  // Interpolate positions between the 3 CS shapes
  vec3 currentPos = mix(pos1, pos2, ease1);
  currentPos = mix(currentPos, pos3, ease2);
  
  // Chaos factor: particles explode slightly during the middle of a transition
  float chaos1 = sin(p1 * 3.14159) * 1.5;
  float chaos2 = sin(p2 * 3.14159) * 1.5;
  currentPos += randoms * (chaos1 + chaos2);
  
  // Ambient floating animation
  currentPos.y += sin(uTime * 1.5 + randoms.x * 20.0) * 0.1;
  currentPos.x += cos(uTime * 1.2 + randoms.y * 20.0) * 0.1;
  
  // --- THE QUANTIZATION FIELD (MOUSE INTERACTION) ---
  float dist = distance(currentPos, uMouse);
  float radius = 2.5; // Radius of the compiler field
  
  vQuantized = 0.0;
  vec3 finalColor = vec3(0.0);
  
  // Color Morphing (Cyan -> Deep Purple -> Neon Blue)
  vec3 color1 = vec3(0.13, 0.83, 0.93) * 1.5;
  vec3 color2 = vec3(0.50, 0.10, 0.90) * 1.5;
  vec3 color3 = vec3(0.20, 0.50, 1.00) * 1.5;
  
  finalColor = mix(color1, color2, ease1);
  finalColor = mix(finalColor, color3, ease2);
  
  if (dist < radius) {
      // Calculate quantization force (strongest at center of mouse)
      float force = 1.0 - (dist / radius);
      force = pow(force, 3.0); // Snap aggressively
      
      // Calculate perfectly rigid 3D Voxel Grid position
      float density = 6.0; 
      vec3 snappedPos = floor(currentPos * density) / density;
      
      // Snap the particle to the grid
      currentPos = mix(currentPos, snappedPos, force);
      
      // Shift color to Stark Matrix/Cyber Emerald Green
      vec3 matrixGreen = vec3(0.1, 1.0, 0.3) * 2.5;
      finalColor = mix(finalColor, matrixGreen, force);
      
      vQuantized = force;
  }
  
  vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
  
  // Size attenuation
  gl_PointSize = (12.0 / -mvPosition.z) * (0.5 + randoms.z);
  gl_Position = projectionMatrix * mvPosition;
  
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
      
      // Random chaos vectors
      r[i3 + 0] = (Math.random() - 0.5) * 2;
      r[i3 + 1] = (Math.random() - 0.5) * 2;
      r[i3 + 2] = (Math.random() - 0.5) * 2;
      
      // SHAPE 1: Microservices Swarm (1 Core + 5 Orbiting Clusters)
      const cluster = i % 6;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      if (cluster === 0) {
        // Central Hub
        const rad = Math.random() * 1.5;
        p1[i3 + 0] = rad * Math.sin(phi) * Math.cos(theta);
        p1[i3 + 1] = rad * Math.sin(phi) * Math.sin(theta);
        p1[i3 + 2] = rad * Math.cos(phi);
      } else {
        // Orbiting Microservices
        const angle = (cluster / 5.0) * Math.PI * 2.0;
        const cx = Math.cos(angle) * 3.5;
        const cz = Math.sin(angle) * 3.5;
        const cy = (Math.random() - 0.5) * 2.0;
        const rad = Math.random() * 0.8;
        p1[i3 + 0] = cx + (rad * Math.sin(phi) * Math.cos(theta));
        p1[i3 + 1] = cy + (rad * Math.sin(phi) * Math.sin(theta));
        p1[i3 + 2] = cz + (rad * Math.cos(phi));
      }
      
      // SHAPE 2: The Monolith (Dense Rectangular Blockchain)
      p2[i3 + 0] = (Math.random() - 0.5) * 2.0; // Width
      p2[i3 + 1] = (Math.random() - 0.5) * 8.0; // Height (Very tall)
      p2[i3 + 2] = (Math.random() - 0.5) * 2.0; // Depth
      
      // SHAPE 3: The Sorting Algorithm (Perfectly Ordered 3D Paraboloid Wave)
      const row = Math.floor(i / 250); // 200 rows
      const col = i % 250; // 250 cols
      const x = (col / 250 - 0.5) * 10.0;
      const z = (row / 200 - 0.5) * 10.0;
      // Mathematical sorting visualization (a perfect 3D wave interference pattern)
      const y = Math.sin(x * 1.5) * Math.cos(z * 1.5) * 1.5 - 2.0;
      p3[i3 + 0] = x;
      p3[i3 + 1] = y;
      p3[i3 + 2] = z;
    }
    
    return { pos1: p1, pos2: p2, pos3: p3, randoms: r };
  }, [particleCount]);

  // Sync scroll to shader
  useEffect(() => {
    const handleScroll = () => {
      if (!materialRef.current) return;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollY = window.scrollY;
      const scrollPercent = Math.min(Math.max(scrollY / maxScroll, 0.0), 1.0);
      materialRef.current.uniforms.uScroll.value = scrollPercent;
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Raycasting plane for the Quantization Field mouse interaction
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mousePos = useMemo(() => new THREE.Vector3(100, 100, 100), []); // Start offscreen

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      
      // Cast 2D mouse position into 3D world space
      raycaster.setFromCamera(state.pointer, state.camera);
      raycaster.ray.intersectPlane(plane, mousePos);
      
      // Feed actual 3D mouse position into the Quantization shader
      materialRef.current.uniforms.uMouse.value.copy(mousePos);
    }
    
    if (pointsRef.current) {
      // Base rotation that applies to all shapes
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.1;
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
          uScroll: { value: 0 },
          uMouse: { value: new THREE.Vector3(100, 100, 100) }
        }}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
