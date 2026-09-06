import { useEffect, useRef } from "react";

/**
 * React Bits ClickSpark.
 * Fires a small burst of lines wherever the page is tapped.
 */
export default function ClickSpark({
  color = "#f2b75c",
  count = 8,
  length = 14,
  duration = 420,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let sparks = [];
    let frame = null;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // easeOutCubic keeps the burst snappy at the start and soft at the end.
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const render = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      sparks = sparks.filter((spark) => now - spark.at < duration);

      for (const spark of sparks) {
        const progress = ease((now - spark.at) / duration);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 1 - progress;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count + spark.rotation;
          const start = 6 + progress * length * 1.6;
          const end = start + length * (1 - progress);
          ctx.beginPath();
          ctx.moveTo(spark.x + Math.cos(angle) * start, spark.y + Math.sin(angle) * start);
          ctx.lineTo(spark.x + Math.cos(angle) * end, spark.y + Math.sin(angle) * end);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      frame = sparks.length ? requestAnimationFrame(render) : null;
    };

    const onClick = (event) => {
      sparks.push({
        x: event.clientX,
        y: event.clientY,
        at: performance.now(),
        rotation: Math.random() * Math.PI,
      });
      if (!frame) frame = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", onClick);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onClick);
    };
  }, [color, count, length, duration]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[200]"
    />
  );
}
