import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Line, useCursor } from '@react-three/drei';
import { Sound } from '../../utils/SoundEngine.js';
import { PLAYFAIR_FONT, MONITOR_POS, CELL, GAP, CAP_SIZE, BUILD_GHOST_DELAY, BUILD_STAGGER, BUILD_FLY_DURATION, RESULT_OFFSET, PH } from '../../constants/scene.js';

// We need the cellLocalX, cellLocalY, pp, easeOutCubic, easeInOutCubic helpers here.
function pp(t, [a, b]) { if (t <= a) return 0; if (t >= b) return 1; return (t - a) / (b - a); }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function cellLocalX(c) { return (c - 2) * (CELL + GAP); }
function cellLocalY(r) { return (2 - r) * (CELL + GAP); }

/* ═══ GRID SLOT ═══ */
function GridSlot({ r, c }) {
  return (
    <group position={[cellLocalX(c), cellLocalY(r), 0]}>
      <mesh>
        <planeGeometry args={[CAP_SIZE + 0.045, CAP_SIZE + 0.045]} />
        <meshBasicMaterial color="#0e2030" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[CAP_SIZE + 0.005, CAP_SIZE + 0.005]} />
        <meshBasicMaterial color="#020810" transparent opacity={0.95} />
      </mesh>
    </group>
  );
}

/* ═══ KEYCAP ═══ */
function Keycap({ r, c, letter, role, buildStart, buildIndex, keyHighlight }) {
  const grp = useRef(null);
  useFrame((s, delta) => {
    const g = grp.current; if (!g) return;
    let buildT = 1;
    if (buildStart > 0) {
      const elapsed = performance.now() - buildStart;
      const myStart = BUILD_GHOST_DELAY + buildIndex * BUILD_STAGGER;
      buildT = Math.max(0, Math.min(1, (elapsed - myStart) / BUILD_FLY_DURATION));
    }
    const be = buildT < 1 ? 1 - Math.pow(1 - buildT, 3) : 1;
    g.position.y = (1 - be) * 2.2;
    g.position.z = (1 - be) * 0.55;
    const sc = 0.001 + be * 0.999;
    const k = Math.min(1, delta * 16);
    g.scale.x += (sc - g.scale.x) * k;
    g.scale.y = g.scale.x; g.scale.z = g.scale.x;
  });
  const isSrc = role === 'source';
  const isTgt = role === 'target';
  const keyOnly = keyHighlight && !isSrc && !isTgt;
  const baseColor = isSrc ? '#5a3010' : isTgt ? '#0a4a3a' : '#2c3d52';
  const emissive  = isSrc ? '#ff9a3c' : isTgt ? '#2ee6a8' : (keyOnly ? '#ffd9a0' : '#1a2c3e');
  const emissiveInt = isSrc || isTgt ? 1.9 : (keyOnly ? 1.35 : 0.55);
  const letterColor = isSrc ? '#fff5dc' : isTgt ? '#daffee' : (keyOnly ? '#fff2d0' : '#e8f2ff');
  return (
    <group position={[cellLocalX(c), cellLocalY(r), 0]}>
      <group ref={grp}>
        <mesh castShadow>
          <boxGeometry args={[CAP_SIZE, CAP_SIZE, 0.12]} />
          <meshStandardMaterial color={baseColor} emissive={emissive}
            emissiveIntensity={emissiveInt} roughness={0.45} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.061]}>
          <planeGeometry args={[0.24, 0.24]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.35} />
        </mesh>
        {keyOnly && (
          <mesh position={[0, 0, -0.085]}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshBasicMaterial color="#ffb454" transparent opacity={0.65}
              toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        )}
        {(isSrc || isTgt) && (
          <mesh position={[0, 0, -0.075]}>
            <planeGeometry args={[0.46, 0.46]} />
            <meshBasicMaterial color={isSrc ? '#ffb454' : '#2ee6a8'}
              transparent opacity={0.6} toneMapped={false} />
          </mesh>
        )}
        <Text position={[0, 0, 0.063]} fontSize={0.18} color={letterColor}
          font={PLAYFAIR_FONT} anchorX="center" anchorY="middle"
          outlineWidth={0.012} outlineColor="#000000" fontWeight={700}>
          {letter}
        </Text>
      </group>
    </group>
  );
}

