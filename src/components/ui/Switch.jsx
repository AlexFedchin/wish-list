export default function Switch({ checked, onChange, label, description, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-4 rounded-xl p-1 text-left transition-opacity disabled:opacity-50"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] font-medium text-ink-100">{label}</span>
        {description && (
          <span className="mt-1 block text-sm leading-relaxed text-ink-400">{description}</span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full border transition-colors duration-300 ${
          checked
            ? "border-brand-500 bg-brand-600 shadow-[0_0_20px_-4px_rgba(124,58,237,0.85)]"
            : "border-ink-650 bg-ink-800"
        }`}
      >
        <span
          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white transition-all duration-300 ${
            checked ? "left-[calc(100%-1.375rem)]" : "left-0.5 bg-ink-400"
          }`}
        />
      </span>
    </button>
  );
}
