import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Sound } from '../../utils/SoundEngine.js';
import { runCipher, toBigrams } from '../../utils/Cipher.js';

/* ═══ BIGRAM STRIP — now DRAGGABLE ═══ */
function BigramStrip({ input, activePairIdx, steps }) {
  const pairs = useMemo(() => toBigrams(input), [input]);
  const [revealed, setRevealed] = useState(0);
  const { pos, onPointerDown } = useDraggable(
    typeof window !== 'undefined' ? window.innerWidth / 2 - 220 : 300,
    64
  );
  useEffect(() => {
    setRevealed(0);
    if (pairs.length === 0) return;
    let i = 0;
    const t = setInterval(() => {
      i += 1; setRevealed(i);
      if (i >= pairs.length) clearInterval(t);
    }, 80);
    return () => clearInterval(t);
  }, [pairs]);
  if (pairs.length === 0) return null;
  return (
    <div
      className="hud-layer draggable"
      onPointerDown={onPointerDown}
      style={{
        position: 'fixed', left: 0, top: 0,
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        touchAction: 'none', willChange: 'transform',
        display: 'flex', alignItems: 'center', gap: 8,
        maxWidth: '92vw', pointerEvents: 'auto',
      }}>
      <span className="mono shrink-0"
        style={{ fontSize: 9, letterSpacing: '.24em',
          color: 'rgba(180,210,240,.45)', fontStyle: 'italic' }}>
        DIGRAPHS
      </span>
      <div className="flex gap-1 items-center flex-wrap justify-center"
        style={{ maxWidth: '70vw' }}>
        {pairs.map((p, i) => {
          const isActive = i === activePairIdx;
          const isDone = activePairIdx >= 0 && i < activePairIdx;
          const visible = i < revealed;
          const outStr = steps[i] ? steps[i].outPair.join('') : '';
          return (
            <div key={i}
              className={'bigram-card' + (isActive ? ' active' : '') + (isDone ? ' done' : '')}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.82)',
              }}>
              <span>{p[0]}{p[1]}</span>
              {(isActive || isDone) && outStr && <span className="sub">→{outStr}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ DRAGGABLE HOOK ═══ */
function useDraggable(initialX, initialY) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const posRef = useRef(pos);
  posRef.current = pos;

  const onPointerDown = useCallback((e) => {
    const target = e.target;
    if (target && target.closest) {
      if (target.closest('button, input, textarea, select, label, a, [data-no-drag]')) return;
    }
    e.preventDefault();
    e.stopPropagation();
    Sound.hover();

    const startX = e.clientX, startY = e.clientY;
    const baseX = posRef.current.x, baseY = posRef.current.y;
    let moved = false;

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && Math.hypot(dx, dy) > 3) moved = true;
      setPos({ x: baseX + dx, y: baseY + dy });
    };
    const onUp = () => {
      if (moved) Sound.panel();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }, []);

  return { pos, onPointerDown };
}

/* ═══ DRAGGABLE PANEL ═══ */
function DraggablePanel({ initialX, initialY, width, children, z = 'hud-layer' }) {
  const { pos, onPointerDown } = useDraggable(initialX, initialY);
  return (
    <div
      className={`${z} draggable`}
      onPointerDown={onPointerDown}
      style={{
        position: 'fixed', left: 0, top: 0,
        width: width,
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        touchAction: 'none',
        willChange: 'transform',
        pointerEvents: 'auto',
      }}>
      <div className="panel">{children}</div>
    </div>
  );
}

/* ═══ HUD ═══ */
function HUD({
  steps, stepIdx, playing, speed, setSpeed, setStepIdx, setPlaying, togglePlay,
  result, mode, setMode, input, setInput, keyText, setKeyText,
  onDownload, onCopy, copied, asciiMode, setAsciiMode,
  keyFocused, setKeyFocused,
  activeStep, showResult, onToggleResult, muted, onToggleMute,
}) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );
  const [panelState, setPanelState] = useState(() => {
    const m = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
    return { left: !m, rule: !m, bottom: !m, bigrams: !m };
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const togglePanel = (key) => { Sound.toggle(); setPanelState(s => ({ ...s, [key]: !s[key] })); };

  const ruleInitX = useMemo(() => {
    if (typeof window === 'undefined') return 400;
    return Math.max(280, Math.round(window.innerWidth * 0.30 - 300));
  }, []);
  const ruleInitY = useMemo(() => {
    if (typeof window === 'undefined') return 340;
    return Math.round(window.innerHeight * 0.42);
  }, []);

  return (
    <>
      <div className="crosshair" />

      {/* ═══ TOP BAR ═══ */}
      <div className="hud-layer fixed top-0 left-0 right-0 h-11 px-4 flex items-center justify-between border-b border-white/10 bg-black/80 backdrop-blur-sm pointer-events-none">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[#ff9640] shrink-0"
            style={{ fontSize: 15, letterSpacing: '.3em', fontWeight: 700,
              textShadow: '0 0 12px rgba(255,150,60,.7), 0 0 24px rgba(255,150,60,.35)' }}>
            PLAYFAIR
          </span>
          {!isMobile && (
            <>
              <span className="text-white/20">|</span>
              <span className="label truncate" style={{ letterSpacing: '.28em' }}>ASCII // R3F DOSSIER — ROOM</span>
            </>
          )}
        </div>

        {!isMobile && (
          <div className="flex items-center gap-3 pointer-events-auto">
            <button className={'btn ' + (mode === 'encrypt' ? 'on' : '')} onClick={() => setMode('encrypt')}>Encrypt</button>
            <button className={'btn ' + (mode === 'decrypt' ? 'on' : '')} onClick={() => setMode('decrypt')}>Decrypt</button>
            <button className={'btn ' + (asciiMode ? 'on' : '')} onClick={() => setAsciiMode(!asciiMode)}>
              {asciiMode ? 'ASCII' : 'SOLID'}
            </button>
            <button className={'btn ' + (muted ? '' : 'on')} onClick={onToggleMute}
              title={muted ? 'Unmute' : 'Mute'}>
              {muted ? '🔇 AUDIO' : '🔊 AUDIO'}
            </button>
            <span className="label">BIGRAMS: <span style={{ color: '#ff9640' }}>{steps.length}</span></span>
          </div>
        )}

        <button
          className="hamburger pointer-events-auto"
          onClick={() => setMobileMenuOpen(v => !v)}
          aria-label="menu">
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* ═══ MOBILE MENU ═══ */}
      {mobileMenuOpen && (
        <div className="hud-layer-menu mobile-menu">
          <div className="panel overflow-hidden">
            <div className="panel-header">
              <span className="label">Panels</span>
              <button className="min-btn" onClick={() => setMobileMenuOpen(false)}>✕</button>
            </div>
            {[
              { key: 'left', label: 'KEY / INPUT PANEL' },
              { key: 'rule', label: 'RULE PANEL' },
              { key: 'bigrams', label: 'BIGRAM STRIP' },
              { key: 'bottom', label: 'BIGRAM STEPPER' },
            ].map(item => (
              <div key={item.key}
                className={'mobile-toggle ' + (panelState[item.key] ? 'on' : '')}
                onClick={() => togglePanel(item.key)}>
                <span>{item.label}</span>
                <span className="indicator"></span>
              </div>
            ))}
            <div className="panel-header" style={{ borderTop: '1px solid rgba(120,170,220,.1)', borderBottom: 'none' }}>
              <span className="label">Mode</span>
            </div>
            <div className="mobile-toggle" style={{ gap: 8 }}>
              <button className={'btn ' + (mode === 'encrypt' ? 'on' : '')}
                style={{ flex: 1 }}
                onClick={() => setMode('encrypt')}>Encrypt</button>
              <button className={'btn ' + (mode === 'decrypt' ? 'on' : '')}
                style={{ flex: 1 }}
                onClick={() => setMode('decrypt')}>Decrypt</button>
            </div>
            <div className="mobile-toggle" style={{ gap: 8 }}>
              <button className={'btn ' + (asciiMode ? 'on' : '')}
                style={{ flex: 1 }}
                onClick={() => setAsciiMode(!asciiMode)}>
                {asciiMode ? 'ASCII' : 'SOLID'}
              </button>
              <button className={'btn ' + (muted ? '' : 'on')}
                style={{ flex: 1 }}
                onClick={onToggleMute}>
                {muted ? '🔇' : '🔊'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ BIGRAM STRIP (draggable) ═══ */}
      {panelState.bigrams && <BigramStrip input={input} activePairIdx={stepIdx} steps={steps} />}

      {/* ═══ LEFT PANEL: KEY / INPUT ═══ */}
      {panelState.left && (
        <DraggablePanel initialX={12} initialY={56}
          width={isMobile ? Math.min(280, (typeof window !== 'undefined' ? window.innerWidth : 400) - 24) : 260}>
          <div className="panel-header">
            <span className="label">Passphrase / Input</span>
            <button className="min-btn" onClick={() => togglePanel('left')} title="minimize">—</button>
          </div>
          <div className="p-3 flex flex-col gap-2.5">
            <div className="label">Key</div>
            <input className={'field' + (keyFocused ? ' glow' : '')}
              value={keyText} spellCheck={false}
              placeholder="ENTER KEY PHRASE…"
              onFocus={() => setKeyFocused(true)}
              onBlur={() => setKeyFocused(false)}
              onChange={(e) => { setKeyText(e.target.value); Sound.type(); }} />
            <div className="label mt-1" style={{ fontStyle: 'italic' }}>
              {mode === 'encrypt' ? 'Plaintext' : 'Ciphertext'}
            </div>
            <textarea className="field"
              style={{ resize: 'none', height: 62, lineHeight: 1.5, fontSize: 13 }}
              spellCheck={false} value={input} placeholder="Type or drop a .txt file…"
              onChange={(e) => { setInput(e.target.value); Sound.type(); }} />
            <div className="flex gap-2">
              <label className="btn flex-1 text-center" style={{ display: 'inline-block' }}>
                Load .txt
                <input type="file" accept=".txt,text/plain" style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0]; if (!f) return;
                    const r = new FileReader();
                    r.onload = () => { setInput(String(r.result || '').slice(0, 20000)); Sound.click(); };
                    r.readAsText(f); e.target.value = '';
                  }} />
              </label>
              <button className="btn flex-1" onClick={() => setInput('')}>Clear</button>
            </div>
          </div>
        </DraggablePanel>
      )}

      {!panelState.left && !isMobile && (
        <div className="hud-layer fixed left-3 top-14 pointer-events-auto">
          <button className="btn" onClick={() => togglePanel('left')}>
            ⌨ KEY / INPUT ▸
          </button>
        </div>
      )}

      {/* ═══ RULE PANEL — next to grid ═══ */}
      {panelState.rule && (
        <DraggablePanel initialX={ruleInitX} initialY={ruleInitY}
          width={isMobile ? Math.min(280, (typeof window !== 'undefined' ? window.innerWidth : 400) - 24) : 260}>
          <div className="panel-header">
            <span className="label">Current Rule</span>
            <button className="min-btn" onClick={() => togglePanel('rule')} title="minimize">—</button>
          </div>
          <div className="p-3 flex flex-col gap-2">
            <div style={{ color: '#ffb454', fontSize: 16, fontWeight: 700, letterSpacing: '.08em' }}>
              {activeStep ? activeStep.rule : 'AWAITING STEP'}
            </div>
            <div style={{ color: '#a8ffdd', fontSize: 11, fontStyle: 'italic',
              lineHeight: 1.5, minHeight: 32 }}>
              {activeStep && activeStep.rule === 'SAME ROW' && 'shift each letter right one · wrap at row end'}
              {activeStep && activeStep.rule === 'SAME COLUMN' && 'shift each letter down one · wrap at column end'}
              {activeStep && activeStep.rule === 'RECTANGLE' && 'swap with the letters on the opposite corners'}
              {!activeStep && 'press ▶ PLAY or step through to see the transformation rules'}
            </div>
          </div>
        </DraggablePanel>
      )}

      {!panelState.rule && !isMobile && (
        <div className="hud-layer fixed left-3 top-[300px] pointer-events-auto">
          <button className="btn" onClick={() => togglePanel('rule')}>
            ⚙ RULE ▸
          </button>
        </div>
      )}

      {/* ═══ RESULT TOGGLE ═══ */}
      <ResultToggle showResult={showResult} onToggleResult={onToggleResult} isMobile={isMobile} />

      {/* ═══ BOTTOM PANEL ═══ */}
      {panelState.bottom && (
        <DraggablePanel
          initialX={12}
          initialY={typeof window !== 'undefined' ? Math.max(0, window.innerHeight - 110) : 600}
          width={typeof window !== 'undefined' ? window.innerWidth - 24 : 800}>
          <div className="panel-header">
            <span className="label">Bigram Stepper</span>
            <button className="min-btn" onClick={() => togglePanel('bottom')} title="minimize">—</button>
          </div>
          <div className="p-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button className="btn" onClick={() => { setPlaying(false); setStepIdx(-1); Sound.click(); }} disabled={!steps.length}>⏮</button>
              <button className="btn" onClick={() => { setPlaying(false); setStepIdx((i) => Math.max(-1, i - 1)); Sound.click(); }} disabled={!steps.length}>◀</button>
              <button className={'btn ' + (playing ? 'on' : '')} onClick={togglePlay} disabled={!steps.length} style={{ minWidth: 74 }}>
                {playing ? '❚❚ Pause' : '▶ Play'}
              </button>
              <button className="btn" onClick={() => { setPlaying(false); setStepIdx((i) => Math.min(steps.length - 1, i + 1)); Sound.click(); }} disabled={!steps.length}>▶</button>
              <button className="btn" onClick={() => { setPlaying(false); setStepIdx(steps.length - 1); Sound.click(); }} disabled={!steps.length}>⏭</button>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="label">Speed</span>
              <input type="range" min="1200" max="4000" step="100" value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))} style={{ width: 80 }} />
              <span className="mono" style={{ fontSize: 11, color: 'rgba(219,230,242,.55)', width: 56 }}>{speed}ms</span>
            </div>
            <span className="mono ml-auto" style={{ fontSize: 11, letterSpacing: '.16em', color: 'rgba(219,230,242,.6)', fontStyle: 'italic' }}>
              STEP {stepIdx + 1} / {steps.length || 0}
            </span>
            {result.output && (
              <div className="flex items-center gap-2 ml-3">
                <button className="btn" onClick={onCopy}>{copied ? '✓' : 'Copy'}</button>
                <button className="btn" onClick={onDownload}>Save .txt</button>
              </div>
            )}
          </div>
        </DraggablePanel>
      )}

      {!panelState.bottom && !isMobile && (
        <div className="hud-layer fixed bottom-3 left-3 pointer-events-auto">
          <button className="btn" onClick={() => togglePanel('bottom')}>
            ▴ BIGRAM STEPPER
          </button>
        </div>
      )}
    </>
  );
}

