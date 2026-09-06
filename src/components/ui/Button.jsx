import { forwardRef } from "react";
import { PiCircleNotchBold } from "react-icons/pi";

const VARIANTS = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700 shadow-[0_10px_30px_-12px_rgba(124,58,237,0.9)] hover:shadow-[0_14px_38px_-10px_rgba(124,58,237,1)]",
  secondary:
    "bg-ink-800 text-ink-100 border border-ink-650 hover:bg-ink-750 hover:border-ink-600 active:bg-ink-800",
  ghost: "text-ink-300 hover:text-ink-50 hover:bg-ink-800/80",
  outline:
    "border border-brand-600/50 text-brand-300 hover:bg-brand-600/10 hover:border-brand-500 active:bg-brand-600/20",
  danger:
    "bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50",
};

const SIZES = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-5 text-[0.9375rem] gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2 rounded-xl sm:h-13 sm:px-7",
  icon: "h-10 w-10 rounded-lg justify-center",
};

const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    loading = false,
    icon: Icon,
    className = "",
    disabled,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`inline-flex select-none items-center justify-center font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-45 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <PiCircleNotchBold className="animate-spin text-[1.15em]" aria-hidden="true" />
      ) : (
        Icon && <Icon className="text-[1.15em]" aria-hidden="true" />
      )}
      {children}
    </button>
  );
});

export default Button;
