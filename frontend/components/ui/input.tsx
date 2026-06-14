import * as React from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-[var(--radius-md)] border border-[var(--border-hex,#ecedf4)] bg-[var(--surface-2)] px-3.5 py-[11px] text-sm text-[var(--text)] font-[var(--font)] transition-all duration-150",
          "placeholder:text-[var(--text-faint)]",
          "focus:outline-none focus:border-[var(--primary-hex,#6366f1)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_4px_var(--primary-ring)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
