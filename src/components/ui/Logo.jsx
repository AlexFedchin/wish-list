import { Link } from "react-router-dom";
import { PiGiftFill } from "react-icons/pi";

export default function Logo({ to = "/", className = "" }) {
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-2.5 text-ink-50 transition-opacity hover:opacity-90 ${className}`}
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-brand-600/40 bg-brand-600/15 text-brand-300 shadow-[0_0_22px_-6px_rgba(124,58,237,0.9)]">
        <PiGiftFill className="text-lg" />
      </span>
      <span className="text-[1.0625rem] font-semibold tracking-tight">Wishly</span>
    </Link>
  );
}
