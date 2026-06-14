import { cn } from "@/lib/cn";

type ChipVariant = "primary" | "green" | "blue" | "orange" | "violet" | "pink" | "teal" | "danger" | "gray";

const VARIANT_COLORS: Record<ChipVariant, { bg: string; color: string }> = {
  primary: { bg: "var(--primary-soft)",  color: "var(--primary-hex,#6366f1)" },
  green:   { bg: "var(--green-soft)",    color: "var(--green-600)" },
  blue:    { bg: "var(--blue-soft)",     color: "var(--blue)" },
  orange:  { bg: "var(--orange-soft)",   color: "var(--orange)" },
  violet:  { bg: "var(--violet-soft)",   color: "var(--violet)" },
  pink:    { bg: "var(--pink-soft)",     color: "var(--pink)" },
  teal:    { bg: "var(--teal-soft)",     color: "var(--teal)" },
  danger:  { bg: "var(--danger-soft)",   color: "var(--danger)" },
  gray:    { bg: "var(--surface-3)",     color: "var(--text-muted)" },
};

export interface ChipIcoProps {
  variant?: ChipVariant;
  size?: number;
  radius?: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function ChipIco({ variant = "primary", size = 46, radius = 14, children, className, style }: ChipIcoProps) {
  const { bg, color } = VARIANT_COLORS[variant];
  return (
    <div
      className={cn("flex items-center justify-center flex-shrink-0", className)}
      style={{ width: size, height: size, borderRadius: radius, background: bg, color, ...style }}
    >
      {children}
    </div>
  );
}
