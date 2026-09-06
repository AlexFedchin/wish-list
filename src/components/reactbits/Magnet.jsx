import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * React Bits — Magnet.
 * Pulls its child toward the cursor while the cursor is nearby.
 * Disabled on touch pointers, where there is nothing to follow.
 */
export default function Magnet({ children, strength = 0.35, radius = 110, className = "" }) {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const onMove = (event) => {
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;

      if (Math.hypot(dx, dy) < radius + Math.max(rect.width, rect.height) / 2) {
        setOffset({ x: dx * strength, y: dy * strength });
      } else {
        setOffset((current) => (current.x === 0 && current.y === 0 ? current : { x: 0, y: 0 }));
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [strength, radius]);

  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className}`}
      animate={offset}
      transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
