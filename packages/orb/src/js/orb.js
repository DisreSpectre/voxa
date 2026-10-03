// Voxa Minimal Orb — pure canvas 2D, minimal aesthetic.
// Audio-reactive luminous aura disc with state transitions and audio pulses.

import { getSkin, getPalette, DEFAULT_SKIN, DEFAULT_PALETTE } from "./skins.js";

const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a))})`;

export function createOrb(canvas) {
  const ctx = canvas.getContext("2d");

  let W = 0, H = 0;
  let dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(40, r.width);
    H = Math.max(40, r.height);
    dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  let pal = getPalette(DEFAULT_PALETTE);
  let skin = getSkin(DEFAULT_SKIN);

  function setPalette(id) { pal = getPalette(id); }
  function setSkin(id) { skin = getSkin(id); }

  let state = "idle";
  let targetEnergy = 0.25;
  let energy = 0.25;
  let audioLevel = 0;
  let smoothLevel = 0;

  function setOrbState(s) {
    state = s;
    if (s === "speaking") targetEnergy = 0.95;
    else if (s === "listening") targetEnergy = 0.85;
    else if (s === "connecting") targetEnergy = 0.45;
    else targetEnergy = 0.25;
  }

  function setAudioLevel(lvl) {
    audioLevel = Math.max(0, Math.min(1, lvl || 0));
  }

  let raf = null;
  let lastT = performance.now();

  function drawAuraDisc(cx, cy, R, breath, t) {
    const pulse = 1 + 0.16 * smoothLevel + 0.05 * breath;
    const rad = R * 0.78 * pulse;
    const col = state === "speaking" ? pal.core : state === "listening" ? pal.accent : pal.core;

    // Outer soft glow
    const glowR = rad * 1.45;
    const gOuter = ctx.createRadialGradient(cx, cy, rad * 0.2, cx, cy, glowR);
    gOuter.addColorStop(0, rgba(col, 0.35 + 0.25 * smoothLevel));
    gOuter.addColorStop(0.6, rgba(col, 0.12 + 0.15 * smoothLevel));
    gOuter.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = gOuter;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();

    // Main aura core
    const g = ctx.createRadialGradient(cx, cy, rad * 0.05, cx, cy, rad);
    g.addColorStop(0, rgba(pal.white, 0.98));
    g.addColorStop(0.28, rgba(col, 0.85 + 0.15 * energy));
    g.addColorStop(0.68, rgba(col, 0.3 + 0.25 * smoothLevel));
    g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();

    // Voice concentric sound ripples
    if (smoothLevel > 0.03 || state === "speaking" || state === "listening") {
      const rings = 3;
      for (let i = 0; i < rings; i++) {
        const phase = (t * (0.5 + smoothLevel) + i / rings) % 1;
        const rr = rad * (0.95 + phase * (0.45 + 0.4 * smoothLevel));
        const al = (1 - phase) * (0.2 + 0.5 * smoothLevel);
        if (al <= 0.02) continue;
        ctx.strokeStyle = rgba(col, al);
        ctx.lineWidth = Math.max(1, 1.5 * dpr * (1 - phase * 0.5));
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function render(now) {
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;
    const t = now / 1000;

    energy += (targetEnergy - energy) * Math.min(1, dt * 6);
    smoothLevel += (audioLevel - smoothLevel) * Math.min(1, dt * 14);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) * 0.44;
    const breath = Math.sin(t * (state === "idle" ? 1.4 : 2.6)) * 0.5 + 0.5;

    ctx.globalCompositeOperation = "source-over";
    drawAuraDisc(cx, cy, R, breath, t);
    ctx.restore();

    raf = requestAnimationFrame(render);
  }

  raf = requestAnimationFrame(render);

  return {
    setOrbState,
    setAudioLevel,
    setSkin,
    setPalette,
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
    },
  };
}
