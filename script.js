/**
 * NeuroAI Initiative — motif animation
 *
 * A single field of dots organized into four local regimes
 * that drift, overlap, and exchange structure over time:
 *
 *   neural       — clustered, burst-like, locally dense
 *   physiological — rhythmic, wave-like, oscillatory
 *   behavioral   — path-traced, slow curved trajectories
 *   computational — rectilinear, aligned, lattice-like
 *
 * As the regime centers drift, particles come under mixed
 * influence and interpolate between behaviors — expressing
 * multimodal data coming into relation.
 */
(function () {
  'use strict';

  const canvas = document.getElementById('motif-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const CREAM        = '248, 243, 230';
  const DOT_R        = 1.6;
  const DOT_ALPHA    = 0.34;
  const LINE_ALPHA   = 0.20;
  const LINE_DIST    = 0.17;   // normalized connection threshold
  const LERP         = 0.006;  // how fast particles track their target
  const ZONE_RADIUS  = 0.52;   // influence radius per regime zone

  const isMobile = () => window.innerWidth < 600;
  const N_DESKTOP = 58;
  const N_MOBILE  = 28;

  // ── Zone definitions ─────────────────────────────────────────
  // Each zone has a center that drifts slowly around the canvas.
  const zones = [
    { x: 0.22, y: 0.30, vx:  0.000075, vy:  0.000050, type: 'neural'  },
    { x: 0.75, y: 0.22, vx: -0.000055, vy:  0.000080, type: 'physio'  },
    { x: 0.24, y: 0.76, vx:  0.000065, vy: -0.000060, type: 'behav'   },
    { x: 0.78, y: 0.74, vx: -0.000050, vy: -0.000055, type: 'comp'    },
  ];

  // Neural sub-clusters — local density centers within the neural zone
  const NEURAL_CLUSTERS = [
    { x: 0.14, y: 0.22 },
    { x: 0.28, y: 0.16 },
    { x: 0.18, y: 0.38 },
    { x: 0.32, y: 0.32 },
  ];

  // Computational grid dims
  const COMP_COLS = 7;
  const COMP_ROWS = 6;

  // ── Helpers ──────────────────────────────────────────────────
  const rand   = ()           => Math.random();
  const clamp  = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const lerp   = (a, b, t)   => a + (b - a) * t;
  const dist2  = (ax, ay, bx, by) => {
    const dx = ax - bx, dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // ── Particle ─────────────────────────────────────────────────
  class Particle {
    constructor(i, n) {
      this.i = i;

      // Starting position — evenly spread with jitter
      this.ox = 0.05 + rand() * 0.90;
      this.oy = 0.05 + rand() * 0.90;
      this.x  = this.ox;
      this.y  = this.oy;

      // Organic drift velocity (fallback when no zone dominates)
      this.vx = (rand() - 0.5) * 0.000095;
      this.vy = (rand() - 0.5) * 0.000095;

      // Neural: cluster assignment + local offset
      this.nCluster  = Math.floor(rand() * NEURAL_CLUSTERS.length);
      this.nOffX     = (rand() - 0.5) * 0.13;
      this.nOffY     = (rand() - 0.5) * 0.13;

      // Physiological: phase along traveling wave
      // Spread particles evenly so the wave is legible
      this.pPhase    = (i / n) * Math.PI * 2;
      this.pBaseX    = 0.56 + (i / n) * 0.36;

      // Behavioral: path phase + which of 3 slow curves
      this.bPhase    = rand() * Math.PI * 2;
      this.bPath     = i % 3;

      // Computational: assigned grid cell
      const col      = Math.floor(rand() * COMP_COLS);
      const row      = Math.floor(rand() * COMP_ROWS);
      this.cGX       = (col + 1) / (COMP_COLS + 1);
      this.cGY       = (row + 1) / (COMP_ROWS + 1);

      // Per-particle opacity variation
      this.aScale    = 0.55 + rand() * 0.45;
    }

    // Return the regime-specific target position for a given zone + time
    regimeTarget(zone, t) {
      switch (zone.type) {

        case 'neural': {
          // Cluster with slight organic pulse
          const c    = NEURAL_CLUSTERS[this.nCluster];
          const pulse = 0.018 * Math.sin(t * 0.0009 + this.nCluster * 1.3);
          return {
            x: clamp(c.x + this.nOffX + pulse,       0.03, 0.97),
            y: clamp(c.y + this.nOffY + pulse * 0.8, 0.03, 0.97),
          };
        }

        case 'physio': {
          // Traveling wave — rhythmic, oscillatory band
          const amp  = 0.10;
          const freq = 4.5;
          const speed = 0.00075;
          const wy   = 0.26 + amp * Math.sin(this.pBaseX * freq + t * speed + this.pPhase);
          return {
            x: clamp(this.pBaseX,  0.04, 0.96),
            y: clamp(wy,           0.04, 0.96),
          };
        }

        case 'behav': {
          // Each particle traces a slow, slightly different curved path
          // Three path families with different Lissajous-ish shapes
          const ts = t * 0.00032;
          let bx, by;
          if (this.bPath === 0) {
            bx = 0.20 + 0.12 * Math.cos(ts + this.bPhase);
            by = 0.76 + 0.14 * Math.sin(ts * 1.4 + this.bPhase);
          } else if (this.bPath === 1) {
            bx = 0.28 + 0.10 * Math.cos(ts * 1.2 + this.bPhase);
            by = 0.68 + 0.16 * Math.sin(ts * 0.9 + this.bPhase + 1.0);
          } else {
            bx = 0.24 + 0.13 * Math.cos(ts * 0.8 + this.bPhase + 2.1);
            by = 0.80 + 0.11 * Math.sin(ts * 1.6 + this.bPhase);
          }
          return {
            x: clamp(bx, 0.04, 0.96),
            y: clamp(by, 0.04, 0.96),
          };
        }

        case 'comp': {
          // Precise grid alignment
          return { x: this.cGX, y: this.cGY };
        }

        default:
          return { x: this.ox, y: this.oy };
      }
    }

    update(t) {
      // Drift organic anchor
      this.ox += this.vx;
      this.oy += this.vy;
      if (this.ox < 0.04 || this.ox > 0.96) this.vx *= -1;
      if (this.oy < 0.04 || this.oy > 0.96) this.vy *= -1;

      // Compute zone influence weights from organic position
      let totalW = 0;
      const weights = zones.map(z => {
        const d = dist2(this.ox, this.oy, z.x, z.y);
        const w = Math.max(0, 1 - d / ZONE_RADIUS);
        totalW += w;
        return w;
      });

      let tx, ty;
      if (totalW < 0.001) {
        // No zone influence — drift organically
        tx = this.ox;
        ty = this.oy;
      } else {
        tx = 0; ty = 0;
        zones.forEach((z, zi) => {
          const nw  = weights[zi] / totalW;
          const tgt = this.regimeTarget(z, t);
          tx += nw * tgt.x;
          ty += nw * tgt.y;
        });
      }

      // Smoothly approach blended target
      this.x += (tx - this.x) * LERP;
      this.y += (ty - this.y) * LERP;
    }
  }

  // ── State ────────────────────────────────────────────────────
  let W, H, needsResize = true;
  let startTime = null;
  let particles  = [];
  let mobile     = isMobile();

  function buildParticles() {
    const n = mobile ? N_MOBILE : N_DESKTOP;
    particles = Array.from({ length: n }, (_, i) => new Particle(i, n));
  }

  function resize() {
    const wasMobile = mobile;
    mobile = isMobile();
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    if (mobile !== wasMobile) buildParticles();
    needsResize = false;
  }

  // ── Render ───────────────────────────────────────────────────
  function frame(ts) {
    requestAnimationFrame(frame);
    if (needsResize) resize();
    if (!W || !H) return;
    if (!startTime) startTime = ts;
    const t = ts - startTime;

    // Drift zone centers
    zones.forEach(z => {
      z.x += z.vx;
      z.y += z.vy;
      if (z.x < 0.06 || z.x > 0.94) z.vx *= -1;
      if (z.y < 0.06 || z.y > 0.94) z.vy *= -1;
    });

    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => p.update(t));

    // Connections
    const N = particles.length;
    const aspect = W / H;
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const pi = particles[i], pj = particles[j];
        const dx  = pi.x - pj.x;
        const dy  = (pi.y - pj.y) * aspect;
        const d   = Math.sqrt(dx * dx + dy * dy);
        if (d >= LINE_DIST) continue;
        const str = (1 - d / LINE_DIST) * LINE_ALPHA;
        ctx.beginPath();
        ctx.moveTo(pi.x * W, pi.y * H);
        ctx.lineTo(pj.x * W, pj.y * H);
        ctx.strokeStyle = `rgba(${CREAM}, ${str})`;
        ctx.lineWidth   = 0.5;
        ctx.stroke();
      }
    }

    // Dots
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, DOT_R, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${CREAM}, ${DOT_ALPHA * p.aScale})`;
      ctx.fill();
    });
  }

  // ── Boot ─────────────────────────────────────────────────────
  window.addEventListener('resize', () => { needsResize = true; });
  buildParticles();
  resize();
  requestAnimationFrame(frame);
})();
