import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/cn";

interface RestrictedBannerProps {
  children: React.ReactNode;
  className?: string;
}

export function RestrictedBanner({ children, className }: RestrictedBannerProps) {
  return (
    <div
      className={cn("flex items-start gap-3 p-4 rounded-[var(--radius-lg)] border", className)}
      style={{
        background: "var(--orange-soft)",
        borderColor: "var(--orange)",
        color: "var(--orange)",
      }}
    >
      <ShieldAlert size={18} className="flex-shrink-0 mt-0.5" />
      <p className="text-sm font-semibold leading-relaxed m-0" style={{ color: "var(--text)" }}>
        {children}
      </p>
    </div>
  );
}
