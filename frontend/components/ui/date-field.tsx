"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface DateFieldProps {
  /** datetime-local string `YYYY-MM-DDTHH:mm` (or `YYYY-MM-DD` when withTime=false). "" = empty. */
  value: string;
  onChange: (value: string) => void;
  /** Include an hour:minute picker (default true). Emits a datetime-local string when true. */
  withTime?: boolean;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Parse a `YYYY-MM-DD[THH:mm]` string into a local Date, or null. */
function parse(value: string): Date | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h ?? 0), Number(mi ?? 0));
  return isNaN(date.getTime()) ? null : date;
}

function fmtValue(d: Date, withTime: boolean): string {
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return withTime ? `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}` : date;
}

function fmtLabel(d: Date, withTime: boolean): string {
  const date = d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  if (!withTime) return date;
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}

/**
 * Calendar date/time picker — a styled trigger that opens a shadcn Popover holding a react-day-picker
 * Calendar, replacing the native datetime-local input so it looks consistent across browsers and
 * themes. Drop-in for the existing datetime-local state: `value`/`onChange` use the same
 * `YYYY-MM-DDTHH:mm` string format.
 */
export function DateField({
  value,
  onChange,
  withTime = true,
  placeholder = withTime ? "Pick date & time" : "Pick a date",
  disabled,
  id,
  className,
  "aria-label": ariaLabel,
}: DateFieldProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date | undefined>(undefined);
  const selected = parse(value);

  function close() {
    setOpen(false);
  }

  function pickDay(day: Date | undefined) {
    if (!day) return;
    const today = new Date();
    const base = selected ?? new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0);
    const next = new Date(day.getFullYear(), day.getMonth(), day.getDate(), base.getHours(), base.getMinutes());
    onChange(fmtValue(next, withTime));
    if (!withTime) close();
  }

  function setTime(hh: number, mm: number) {
    const base = selected ?? new Date();
    const next = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hh, mm);
    onChange(fmtValue(next, true));
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (o) setMonth(parse(value) ?? new Date()); // re-sync the viewed month when opening
        setOpen(o);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-[var(--rs)] border border-[var(--bo)] bg-[var(--ca)] px-3.5 py-2.5 text-left text-[14px] transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ac)] focus-visible:border-[var(--ac)]",
            "disabled:cursor-not-allowed disabled:opacity-60",
            selected ? "text-[var(--t1)]" : "text-[var(--t3)]",
            className,
          )}
        >
          <span className="truncate">{selected ? fmtLabel(selected, withTime) : placeholder}</span>
          <CalendarDays size={16} aria-hidden className="shrink-0 text-[var(--t3)]" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto">
        <Calendar
          mode="single"
          selected={selected ?? undefined}
          onSelect={pickDay}
          month={month}
          onMonthChange={setMonth}
        />

        {withTime && (
          <div className="mt-3 flex items-center gap-2 border-t border-[var(--bo)] pt-3">
            <span className="text-[12px] font-semibold text-[var(--t2)]">Time</span>
            <input
              type="time"
              value={selected ? `${pad(selected.getHours())}:${pad(selected.getMinutes())}` : ""}
              onChange={(e) => {
                const [hh, mm] = e.target.value.split(":").map(Number);
                if (!isNaN(hh) && !isNaN(mm)) setTime(hh, mm);
              }}
              className="flex-1 rounded-[var(--rs)] border border-[var(--bo)] bg-[var(--ca)] px-2.5 py-1.5 text-[13px] text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ac)]"
            />
          </div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onChange("");
              close();
            }}
            className="text-[12.5px] font-semibold text-[var(--t2)] transition-colors hover:text-[var(--ac-2)]"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={close}
            className="rounded-[var(--rs)] bg-[var(--ac)] px-3 py-1.5 text-[12.5px] font-bold text-white transition-opacity hover:opacity-90"
          >
            Done
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
