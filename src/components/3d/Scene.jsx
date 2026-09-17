import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { AsciiRenderer } from '@react-three/drei';
import {
  EffectComposer, Bloom, Vignette, ChromaticAberration, Noise, ToneMapping,
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import { Player } from './Player.jsx';
import { Room, CinematicLights, DeskLamp, Terminal, DustMotes } from './Room.jsx';
import { MonitorScreen } from './MonitorScreen.jsx';
import { FloatingTerminal } from './FloatingTerminal.jsx';

/* ═══ SCENE ═══ */
function Scene({
  grid, activeStep, stepIdx, steps, result, mode,
  focusedTarget, setFocusedTarget, asciiMode,
  buildStart, stepProgress, interactive,
  keyFocused, keyLetterSet, finalOutputSlots,
  showResult,
}) {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.15;
  }, [gl]);
  return (
    <>
      <color attach="background" args={['#02040a']} />
      <fog attach="fog" args={['#02040a', 3.5, 20]} />
      <CinematicLights />
      <Room />
      <DeskLamp />
      <Terminal output={result.output} />
      <DustMotes count={260} />
      <group onClick={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        setFocusedTarget({ position: MONITOR_POS });
        Sound.click();
      }}>
        <MonitorScreen grid={grid} activeStep={activeStep}
          onClick={() => { if (interactive) { setFocusedTarget({ position: MONITOR_POS }); Sound.click(); } }}
          buildStart={buildStart} stepProgress={stepProgress}
          keyFocused={keyFocused} keyLetterSet={keyLetterSet}
          finalOutputSlots={finalOutputSlots}
          showResult={showResult}
          stepIdx={stepIdx} />
      </group>
      <Player focusedTarget={focusedTarget} active={interactive} />
      <FloatingTerminal activeStep={activeStep} stepIdx={stepIdx}
        steps={steps} result={result} mode={mode} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.9} luminanceThreshold={0.45} luminanceSmoothing={0.35} mipmapBlur radius={0.65} />
        <ChromaticAberration offset={[0.0009, 0.0013]} radialModulation modulationOffset={0.35} />
        <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.3} />
        <Vignette eskil={false} offset={0.15} darkness={1.05} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
      {asciiMode && (
        <AsciiRenderer fgColor="#e0ecff" bgColor="#02040a"
          characters=" .:-=+*#%@" invert={false} resolution={0.2} />
      )}
    </>
  );
}

export { Scene };