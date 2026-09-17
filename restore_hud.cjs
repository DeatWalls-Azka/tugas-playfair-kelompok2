const fs = require('fs');

const original = fs.readFileSync('index_original.html', 'utf8');

// Extract HUD section
const hudStart = original.indexOf('/* ═══ HUD ═══ */');
const appSection = original.indexOf('/* ═══ APP ═══ */');
const hudSection = original.substring(hudStart, appSection).trim();

const hudContent = `import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Sound } from '../../utils/SoundEngine.js';
import { runCipher, toBigrams } from '../../utils/Cipher.js';

${hudSection}

export { HUD };
`;

fs.writeFileSync('src/components/ui/HUD.jsx', hudContent);
console.log('HUD.jsx restored from original.');
