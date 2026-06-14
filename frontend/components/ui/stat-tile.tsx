import { cn } from "@/lib/cn";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";

interface StatTileProps {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  className?: string;
}

export function StatTile({
  label,
  value,
  delta,
  trend = "neutral",
  icon: Icon,
  iconColor = "var(--primary-hex,#6366f1)",
  iconBg = "var(--primary-soft)",
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-xl)] border border-[var(--border-hex,#ecedf4)] bg-[var(--surface)] p-6 flex flex-col gap-4",
        "shadow-[var(--shadow-card)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            className="text-xs font-bold uppercase tracking-widest truncate"
            style={{ color: "var(--text-muted)" }}
          >
            {label}
          </span>
          <span
            className="text-[28px] font-extrabold leading-tight tracking-tight tabular-nums"
            style={{ color: "var(--text-strong)" }}
          >
            {value}
          </span>
        </div>
        {Icon && (
          <div
            className="flex items-center justify-center flex-shrink-0 rounded-[14px] w-11 h-11"
            style={{ background: iconBg, color: iconColor }}
          >
            <Icon size={20} />
          </div>
        )}
      </div>

      {delta && (
        <div className="flex items-center gap-1.5 text-xs font-bold">
          {trend === "up" && <TrendingUp size={14} style={{ color: "var(--green-600)" }} />}
          {trend === "down" && <TrendingDown size={14} style={{ color: "var(--danger)" }} />}
          <span
            style={{
              color:
                trend === "up"
                  ? "var(--green-600)"
                  : trend === "down"
                  ? "var(--danger)"
                  : "var(--text-muted)",
            }}
          >
            {delta}
          </span>
        </div>
      )}
    </div>
  );
}
