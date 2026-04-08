/**
 * NeuroAI Initiative — motif animation
 *
 * A field of nodes that slowly morphs between two states:
 *   organic  — loose, drifting clusters  (biological / neural)
 *   grid     — precise regular lattice   (computational / digital)
 *
 * The continuous oscillation between these two arrangements
 * is the visual metaphor: the exchange between neuro and AI.
 */
(function () {
  'use strict';

  const canvas = document.getElementById('motif-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // ── Configuration ────────────────────────────────────────────
  const COLS        = 8;
  const ROWS        = 7;
  const N           = COLS * ROWS;       // 56 nodes
  const CYCLE_MS    = 48000;             // one full organic→grid→organic cycle
  const DOT_RADIUS  = 1.1;              // px
  const DOT_ALPHA   = 0.18;
  const LINE_ALPHA  = 0.09;             // max connection opacity
  const DIST_THRESH = 0.18;             // normalized connection distance cutoff
  const DRIFT_SPEED = 0.00012;          // how fast organic positions wander
  const CREAM       = '245, 240, 227';  // rgb, matches --cream

  // ── Particle ─────────────────────────────────────────────────
  class Particle {
    constructor(index) {
      const col = index % COLS;
      const row = Math.floor(index / COLS);

      // Exact grid position, normalized 0-1
      this.gx = (col + 1) / (COLS + 1);
      this.gy = (row + 1) / (ROWS + 1);

      // Organic starting position: scatter from grid with seeded variation
      const scatter = 0.45;
      this.ox = clamp(this.gx + (rand() - 0.5) * scatter, 0.03, 0.97);
      this.oy = clamp(this.gy + (rand() - 0.5) * scatter, 0.03, 0.97);

      // Slow drift velocity
      this.vx = (rand() - 0.5) * DRIFT_SPEED;
      this.vy = (rand() - 0.5) * DRIFT_SPEED;

      // Per-particle opacity variation for depth
      this.opacityScale = 0.6 + rand() * 0.4;

      // Rendered position (updated each frame)
      this.x = this.ox;
      this.y = this.oy;
    }

    update(morphT) {
      // Drift the organic anchor slowly
      this.ox += this.vx;
      this.oy += this.vy;

      // Soft boundary reflection
      if (this.ox < 0.03 || this.ox > 0.97) this.vx *= -1;
      if (this.oy < 0.03 || this.oy > 0.97) this.vy *= -1;

      // Interpolate between organic and grid state
      this.x = lerp(this.ox, this.gx, morphT);
      this.y = lerp(this.oy, this.gy, morphT);
    }
  }

  // ── Utilities ────────────────────────────────────────────────
  function rand()           { return Math.random(); }
  function lerp(a, b, t)   { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  // Smooth ease in-out for the morphT oscillation
  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  // ── State ────────────────────────────────────────────────────
  let W, H;
  let needsResize = true;
  let startTime   = null;
  const particles = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    needsResize = false;
  }

  function init() {
    resize();
    for (let i = 0; i < N; i++) particles.push(new Particle(i));
  }

  // ── Render loop ──────────────────────────────────────────────
  function frame(ts) {
    requestAnimationFrame(frame);

    if (needsResize) resize();
    if (!startTime) startTime = ts;

    const elapsed = ts - startTime;

    // morphT: 0 = organic, 1 = grid, oscillates via sine
    const phase  = (elapsed % CYCLE_MS) / CYCLE_MS;         // 0 → 1
    const sine   = (Math.sin(phase * Math.PI * 2 - Math.PI / 2) + 1) / 2; // 0 → 1 → 0
    const morphT = easeInOut(sine);

    ctx.clearRect(0, 0, W, H);

    // Update all particles
    particles.forEach(p => p.update(morphT));

    // ── Draw connections ──────────────────────────────────────
    // Batch into a single path per opacity would be ideal,
    // but with N=56 (~120 live pairs) direct draw is fine.
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const pi = particles[i];
        const pj = particles[j];
        const dx = pi.x - pj.x;
        const dy = (pi.y - pj.y) * (W / H);  // correct for canvas aspect
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= DIST_THRESH) continue;

        const strength = (1 - dist / DIST_THRESH) * LINE_ALPHA;
        ctx.beginPath();
        ctx.moveTo(pi.x * W, pi.y * H);
        ctx.lineTo(pj.x * W, pj.y * H);
        ctx.strokeStyle = `rgba(${CREAM}, ${strength})`;
        ctx.lineWidth   = 0.5;
        ctx.stroke();
      }
    }

    // ── Draw nodes ────────────────────────────────────────────
    particles.forEach(p => {
      const alpha = DOT_ALPHA * p.opacityScale;
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${CREAM}, ${alpha})`;
      ctx.fill();
    });
  }

  // ── Boot ─────────────────────────────────────────────────────
  window.addEventListener('resize', () => { needsResize = true; });
  init();
  requestAnimationFrame(frame);
})();
