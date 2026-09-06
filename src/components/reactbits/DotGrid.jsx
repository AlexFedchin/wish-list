import { useEffect, useRef } from "react";

/**
 * React Bits DotGrid.
 * An interactive dot field that reacts to the pointer and ripples on click.
 * Rewritten on requestAnimationFrame so it ships without an animation library.
 */
export default function DotGrid({
  gap = 26,
  dotSize = 1.6,
  baseColor = "#292621",
  activeColor = "#e79c31",
  proximity = 130,
  shockRadius = 220,
  className = "",
}) {
  const canvasRef = useRef(null);
  const pointer = useRef({ x: -9999, y: -9999 });
  const ripples = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dots = [];
    let frame;
    let width = 0;
    let height = 0;

    const parseColor = (hex) => {
      const value = hex.replace("#", "");
      return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
    };
    const base = parseColor(baseColor);
    const active = parseColor(activeColor);

    const build = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots = [];
      const cols = Math.ceil(width / gap) + 1;
      const rows = Math.ceil(height / gap) + 1;
      const offsetX = (width - (cols - 1) * gap) / 2;
      const offsetY = (height - (rows - 1) * gap) / 2;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          dots.push({
            x: offsetX + col * gap,
            y: offsetY + row * gap,
            dx: 0,
            dy: 0,
            vx: 0,
            vy: 0,
          });
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const now = performance.now();
      ripples.current = ripples.current.filter((r) => now - r.at < 700);

      for (const dot of dots) {
        const distX = pointer.current.x - dot.x;
        const distY = pointer.current.y - dot.y;
        const distance = Math.hypot(distX, distY);

        let intensity = 0;
        if (distance < proximity) {
          intensity = 1 - distance / proximity;
          // Nudge the dot away from the cursor; the spring below pulls it home.
          const push = intensity * 0.5;
          dot.vx -= (distX / (distance || 1)) * push;
          dot.vy -= (distY / (distance || 1)) * push;
        }

        for (const ripple of ripples.current) {
          const age = (now - ripple.at) / 700;
          const ring = age * shockRadius;
          const d = Math.hypot(ripple.x - dot.x, ripple.y - dot.y);
          if (Math.abs(d - ring) < 40) {
            const force = (1 - age) * 3;
            dot.vx += ((dot.x - ripple.x) / (d || 1)) * force;
            dot.vy += ((dot.y - ripple.y) / (d || 1)) * force;
            intensity = Math.max(intensity, 1 - age);
          }
        }

        // Critically damped return to the grid position.
        dot.vx += -dot.dx * 0.12;
        dot.vy += -dot.dy * 0.12;
        dot.vx *= 0.82;
        dot.vy *= 0.82;
        dot.dx += dot.vx;
        dot.dy += dot.vy;

        const [r, g, b] = base.map((channel, i) =>
          Math.round(channel + (active[i] - channel) * intensity),
        );
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.arc(dot.x + dot.dx, dot.y + dot.dy, dotSize + intensity * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      frame = requestAnimationFrame(draw);
    };

    const onPointerMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const onPointerLeave = () => {
      pointer.current = { x: -9999, y: -9999 };
    };
    const onClick = (event) => {
      const rect = canvas.getBoundingClientRect();
      if (event.clientY < rect.top || event.clientY > rect.bottom) return;
      ripples.current.push({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        at: performance.now(),
      });
    };

    build();
    if (reduceMotion) {
      draw();
      cancelAnimationFrame(frame);
      // Draw a single static frame and stop.
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = baseColor;
      for (const dot of dots) {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    frame = requestAnimationFrame(draw);
    const observer = new ResizeObserver(build);
    observer.observe(canvas.parentElement);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("click", onClick);
    };
  }, [gap, dotSize, baseColor, activeColor, proximity, shockRadius]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
