import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { PiXBold } from "react-icons/pi";

/**
 * A bottom sheet on phones and a centred dialog from `sm` up — the sheet keeps
 * actions inside thumb reach, which is where most of this app gets used.
 */
export default function Modal({ open, onClose, title, description, children, footer }) {
  const panelRef = useRef(null);
  const dragControls = useDragControls();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;

      const focusable = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    const focusTimer = setTimeout(() => {
      const target = panelRef.current?.querySelector("[data-autofocus]");
      target?.focus();
    }, 60);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
      clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            drag="y"
            // Only the grabber starts a drag, so selecting text in a field
            // never drags the sheet away.
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 700) onClose();
            }}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98, transition: { duration: 0.18 } }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-ink-700 bg-ink-900 shadow-2xl shadow-black/80 sm:max-w-lg sm:rounded-3xl"
          >
            <div
              onPointerDown={(event) => dragControls.start(event)}
              className="flex shrink-0 cursor-grab touch-none justify-center pt-3 active:cursor-grabbing sm:hidden"
            >
              <span className="h-1 w-10 rounded-full bg-ink-650" />
            </div>

            <div className="flex items-start gap-4 px-5 pb-4 pt-4 sm:px-7 sm:pt-6">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-ink-50 sm:text-xl">{title}</h2>
                {description && (
                  <p className="mt-1 text-sm leading-relaxed text-ink-400">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
              >
                <PiXBold />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2 sm:px-7">{children}</div>

            {footer && (
              <div className="flex flex-col-reverse gap-2 border-t border-ink-800 px-5 pt-4 pb-safe sm:flex-row sm:justify-end sm:px-7 sm:pb-5">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