/* ═══ RULE HIGHLIGHT ═══ */
function RuleHighlight({ activeStep, alpha, grid }) {
  if (!activeStep || alpha <= 0.001) return null;
  const { rule, inPos, outPos } = activeStep;
  const [r0, c0] = inPos[0];
  const [r1, c1] = inPos[1];
  const A = alpha;

  const renderWrapCol = (colIndex, isLeft) => (
    <group position={[cellLocalX(colIndex), 0, 0.001]}>
      {[0,1,2,3,4].map(r => (
        <mesh key={r} position={[0, cellLocalY(r), 0]}>
          <planeGeometry args={[CAP_SIZE + 0.02, CAP_SIZE + 0.02]} />
          <meshBasicMaterial color="#0e2030" transparent opacity={0.55 * A} depthWrite={false} />
        </mesh>
      ))}
      {[0,1,2,3,4].map(r => (
        <Text key={r} position={[0, cellLocalY(r), 0.01]}
          fontSize={0.16} color="#a8ffdd" fillOpacity={0.85 * A}
          font={PLAYFAIR_FONT} anchorX="center" anchorY="middle"
          outlineWidth={0.008} outlineColor="#000000" fontWeight={700}>
          {grid[r][isLeft ? 4 : 0]}
        </Text>
      ))}
    </group>
  );

  const renderWrapRow = (rowIndex, isTop) => (
    <group position={[0, cellLocalY(rowIndex), 0.001]}>
      {[0,1,2,3,4].map(c => (
        <mesh key={c} position={[cellLocalX(c), 0, 0]}>
          <planeGeometry args={[CAP_SIZE + 0.02, CAP_SIZE + 0.02]} />
          <meshBasicMaterial color="#0e2030" transparent opacity={0.55 * A} depthWrite={false} />
        </mesh>
      ))}
      {[0,1,2,3,4].map(c => (
        <Text key={c} position={[cellLocalX(c), 0, 0.01]}
          fontSize={0.16} color="#a8ffdd" fillOpacity={0.85 * A}
          font={PLAYFAIR_FONT} anchorX="center" anchorY="middle"
          outlineWidth={0.008} outlineColor="#000000" fontWeight={700}>
          {grid[isTop ? 4 : 0][c]}
        </Text>
      ))}
    </group>
  );

  if (rule === 'SAME ROW') {
    const row = r0;
    const y = cellLocalY(row);
    const w = 5 * (CELL + GAP) - GAP + 0.08;
    const h = CAP_SIZE + 0.10;
    const wrapRight = activeStep.wrap === 'row-right' || (!activeStep.wrap);
    const wrapLeft  = activeStep.wrap === 'row-left';
    return (
      <group position={[0, 0, 0.115]}>
        <mesh position={[0, y, 0]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial color="#ff9640" transparent opacity={0.22 * A}
            toneMapped={false} depthWrite={false} />
        </mesh>
        <Line points={[[-w/2, y - h/2, 0.001], [w/2, y - h/2, 0.001],
                       [w/2, y + h/2, 0.001], [-w/2, y + h/2, 0.001],
                       [-w/2, y - h/2, 0.001]]}
          color="#ffb454" lineWidth={1.5} transparent opacity={0.75 * A} />
        {[0, 1].map((k) => {
          const [ia, ib] = inPos[k]; const [oa, ob] = outPos[k];
          const x0 = cellLocalX(ib), x1 = cellLocalX(ob);
          const y0 = cellLocalY(ia);
          return (
            <Line key={k} points={[[x0, y0, 0.003], [x1, y0, 0.003]]}
              color="#2ee6a8" lineWidth={2.5} transparent opacity={0.9 * A} />
          );
        })}
        {wrapRight && renderWrapCol(5, false)}
        {wrapLeft  && renderWrapCol(-3, true)}
      </group>
    );
  }

  if (rule === 'SAME COLUMN') {
    const col = c0;
    const x = cellLocalX(col);
    const h = 5 * (CELL + GAP) - GAP + 0.08;
    const w = CAP_SIZE + 0.10;
    const wrapDown = activeStep.wrap === 'col-down' || (!activeStep.wrap);
    const wrapUp   = activeStep.wrap === 'col-up';
    return (
      <group position={[0, 0, 0.115]}>
        <mesh position={[x, 0, 0]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial color="#ff9640" transparent opacity={0.22 * A}
            toneMapped={false} depthWrite={false} />
        </mesh>
        <Line points={[[x - w/2, h/2, 0.001], [x + w/2, h/2, 0.001],
                       [x + w/2, -h/2, 0.001], [x - w/2, -h/2, 0.001],
                       [x - w/2, h/2, 0.001]]}
          color="#ffb454" lineWidth={1.5} transparent opacity={0.75 * A} />
        {[0, 1].map((k) => {
          const [ia, ib] = inPos[k]; const [oa, ob] = outPos[k];
          const y0 = cellLocalY(ia), y1 = cellLocalY(oa);
          const x0 = cellLocalX(ib);
          return (
            <Line key={k} points={[[x0, y0, 0.003], [x0, y1, 0.003]]}
              color="#2ee6a8" lineWidth={2.5} transparent opacity={0.9 * A} />
          );
        })}
        {wrapDown && renderWrapRow(5, false)}
        {wrapUp   && renderWrapRow(-3, true)}
      </group>
    );
  }

  const [ra, ca] = inPos[0]; const [rb, cb] = inPos[1];
  const corners = [[ra, ca], [ra, cb], [rb, cb], [rb, ca]];
  return (
    <group position={[0, 0, 0.115]}>
      {corners.map(([r, c], i) => (
        <mesh key={i} position={[cellLocalX(c), cellLocalY(r), 0]}>
          <planeGeometry args={[CAP_SIZE + 0.10, CAP_SIZE + 0.10]} />
          <meshBasicMaterial color="#2ee6a8" transparent opacity={0.28 * A}
            toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
      <Line points={[
        [cellLocalX(ca), cellLocalY(ra), 0.20],
        [cellLocalX(cb), cellLocalY(rb), 0.20],
      ]} color="#ffb454" lineWidth={3} transparent opacity={0.95 * A} />
      <Line points={[
        [cellLocalX(cb), cellLocalY(ra), 0.20],
        [cellLocalX(ca), cellLocalY(rb), 0.20],
      ]} color="#2ee6a8" lineWidth={3} transparent opacity={0.95 * A} />
    </group>
  );
}

/* ═══ CLONE FLYER ═══ */
function CloneFlyer({ fromR, fromC, toR, toC, letter, progress, visible }) {
  const grp = useRef(null);
  useFrame(() => {
    const g = grp.current; if (!g) return;
    if (!visible) { g.visible = false; return; }
    g.visible = true;
    const t = progress;
    const x0 = cellLocalX(fromC), y0 = cellLocalY(fromR);
    const x1 = cellLocalX(toC),   y1 = cellLocalY(toR);
    const te = easeInOutCubic(t);
    const x = x0 + (x1 - x0) * te;
    const y = y0 + (y1 - y0) * te;
    const z = 0.08 + Math.sin(t * Math.PI) * 0.34;
    g.position.set(x, y, z);
    const sc = 1 + Math.sin(t * Math.PI) * 0.22;
    g.scale.setScalar(sc);
  });
  return (
    <group ref={grp}>
      <mesh>
        <boxGeometry args={[CAP_SIZE * 1.15, CAP_SIZE * 1.15, 0.12]} />
        <meshStandardMaterial color="#5a3010" emissive="#ffb454"
          emissiveIntensity={2.6} roughness={0.28} metalness={0.4} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.062]}>
        <planeGeometry args={[0.26, 0.26]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.55} />
      </mesh>
      <Text position={[0, 0, 0.064]} fontSize={0.20} color="#fff5dc"
        font={PLAYFAIR_FONT} anchorX="center" anchorY="middle"
        outlineWidth={0.014} outlineColor="#000000" fontWeight={700}>
        {letter}
      </Text>
      <mesh position={[0, 0, -0.09]}>
        <planeGeometry args={[0.56, 0.56]} />
        <meshBasicMaterial color="#ffb454" transparent opacity={0.35}
          toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/* ═══ BURST ═══ */
function Burst({ r, c, progress, active }) {
  const particles = useMemo(() => {
    const N = 16;
    return Array.from({ length: N }, (_, i) => {
      const angle = (i / N) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 0.22 + Math.random() * 0.18;
      return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        size: 0.014 + Math.random() * 0.016, delay: Math.random() * 0.2 };
    });
  }, []);
  if (!active) return null;
  const x = cellLocalX(c), y = cellLocalY(r);
  return (
    <group position={[x, y, 0.2]}>
      <mesh>
        <ringGeometry args={[0.06 + progress * 0.34, 0.09 + progress * 0.34, 32]} />
        <meshBasicMaterial color="#ffb454" transparent
          opacity={Math.max(0, 1 - progress) * 0.9} toneMapped={false}
          side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {particles.map((p, i) => {
        const localT = Math.max(0, Math.min(1, (progress - p.delay) / (1 - p.delay)));
        if (localT <= 0 || localT >= 1) return null;
        const life = 1 - localT;
        return (
          <mesh key={i} position={[p.vx * localT, p.vy * localT, 0]}>
            <sphereGeometry args={[p.size, 6, 6]} />
            <meshBasicMaterial color="#ffd9a0" transparent opacity={life}
              toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ═══ BIRTH LETTER ═══
   FIX: uses DETERMINISTIC phase-based interpolation, not a delta lerp.
   birthEase drives scale + Z drop, glideEase drives the horizontal
   migration to the transformed-grid slot. Both are computed from
   `stepProgress` directly, so the glide ALWAYS completes at glideT = 1
   — nothing is ever cut off by the next step tick. */
function BirthLetter({
  r, c, letter, stepProgress,
  birthPhase, glidePhase, slotIndex, active,
}) {
  const grp = useRef(null);
  const resultCellSize = 0.22;
  const resultGap = 0.03;

  useFrame(() => {
    const g = grp.current; if (!g) return;
    if (!active) { g.visible = false; return; }
    g.visible = true;

    const birthT = pp(stepProgress, birthPhase);
    const glideT = pp(stepProgress, glidePhase);

    const be = easeOutCubic(birthT);
    const ge = easeInOutCubic(glideT);

    const gridX = cellLocalX(c);
    const gridY = cellLocalY(r);
    const resultX = RESULT_OFFSET + ((slotIndex % 5) - 2) * (resultCellSize + resultGap);
    const resultY = (2 - Math.floor(slotIndex / 5)) * (resultCellSize + resultGap);

    const x = gridX + (resultX - gridX) * ge;
    const y = gridY + (resultY - gridY) * ge;
    // Z starts high (falling in), settles to 0.09, stays there during glide
    const z = 0.55 + (0.09 - 0.55) * be;
    const sc = 0.30 + 0.70 * be;

    g.position.set(x, y, z);
    g.scale.setScalar(sc);
  });

  if (!active) return null;
  return (
    <group ref={grp}>
      <mesh position={[0, 0, -0.06]}>
        <planeGeometry args={[0.52, 0.52]} />
        <meshBasicMaterial color="#b44aff" transparent opacity={0.55}
          toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh>
        <boxGeometry args={[CAP_SIZE * 1.08, CAP_SIZE * 1.08, 0.12]} />
        <meshStandardMaterial color="#2a1040" emissive="#b44aff"
          emissiveIntensity={2.8} roughness={0.3} metalness={0.5} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.062]}>
        <planeGeometry args={[0.26, 0.26]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.55} />
      </mesh>
      <Text position={[0, 0, 0.064]} fontSize={0.20} color="#e8d0ff"
        font={PLAYFAIR_FONT} anchorX="center" anchorY="middle"
        outlineWidth={0.014} outlineColor="#000000" fontWeight={700}>
        {letter}
      </Text>
    </group>
  );
}

/* ═══ RESULT GRID CONTENT ═══ */
function ResultGridContent({ finalOutputSlots, cellSize = 0.22, gap = 0.03 }) {
  const displaySlots = finalOutputSlots.slice(0, 25);
  const allSlots = Array.from({ length: 25 }, (_, i) => displaySlots[i] || null);

  return (
    <group>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[5 * (cellSize + gap) + 0.1, 5 * (cellSize + gap) + 0.1]} />
        <meshBasicMaterial color="#0a0a18" transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[5 * (cellSize + gap) + 0.06, 5 * (cellSize + gap) + 0.06]} />
        <meshBasicMaterial color="#b44aff" transparent opacity={0.15}
          toneMapped={false} depthWrite={false} />
      </mesh>
      {allSlots.map((letter, i) => {
        const row = Math.floor(i / 5);
        const col = i % 5;
        const x = (col - 2) * (cellSize + gap);
        const y = (2 - row) * (cellSize + gap);
        const isFilled = letter !== null;
        return (
          <group key={i} position={[x, y, 0]}>
            <mesh position={[0, 0, -0.005]}>
              <planeGeometry args={[cellSize + 0.02, cellSize + 0.02]} />
              <meshBasicMaterial color={isFilled ? "#2a1040" : "#0e2030"}
                transparent opacity={isFilled ? 0.7 : 0.45} />
            </mesh>
            {isFilled && (
              <>
                <mesh>
                  <boxGeometry args={[cellSize * 0.95, cellSize * 0.95, 0.08]} />
                  <meshStandardMaterial color="#2a1040" emissive="#b44aff"
                    emissiveIntensity={2.5} roughness={0.3} metalness={0.5}
                    toneMapped={false} />
                </mesh>
                <Text position={[0, 0, 0.05]} fontSize={cellSize * 0.7} color="#e8d0ff"
                  font={PLAYFAIR_FONT} anchorX="center" anchorY="middle"
                  outlineWidth={0.010} outlineColor="#000000" fontWeight={700}>
                  {letter}
                </Text>
              </>
            )}
          </group>
        );
      })}
      <Text position={[0, 5 * (cellSize + gap) / 2 + 0.22, 0.01]}
        fontSize={0.06} color="#b44aff" font={PLAYFAIR_FONT}
        anchorX="center" anchorY="middle" letterSpacing={0.15} fontWeight={700}>
        TRANSFORMED
      </Text>
    </group>
  );
}

/* ═══ MONITOR SCREEN ═══ */
function MonitorScreen({
  grid, activeStep, onClick, buildStart, stepProgress,
  keyFocused, keyLetterSet, finalOutputSlots, showResult,
  stepIdx,
}) {
  const screenRef = useRef(null);
  const groupRef = useRef(null);
  const slideRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  // Sound triggers per step, driven by phase crossings
  const sfxRef = useRef({});
  useEffect(() => { sfxRef.current = {}; }, [stepIdx]);
  useEffect(() => {
    if (!activeStep) return;
    const s = sfxRef.current;
    if (stepProgress >= PH.fly1[0]   && !s.fly1)   { s.fly1 = true;   Sound.whoosh(); }
    if (stepProgress >= PH.burst1[0] && !s.burst1) { s.burst1 = true; Sound.burst(); }
    if (stepProgress >= PH.birth1[0] && !s.birth1) { s.birth1 = true; Sound.birth(); }
    if (stepProgress >= PH.fly2[0]   && !s.fly2)   { s.fly2 = true;   Sound.whoosh(); }
    if (stepProgress >= PH.burst2[0] && !s.burst2) { s.burst2 = true; Sound.burst(); }
    if (stepProgress >= PH.birth2[0] && !s.birth2) { s.birth2 = true; Sound.birth(); }
  });

  useFrame((state, delta) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    if (screenRef.current) {
      const flicker = 0.92 + Math.sin(state.clock.elapsedTime * 30) * 0.02
                    + Math.sin(state.clock.elapsedTime * 7.3) * 0.03;
      screenRef.current.material.opacity = flicker;
    }
    if (groupRef.current) {
      const s = hovered ? 1.015 : 1.0;
      groupRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.1);
    }
    if (slideRef.current) {
      const targetX = showResult ? -RESULT_OFFSET : 0;
      slideRef.current.position.x +=
        (targetX - slideRef.current.position.x) * Math.min(1, delta * 4);
    }
  });

  const roleMap = useMemo(() => {
    const m = {};
    if (activeStep) {
      for (const [r, c] of activeStep.inPos) m[`${r},${c}`] = 'source';
      for (const [r, c] of activeStep.outPos) {
        if (m[`${r},${c}`] !== 'source') m[`${r},${c}`] = 'target';
      }
    }
    return m;
  }, [activeStep]);

  const ruleA = pp(stepProgress, [0.00, 0.05]) * (1 - pp(stepProgress, [0.94, 1.00]));
  const fly1T = pp(stepProgress, PH.fly1);
  const fly2T = pp(stepProgress, PH.fly2);
  const burst1T = pp(stepProgress, PH.burst1);
  const burst2T = pp(stepProgress, PH.burst2);
  const showFly1 = stepProgress >= PH.fly1[0] && stepProgress < PH.fly1[1];
  const showFly2 = stepProgress >= PH.fly2[0] && stepProgress < PH.fly2[1];
  const showBurst1 = stepProgress >= PH.burst1[0] && stepProgress < PH.burst1[1];
  const showBurst2 = stepProgress >= PH.burst2[0] && stepProgress < PH.burst2[1];
  const showBirth1 = stepProgress >= PH.birth1[0];
  const showBirth2 = stepProgress >= PH.birth2[0];
  const safeStepIdx = Math.max(0, stepIdx || 0);

  return (
    <group ref={groupRef} position={MONITOR_POS}>
      <mesh position={[0, 0, -0.22]} castShadow>
        <boxGeometry args={[2.4, 2.05, 0.42]} />
        <meshStandardMaterial color="#14161c" roughness={0.55} metalness={0.55} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[2.18, 1.84, 0.05]} />
        <meshStandardMaterial color="#08090d" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh ref={screenRef} position={[0, 0, 0.05]} renderOrder={-1}
        onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}>
        <planeGeometry args={[2.08, 1.74]} />
        <shaderMaterial transparent depthWrite={false} uniforms={uniforms}
          vertexShader={`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
          fragmentShader={`
            uniform float uTime; varying vec2 vUv;
            void main(){
              vec2 uv = vUv*2.0-1.0; float r2 = dot(uv,uv);
              uv *= 1.0+0.08*r2; uv = uv*0.5+0.5;
              if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0){ gl_FragColor=vec4(0.0); return; }
              vec2 g = fract(uv*14.0);
              float line = smoothstep(0.02,0.0,abs(g.x-0.5)-0.48)+smoothstep(0.02,0.0,abs(g.y-0.5)-0.48);
              float scan = sin(uv.y*900.0+uTime*6.0)*0.5+0.5; scan = mix(1.0,scan,0.18);
              float band = smoothstep(0.03,0.0,abs(uv.y-fract(uTime*0.08))-0.015)*0.25;
              float vig = 1.0 - smoothstep(0.4,1.0,r2);
              vec3 col = vec3(0.025,0.06,0.05);
              col += vec3(0.015,0.05,0.03)*line;
              col += vec3(0.10,0.30,0.18)*band;
              col *= scan*vig;
              gl_FragColor = vec4(col, 0.94);
            }
          `} />
      </mesh>

      <group ref={slideRef}>
        <group position={[0, 0, 0]}>
          <group position={[0, 0, 0.075]}>
            {Array.from({ length: 25 }).map((_, i) => (
              <GridSlot key={`slot-${i}`} r={Math.floor(i / 5)} c={i % 5} />
            ))}
          </group>
          <RuleHighlight activeStep={activeStep} alpha={ruleA} grid={grid} />
          <group position={[0, 0, 0.09]}>
            {Array.from({ length: 25 }).map((_, i) => {
              const r = Math.floor(i / 5), c = i % 5;
              const letter = grid[r][c];
              return (
                <Keycap key={`${r},${c}`} r={r} c={c} letter={letter}
                  role={roleMap[`${r},${c}`] || null}
                  buildStart={buildStart} buildIndex={i}
                  keyHighlight={keyFocused && keyLetterSet.has(letter)} />
              );
            })}
          </group>

          {activeStep && (
            <>
              <CloneFlyer
                fromR={activeStep.inPos[0][0]} fromC={activeStep.inPos[0][1]}
                toR={activeStep.outPos[0][0]} toC={activeStep.outPos[0][1]}
                letter={activeStep.inPair[0]} progress={fly1T} visible={showFly1} />
              <Burst r={activeStep.outPos[0][0]} c={activeStep.outPos[0][1]}
                progress={burst1T} active={showBurst1} />
              <BirthLetter r={activeStep.outPos[0][0]} c={activeStep.outPos[0][1]}
                letter={activeStep.outPair[0]} stepProgress={stepProgress}
                birthPhase={PH.birth1} glidePhase={PH.glide1}
                active={showBirth1} slotIndex={safeStepIdx * 2} />

              <CloneFlyer
                fromR={activeStep.inPos[1][0]} fromC={activeStep.inPos[1][1]}
                toR={activeStep.outPos[1][0]} toC={activeStep.outPos[1][1]}
                letter={activeStep.inPair[1]} progress={fly2T} visible={showFly2} />
              <Burst r={activeStep.outPos[1][0]} c={activeStep.outPos[1][1]}
                progress={burst2T} active={showBurst2} />
              <BirthLetter r={activeStep.outPos[1][0]} c={activeStep.outPos[1][1]}
                letter={activeStep.outPair[1]} stepProgress={stepProgress}
                birthPhase={PH.birth2} glidePhase={PH.glide2}
                active={showBirth2} slotIndex={safeStepIdx * 2 + 1} />
            </>
          )}
        </group>

        <group position={[RESULT_OFFSET, 0, 0.09]}>
          <ResultGridContent finalOutputSlots={finalOutputSlots} />
        </group>
      </group>

      <mesh position={[1.02, -0.94, 0.06]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#2ee6a8" toneMapped={false} />
      </mesh>
      <mesh position={[0, -1.14, -0.05]}>
        <boxGeometry args={[0.7, 0.1, 0.5]} />
        <meshStandardMaterial color="#0e1016" roughness={0.6} metalness={0.5} />
      </mesh>
    </group>
  );
}

export { MonitorScreen };