/* ═══ RESULT TOGGLE (draggable) ═══ */
function ResultToggle({ showResult, onToggleResult, isMobile }) {
  const initX = useMemo(() => {
    if (typeof window === 'undefined') return 1000;
    return Math.max(0, window.innerWidth - 56);
  }, []);
  const initY = useMemo(() => {
    if (typeof window === 'undefined') return 400;
    return Math.round(window.innerHeight / 2 - 40);
  }, []);
  const { pos, onPointerDown } = useDraggable(initX, initY);
  return (
    <div
      className="hud-layer-top draggable"
      onPointerDown={onPointerDown}
      style={{
        position: 'fixed', left: 0, top: 0,
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        touchAction: 'none', pointerEvents: 'auto',
        willChange: 'transform',
      }}>
      <button
        className="btn"
        onClick={onToggleResult}
        style={{
          background: showResult ? 'rgba(180,74,255,.20)' : 'rgba(255,150,60,.18)',
          borderColor: showResult ? 'rgba(180,74,255,.75)' : 'rgba(255,150,60,.75)',
          color: showResult ? '#e8d0ff' : '#ffcf8a',
          padding: '12px 14px',
          fontSize: 11,
          writingMode: isMobile ? 'horizontal-tb' : 'vertical-rl',
          textOrientation: 'mixed',
          letterSpacing: '.18em',
          boxShadow: showResult
            ? '0 0 22px rgba(180,74,255,.35)'
            : '0 0 22px rgba(255,150,60,.30)',
        }}>
        {showResult ? '◀ DOSSIER' : 'RESULT ▶'}
      </button>
    </div>
  );
}

export { HUD };
