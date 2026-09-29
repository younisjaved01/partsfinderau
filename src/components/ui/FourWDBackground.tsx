import { useEffect, useRef } from 'react';

/**
 * FourWDBackground — PARTS IQ's signature animated backdrop.
 *
 * A single lightweight Canvas 2D layer (no dependencies) that renders a subtle,
 * premium "4WD engineering meets modern technology" motion field BEHIND the UI:
 *
 *   Layer 1  Slow gradient drift ............ CSS transform (see .animate-drift)
 *   Layer 2  Topographic contour lines ...... canvas, depth-parallaxed
 *   Layer 3  Faint technical / route paths .. canvas, amber blueprint lines
 *   Layer 4  Drifting particles + traveller . canvas, points moving across terrain
 *   Layer 5  Soft glow around the hero/search canvas radial glow
 *
 * It is purely decorative: pointer-events:none, aria-hidden, and it sits behind
 * all interactive content. It respects prefers-reduced-motion (renders one
 * static frame), pauses when the tab is hidden, caps device-pixel-ratio, and
 * reacts briefly to a `partsiq:pulse` window event (dispatched on search).
 *
 * ── TUNING ────────────────────────────────────────────────────────────────
 * Adjust everything from the CONFIG block below:
 *   • speed      → driftSpeed (contours/particles), routeSpeed, glow pulse decay
 *   • intensity  → contours / particles counts per profile
 *   • opacity    → lineAlpha, routeAlpha, glow, and `baseOpacity` on the root
 *   • parallax   → parallax (px of mouse-driven shift)
 * Nothing else in the app needs to change.
 */

export type BgIntensity = 'hero' | 'ambient';

const CONFIG = {
  // Per-intensity profiles. `hero` is used on the Find Parts screen.
  hero: { contours: 10, particles: 26, driftSpeed: 0.65, routeSpeed: 0.9, glow: 0.12, lineAlpha: 0.14, routeAlpha: 0.11, parallax: 26 },
  ambient: { contours: 7, particles: 14, driftSpeed: 0.42, routeSpeed: 0.6, glow: 0.06, lineAlpha: 0.1, routeAlpha: 0.07, parallax: 15 },
  // Brand colours (RGB triplets) used at low alpha over the charcoal base.
  colors: { sand: '204,184,142', olive: '150,155,105', amber: '207,115,32' },
  maxDPR: 2, // cap for retina — keeps fill-rate sane on 4K / mobile
  pulseDecay: 0.955, // how quickly a search "pulse" fades (higher = slower)
} as const;

const rgba = (rgb: string, a: number) => `rgba(${rgb},${a})`;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  c: string;
}

