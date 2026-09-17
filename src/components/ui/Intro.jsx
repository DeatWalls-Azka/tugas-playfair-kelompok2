import React, { useState, useEffect } from 'react';
import { Sound } from '../../utils/SoundEngine.js';

/* ═══ INTRO ═══ */
const INTRO_TEXT =
`In 1854, Charles Wheatstone devised a cipher that would resist every cryptanalyst for nearly a century.

It was offered to the British Foreign Office — and rejected as "too complicated to be worth the trouble."

It carries the name of Lord Playfair, who had nothing to do with its invention.

It does not encrypt letters. It encrypts pairs.
Twenty-five letters. Five rows. Five columns. No J.

What follows is a working dossier — the key matrix, the digraphs, the rules — rendered in real time as ASCII geometry.`;

function Intro({ onEnter, fading }) {
  const [n, setN] = useState(0);
  const done = n >= INTRO_TEXT.length;
  useEffect(() => {
    if (done) return;
    const ch = INTRO_TEXT[n];
    const delay = ch === '\n' ? 260 : (ch === '.' ? 190 : ch === '—' ? 120 : 24);
    const t = setTimeout(() => {
      setN((v) => v + 1);
      if (ch !== ' ' && ch !== '\n') Sound.type();
    }, delay);
    return () => clearTimeout(t);
  }, [n, done]);
  useEffect(() => {
    const onKey = () => onEnter();
    if (!done) return;
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [done, onEnter]);
  return (
    <div onClick={onEnter}
      className="intro-layer fixed inset-0 bg-black flex items-center justify-center cursor-pointer select-none"
      style={{ opacity: fading ? 0 : 1, transition: 'opacity .18s linear' }}>
      <div className="max-w-3xl px-6 md:px-10">
        <p className="whitespace-pre-wrap"
          style={{ fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 'clamp(13px, 1.9vw, 23px)', lineHeight: 1.75,
            color: 'rgba(255,255,255,.92)', letterSpacing: '.01em',
            textShadow: '0 0 24px rgba(255,150,60,.15)' }}>
          {INTRO_TEXT.slice(0, n)}
          <span className="caret" style={{ color: '#ff9640' }}>▍</span>
        </p>
        {done && (
          <p className="mono mt-10"
            style={{ fontSize: 11, letterSpacing: '.38em', color: 'rgba(255,150,60,.85)',
              fontStyle: 'italic', animation: 'blink 1.6s steps(1) infinite' }}>
            CLICK ANYWHERE TO ENTER THE DOSSIER
          </p>
        )}
      </div>
    </div>
  );
}

export { Intro };