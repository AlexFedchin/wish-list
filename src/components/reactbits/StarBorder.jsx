/**
 * React Bits — StarBorder.
 * A light travels around the edge of the element.
 */
export default function StarBorder({ children, className = "", speed = "5s", as: Tag = "div" }) {
  return (
    <Tag className={`relative inline-block overflow-hidden rounded-full p-px ${className}`}>
      <span
        aria-hidden="true"
        className="absolute inset-[-200%] animate-spin-slow"
        style={{
          animationDuration: speed,
          background:
            "conic-gradient(from 0deg, transparent 0%, transparent 62%, #8b5cf6 82%, #c4b5fd 92%, transparent 100%)",
        }}
      />
      <span className="relative flex items-center rounded-full bg-ink-900">{children}</span>
    </Tag>
  );
}
