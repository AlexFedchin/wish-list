export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-ink-700 bg-ink-900/40 px-6 py-16 text-center">
      {Icon && (
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-700 bg-ink-850 text-2xl text-brand-400 shadow-[0_0_30px_-10px_rgba(211,130,26,0.8)]">
          <Icon />
        </span>
      )}
      <h3 className="text-lg font-semibold text-ink-50">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-400">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
