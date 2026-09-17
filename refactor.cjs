const fs = require('fs');
const path = require('path');

const code = fs.readFileSync('src/App.jsx', 'utf8');

function extractFromTo(startString, endString) {
    const startIndex = code.indexOf(startString);
    if (startIndex === -1) return '';
    const endIndex = code.indexOf(endString, startIndex);
    if (endIndex === -1) return code.substring(startIndex).trim();
    return code.substring(startIndex, endIndex).trim();
}

// Extract sections
const constantsStr = extractFromTo('const PLAYFAIR_FONT', '/* ═══════════════════════════════════════════════════════════');
const soundEngineStr = extractFromTo('/* ═══════════════════════════════════════════════════════════', '/* ═══ CIPHER ═══ */');
const cipherStr = extractFromTo('/* ═══ CIPHER ═══ */', '/* ═══ INTRO ═══ */');
const introStr = extractFromTo('/* ═══ INTRO ═══ */', '/* ═══ SHATTER');
const shatterStr = extractFromTo('/* ═══ SHATTER', '/* ═══ GEOMETRY ═══ */');
const geometryStr = extractFromTo('/* ═══ GEOMETRY ═══ */', '/* ═══ PLAYER ═══ */');
const playerStr = extractFromTo('/* ═══ PLAYER ═══ */', '/* ═══ DUST ═══ */');
const dustStr = extractFromTo('/* ═══ DUST ═══ */', '/* ═══ ROOM ═══ */');
const roomStr = extractFromTo('/* ═══ ROOM ═══ */', '/* ═══ GRID SLOT ═══ */');
const monitorStr = extractFromTo('/* ═══ GRID SLOT ═══ */', '/* ═══ FLOATING TERMINAL');
const terminalStr = extractFromTo('/* ═══ FLOATING TERMINAL', '/* ═══ DESK PROPS ═══ */');
const deskPropsStr = extractFromTo('/* ═══ DESK PROPS ═══ */', '/* ═══ SCENE ═══ */');
const sceneStr = extractFromTo('/* ═══ SCENE ═══ */', '/* ═══ HUD ═══ */');
const hudStr = extractFromTo('/* ═══ HUD ═══ */', '/* ═══ APP ═══ */');
const appStr = extractFromTo('/* ═══ APP ═══ */', 'export default App;');

// Write SoundEngine.js
const soundEngineContent = `
${soundEngineStr}

export { Sound };
`;
fs.writeFileSync('src/utils/SoundEngine.js', soundEngineContent.trim());

// Write Cipher.js
const cipherContent = `
${cipherStr}

export { buildGrid, runCipher };
`;
fs.writeFileSync('src/utils/Cipher.js', cipherContent.trim());

// Write scene.js
const constantsContent = `
import * as THREE from 'three';

${constantsStr}
${geometryStr}

export { PLAYFAIR_FONT, EYE_HEIGHT, WALK_SPEED, ROOM_W, ROOM_D, ROOM_H, MONITOR_POS, CELL, GAP, CAP_SIZE, BUILD_GHOST_DELAY, BUILD_STAGGER, BUILD_FLY_DURATION, RESULT_OFFSET, PH };
`;
fs.writeFileSync('src/constants/scene.js', constantsContent.trim());

// Write Intro.jsx
const introContent = `
import React, { useState, useEffect } from 'react';
import { Sound } from '../../utils/SoundEngine.js';

${introStr}

export { Intro };
`;
fs.writeFileSync('src/components/ui/Intro.jsx', introContent.trim());

// Write ShatterCanvas.jsx
const shatterContent = `
import React, { useRef, useEffect } from 'react';

${shatterStr}

export { ShatterCanvas };
`;
fs.writeFileSync('src/components/ui/ShatterCanvas.jsx', shatterContent.trim());

// Write Player.jsx
const playerContent = `
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { Sound } from '../../utils/SoundEngine.js';
import { EYE_HEIGHT, WALK_SPEED, ROOM_W, ROOM_D } from '../../constants/scene.js';

${playerStr}

export { Player };
`;
fs.writeFileSync('src/components/3d/Player.jsx', playerContent.trim());

// Write Room.jsx
const roomContent = `
import React, { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text, useCursor } from '@react-three/drei';
import { ROOM_W, ROOM_D, ROOM_H, PLAYFAIR_FONT } from '../../constants/scene.js';
import { Sound } from '../../utils/SoundEngine.js';

${dustStr}
${deskPropsStr}
${roomStr}

export { Room };
`;
fs.writeFileSync('src/components/3d/Room.jsx', roomContent.trim());

// Write MonitorScreen.jsx
const monitorContent = `
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

${monitorStr}

export { MonitorScreen };
`;
fs.writeFileSync('src/components/3d/MonitorScreen.jsx', monitorContent.trim());

// Write FloatingTerminal.jsx
const floatingTerminalContent = `
import React, { useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useCursor } from '@react-three/drei';
import { Sound } from '../../utils/SoundEngine.js';
import { PLAYFAIR_FONT } from '../../constants/scene.js';

${terminalStr}

export { FloatingTerminal };
`;
fs.writeFileSync('src/components/3d/FloatingTerminal.jsx', floatingTerminalContent.trim());

// Write Scene.jsx
const sceneContent = `
import React, { useMemo } from 'react';
import {
  EffectComposer, Bloom, Vignette, ChromaticAberration, Noise, ToneMapping,
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import { Player } from './Player.jsx';
import { Room } from './Room.jsx';
import { MonitorScreen } from './MonitorScreen.jsx';
import { FloatingTerminal } from './FloatingTerminal.jsx';

${sceneStr}

export { Scene };
`;
fs.writeFileSync('src/components/3d/Scene.jsx', sceneContent.trim());

// Write HUD.jsx
const hudContent = `
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sound } from '../../utils/SoundEngine.js';
import { runCipher } from '../../utils/Cipher.js';

${hudStr}

export { HUD };
`;
fs.writeFileSync('src/components/ui/HUD.jsx', hudContent.trim());

// Write App.jsx
const finalAppContent = `
import React, { useState, useCallback, Suspense, useEffect } from 'react';
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

${appStr}

export default App;
`;
fs.writeFileSync('src/App.jsx', finalAppContent.trim());

console.log("Refactoring complete.");
