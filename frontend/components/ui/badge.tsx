import * as React from "react";
import { cn } from "@/lib/utils";

// Design-handoff badge palette (.badge .b-*). Meaning is carried by the label + dot,
// never colour alone (docs/05 §9). `accent`/`neutral` are kept as M1 aliases.
type Variant =
  | "accent" | "neutral"
  | "primary" | "green" | "blue" | "orange" | "violet" | "pink" | "teal" | "danger" | "gray";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  dot?: boolean;
}

const tints: Record<Variant, { bg: string; fg: string }> = {
  accent: { bg: "var(--primary-soft)", fg: "var(--primary)" },
  primary: { bg: "var(--primary-soft)", fg: "var(--primary)" },
  neutral: { bg: "var(--surface-3)", fg: "var(--text-muted)" },
  gray: { bg: "var(--surface-3)", fg: "var(--text-muted)" },
  green: { bg: "var(--green-soft)", fg: "var(--green-600)" },
  blue: { bg: "var(--blue-soft)", fg: "var(--blue)" },
  orange: { bg: "var(--orange-soft)", fg: "var(--orange)" },
  violet: { bg: "var(--violet-soft)", fg: "var(--violet)" },
  pink: { bg: "var(--pink-soft)", fg: "var(--pink)" },
  teal: { bg: "var(--teal-soft)", fg: "var(--teal)" },
  danger: { bg: "var(--danger-soft)", fg: "var(--danger)" },
};

export function Badge({ variant = "neutral", dot = true, className, children, ...props }: BadgeProps) {
  const t = tints[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-[11px] py-1 text-[12px] font-bold leading-[1.4] whitespace-nowrap",
        className,
      )}
      style={{ background: t.bg, color: t.fg }}
      {...props}
    >
      {dot && <span aria-hidden className="h-[7px] w-[7px] rounded-full" style={{ background: "currentColor" }} />}
      {children}
    </span>
  );
}
