"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

/**
 * Tiny dependency-free toast. A module-level pub/sub store lets any component call
 * `toast.success(...)` without context plumbing; `<Toaster />` (mounted once in the app shell)
 * subscribes and renders the stack. Auto-dismisses after a few seconds.
 */
type ToastVariant = "success" | "error" | "info";
interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
}

let counter = 0;
const listeners = new Set<(items: ToastItem[]) => void>();
let items: ToastItem[] = [];

function emit() {
  for (const l of listeners) l(items);
}

function push(variant: ToastVariant, title: string, description?: string) {
  const id = ++counter;
  items = [...items, { id, variant, title, description }];
  emit();
  setTimeout(() => dismiss(id), 4000);
}

function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  success: (title: string, description?: string) => push("success", title, description),
  error: (title: string, description?: string) => push("error", title, description),
  info: (title: string, description?: string) => push("info", title, description),
};

const ICONS = {
  success: { Icon: CheckCircle2, color: "var(--green-600)", bg: "var(--green-soft)" },
  error: { Icon: XCircle, color: "var(--danger)", bg: "var(--danger-soft)" },
  info: { Icon: Info, color: "var(--primary-hex,#6366f1)", bg: "var(--primary-soft)" },
} as const;

export function Toaster() {
  const [list, setList] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setList);
    setList(items);
    return () => {
      listeners.delete(setList);
    };
  }, []);

  if (list.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2.5 w-[min(360px,calc(100vw-2rem))]">
      {list.map((t) => {
        const { Icon, color, bg } = ICONS[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            className="flex items-start gap-3 rounded-[var(--radius-lg)] border p-3.5 pr-2.5"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-hex,#ecedf4)",
              boxShadow: "var(--shadow-pop)",
              animation: "toastIn .22s cubic-bezier(.21,1.02,.73,1)",
            }}
          >
            <span
              className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
              style={{ background: bg, color }}
            >
              <Icon size={17} />
            </span>
            <div className="flex flex-col gap-0.5 flex-1 min-w-0 pt-0.5">
              <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
                {t.title}
              </span>
              {t.description && (
                <span className="text-[12.5px] leading-snug" style={{ color: "var(--text-muted)" }}>
                  {t.description}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)] flex-shrink-0 transition-colors hover:bg-[var(--surface-2)]"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
