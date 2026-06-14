import { cn } from "@/lib/cn";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 px-6 text-center",
        className
      )}
    >
      <div
        className="flex items-center justify-center w-14 h-14 rounded-[var(--radius-lg)]"
        style={{ background: "var(--surface-3)", color: "var(--text-faint)" }}
      >
        <Icon size={24} />
      </div>
      <div className="flex flex-col gap-1.5 max-w-sm">
        <h3
          className="text-base font-extrabold"
          style={{ color: "var(--text-strong)" }}
        >
          {title}
        </h3>
        {description && (
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
