import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-hex,#6366f1)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:flex-shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary-hex,#6366f1)] text-white shadow-[var(--shadow-glow)] hover:bg-[var(--primary-600,#5048e5)] active:translate-y-px active:scale-[.99]",
        ghost:
          "bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border-hex,#ecedf4)] hover:border-[var(--primary-ring)] hover:text-[var(--primary-hex,#6366f1)] active:translate-y-px",
        soft:
          "bg-[var(--primary-soft)] text-[var(--primary-hex,#6366f1)] hover:bg-[var(--primary-ring)] active:translate-y-px",
        danger:
          "bg-[var(--danger-soft)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white active:translate-y-px",
        outline:
          "border border-[var(--border-hex,#ecedf4)] bg-transparent text-[var(--text)] hover:bg-[var(--surface-2)] active:translate-y-px",
        link:
          "text-[var(--primary-hex,#6366f1)] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-[42px] px-[18px] text-sm rounded-[var(--radius-md)]",
        sm:      "h-[34px] px-[13px] text-[13px] rounded-[var(--radius-sm)]",
        lg:      "h-[50px] px-6 text-base rounded-[var(--radius-md)]",
        icon:    "h-[42px] w-[42px] rounded-[var(--radius-md)]",
        "icon-sm": "h-[34px] w-[34px] rounded-[var(--radius-sm)]",
        block:   "h-[42px] w-full px-[18px] text-sm rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
