import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "accent" | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

/**
 * Status/role pill. Meaning is carried by the text label (and a dot) — never color alone
 * (docs/05 §9). Accent = active/elevated; neutral = inactive/draft.
 */
export function Badge({ variant = "neutral", className, children, ...props }: BadgeProps) {
  const accent = variant === "accent";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        className,
      )}
      style={
        accent
          ? { background: "var(--ad)", color: "var(--ac)" }
          : { background: "var(--pill-bg)", color: "var(--pill-text)" }
      }
      {...props}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: accent ? "var(--ac)" : "var(--pill-dot)" }}
      />
      {children}
    </span>
  );
}
