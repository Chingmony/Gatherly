import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold leading-snug whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default:     "bg-[var(--primary-soft)] text-[var(--primary-hex,#6366f1)]",
        secondary:   "bg-[var(--surface-3)] text-[var(--text-muted)]",
        destructive: "bg-[var(--danger-soft)] text-[var(--danger)]",
        outline:     "border border-[var(--border-hex,#ecedf4)] text-[var(--text)]",
        green:   "bg-[var(--green-soft)] text-[var(--green-600)]",
        blue:    "bg-[var(--blue-soft)] text-[var(--blue)]",
        orange:  "bg-[var(--orange-soft)] text-[var(--orange)]",
        violet:  "bg-[var(--violet-soft)] text-[var(--violet)]",
        pink:    "bg-[var(--pink-soft)] text-[var(--pink)]",
        teal:    "bg-[var(--teal-soft)] text-[var(--teal)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
