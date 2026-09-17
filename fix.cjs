const fs = require('fs');

// 1. Fix Cipher.js exports
let cipher = fs.readFileSync('src/utils/Cipher.js', 'utf8');
cipher = cipher.replace('export { buildGrid, runCipher };', 'export { buildGrid, runCipher, toBigrams };');
fs.writeFileSync('src/utils/Cipher.js', cipher);

// 2. Fix Room.jsx exports
let room = fs.readFileSync('src/components/3d/Room.jsx', 'utf8');
room = room.replace('export { Room };', 'export { Room, CinematicLights, DeskLamp, Terminal, DustMotes };');
fs.writeFileSync('src/components/3d/Room.jsx', room);

// 3. Move BigramStrip and DraggablePanel from Scene.jsx to HUD.jsx
let scene2 = fs.readFileSync('src/components/3d/Scene.jsx', 'utf8');
const bigramIndex = scene2.indexOf('/* ═══ BIGRAM STRIP');
let extraUI2 = '';
if (bigramIndex !== -1) {
    const exportSceneIndex = scene2.indexOf('export { Scene };', bigramIndex);
    extraUI2 = scene2.substring(bigramIndex, exportSceneIndex).trim();
    scene2 = scene2.substring(0, bigramIndex).trim() + '\n\nexport { Scene };';
}
scene2 = scene2.replace("import React, { useMemo } from 'react';", "import React, { useMemo, useEffect } from 'react';\nimport * as THREE from 'three';\nimport { useThree } from '@react-three/fiber';\nimport { AsciiRenderer } from '@react-three/drei';");
scene2 = scene2.replace("import { Room } from './Room.jsx';", "import { Room, CinematicLights, DeskLamp, Terminal, DustMotes } from './Room.jsx';");
fs.writeFileSync('src/components/3d/Scene.jsx', scene2);

// Add extraUI to HUD.jsx
let hud = fs.readFileSync('src/components/ui/HUD.jsx', 'utf8');
hud = hud.replace("import { runCipher } from '../../utils/Cipher.js';", "import { runCipher, toBigrams } from '../../utils/Cipher.js';\nimport { useKeyboardControls } from '@react-three/drei';");
hud = hud.replace('export { HUD };', extraUI2 + '\n\nexport { HUD };');
hud = hud.replace("import React, { useState, useEffect, useRef, useMemo } from 'react';", "import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';");
fs.writeFileSync('src/components/ui/HUD.jsx', hud);
