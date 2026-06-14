import { cn } from "@/lib/cn";

interface PageHeaderProps {
  title: string;
  sub?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, sub, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center gap-4 mb-6", className)}>
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <h1
          className="text-[25px] font-extrabold tracking-tight leading-tight truncate"
          style={{ color: "var(--text-strong)", margin: 0 }}
        >
          {title}
        </h1>
        {sub && (
          <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            {sub}
          </span>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0">{children}</div>
      )}
    </div>
  );
}
