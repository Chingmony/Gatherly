import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-[var(--rs)] border border-[var(--bo)] bg-[var(--ca)] px-3.5 py-2.5 text-[14px] text-[var(--t1)]",
        "placeholder:text-[var(--t3)] transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ac)] focus-visible:border-[var(--ac)]",
        "aria-[invalid=true]:border-[var(--ac-2)]",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
