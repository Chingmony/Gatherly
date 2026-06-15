"use client";

import * as React from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  titleId: string;
  children: React.ReactNode;
}

/**
 * Minimal accessible modal (docs/05 §7a/§9): role="dialog", aria-modal, labelled by its title,
 * Esc + backdrop to close, initial focus + a lightweight Tab focus-trap, and focus restored to
 * the trigger on close.
 */
export function Dialog({ open, onClose, titleId, children }: DialogProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const restoreTo = React.useRef<HTMLElement | null>(null);

  // Keep the latest onClose in a ref so the focus/listener effect below can depend
  // on `open` ALONE. Depending on `onClose` (usually a fresh inline arrow each render)
  // would re-run this effect on every keystroke and steal focus back to the first field.
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  });

  React.useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    focusables()[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key === "Tab") {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      restoreTo.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--overlay)]" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-[var(--r)] border border-[var(--bo)] bg-[var(--ca)] p-5 shadow-[var(--sh2)]"
      >
        {children}
      </div>
    </div>
  );
}
