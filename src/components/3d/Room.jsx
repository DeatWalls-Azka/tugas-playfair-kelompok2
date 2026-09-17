import React, { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text, useCursor } from '@react-three/drei';
import { ROOM_W, ROOM_D, ROOM_H, PLAYFAIR_FONT } from '../../constants/scene.js';
import { Sound } from '../../utils/SoundEngine.js';

/* ═══ DUST ═══ */
function DustMotes({ count = 240 }) {
  const pointsRef = useRef(null);
  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * ROOM_W * 0.9;
      pos[i * 3 + 1] = Math.random() * ROOM_H;
      pos[i * 3 + 2] = (Math.random() - 0.5) * ROOM_D * 0.9;
      spd[i] = 0.05 + Math.random() * 0.15;
    }
    return { positions: pos, speeds: spd };
  }, [count]);
  useFrame((state, delta) => {
    const g = pointsRef.current; if (!g) return;
    const arr = g.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * delta;
      arr[i * 3 + 0] += Math.sin(state.clock.elapsedTime * 0.4 + i) * delta * 0.08;
      if (arr[i * 3 + 1] > ROOM_H) arr[i * 3 + 1] = 0;
    }
    g.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.028} color="#ffd9a8" sizeAttenuation transparent opacity={0.55}
        depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}
/* ═══ DESK PROPS ═══ */
function Terminal({ output }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const lines = useMemo(() => {
    if (!output) return ['> READY'];
    return ['> ' + output.slice(0, 22), '  ' + output.slice(22, 44)];
  }, [output]);
  return (
    <group position={[1.55, 1.12, -5.1]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); Sound.hover(); }}
      onPointerOut={() => setHovered(false)}>
      <mesh rotation={[-0.15, 0, 0]} castShadow>
        <boxGeometry args={[1.1, 0.62, 0.28]} />
        <meshStandardMaterial color="#0e1620" roughness={0.6} metalness={0.4}
          emissive={hovered ? '#1a3040' : '#080e18'}
          emissiveIntensity={hovered ? 1.2 : 0.4} />
      </mesh>
      <mesh position={[0, 0.02, 0.15]} rotation={[-0.15, 0, 0]}>
        <planeGeometry args={[0.88, 0.42]} />
        <meshStandardMaterial color="#001a10" emissive="#0a4a30" emissiveIntensity={1.6}
          roughness={0.25} metalness={0.2} toneMapped={false} />
      </mesh>
      {lines.map((line, i) => (
        <Text key={i} position={[-0.38, 0.10 - i * 0.11, 0.165]}
          rotation={[-0.15, 0, 0]} fontSize={0.042} color="#7dffb8"
          font={PLAYFAIR_FONT} anchorX="left" anchorY="middle">{line}</Text>
      ))}
      <mesh position={[0, -0.34, 0.02]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[0.5, 0.08, 0.22]} />
        <meshStandardMaterial color="#0a1018" roughness={0.8} metalness={0.3} />
      </mesh>
    </group>
  );
}

function DeskLamp() {
  const lightRef = useRef(null);
  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 2.4 + Math.sin(state.clock.elapsedTime * 0.5) * 0.3
                                        + Math.sin(state.clock.elapsedTime * 7.1) * 0.08;
    }
  });
  return (
    <group position={[-1.75, 1.0, -5.1]}>
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.05, 12]} />
        <meshStandardMaterial color="#1a2430" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[0.12, 0.28, 0]} rotation={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.025, 0.025, 0.55, 8]} />
        <meshStandardMaterial color="#2a3a4e" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0.32, 0.52, 0]} rotation={[0, 0, 0.5]}>
        <coneGeometry args={[0.14, 0.2, 10, 1, true]} />
        <meshStandardMaterial color="#c8a060" roughness={0.35} metalness={0.7}
          emissive="#ff9640" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      <pointLight ref={lightRef} position={[0.32, 0.5, 0.35]} intensity={2.4}
        color="#ffb066" distance={5} decay={2} />
    </group>
  );
}

/* ═══ LIGHTS ═══ */
function CinematicLights() {
  const amberRef = useRef(null), cyanRef = useRef(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (amberRef.current) amberRef.current.intensity = 12 + Math.sin(t * 0.9) * 3 + Math.sin(t * 13) * 0.6;
    if (cyanRef.current) cyanRef.current.intensity = 10 + Math.sin(t * 1.1 + 1) * 2.5;
  });
  return (
    <>
      <ambientLight intensity={0.15} color="#1a3050" />
      <spotLight position={[0, ROOM_H - 0.2, 1.5]} angle={0.9} penumbra={0.9}
        intensity={26} color="#c8e0ff" distance={14} decay={2} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        target-position={[0, 1, -5]} />
      <pointLight ref={amberRef} position={[-ROOM_W / 2 + 1.2, 2.2, 0.5]}
        intensity={12} color="#ff8a2c" distance={14} decay={2} />
      <pointLight ref={cyanRef} position={[ROOM_W / 2 - 1.2, 2.2, -1.5]}
        intensity={10} color="#2ee6a8" distance={14} decay={2} />
      <pointLight position={[0, 0.3, 3]} intensity={6} color="#3a6ae0" distance={10} decay={2} />
    </>
  );
}
/* ═══ ROOM ═══ */
function Room() {
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#141a24', roughness: 0.94, metalness: 0.15,
    emissive: '#0a1018', emissiveIntensity: 0.25 }), []);
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0c1218', roughness: 0.72, metalness: 0.45,
    emissive: '#060a10', emissiveIntensity: 0.2 }), []);
  const ceilMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0e141c', roughness: 0.95, metalness: 0.1 }), []);
  const deskMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2a1c10', roughness: 0.68, metalness: 0.25,
    emissive: '#14080a', emissiveIntensity: 0.2 }), []);
  return (
    <group>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_D]} /><primitive object={floorMat} attach="material" />
      </mesh>
      <mesh position={[0, ROOM_H, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_W, ROOM_D]} /><primitive object={ceilMat} attach="material" />
      </mesh>
      <mesh position={[0, ROOM_H / 2, -ROOM_D / 2]} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_H]} /><primitive object={wallMat} attach="material" />
      </mesh>
      <mesh position={[0, ROOM_H / 2, ROOM_D / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[ROOM_W, ROOM_H]} /><primitive object={wallMat} attach="material" />
      </mesh>
      <mesh position={[-ROOM_W / 2, ROOM_H / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM_D, ROOM_H]} /><primitive object={wallMat} attach="material" />
      </mesh>
      <mesh position={[ROOM_W / 2, ROOM_H / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM_D, ROOM_H]} /><primitive object={wallMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.012, -4.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.5, 0.04]} />
        <meshBasicMaterial color="#ff9640" toneMapped={false} transparent opacity={0.75} />
      </mesh>
      <mesh position={[0, 0.012, 3.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.5, 0.04]} />
        <meshBasicMaterial color="#2ee6a8" toneMapped={false} transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, ROOM_H - 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.5, 0.14]} />
        <meshBasicMaterial color="#d8eaff" toneMapped={false} />
      </mesh>
      <group position={[0, 0, -5.4]}>
        <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.6, 0.14, 1.7] } /><primitive object={deskMat} attach="material" />
        </mesh>
        {[[-2.1, -0.7], [2.1, -0.7], [-2.1, 0.7], [2.1, 0.7]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.46, z]} castShadow>
            <boxGeometry args={[0.14, 0.92, 0.14]} />
            <meshStandardMaterial color="#1c1208" roughness={0.85} metalness={0.2} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export { Room, CinematicLights, DeskLamp, Terminal, DustMotes };