"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Calendar, CheckSquare, QrCode, FileText,
  Package, Building2, Users, Settings, LogOut, ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/cn";
import type { Role } from "@/lib/roles";
import { performLogout } from "@/lib/auth/session";

interface NavItem {
  section?: string;
  id?: string;
  label?: string;
  href?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  roles?: Role[];
  badge?: string;
}

const NAV: NavItem[] = [
  { section: "Main Menu" },
  { id: "dashboard",   label: "Dashboard",        href: "/dashboard",   icon: LayoutDashboard, roles: ["admin", "subadmin", "handler"] },
  { id: "events",      label: "Events",           href: "/events",      icon: Calendar,        roles: ["admin", "subadmin", "handler"] },
  { id: "tasks",       label: "My Tasks",         href: "/tasks",       icon: CheckSquare,     roles: ["subadmin", "handler"], badge: "tasks" },
  { id: "scanner",     label: "Check-in Scanner", href: "/scanner",                 icon: QrCode,    roles: ["admin", "subadmin", "handler"] },
  { id: "formbuilder", label: "Form Builder",     href: "/events/ev1/form-builder", icon: FileText, roles: ["admin", "subadmin"] },
  { section: "Others" },
  { id: "supplylist",  label: "Supply List",      href: "/supply-list", icon: Package,         roles: ["admin"] },
  { id: "organization",label: "Organization",     href: "/organization",icon: Building2,        roles: ["admin"] },
  { id: "team",        label: "User Management",  href: "/team",        icon: Users,           roles: ["admin"] },
  { id: "settings",    label: "Settings",         href: "/settings",    icon: Settings,        roles: ["admin", "subadmin", "handler"] },
  { id: "logout",      label: "Logout",           href: "/login",       icon: LogOut,          roles: ["admin", "subadmin", "handler"] },
];

const ROLE_INFO: Record<Role, { label: string; sub: string; soft: string; color: string }> = {
  admin:    { label: "Admin",    sub: "Full access",        soft: "var(--violet-soft)", color: "var(--violet)" },
  subadmin: { label: "Manager",  sub: "Event-scoped",       soft: "var(--blue-soft)",   color: "var(--blue)" },
  handler:  { label: "Handler",  sub: "Task & scan access", soft: "var(--green-soft)",  color: "var(--green-600)" },
};

interface SidebarProps {
  role: Role;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const r = ROLE_INFO[role];

  return (
    <aside
      className="hidden md:flex flex-col flex-shrink-0 border-r"
      style={{
        width: "var(--sidebar-w, 252px)",
        background: "var(--sidebar)",
        borderColor: "var(--border-hex, #ecedf4)",
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <Logo size={30} />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 pb-4">
        {visibleNav(role).map((item, i) => {
          if (item.section) {
            return (
              <div
                key={`s-${i}`}
                className="text-[11px] font-bold uppercase tracking-[0.13em] px-3 pt-[18px] pb-[9px]"
                style={{ color: "var(--text-faint)" }}
              >
                {item.section}
              </div>
            );
          }

          const href = item.href!;
          const active = isActive(pathname, href);
          const Icon = item.icon!;
          const sharedCls = cn(
            "flex items-center gap-3 px-[13px] py-[11px] my-0.5 rounded-[var(--radius-md)] text-[14.5px] font-semibold transition-all duration-150 relative whitespace-nowrap group w-full text-left",
            active
              ? "bg-[var(--pink-soft)] text-[var(--pink)]"
              : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          );
          const iconSpan = (
            <span
              className="flex w-5 h-5 flex-shrink-0 transition-colors duration-150"
              style={{ color: active ? "var(--pink)" : "var(--text-faint)" }}
            >
              <Icon size={19} />
            </span>
          );
          // Ventixe-style pink indicator bar on the active row's left edge
          const indicator = active ? (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[22px] w-[3px] rounded-r-full"
              style={{ background: "var(--pink)" }}
            />
          ) : null;

          if (item.id === "logout") {
            return (
              <button
                key="logout"
                type="button"
                className={sharedCls}
                onClick={async () => {
                  await performLogout();
                  router.push("/login");
                }}
              >
                {indicator}
                {iconSpan}
                <span className="flex-1">{item.label}</span>
              </button>
            );
          }

          return (
            <Link key={item.id} href={href} className={sharedCls}>
              {indicator}
              {iconSpan}
              <span className="flex-1">{item.label}</span>
              {item.id === "events" && role === "subadmin" && (
                <ShieldCheck size={14} className="opacity-50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Role promo card */}
      <div
        className="m-3.5 p-5 rounded-[var(--radius-lg)] text-center relative overflow-hidden"
        style={{
          background: "linear-gradient(150deg, #fdecf5 0%, #f3edff 50%, #eef0ff 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.55,
            background:
              "radial-gradient(80px 60px at 80% 20%, rgba(236,72,153,.28), transparent)",
          }}
        />
        <div className="relative">
          <div className="flex justify-center mb-2">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-1 rounded-full"
              style={{ background: r.soft, color: r.color }}
            >
              <ShieldCheck size={13} />
              {r.label}
            </span>
          </div>
          <h4
            className="text-[15px] font-extrabold m-0 mb-1.5"
            style={{
              background: "linear-gradient(90deg, var(--pink), var(--violet))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            You're signed in as {r.label}
          </h4>
          <p className="text-xs leading-relaxed m-0 mb-3.5" style={{ color: "var(--text-muted)" }}>
            {r.sub} · permissions adapt to your role across every screen.
          </p>
          {/* Ventixe-style pink gradient pill button */}
          <Link
            href="/settings"
            className="inline-flex items-center justify-center w-full text-[13px] font-extrabold px-4 py-2.5 rounded-full text-white transition-all duration-150 hover:brightness-105"
            style={{
              background: "linear-gradient(90deg, var(--pink), var(--violet))",
              boxShadow: "0 8px 20px rgba(236,72,153,0.30)",
            }}
          >
            Manage Access
          </Link>
        </div>
      </div>
    </aside>
  );
}


/** Returns NAV items visible to `role`, with orphaned section headers removed. */
function visibleNav(role: Role): NavItem[] {
  const filtered = NAV.filter((item) => item.section || item.roles?.includes(role));
  return filtered.filter((item, i) =>
    !item.section || (filtered[i + 1] != null && !filtered[i + 1].section)
  );
}

/** Derives active state from href so id↔segment mismatches can never silently break. */
function isActive(pathname: string, href: string): boolean {
  const hrefSegs = href.split("/").filter(Boolean);
  const pathSegs = pathname.split("/").filter(Boolean);
  // Deep event-scoped paths (3+ segments): match by the page-type last segment
  if (hrefSegs.length >= 3) return pathSegs[pathSegs.length - 1] === hrefSegs[hrefSegs.length - 1];
  // Shallow top-level paths: first segment must match and pathname must not be deeper
  return pathSegs[0] === hrefSegs[0] && pathSegs.length <= 2;
}
