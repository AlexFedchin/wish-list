import { Link } from "react-router-dom";

/**
 * The wordmark carries the whole identity, so it is set rather than boxed: a
 * light "wish" leaning on a heavier "stand", with the accent rule as the base
 * the name is named after.
 */
export default function Logo({ to = "/", className = "" }) {
  return (
    <Link
      to={to}
      aria-label="Wishstand home"
      className={`group inline-flex items-baseline text-[1.125rem] leading-none tracking-[-0.035em] ${className}`}
    >
      <span className="font-light text-ink-300 transition-colors duration-300 group-hover:text-ink-100">
        wish
      </span>
      <span className="relative font-semibold text-ink-50">
        stand
        <span
          aria-hidden="true"
          className="absolute -bottom-1.5 left-0 h-[2px] w-full bg-brand-500 transition-colors duration-300 group-hover:bg-brand-300"
        />
      </span>
    </Link>
  );
}
