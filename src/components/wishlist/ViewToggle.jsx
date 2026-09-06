import { PiRowsBold, PiSquaresFourBold } from "react-icons/pi";

const OPTIONS = [
  { value: "grid", label: "Card view", Icon: PiSquaresFourBold },
  { value: "list", label: "List view", Icon: PiRowsBold },
];

export default function ViewToggle({ view, onChange }) {
  return (
    <div
      role="group"
      aria-label="Layout"
      className="inline-flex shrink-0 rounded-xl border border-ink-700 bg-ink-900/70 p-1"
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-label={label}
          aria-pressed={view === value}
          className={`flex h-9 w-10 items-center justify-center rounded-lg text-base transition-colors ${
            view === value
              ? "bg-ink-750 text-brand-300 shadow-[inset_0_0_0_1px_rgba(211,130,26,0.35)]"
              : "text-ink-400 hover:text-ink-100"
          }`}
        >
          <Icon />
        </button>
      ))}
    </div>
  );
}
