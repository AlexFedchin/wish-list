import { useRef } from "react";

/**
 * React Bits SpotlightCard.
 * A soft highlight follows the cursor across the card surface.
 *
 * `innerClassName` reaches the wrapper that sits above the highlight, so a card
 * can lay its own children out (a flex column, say) without losing the effect.
 */
export default function SpotlightCard({
  children,
  className = "",
  innerClassName = "",
  spotlightColor = "rgba(139, 92, 246, 0.18)",
  as: Tag = "div",
  ...rest
}) {
  const ref = useRef(null);

  const handleMove = (event) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    node.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
    node.style.setProperty("--spot-opacity", "1");
  };

  const handleLeave = () => {
    ref.current?.style.setProperty("--spot-opacity", "0");
  };

  return (
    <Tag
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`group relative overflow-hidden rounded-card border border-ink-700 bg-ink-850/70 transition-colors duration-300 hover:border-ink-650 ${className}`}
      {...rest}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--spot-opacity,0)] transition-opacity duration-500"
        style={{
          background: `radial-gradient(340px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${spotlightColor}, transparent 70%)`,
        }}
      />
      <div className={`relative ${innerClassName}`}>{children}</div>
    </Tag>
  );
}
