"use client";

import { cn } from "@/lib/cn";

interface SegmentOption {
  id: string;
  label: string;
}

interface SegmentedProps {
  options: SegmentOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Segmented({ options, value, onChange, className }: SegmentedProps) {
  return (
    <div
      className={cn("flex items-center gap-1 p-1 rounded-[var(--radius-md)]", className)}
      style={{ background: "var(--surface-3)" }}
      role="radiogroup"
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex-1 text-sm font-bold px-3 py-1.5 rounded-[var(--radius-sm)] transition-all duration-150 whitespace-nowrap",
              active
                ? "bg-[var(--surface)] shadow-[var(--shadow-sm)]"
                : "hover:bg-[var(--surface-2)]"
            )}
            style={{
              color: active ? "var(--text-strong)" : "var(--text-muted)",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font)",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
