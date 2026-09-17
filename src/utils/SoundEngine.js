/* ═══════════════════════════════════════════════════════════
   SOUND ENGINE — procedural. Pre-warms buffers on init()
   ═══════════════════════════════════════════════════════════ */
const Sound = (() => {
  let ctx = null;
  let master = null;
  let ambient = null;
  let muted = false;
  let shatterBuf = null;

  function init() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
      // Pre-generate the heavy shatter noise buffer here (once).
      const sr = ctx.sampleRate;
      const dur = 1.4;
      shatterBuf = ctx.createBuffer(1, Math.floor(sr * dur), sr);
      const d = shatterBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        const env = Math.exp(-t * 3.1) * (1 - Math.exp(-t * 220));
        d[i] = (Math.random() * 2 - 1) * env;
      }
    } catch (e) { ctx = null; }
    return ctx;
  }
  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }
  function now() { return ctx ? ctx.currentTime : 0; }

  function tone(freq, duration, type, gain, offset) {
    const c = init(); if (!c) return;
    resume();
    const t0 = now() + (offset || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain || 0.05), t0 + 0.010);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + duration + 0.05);
  }

  function noise(duration, filterType, filterFreq, gain, sweepTo, q) {
    const c = init(); if (!c) return;
    resume();
    const sr = c.sampleRate;
    const buf = c.createBuffer(1, Math.max(1, Math.floor(sr * duration)), sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const t = i / sr;
      d[i] = (Math.random() * 2 - 1) * Math.exp(-t * (4 / duration));
    }
    const src = c.createBufferSource(); src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = filterType || 'bandpass';
    filter.frequency.value = filterFreq || 1000;
    filter.Q.value = q == null ? 2 : q;
    if (sweepTo) {
      filter.frequency.exponentialRampToValueAtTime(
        Math.max(20, sweepTo), c.currentTime + duration);
    }
    const g = c.createGain(); g.gain.value = gain || 0.1;
    src.connect(filter); filter.connect(g); g.connect(master);
    src.start();
  }

  return {
    init, resume,
    get muted() { return muted; },
    setMuted(v) {
      muted = !!v;
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.5, now(), 0.05);
    },
    toggleMute() { this.setMuted(!muted); return muted; },

    // ── UI
    type()   { tone(1700 + Math.random() * 600, 0.018, 'square', 0.012); },
    click()  { tone(1500, 0.035, 'square', 0.035);
               tone(760, 0.055, 'sine', 0.028, 0.010); },
    hover()  { tone(2500, 0.012, 'sine', 0.007); },
    panel()  { tone(420, 0.07, 'triangle', 0.05);
               tone(620, 0.06, 'triangle', 0.038, 0.045); },
    toggle() { tone(620, 0.08, 'sine', 0.055);
               tone(940, 0.08, 'sine', 0.045, 0.04); },
    error()  { tone(160, 0.16, 'sawtooth', 0.05);
               tone(120, 0.20, 'sawtooth', 0.045, 0.05); },

    // ── Scene
    step() {
      noise(0.085, 'lowpass', 180 + Math.random() * 160, 0.09, null, 0.8);
      tone(60 + Math.random() * 30, 0.05, 'sine', 0.05);
    },
    whoosh() { noise(0.46, 'bandpass', 480, 0.07, 2600, 5); },
    burst()  {
      noise(0.34, 'highpass', 1400, 0.11, null, 1);
      tone(88, 0.30, 'sine', 0.13);
      tone(60, 0.42, 'sine', 0.09, 0.02);
    },
    birth() {
      tone(523.25, 0.34, 'sine', 0.045);
      tone(783.99, 0.34, 'sine', 0.035);
      tone(1046.50, 0.34, 'sine', 0.028);
      tone(1567.98, 0.28, 'sine', 0.018, 0.02);
    },
    // uses the pre-generated buffer — no synchronous synthesis on click
    shatter() {
      const c = init(); if (!c || !shatterBuf) return;
      resume();
      const src = c.createBufferSource(); src.buffer = shatterBuf;
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1700;
      const g = c.createGain(); g.gain.value = 0.20;
      src.connect(hp); hp.connect(g); g.connect(master); src.start();
      tone(170, 0.55, 'sine', 0.35);
      tone(42,  0.55, 'sine', 0.30, 0.02);
    },
    ambienceStart() {
      const c = init(); if (!c) return;
      resume();
      if (ambient) return;

      const bus = c.createGain();
      bus.gain.setValueAtTime(0.0001, now());
      bus.gain.exponentialRampToValueAtTime(0.065, now() + 5);
      bus.connect(master);

      const o1 = c.createOscillator(); o1.type = 'sine'; o1.frequency.value = 48.999;
      const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = 73.416;
      o2.detune.value = 6;
      const o3 = c.createOscillator(); o3.type = 'triangle'; o3.frequency.value = 97.999;
      o3.detune.value = -8;

      const g1 = c.createGain(); g1.gain.value = 0.65;
      const g2 = c.createGain(); g2.gain.value = 0.22;
      const g3 = c.createGain(); g3.gain.value = 0.09;

      o1.connect(g1).connect(bus);
      o2.connect(g2).connect(bus);
      o3.connect(g3).connect(bus);

      const lfo = c.createOscillator(); lfo.frequency.value = 0.06;
      const lfoG = c.createGain(); lfoG.gain.value = 0.18;
      lfo.connect(lfoG); lfoG.connect(g1.gain);

      const sr = c.sampleRate;
      const nbuf = c.createBuffer(1, sr * 4, sr);
      const nd = nbuf.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      const ns = c.createBufferSource(); ns.buffer = nbuf; ns.loop = true;
      const nf = c.createBiquadFilter(); nf.type = 'bandpass';
      nf.frequency.value = 260; nf.Q.value = 1.4;
      const ng = c.createGain(); ng.gain.value = 0.035;
      ns.connect(nf).connect(ng).connect(bus);

      const lfo2 = c.createOscillator(); lfo2.frequency.value = 0.035;
      const lfo2G = c.createGain(); lfo2G.gain.value = 130;
      lfo2.connect(lfo2G); lfo2G.connect(nf.frequency);

      o1.start(); o2.start(); o3.start();
      lfo.start(); lfo2.start(); ns.start();

      ambient = { o1, o2, o3, lfo, lfo2, ns, bus };
    },
  };
})();

export { Sound };