const fs = require('fs');

const original = fs.readFileSync('index_original.html', 'utf8');

// Extract everything from HUD section including all helpers
// In the original: BigramStrip -> useDraggable -> DraggablePanel -> ResultToggle -> HUD -> APP
// We need all of those in HUD.jsx

const bigramStart = original.indexOf('/* ═══ BIGRAM STRIP');
const appStart = original.indexOf('/* ═══ APP ═══ */');

const hudContent = `import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Sound } from '../../utils/SoundEngine.js';
import { runCipher, toBigrams } from '../../utils/Cipher.js';

${original.substring(bigramStart, appStart).trim()}

export { HUD };
`;

fs.writeFileSync('src/components/ui/HUD.jsx', hudContent);
console.log('HUD.jsx rebuilt cleanly with all helpers.');
