/**
 * NeuroAI Initiative — motif animation
 *
 * Nodes begin in loose organic clusters (biological / neural),
 * then slowly converge into a precise regular grid (computational / digital),
 * then dissolve back. The oscillation is the metaphor: neuro ↔ AI.
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
  const CYCLE_MS    = 36000;             // organic → grid → organic cycle (36s)
  const DOT_RADIUS  = 1.5;
  const DOT_ALPHA   = 0.3;
  const LINE_ALPHA  = 0.16;
  const DIST_THRESH = 0.19;
  const DRIFT_SPEED = 0.00010;
  const CREAM       = '248, 243, 230';

  // Organic-mode cluster centers. Particles are seeded near one
  // of these, producing clearly biological groupings before alignment.
  const CLUSTERS = [
    { cx: 0.28, cy: 0.38 },
    { cx: 0.72, cy: 0.28 },
    { cx: 0.52, cy: 0.72 },
  ];

  // ── Helpers ──────────────────────────────────────────────────
  function rand()            { return Math.random(); }
  function lerp(a, b, t)    { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  // ── Particle ─────────────────────────────────────────────────
  class Particle {
    constructor(index) {
      const col = index % COLS;
      const row = Math.floor(index / COLS);

      // Precise grid position (normalized 0–1)
      this.gx = (col + 1) / (COLS + 1);
      this.gy = (row + 1) / (ROWS + 1);

      // Organic starting position: cluster-biased scatter
      const cluster = CLUSTERS[index % CLUSTERS.length];
      const spread  = 0.28 + rand() * 0.14;
      this.ox = clamp(cluster.cx + (rand() - 0.5) * spread, 0.04, 0.96);
      this.oy = clamp(cluster.cy + (rand() - 0.5) * spread, 0.04, 0.96);

      // Slow drift velocity in organic state
      this.vx = (rand() - 0.5) * DRIFT_SPEED;
      this.vy = (rand() - 0.5) * DRIFT_SPEED;

      // Per-particle opacity for depth variation
      this.alpha = 0.55 + rand() * 0.45;

      // Current rendered position
      this.x = this.ox;
      this.y = this.oy;
    }

    update(morphT) {
      // Drift organic anchor
      this.ox += this.vx;
      this.oy += this.vy;
      if (this.ox < 0.04 || this.ox > 0.96) this.vx *= -1;
      if (this.oy < 0.04 || this.oy > 0.96) this.vy *= -1;

      // Interpolate: organic ↔ grid
      this.x = lerp(this.ox, this.gx, morphT);
      this.y = lerp(this.oy, this.gy, morphT);
    }
  }

  // ── State ────────────────────────────────────────────────────
  let W, H;
  let needsResize = true;
  let startTime   = null;
  const particles = Array.from({ length: N }, (_, i) => new Particle(i));

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    needsResize = false;
  }

  // ── Render loop ──────────────────────────────────────────────
  function frame(ts) {
    requestAnimationFrame(frame);
    if (needsResize) resize();
    if (!W || !H) return;
    if (!startTime) startTime = ts;

    const elapsed = ts - startTime;
    const phase   = (elapsed % CYCLE_MS) / CYCLE_MS;
    const sine    = (Math.sin(phase * Math.PI * 2 - Math.PI / 2) + 1) / 2;
    const morphT  = easeInOut(sine);

    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => p.update(morphT));

    // Connections
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const pi = particles[i], pj = particles[j];
        const dx = pi.x - pj.x;
        const dy = (pi.y - pj.y) * (W / H);
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

    // Nodes
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${CREAM}, ${DOT_ALPHA * p.alpha})`;
      ctx.fill();
    });
  }

  // ── Boot ─────────────────────────────────────────────────────
  window.addEventListener('resize', () => { needsResize = true; });
  resize();
  requestAnimationFrame(frame);
})();
