import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  // Primary brand violet; deepens on hover.
  primary: "bg-[var(--ac)] text-white hover:bg-[var(--ac-deep)]",
  // Flat white surface with a hairline border.
  secondary: "bg-[var(--ca)] text-[var(--t1)] border border-[var(--bo)] hover:bg-[var(--sidebar-hover)]",
  ghost: "bg-transparent text-[var(--t2)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--t1)]",
  // No decorative red — destructive reads as a neutral bordered action (meaning comes from the label).
  destructive: "bg-[var(--ca)] text-[var(--slate-2)] border border-[var(--bo)] hover:bg-[var(--sidebar-hover)]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--rs)] px-4 py-2.5 text-[13px] font-semibold transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ac)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
