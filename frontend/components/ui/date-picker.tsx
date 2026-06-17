"use client";

import * as React from "react";
import { Calendar as CalIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");

/** Parse a `YYYY-MM-DD` string into a local Date (no timezone shift), or null. */
function parseYMD(value?: string | null): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export interface DatePickerProps {
  /** Selected date as `YYYY-MM-DD`, or "" when unset. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * A self-contained, shadcn-styled date picker (no native browser calendar). Keeps the same
 * `YYYY-MM-DD` string contract as a plain `<input type="date">` so it drops into existing forms.
 */
export function DatePicker({
  value,
  onChange,
  id,
  placeholder = "Pick a date",
  disabled,
  className,
}: DatePickerProps) {
  const selected = React.useMemo(() => parseYMD(value), [value]);
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState(() => selected ?? new Date());
  const rootRef = React.useRef<HTMLDivElement>(null);

  // When opening (or the value changes), focus the view on the selected month.
  React.useEffect(() => {
    if (open) setView(selected ?? new Date());
  }, [open, selected]);

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

  const today = new Date();
  const year = view.getFullYear();
  const month = view.getMonth();

  // Build a 6-row grid: leading days from the previous month, this month, then trailing days.
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Date[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push(new Date(year, month, i - firstWeekday + 1));
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0 || cells.length < 42) cells.push(new Date(year, month, daysInMonth + (cells.length - firstWeekday - daysInMonth) + 1));

  const display = selected
    ? selected.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  const stepMonth = (delta: number) => setView(new Date(year, month + delta, 1));

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
        <CalIcon size={15} style={{ color: "var(--text-faint)" }} className="shrink-0" />
        <span className={cn(!display && "text-[var(--text-faint)]")}>{display || placeholder}</span>
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-[300px] rounded-[var(--radius-lg,16px)] border border-[var(--border-hex,#ecedf4)] p-3"
          style={{ background: "var(--surface)", boxShadow: "var(--shadow-card)" }}
        >
          {/* Month header */}
          <div className="mb-2 flex items-center justify-between">
            <span className="px-1 text-sm font-bold" style={{ color: "var(--text-strong)" }}>
              {MONTHS[month]} {year}
            </span>
            <div className="flex items-center gap-1">
              <NavBtn label="Previous month" onClick={() => stepMonth(-1)}>
                <ChevronLeft size={16} />
              </NavBtn>
              <NavBtn label="Next month" onClick={() => stepMonth(1)}>
                <ChevronRight size={16} />
              </NavBtn>
            </div>
          </div>

          {/* Weekday row */}
          <div className="grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="flex h-8 items-center justify-center text-[11px] font-bold uppercase"
                style={{ color: "var(--text-faint)" }}
              >
                {w}
              </div>
            ))}

            {cells.map((d, i) => {
              const inMonth = d.getMonth() === month;
              const isSelected = selected && sameDay(d, selected);
              const isToday = sameDay(d, today);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onChange(toYMD(d));
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-[var(--radius-sm,10px)] text-[13px] font-semibold transition-colors",
                    !isSelected && "hover:bg-[var(--surface-3)]"
                  )}
                  style={
                    isSelected
                      ? { background: "var(--primary-hex,#6366f1)", color: "#fff" }
                      : {
                          color: inMonth ? "var(--text)" : "var(--text-faint)",
                          ...(isToday ? { boxShadow: "inset 0 0 0 1.5px var(--primary-hex,#6366f1)" } : {}),
                        }
                  }
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="mt-2 flex items-center justify-between border-t pt-2" style={{ borderColor: "var(--border-hex,#ecedf4)" }}>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="rounded-md px-2 py-1 text-xs font-bold transition-colors hover:bg-[var(--surface-3)]"
              style={{ color: "var(--text-muted)" }}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(toYMD(today));
                setOpen(false);
              }}
              className="rounded-md px-2 py-1 text-xs font-bold transition-colors hover:bg-[var(--surface-3)]"
              style={{ color: "var(--primary-hex,#6366f1)" }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NavBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm,10px)] transition-colors hover:bg-[var(--surface-3)]"
      style={{ color: "var(--text-muted)" }}
    >
      {children}
    </button>
  );
}
