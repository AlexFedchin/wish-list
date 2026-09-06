import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PiCheckCircleFill, PiInfoFill, PiWarningCircleFill } from "react-icons/pi";

const ToastContext = createContext(null);

const ICONS = {
  success: PiCheckCircleFill,
  error: PiWarningCircleFill,
  info: PiInfoFill,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const push = useCallback(
    (message, tone = "info") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((current) => [...current.slice(-2), { id, message, tone }]);
      timers.current.set(id, setTimeout(() => dismiss(id), 4000));
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      toast: push,
      success: (message) => push(message, "success"),
      error: (message) => push(message, "error"),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Top on mobile so it never collides with the thumb zone / FAB. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:bottom-6 sm:top-auto sm:items-end sm:px-6">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.tone] ?? PiInfoFill;
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                onClick={() => dismiss(toast.id)}
                className="pointer-events-auto flex w-full max-w-sm cursor-pointer items-start gap-3 rounded-2xl border border-ink-700 bg-ink-850/95 px-4 py-3 text-sm text-ink-100 shadow-2xl shadow-black/60 backdrop-blur-xl"
              >
                <Icon
                  className={`mt-px shrink-0 text-lg ${
                    toast.tone === "error" ? "text-red-400" : "text-brand-400"
                  }`}
                />
                <span className="leading-snug">{toast.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
