import { forwardRef, useId } from "react";

const CONTROL =
  "w-full rounded-xl border border-ink-700 bg-ink-900/80 px-4 text-ink-50 placeholder:text-ink-400 transition-colors duration-200 hover:border-ink-650 focus:border-brand-600 focus:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-brand-600/15 disabled:opacity-50";

function Label({ htmlFor, children, hint }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-200">
        {children}
      </label>
      {hint && <span className="text-xs text-ink-400">{hint}</span>}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { label, hint, error, className = "", id, ...rest },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={fieldId} hint={hint}>
          {label}
        </Label>
      )}
      {/* 16px minimum keeps iOS Safari from zooming the viewport on focus. */}
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={`${CONTROL} h-12 text-base ${error ? "border-red-500/60" : ""}`}
        {...rest}
      />
      {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, hint, error, className = "", rows = 3, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={fieldId} hint={hint}>
          {label}
        </Label>
      )}
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={`${CONTROL} resize-none py-3 text-base leading-relaxed ${error ? "border-red-500/60" : ""}`}
        {...rest}
      />
      {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
    </div>
  );
});