export function FourWDBackground({
  intensity = 'ambient',
  className = '',
}: {
  intensity?: BgIntensity;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const cfg = CONFIG[intensity];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let raf = 0;
    let t = 0; // virtual clock (seconds), only advances while visible
    let last = performance.now();
    let pulse = 0;

    // Eased mouse position (-0.5..0.5) for parallax.
    const mouse = { tx: 0, ty: 0, x: 0, y: 0 };
    let particles: Particle[] = [];

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDPR);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedParticles();
    };

    const seedParticles = () => {
      const pcs = CONFIG.colors;
      const palette = [pcs.sand, pcs.amber, pcs.olive];
      particles = Array.from({ length: cfg.particles }, (_, i) => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: 6 + Math.random() * 10, // px/s, drifting east
        vy: -3 - Math.random() * 4, // slight north drift
        r: 0.6 + Math.random() * 1.4,
        c: palette[i % palette.length],
      }));
    };

    // A gentle terrain/route curve sampled at x.
    const wave = (x: number, baseY: number, amp: number, phase: number) =>
      baseY +
      Math.sin(x * 0.0062 + phase) * amp +
      Math.sin(x * 0.0135 + phase * 1.7) * amp * 0.4;

    const drawContours = () => {
      const ox = mouse.x * cfg.parallax;
      const oy = mouse.y * cfg.parallax * 0.5;
      for (let i = 0; i < cfg.contours; i++) {
        const depth = cfg.contours > 1 ? i / (cfg.contours - 1) : 1; // 0 back → 1 front
        const baseY = ((i + 0.5) / cfg.contours) * H + Math.sin(t * 0.05 + i) * 6;
        const amp = 8 + depth * 20;
        const phase = t * (0.12 + depth * 0.4) * cfg.driftSpeed + i * 0.7;
        const alpha = cfg.lineAlpha * (0.45 + 0.55 * depth);
        const px = ox * (0.3 + 0.7 * depth);
        const py = oy * depth;
        ctx.beginPath();
        for (let x = -20; x <= W + 20; x += 16) {
          const y = wave(x - px, baseY, amp, phase) + py;
          if (x === -20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = rgba(depth > 0.6 ? CONFIG.colors.sand : CONFIG.colors.olive, alpha);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const routes = [
      { baseYf: 0.34, amp: 34, speed: 0.7, phase: 0 },
      { baseYf: 0.72, amp: 46, speed: 0.5, phase: 2.2 },
    ];

    const drawRoutes = () => {
      const ox = mouse.x * cfg.parallax * 1.2;
      ctx.setLineDash([2, 10]);
      routes.forEach((rt, idx) => {
        if (intensity === 'ambient' && idx > 0) return; // one route when ambient
        const baseY = rt.baseYf * H;
        const phase = t * rt.speed * cfg.routeSpeed * 0.2 + rt.phase;
        ctx.beginPath();
        for (let x = -20; x <= W + 20; x += 18) {
          const y = wave(x - ox, baseY, rt.amp, phase);
          if (x === -20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = rgba(CONFIG.colors.amber, cfg.routeAlpha);
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Traveller — an abstract 4WD moving along the route.
        const s = ((t * rt.speed * cfg.routeSpeed * 0.03 + idx * 0.5) % 1 + 1) % 1;
        const tx = s * (W + 40) - 20;
        const ty = wave(tx - ox, baseY, rt.amp, phase);
        const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, 14);
        g.addColorStop(0, rgba(CONFIG.colors.amber, 0.5 + pulse * 0.3));
        g.addColorStop(1, rgba(CONFIG.colors.amber, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(tx, ty, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rgba(CONFIG.colors.amber, 0.8);
        ctx.beginPath();
        ctx.arc(tx, ty, 1.6, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.setLineDash([]);
    };

    const drawParticles = (dt: number) => {
      const boost = 1 + pulse * 1.6;
      const ox = mouse.x * cfg.parallax * 0.6;
      const oy = mouse.y * cfg.parallax * 0.6;
      for (const p of particles) {
        p.x += p.vx * dt * boost;
        p.y += p.vy * dt * boost;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.x < -10) p.x = W + 10;
        ctx.fillStyle = rgba(p.c, 0.5);
        ctx.beginPath();
        ctx.arc(p.x + ox, p.y + oy, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawGlow = () => {
      const cx = W * 0.5;
      const cy = H * (intensity === 'hero' ? 0.3 : 0.22);
      const radius = Math.max(W, H) * (intensity === 'hero' ? 0.5 : 0.42);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      const a = cfg.glow + pulse * 0.12;
      g.addColorStop(0, rgba(CONFIG.colors.amber, a));
      g.addColorStop(1, rgba(CONFIG.colors.amber, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Search pulse — an expanding ring, only while decaying.
      if (pulse > 0.02) {
        const rr = (1 - pulse) * radius * 0.9;
        ctx.strokeStyle = rgba(CONFIG.colors.amber, pulse * 0.22);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); // clamp after tab-away
      last = now;
      t += dt;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      pulse *= CONFIG.pulseDecay;

      ctx.clearRect(0, 0, W, H);
      drawGlow();
      drawContours();
      drawRoutes();
      drawParticles(dt);

      raf = requestAnimationFrame(frame);
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, W, H);
      drawGlow();
      drawContours();
      drawRoutes();
      for (const p of particles) {
        ctx.fillStyle = rgba(p.c, 0.4);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // ── Listeners ────────────────────────────────────────────────
    const onPointer = (e: PointerEvent) => {
      mouse.tx = e.clientX / W - 0.5;
      mouse.ty = e.clientY / H - 0.5;
    };
    const onPulse = () => {
      pulse = 1;
    };
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!reduce && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const onResize = () => {
      resize();
      if (reduce) drawStatic();
    };

    resize();
    if (reduce) {
      drawStatic();
    } else {
      window.addEventListener('pointermove', onPointer, { passive: true });
      window.addEventListener('partsiq:pulse', onPulse);
      document.addEventListener('visibilitychange', onVisibility);
      raf = requestAnimationFrame(frame);
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('partsiq:pulse', onPulse);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
    };
  }, [intensity]);

  return (
    <div className={`pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      {/* Layer 1 — slow gradient drift (GPU transform, CSS keyframes). */}
      <div
        className="absolute inset-0 animate-drift opacity-90"
        style={{
          background:
            'radial-gradient(60% 55% at 22% 18%, rgba(207,115,32,0.10), transparent 60%),' +
            'radial-gradient(55% 60% at 82% 8%, rgba(150,155,105,0.08), transparent 62%),' +
            'radial-gradient(70% 70% at 60% 100%, rgba(204,184,142,0.05), transparent 65%)',
        }}
      />
      {/* Layers 2–5 — canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
