import React, { useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useCursor } from '@react-three/drei';
import { Sound } from '../../utils/SoundEngine.js';
import { PLAYFAIR_FONT } from '../../constants/scene.js';

/* ═══ FLOATING TERMINAL — now draggable in screen space ═══ */
function FloatingTerminal({ activeStep, stepIdx, steps, result, mode }) {
  const grp = useRef(null);
  const { camera, gl } = useThree();
  const offsetRef = useRef(new THREE.Vector3(1.8, 0.1, -3.0));
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  useCursor(hovered || dragging);

  const handlePointerDown = useCallback((e) => {
    e.stopPropagation();
    Sound.hover();
    setDragging(true);
    const startX = e.clientX, startY = e.clientY;
    const startOffset = offsetRef.current.clone();

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const distance = Math.abs(startOffset.z) || 3.0;
      const fov = camera.fov * Math.PI / 180;
      const h = 2 * Math.tan(fov / 2) * distance;
      const w = h * camera.aspect;
      const nx = startOffset.x + (dx / window.innerWidth) * w;
      const ny = startOffset.y - (dy / window.innerHeight) * h;
      // keep some minimum forward distance so it doesn't fly through the camera
      offsetRef.current.set(nx, ny, startOffset.z);
    };
    const onUp = () => {
      setDragging(false);
      Sound.panel();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }, [camera]);

  useFrame(() => {
    const g = grp.current; if (!g) return;
    const offset = offsetRef.current.clone();
    offset.applyQuaternion(camera.quaternion);
    g.position.copy(camera.position).add(offset);
    g.quaternion.copy(camera.quaternion);
  });

  const panelW = 1.15, panelH = 1.25;
  const stepNum = steps.length ? String(stepIdx + 1).padStart(2, '0') : '00';
  const totalNum = String(steps.length).padStart(2, '0');
  const inStr = activeStep ? activeStep.inPair.join('') : '——';
  const outStr = activeStep ? activeStep.outPair.join('') : '——';
  const ruleStr = activeStep ? activeStep.rule : 'AWAITING STEP';
  const inPosStr = activeStep ? activeStep.inPos.map((p) => `${p[0]},${p[1]}`).join(' · ') : '—';
  const outPosStr = activeStep ? activeStep.outPos.map((p) => `${p[0]},${p[1]}`).join(' · ') : '—';
  const finalOut = result.output || '——';

  return (
    <group ref={grp}>
      {/* Draggable hitbox — invisible but interactive */}
      <mesh position={[0, 0, 0.02]}
        onPointerDown={handlePointerDown}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}>
        <planeGeometry args={[panelW + 0.20, panelH + 0.20]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
      </mesh>

      <mesh position={[0, 0, -0.008]}>
        <planeGeometry args={[panelW + 0.05, panelH + 0.05]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.55} />
      </mesh>
      <mesh>
        <planeGeometry args={[panelW, panelH]} />
        <meshBasicMaterial color="#060d16" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, panelH / 2 - 0.005, 0.001]}>
        <planeGeometry args={[panelW, 0.010]} />
        <meshBasicMaterial color={dragging ? '#ffcf8a' : '#ff9640'} toneMapped={false} transparent opacity={0.95} />
      </mesh>
      <mesh position={[0, -panelH / 2 + 0.005, 0.001]}>
        <planeGeometry args={[panelW, 0.010]} />
        <meshBasicMaterial color="#2ee6a8" toneMapped={false} transparent opacity={0.95} />
      </mesh>
      <Text position={[-panelW / 2 + 0.08, panelH / 2 - 0.08, 0.01]}
        fontSize={0.05} color="#ff9640" font={PLAYFAIR_FONT}
        anchorX="left" anchorY="middle" letterSpacing={0.05} fontWeight={700}>
        PLAYFAIR · DOSSIER
      </Text>
      <Text position={[panelW / 2 - 0.08, panelH / 2 - 0.08, 0.01]}
        fontSize={0.04} color="#2ee6a8" font={PLAYFAIR_FONT}
        anchorX="right" anchorY="middle" letterSpacing={0.05}>
        {mode === 'encrypt' ? 'ENCRYPT' : 'DECRYPT'}
      </Text>
      <mesh position={[0, panelH / 2 - 0.155, 0.005]}>
        <planeGeometry args={[panelW - 0.14, 0.003]} />
        <meshBasicMaterial color="#2ee6a8" transparent opacity={0.3} toneMapped={false} />
      </mesh>
      <Text position={[-panelW / 2 + 0.08, panelH / 2 - 0.25, 0.01]}
        fontSize={0.034} color="#a0bedc" fillOpacity={0.7} font={PLAYFAIR_FONT}
        anchorX="left" anchorY="middle" letterSpacing={0.10} fontStyle="italic">STEP</Text>
      <Text position={[-panelW / 2 + 0.28, panelH / 2 - 0.25, 0.01]}
        fontSize={0.062} color="#ffffff" font={PLAYFAIR_FONT}
        anchorX="left" anchorY="middle" letterSpacing={0.04} fontWeight={700}>{stepNum}</Text>
      <Text position={[-panelW / 2 + 0.50, panelH / 2 - 0.25, 0.01]}
        fontSize={0.034} color="#a0bedc" fillOpacity={0.5} font={PLAYFAIR_FONT}
        anchorX="left" anchorY="middle" letterSpacing={0.10}>/ {totalNum}</Text>
      <Text position={[-panelW / 2 + 0.08, panelH / 2 - 0.38, 0.01]}
        fontSize={0.034} color="#a0bedc" fillOpacity={0.7} font={PLAYFAIR_FONT}
        anchorX="left" anchorY="middle" letterSpacing={0.10} fontStyle="italic">RULE</Text>
      <Text position={[-panelW / 2 + 0.28, panelH / 2 - 0.38, 0.01]}
        fontSize={0.044} color={activeStep ? '#ffb454' : '#a0bedc'}
        fillOpacity={activeStep ? 1 : 0.5}
        font={PLAYFAIR_FONT} anchorX="left" anchorY="middle" letterSpacing={0.05} fontWeight={600}>
        {ruleStr}
      </Text>
      <mesh position={[0, panelH / 2 - 0.485, 0.004]}>
        <planeGeometry args={[panelW - 0.14, 0.003]} />
        <meshBasicMaterial color="#ff9640" transparent opacity={0.25} toneMapped={false} />
      </mesh>
      <Text position={[-panelW / 2 + 0.08, panelH / 2 - 0.60, 0.01]}
        fontSize={0.034} color="#a0bedc" fillOpacity={0.7} font={PLAYFAIR_FONT}
        anchorX="left" anchorY="middle" letterSpacing={0.10} fontStyle="italic">DIGRAPH</Text>
      <Text position={[-panelW / 2 + 0.08, panelH / 2 - 0.75, 0.01]}
        fontSize={0.100} color={activeStep ? '#ffd694' : '#a0bedc'}
        fillOpacity={activeStep ? 1 : 0.4}
        font={PLAYFAIR_FONT} anchorX="left" anchorY="middle" letterSpacing={0.08} fontWeight={700}>
        {inStr}
      </Text>
      <Text position={[-panelW / 2 + 0.32, panelH / 2 - 0.75, 0.01]}
        fontSize={0.075} color="#a0bedc" fillOpacity={0.5} font={PLAYFAIR_FONT}
        anchorX="left" anchorY="middle">→</Text>
      <Text position={[-panelW / 2 + 0.43, panelH / 2 - 0.75, 0.01]}
        fontSize={0.100} color={activeStep ? '#a8ffdd' : '#a0bedc'}
        fillOpacity={activeStep ? 1 : 0.4}
        font={PLAYFAIR_FONT} anchorX="left" anchorY="middle" letterSpacing={0.08} fontWeight={700}>
        {outStr}
      </Text>
      <Text position={[-panelW / 2 + 0.08, panelH / 2 - 0.87, 0.01]}
        fontSize={0.026} color="#a0bedc" fillOpacity={0.55} font={PLAYFAIR_FONT}
        anchorX="left" anchorY="middle" letterSpacing={0.04} fontStyle="italic">
        {inPosStr}  →  {outPosStr}
      </Text>
      <mesh position={[0, panelH / 2 - 0.955, 0.004]}>
        <planeGeometry args={[panelW - 0.14, 0.003]} />
        <meshBasicMaterial color="#2ee6a8" transparent opacity={0.3} toneMapped={false} />
      </mesh>
      <Text position={[-panelW / 2 + 0.08, panelH / 2 - 1.05, 0.01]}
        fontSize={0.034} color="#a0bedc" fillOpacity={0.7} font={PLAYFAIR_FONT}
        anchorX="left" anchorY="middle" letterSpacing={0.10} fontStyle="italic">RESULT</Text>
      <Text position={[-panelW / 2 + 0.08, panelH / 2 - 1.19, 0.01]}
        fontSize={0.042} color="#7dffb8" font={PLAYFAIR_FONT}
        anchorX="left" anchorY="middle" letterSpacing={0.06} fontWeight={600}
        maxWidth={panelW - 0.18}>
        {finalOut.slice(0, 30) || '——'}
      </Text>
      {/* small drag hint */}
      <Text position={[panelW / 2 - 0.08, -panelH / 2 + 0.07, 0.011]}
        fontSize={0.024} color="#a0bedc" fillOpacity={0.4} font={PLAYFAIR_FONT}
        anchorX="right" anchorY="middle" letterSpacing={0.15} fontStyle="italic">
        ⟡ DRAG
      </Text>
    </group>
  );
}

export { FloatingTerminal };