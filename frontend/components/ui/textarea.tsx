import * as React from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[84px] w-full rounded-[var(--radius-md)] border border-[var(--border-hex,#ecedf4)] bg-[var(--surface-2)] px-3.5 py-[11px] text-sm text-[var(--text)] font-[var(--font)] leading-relaxed resize-vertical transition-all duration-150",
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
Textarea.displayName = "Textarea";

export { Textarea };
