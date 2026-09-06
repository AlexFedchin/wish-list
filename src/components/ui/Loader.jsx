import { PiCircleNotchBold } from "react-icons/pi";

export function Loader({ label = "Loading" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-400">
      <PiCircleNotchBold className="animate-spin text-2xl text-brand-500" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-card border border-ink-800 bg-ink-850/50 p-5">
      <div className="h-4 w-1/2 rounded bg-ink-700" />
      <div className="mt-3 h-3 w-full rounded bg-ink-800" />
      <div className="mt-2 h-3 w-2/3 rounded bg-ink-800" />
    </div>
  );
}
