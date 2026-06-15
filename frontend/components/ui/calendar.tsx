"use client";

import * as React from "react";
import { DayPicker, type DayButtonProps, type ChevronProps } from "react-day-picker";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

/* shadcn/ui Calendar — react-day-picker styled with Gatherly tokens. Day state (selected/today/
 * outside/disabled) is rendered through a custom DayButton so utility precedence is deterministic
 * via `cn`; the navigation chevrons use lucide icons. */

/** Replaces RDP's default chevron with a lucide icon (default size 24 → 16). */
function CalendarChevron({ orientation, className, size = 16, disabled }: ChevronProps) {
  const Icon =
    orientation === "left" ? ChevronLeft : orientation === "right" ? ChevronRight : orientation === "up" ? ChevronUp : ChevronDown;
  return <Icon size={size} aria-hidden className={cn(disabled && "opacity-40", className)} />;
}

/** Day cell button — mirrors RDP's default focus-on-`focused` effect so keyboard nav still moves
 * focus, then applies token styling per modifier. */
function CalendarDayButton({ day: _day, modifiers, className, ...props }: DayButtonProps) {
  void _day; // `day` is a CalendarDay object — destructured out so it isn't spread onto the <button>.
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-[var(--rs)] text-[13px] text-[var(--t1)] transition-colors",
        "hover:bg-[var(--sidebar-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ac)]",
        modifiers.outside && "text-[var(--t3)]",
        modifiers.today && !modifiers.selected && "font-bold text-[var(--ac)]",
        modifiers.selected && "bg-[var(--ac)] font-bold text-white hover:bg-[var(--ac)]",
        modifiers.disabled && "pointer-events-none opacity-40",
        className,
      )}
      {...props}
    />
  );
}

const navButton =
  "grid h-7 w-7 place-items-center rounded-[var(--rs)] text-[var(--t2)] transition-colors hover:bg-[var(--sidebar-hover)] hover:text-[var(--t1)] disabled:pointer-events-none disabled:opacity-40";

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      fixedWeeks
      className={cn("select-none", className)}
      classNames={{
        root: "relative",
        months: "relative",
        month: "space-y-2",
        month_caption: "relative flex h-8 items-center justify-center",
        caption_label: "text-[13px] font-bold text-[var(--t1)]",
        nav: "absolute inset-x-0 top-0 flex h-8 items-center justify-between",
        button_previous: navButton,
        button_next: navButton,
        month_grid: "w-full border-collapse",
        weekdays: "",
        weekday: "h-7 w-8 p-0 text-[11px] font-semibold uppercase text-[var(--t3)]",
        week: "",
        day: "h-8 w-8 p-0 text-center align-middle",
        ...classNames,
      }}
      components={{ Chevron: CalendarChevron, DayButton: CalendarDayButton }}
      {...props}
    />
  );
}
