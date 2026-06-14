import { cn } from "@/lib/cn";

type BadgeVariant =
  | "green"
  | "blue"
  | "orange"
  | "violet"
  | "pink"
  | "teal"
  | "gray"
  | "danger"
  | "primary"
  | "default";

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  green:   "bg-[var(--green-soft)]   text-[var(--green-600)]",
  blue:    "bg-[var(--blue-soft)]    text-[var(--blue)]",
  orange:  "bg-[var(--orange-soft)]  text-[var(--orange)]",
  violet:  "bg-[var(--violet-soft)]  text-[var(--violet)]",
  pink:    "bg-[var(--pink-soft)]    text-[var(--pink)]",
  teal:    "bg-[var(--teal-soft)]    text-[var(--teal)]",
  gray:    "bg-[var(--surface-3)]    text-[var(--text-muted)]",
  danger:  "bg-[var(--danger-soft)]  text-[var(--danger)]",
  primary: "bg-[var(--primary-soft)] text-[var(--primary-hex,#6366f1)]",
  default: "bg-[var(--surface-3)]    text-[var(--text-muted)]",
};

interface StatusBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function StatusBadge({ variant = "default", children, dot, className, style }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap leading-snug",
        VARIANT_STYLES[variant],
        className
      )}
      style={style}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

/* Convenience mapping for event/task statuses */
export function eventStatusBadge(status: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    draft:      { variant: "gray",   label: "Draft" },
    published:  { variant: "green",  label: "Published" },
    live:       { variant: "primary", label: "Live" },
    ended:      { variant: "orange", label: "Ended" },
    cancelled:  { variant: "danger", label: "Cancelled" },
    todo:       { variant: "gray",   label: "To Do" },
    in_progress: { variant: "blue",  label: "In Progress" },
    done:       { variant: "green",  label: "Done" },
    blocked:    { variant: "danger", label: "Blocked" },
  };
  return map[status] ?? { variant: "default" as BadgeVariant, label: status };
}
