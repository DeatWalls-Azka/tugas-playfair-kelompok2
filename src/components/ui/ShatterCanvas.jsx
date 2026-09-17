import React, { useRef, useEffect } from 'react';

/* ═══ SHATTER — always mounted, activates on trigger ═══
   Pre-sized canvas lives in the DOM at all times so there's no
   first-frame allocation hitch when the shatter actually fires. */
function ShatterCanvas({ active, onDone }) {
  const ref = useRef(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  // Keep the canvas sized to the viewport at all times
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const resize = () => {
      cv.width = window.innerWidth;
      cv.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!active) {
      // idle: clear and stop
      ctx.clearRect(0, 0, cv.width, cv.height);
      return;
    }

    const W = cv.width, H = cv.height;
    const COLS = 7, ROWS = 5, cw = W / COLS, chh = H / ROWS;
    const pts = [];
    for (let r = 0; r <= ROWS; r++) {
      pts[r] = [];
      for (let c = 0; c <= COLS; c++) {
        const edge = r === 0 || r === ROWS || c === 0 || c === COLS;
        const jx = edge ? 0 : (Math.random() - 0.5) * cw * 0.72;
        const jy = edge ? 0 : (Math.random() - 0.5) * chh * 0.72;
        pts[r][c] = { x: c * cw + jx, y: r * chh + jy };
      }
    }
    const shards = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const p00 = pts[r][c], p10 = pts[r][c + 1];
      const p01 = pts[r + 1][c], p11 = pts[r + 1][c + 1];
      const tris = Math.random() < 0.5
        ? [[p00, p10, p11], [p00, p11, p01]]
        : [[p00, p10, p01], [p10, p11, p01]];
      for (const t of tris) {
        const cx = (t[0].x + t[1].x + t[2].x) / 3, cy = (t[0].y + t[1].y + t[2].y) / 3;
        const ang = Math.atan2(cy - H * 0.45, cx - W * 0.5);
        const spd = 170 + Math.random() * 540;
        shards.push({
          pts: t.map((p) => ({ x: p.x - cx, y: p.y - cy })),
          cx, cy,
          vx: Math.cos(ang) * spd + (Math.random() - 0.5) * 170,
          vy: Math.sin(ang) * spd - 190 - Math.random() * 280,
          rot: 0, vr: (Math.random() - 0.5) * 7, alpha: 1,
        });
      }
    }
    let prev = performance.now(); let raf = 0; let finished = false;
    const frame = (now) => {
      const dt = Math.min(0.032, (now - prev) / 1000); prev = now;
      ctx.clearRect(0, 0, W, H);
      let alive = 0;
      for (const s of shards) {
        if (s.alpha <= 0) continue;
        s.vy += 1550 * dt; s.vx *= 1 - 0.55 * dt;
        s.cx += s.vx * dt; s.cy += s.vy * dt; s.rot += s.vr * dt;
        s.alpha -= dt * 0.72; if (s.alpha <= 0) continue;
        alive++;
        ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate(s.rot);
        ctx.beginPath();
        ctx.moveTo(s.pts[0].x, s.pts[0].y);
        ctx.lineTo(s.pts[1].x, s.pts[1].y);
        ctx.lineTo(s.pts[2].x, s.pts[2].y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,180,120,' + (0.14 * s.alpha).toFixed(3) + ')';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,240,220,' + (0.9 * s.alpha).toFixed(3) + ')';
        ctx.lineWidth = 1.1; ctx.stroke(); ctx.restore();
      }
      if (alive > 0) raf = requestAnimationFrame(frame);
      else if (!finished) { finished = true; doneRef.current && doneRef.current(); }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return <canvas ref={ref}
    className="shatter-layer fixed inset-0 pointer-events-none"
    style={{ width: '100%', height: '100%',
      display: active ? 'block' : 'none' }} />;
}

export { ShatterCanvas };