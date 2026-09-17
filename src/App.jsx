import React, { useState, useCallback, Suspense, useEffect, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PointerLockControls, KeyboardControls } from '@react-three/drei';
import * as THREE from 'three';

import { Sound } from './utils/SoundEngine.js';
import { buildGrid, runCipher } from './utils/Cipher.js';
import { Intro } from './components/ui/Intro.jsx';
import { ShatterCanvas } from './components/ui/ShatterCanvas.jsx';
import { HUD } from './components/ui/HUD.jsx';
import { Scene } from './components/3d/Scene.jsx';

const KEYMAP = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
];

function App() {
  const [phase, setPhase] = useState('intro');
  const [keyText, setKeyText] = useState('CICADA3301');
  const [mode, setMode] = useState('encrypt');

  const [input, setInput] = useState('ATTACK AT DAWN');
  const [stepIdx, setStepIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2600);
  const [copied, setCopied] = useState(false);
  const [focusedTarget, setFocusedTarget] = useState(null);
  const [asciiMode, setAsciiMode] = useState(false);
  const [keyFocused, setKeyFocused] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [muted, setMuted] = useState(false);

  const [buildStart, setBuildStart] = useState(0);
  const [stepProgress, setStepProgress] = useState(1);
  const stepRafRef = useRef(0);
  const stepStartRef = useRef(0);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const result = useMemo(() => runCipher(input, keyText, mode), [input, keyText, mode]);
  const steps = result.steps;
  const grid = result.grid;

  const keyLetterSet = useMemo(() => {
    const s = new Set();
    for (const ch of (keyText || '').toUpperCase().replace(/[^A-Z]/g, '')) {
      s.add(ch === 'J' ? 'I' : ch);
    }
    return s;
  }, [keyText]);

  // ─── WARM-UP: create the AudioContext + pre-generate the shatter buffer
  //     on the FIRST user gesture anywhere on the page. This eliminates the
  //     lag when the shatter actually fires, because the buffer already exists.
  useEffect(() => {
    const warm = () => {
      Sound.init();
      Sound.resume();
    };
    window.addEventListener('pointerdown', warm, { once: true, capture: true });
    window.addEventListener('keydown', warm, { once: true, capture: true });
    window.addEventListener('touchstart', warm, { once: true, capture: true });
    return () => {
      window.removeEventListener('pointerdown', warm, { capture: true });
      window.removeEventListener('keydown', warm, { capture: true });
      window.removeEventListener('touchstart', warm, { capture: true });
    };
  }, []);

  useEffect(() => { setBuildStart(performance.now()); }, [keyText]);

  useEffect(() => {
    setStepIdx(-1); setPlaying(false); setStepProgress(1);
  }, [input, keyText, mode]);

  useEffect(() => {
    if (!playing) return;
    if (steps.length === 0 || stepIdx >= steps.length - 1) {
      setPlaying(false); return;
    }
    const t = setTimeout(() => setStepIdx((i) => i + 1), speed);
    return () => clearTimeout(t);
  }, [playing, stepIdx, steps.length, speed]);

  useEffect(() => {
    if (stepIdx < 0) { setStepProgress(1); return; }
    cancelAnimationFrame(stepRafRef.current);
    stepStartRef.current = performance.now();
    // Animation duration slightly less than the step interval so nothing
    // gets cut off — there's a small buffer of settled state between steps.
    const duration = Math.max(600, speedRef.current * 0.96);
    const tick = (now) => {
      const t = Math.min(1, (now - stepStartRef.current) / duration);
      setStepProgress(t);
      if (t < 1) stepRafRef.current = requestAnimationFrame(tick);
    };
    setStepProgress(0);
    stepRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(stepRafRef.current);
  }, [stepIdx]);

  const activeStep = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;

  const finalOutputSlots = useMemo(() => {
    if (!steps.length) return [];
    const out = [];
    const upto = Math.min(stepIdx - 1, steps.length - 1);
    for (let i = 0; i <= upto; i++) {
      if (steps[i]) out.push(steps[i].outPair[0], steps[i].outPair[1]);
    }
    return out;
  }, [steps, stepIdx]);

  useEffect(() => {
    const onClick = (e) => {
      const t = e.target;
      if (t && t.closest && t.closest('button, .btn, .hamburger, .min-btn, .mobile-toggle')) {
        Sound.click();
      }
    };
    const onOver = (e) => {
      const t = e.target;
      if (t && t.closest && t.closest('button, .btn, .hamburger, .min-btn, .mobile-toggle')) {
        Sound.hover();
      }
    };
    document.addEventListener('click', onClick);
    document.addEventListener('mouseover', onOver);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('mouseover', onOver);
    };
  }, []);

  const enter = useCallback(() => {
    setPhase((p) => {
      if (p !== 'intro') return p;
      Sound.init();
      Sound.resume();
      Sound.shatter();
      Sound.ambienceStart();
      setBuildStart(performance.now() + 350);
      return 'shatter';
    });
  }, []);

  const togglePlay = useCallback(() => {
    if (steps.length === 0) return;
    Sound.toggle();
    if (playing) { setPlaying(false); return; }
    if (stepIdx >= steps.length - 1) setStepIdx(-1);
    setPlaying(true);
  }, [playing, steps.length, stepIdx]);

  const onDownload = useCallback(() => {
    const blob = new Blob([result.output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playfair_' + mode + '_' + Date.now() + '.txt';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [result.output, mode]);

  const onCopy = useCallback(() => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(result.output).then(() => {
      setCopied(true); Sound.click();
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }, [result.output]);

  const onToggleMute = useCallback(() => {
    const m = Sound.toggleMute();
    setMuted(m);
    if (!m) Sound.click();
  }, []);

  const interactive = phase === 'dashboard';
  const showDash = phase === 'dashboard' || phase === 'shatter';

  return (
    <KeyboardControls map={KEYMAP}>
      <div className="h-full w-full relative">
        {phase !== 'dashboard' && <Intro onEnter={enter} fading={phase === 'shatter'} />}

        <Canvas
          dpr={[1, 1.5]} shadows
          gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
          camera={{ position: [0, 1.7, 4.2], fov: 48, near: 0.1, far: 100 }}
          onCreated={({ gl, camera }) => {
            gl.setClearColor('#02040a', 1);
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
            camera.position.set(0, 1.7, 4.2);
            camera.lookAt(0, 1.95, -5);
            camera.updateProjectionMatrix();
          }}
          style={{ position: 'fixed', inset: 0, zIndex: 0 }}
        >
          <Suspense fallback={null}>
            <Scene grid={grid} activeStep={activeStep}
              stepIdx={stepIdx} steps={steps} result={result} mode={mode}
              focusedTarget={focusedTarget} setFocusedTarget={setFocusedTarget}
              asciiMode={asciiMode} buildStart={buildStart} stepProgress={stepProgress}
              interactive={interactive}
              keyFocused={keyFocused} keyLetterSet={keyLetterSet}
              finalOutputSlots={finalOutputSlots}
              showResult={showResult} />
            {interactive && <PointerLockControls selector="#lock-btn" makeDefault />}
          </Suspense>
        </Canvas>

        {showDash && (
          <HUD steps={steps} stepIdx={stepIdx} playing={playing} speed={speed}
            setSpeed={setSpeed} setStepIdx={setStepIdx} setPlaying={setPlaying}
            togglePlay={togglePlay} result={result} mode={mode} setMode={setMode}
            input={input} setInput={setInput} keyText={keyText} setKeyText={setKeyText}
            onDownload={onDownload} onCopy={onCopy} copied={copied}
            asciiMode={asciiMode} setAsciiMode={setAsciiMode}
            keyFocused={keyFocused} setKeyFocused={setKeyFocused}
            activeStep={activeStep}
            showResult={showResult}
            onToggleResult={() => { setShowResult(v => !v); Sound.toggle(); }}
            muted={muted} onToggleMute={onToggleMute} />
        )}

        {/* Always-mounted shatter canvas — no allocation hitch on trigger */}
        <ShatterCanvas active={phase === 'shatter'}
          onDone={() => setPhase('dashboard')} />
      </div>
    </KeyboardControls>
  );
}

export default App;