import * as React from "react";
import { cn } from "@/lib/utils";

// Design-handoff button system (.btn variants). Legacy names (secondary/destructive)
// are kept as aliases so existing call-sites keep working through the re-skin.
type Variant = "primary" | "ghost" | "soft" | "danger" | "secondary" | "destructive";
type Size = "md" | "sm";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: "bg-[var(--primary)] text-[var(--on-primary)] shadow-[var(--shadow-glow)] hover:bg-[var(--primary-600)]",
  ghost: "bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--primary-ring)] hover:text-[var(--primary)]",
  secondary: "bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--primary-ring)] hover:text-[var(--primary)]",
  soft: "bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary-ring)]",
  danger: "bg-[var(--danger-soft)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white",
  destructive: "bg-[var(--danger-soft)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white",
};

const sizes: Record<Size, string> = {
  md: "px-[18px] py-[11px] text-[14px] rounded-[var(--radius-md)]",
  sm: "px-[13px] py-2 text-[13px] rounded-[var(--radius-sm)]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 border border-transparent font-bold",
        "transition-all active:translate-y-px active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:translate-y-0",
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
