/**
 * React Bits Aurora, as slow-drifting light instead of a WebGL shader so it
 * costs nothing on a phone. Purely decorative.
 */
export default function Aurora({ className = "", intensity = 1 }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        className="absolute -top-[28rem] left-1/2 h-[46rem] w-[46rem] -translate-x-1/2 rounded-full blur-[130px] animate-drift"
        style={{
          background: `radial-gradient(circle, rgba(124,58,237,${0.34 * intensity}) 0%, rgba(109,40,217,${0.14 * intensity}) 45%, transparent 70%)`,
        }}
      />
      <div
        className="absolute -left-40 top-40 h-[32rem] w-[32rem] rounded-full blur-[120px] animate-drift"
        style={{
          animationDelay: "-7s",
          background: `radial-gradient(circle, rgba(139,92,246,${0.2 * intensity}) 0%, transparent 68%)`,
        }}
      />
      <div
        className="absolute -right-48 top-24 h-[34rem] w-[34rem] rounded-full blur-[130px] animate-drift"
        style={{
          animationDelay: "-14s",
          background: `radial-gradient(circle, rgba(91,33,182,${0.24 * intensity}) 0%, transparent 68%)`,
        }}
      />
    </div>
  );
}
