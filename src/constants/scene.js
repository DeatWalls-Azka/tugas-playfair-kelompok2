import * as THREE from 'three';

const PLAYFAIR_FONT =
  'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtXK-F2qC0s.woff';
/* ═══ GEOMETRY ═══ */
const EYE_HEIGHT = 1.7, WALK_SPEED = 4.2;
const ROOM_W = 16, ROOM_D = 16, ROOM_H = 4.0;
const MONITOR_POS = [0, 1.95, -5.15];
const CELL = 0.32, GAP = 0.03, CAP_SIZE = 0.30;
const BUILD_GHOST_DELAY = 900, BUILD_STAGGER = 55, BUILD_FLY_DURATION = 420;
const RESULT_OFFSET = 2.2;

/* Step timeline.
   Each action has its OWN window. The birth letters glide to the result
   slot within a dedicated `glide` window that ALWAYS reaches progress = 1
   before `settle` starts, so nothing is ever cut off by the next step. */
const PH = {
  rule:   [0.00, 0.05],
  fly1:   [0.05, 0.22],
  burst1: [0.22, 0.28],
  birth1: [0.28, 0.36],
  glide1: [0.36, 0.48],
  fly2:   [0.48, 0.66],
  burst2: [0.66, 0.72],
  birth2: [0.72, 0.80],
  glide2: [0.80, 0.97],
  settle: [0.97, 1.00],
};
function pp(t, [a, b]) { if (t <= a) return 0; if (t >= b) return 1; return (t - a) / (b - a); }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function cellLocalX(c) { return (c - 2) * (CELL + GAP); }
function cellLocalY(r) { return (2 - r) * (CELL + GAP); }

export { PLAYFAIR_FONT, EYE_HEIGHT, WALK_SPEED, ROOM_W, ROOM_D, ROOM_H, MONITOR_POS, CELL, GAP, CAP_SIZE, BUILD_GHOST_DELAY, BUILD_STAGGER, BUILD_FLY_DURATION, RESULT_OFFSET, PH };