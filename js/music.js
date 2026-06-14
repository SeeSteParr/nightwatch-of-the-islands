/* =====================================================================
   Nightwatch of the Islands — music.js
   Procedural WebAudio score, Maltese/Mediterranean flavour.
   Phrygian dominant for the night themes (the classic Mediterranean
   colour), Mixolydian for the returned dawn. Lute-style plucks, an
   open-fifth drone, and duff-drum / tambourine percussion.
   No audio files — the whole score ships inside this script.
   ===================================================================== */
(function () {
  'use strict';

  let ctx = null, out = null, timer = null;
  let mood = null, queuedMood = null, step = 0, nextT = 0, loops = 0;
  let volume = 0.55;

  const PHRYG = [0, 1, 4, 5, 7, 8, 10];   // Phrygian dominant
  const MIXO = [0, 2, 4, 5, 7, 9, 10];    // Mixolydian (dawn)
  const ROOT = 146.83;                     // D3
  const N = null;

  const freq = (scale, d, oct) => {
    const o = Math.floor(d / 7) + (oct || 0);
    return ROOT * Math.pow(2, (scale[((d % 7) + 7) % 7] + 12 * o) / 12);
  };

  /* ------------------------------ voices ----------------------------- */
  function pluck(f, t, v, bright) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator();
    const fl = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = f;
    o2.type = 'triangle'; o2.frequency.value = f * 2.001; // octave shimmer
    fl.type = 'lowpass'; fl.frequency.value = bright ? 2600 : 1700; fl.Q.value = 1.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(fl); o2.connect(fl); fl.connect(g); g.connect(out);
    o.start(t); o2.start(t); o.stop(t + 0.55); o2.stop(t + 0.55);
  }

  function drone(f, t, dur, v, dark) {
    [0.997, 1.004].forEach(det => {
      const o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = f * det;
      fl.type = 'lowpass'; fl.frequency.value = dark ? 240 : 380; fl.Q.value = 0.8;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(v / 2, t + Math.min(0.5, dur / 3));
      g.gain.setValueAtTime(v / 2, t + dur - 0.25);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(fl); fl.connect(g); g.connect(out);
      o.start(t); o.stop(t + dur + 0.05);
    });
  }

  let noiseBuf = null;
  function noise() {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }
  function perc(kind, t, v) {
    if (kind === 2) { // duff drum thump
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(95, t);
      o.frequency.exponentialRampToValueAtTime(48, t + 0.16);
      g.gain.setValueAtTime(v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.22);
    } else { // tambourine shaker
      const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noise();
      fl.type = 'highpass'; fl.frequency.value = 5200;
      g.gain.setValueAtTime(v * 0.7, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      s.connect(fl); fl.connect(g); g.connect(out); s.start(t);
    }
  }

  /* ------------------------------ score ------------------------------ */
  // 16 eighth-note steps per loop. perc codes: 1 shaker, 2 thump.
  const MOODS = {
    title: {
      bpm: 56, scale: PHRYG,
      drone: { notes: [[0, -1], [4, -1]], vol: 0.10 },
      voices: [
        { oct: 1, vol: 0.15, pat: [4, N, N, N, 5, N, N, N, 7, N, 5, N, 4, N, 2, N] }
      ]
    },
    overworld: {
      bpm: 92, scale: PHRYG,
      drone: { notes: [[0, -1]], vol: 0.09 },
      voices: [
        { oct: 0, vol: 0.105, pat: [0, 2, 4, 2, 5, 4, 2, 1, 0, 2, 4, 5, 7, 5, 4, 2] },          // lute arpeggio
        { oct: 1, vol: 0.13, everyOther: true, pat: [7, N, N, 5, N, 4, N, N, 2, N, 4, N, 1, N, 0, N] } // melody, alternate loops
      ],
      perc: { vol: 0.085, pat: [2, N, 1, N, N, N, 1, 1, 2, N, 1, N, N, N, 1, N] }
    },
    mdina: {
      bpm: 66, scale: PHRYG,
      drone: { notes: [[0, -1]], vol: 0.06 },
      voices: [
        { oct: 0, vol: 0.085, pat: [0, N, 4, N, 7, N, 9, N, 7, N, 4, N, 2, N, 4, N] }
      ]
    },
    under: {
      bpm: 46, scale: PHRYG,
      drone: { notes: [[0, -2], [0, -1]], vol: 0.13, dark: true },
      voices: [
        { oct: 0, vol: 0.07, pat: [0, N, N, N, N, N, N, N, 1, N, N, N, N, N, N, N] },
        { oct: 2, vol: 0.045, pat: [N, N, N, N, N, N, N, N, N, N, N, N, 4, N, N, N] } // a far-off echo
      ]
    },
    boss: {
      bpm: 138, scale: PHRYG,
      drone: { notes: [[0, -1]], vol: 0.10 },
      voices: [
        { oct: -1, vol: 0.15, pat: [0, 0, N, 0, 1, 0, N, 0, 0, 0, N, 0, 1, N, 2, 1] },          // war-drum bass
        { oct: 1, vol: 0.12, pat: [7, N, 6, N, 7, N, 8, 7, N, 5, N, 4, 5, 4, 2, 1] }
      ],
      perc: { vol: 0.14, pat: [2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1] }
    },
    day: {
      bpm: 104, scale: MIXO,
      drone: { notes: [[0, -1]], vol: 0.07 },
      voices: [
        { oct: 0, vol: 0.105, bright: true, pat: [0, 2, 4, 7, 9, 7, 4, 2, 0, 2, 4, 7, 11, 9, 7, 4] },
        { oct: 1, vol: 0.12, bright: true, everyOther: true, pat: [7, N, 9, N, 7, N, 4, N, 9, N, 11, N, 9, 7, N, 4] }
      ],
      perc: { vol: 0.06, pat: [N, N, 1, N, N, N, 1, N, N, N, 1, N, N, N, 1, N] }
    }
  };

  function scheduleStep(m, s, t, stepDur) {
    if (s === 0 && m.drone) {
      const barDur = stepDur * 16;
      m.drone.notes.forEach(([d, oct]) => drone(freq(m.scale, d, oct), t, barDur + 0.1, m.drone.vol, m.drone.dark));
    }
    m.voices.forEach(v => {
      if (v.everyOther && loops % 2 === 0) return;
      const d = v.pat[s];
      if (d !== null && d !== undefined) pluck(freq(m.scale, d, v.oct), t, v.vol, v.bright);
    });
    if (m.perc) {
      const p = m.perc.pat[s];
      if (p) perc(p, t, m.perc.vol);
    }
  }

  function tick() {
    if (!ctx || !mood) return;
    // 1.2s lookahead so throttled background timers don't leave gaps
    while (nextT < ctx.currentTime + 1.2) {
      const m = MOODS[mood];
      const stepDur = 60 / m.bpm / 2;
      if (step % 16 === 0) {
        if (step > 0) loops++;
        if (queuedMood) { mood = queuedMood; queuedMood = null; step = 0; loops = 0; continue; }
      }
      scheduleStep(m, step % 16, nextT, stepDur);
      nextT += stepDur;
      step++;
    }
  }

  /* ------------------------------- API ------------------------------- */
  window.MUSIC = {
    init(audioCtx) {
      if (ctx) return;
      ctx = audioCtx;
      out = ctx.createGain();
      out.gain.value = volume;
      out.connect(ctx.destination);
      nextT = ctx.currentTime + 0.05;
      timer = setInterval(tick, 200);
    },
    setMood(m) {
      if (!MOODS[m] || m === mood || m === queuedMood) return;
      if (!mood || m === 'boss' || mood === 'boss') {
        // strike up immediately for fights (and the very first theme)
        mood = m; queuedMood = null; step = 0; loops = 0;
        if (ctx) nextT = Math.max(nextT, ctx.currentTime + 0.03);
      } else {
        queuedMood = m; // otherwise change at the next bar line
      }
    },
    setVolume(v) {
      volume = v;
      if (out) out.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
    },
    state: () => ({ mood, queuedMood, step, running: !!timer, ctxState: ctx && ctx.state })
  };
})();
