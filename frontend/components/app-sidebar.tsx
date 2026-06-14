"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Building2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

/**
 * App shell sidebar (design `ui.jsx` → Sidebar): 252px white surface, brand at top, nav grouped
 * under "Main Menu" / "Others" section labels, active item on the `--primary-soft` / `--primary`
 * treatment, and a role "promo" card pinned at the bottom. Only implemented routes are rendered —
 * routes a role cannot reach are hidden entirely (design Roles §"Sidebar visibility").
 */
type NavItem = { href: string; label: string; icon: LucideIcon; section: "Main Menu" | "Others" };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Main Menu" },
  { href: "/events", label: "Events", icon: CalendarDays, section: "Main Menu" },
  { href: "/users", label: "User Management", icon: Users, section: "Others" },
  { href: "/organization", label: "Organization", icon: Building2, section: "Others" },
];

const SECTIONS: NavItem["section"][] = ["Main Menu", "Others"];

export function AppSidebar({ roleLabel = "Admin" }: { roleLabel?: string }) {
  const pathname = usePathname();
  return (
    <aside
      className="sticky top-0 flex h-screen shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)]"
      style={{ width: "var(--sidebar-w)" }}
    >
      <div className="flex items-center gap-[11px] px-6 pb-[18px] pt-6">
        <Logo size={30} />
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-4">
        {SECTIONS.map((section) => (
          <div key={section}>
            <div className="px-3 pb-[9px] pt-[18px] text-[11px] font-bold uppercase tracking-[0.13em] text-[var(--text-faint)]">
              {section}
            </div>
            {NAV.filter((n) => n.section === section).map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "my-0.5 flex w-full items-center gap-3 rounded-[var(--radius-md)] px-[13px] py-[11px] text-[14.5px] font-semibold transition-colors",
                    active
                      ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
                  )}
                >
                  <Icon
                    className="h-5 w-5 shrink-0"
                    style={{ color: active ? "var(--primary)" : "var(--text-faint)" }}
                    strokeWidth={2}
                  />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <RolePromo roleLabel={roleLabel} />
    </aside>
  );
}

function RolePromo({ roleLabel }: { roleLabel: string }) {
  return (
    <div
      className="relative m-[14px] overflow-hidden rounded-[var(--radius-lg)] px-[18px] pb-[18px] pt-5 text-center"
      style={{
        background:
          "linear-gradient(150deg, var(--primary-soft) 0%, var(--violet-soft) 40%, var(--green-soft) 100%)",
      }}
    >
      <div className="relative">
        <div className="mb-2 flex justify-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-[10px] py-1 text-[11.5px] font-extrabold tracking-[0.02em]"
            style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
          >
            <ShieldCheck className="h-[13px] w-[13px]" aria-hidden /> {roleLabel}
          </span>
        </div>
        <h4
          className="mb-1.5 text-[15px] font-extrabold"
          style={{
            background: "linear-gradient(90deg, var(--primary), var(--green-600))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          You&apos;re signed in as {roleLabel}
        </h4>
        <p className="m-0 text-[12px] leading-[1.5] text-[var(--text-muted)]">
          Permissions adapt to your role across every screen.
        </p>
      </div>
    </div>
  );
}
