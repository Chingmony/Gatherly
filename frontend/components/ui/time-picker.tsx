"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/cn";

const pad = (n: number) => String(n).padStart(2, "0");

/** Format a 24h `HH:mm` string as a 12-hour label like `9:00 AM`. */
function formatLabel(value: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!m) return "";
  const h = Number(m[1]);
  const min = m[2];
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${min} ${period}`;
}

export interface TimePickerProps {
  /** Selected time as 24-hour `HH:mm`, or "" when unset. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  /** Minute increment for the option list (default 15). */
  step?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * A self-contained, shadcn-styled time picker (no native browser clock). Presents a scrollable
 * list of times at a fixed `step`; keeps the same 24-hour `HH:mm` string contract as a plain
 * `<input type="time">` so it drops into existing forms.
 */
export function TimePicker({
  value,
  onChange,
  id,
  placeholder = "Pick a time",
  step = 15,
  disabled,
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const options = React.useMemo(() => {
    const out: string[] = [];
    for (let mins = 0; mins < 24 * 60; mins += step) {
      out.push(`${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`);
    }
    return out;
  }, [step]);

  // Close on outside click / Escape.
  React.useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Scroll the selected option into view when opening.
  React.useEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.querySelector<HTMLElement>("[data-active='true']");
    if (active) active.scrollIntoView({ block: "center" });
  }, [open]);

  const display = formatLabel(value);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--border-hex,#ecedf4)] bg-[var(--surface-2)] px-3.5 py-[11px] text-left text-sm text-[var(--text)] transition-all duration-150",
          "focus:outline-none focus:border-[var(--primary-hex,#6366f1)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_4px_var(--primary-ring)]",
          open && "border-[var(--primary-hex,#6366f1)] bg-[var(--surface)] shadow-[0_0_0_4px_var(--primary-ring)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <Clock size={15} style={{ color: "var(--text-faint)" }} className="shrink-0" />
        <span className={cn(!display && "text-[var(--text-faint)]")}>{display || placeholder}</span>
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-[180px] rounded-[var(--radius-lg,16px)] border border-[var(--border-hex,#ecedf4)] p-1.5"
          style={{ background: "var(--surface)", boxShadow: "var(--shadow-card)" }}
        >
          <div ref={listRef} className="flex max-h-[240px] flex-col gap-0.5 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  data-active={isSelected}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={cn(
                    "rounded-[var(--radius-sm,10px)] px-3 py-2 text-left text-[13px] font-semibold transition-colors",
                    !isSelected && "hover:bg-[var(--surface-3)]"
                  )}
                  style={
                    isSelected
                      ? { background: "var(--primary-hex,#6366f1)", color: "#fff" }
                      : { color: "var(--text)" }
                  }
                >
                  {formatLabel(opt)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
