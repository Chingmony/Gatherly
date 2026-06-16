"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, QrCode, Settings } from "lucide-react";
import { cn } from "@/lib/cn";

const HANDLER_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks",     label: "Tasks",     icon: CheckSquare },
  { href: "/scanner",   label: "Scanner",   icon: QrCode },
  { href: "/settings",  label: "Settings",  icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  const hrefSegs = href.split("/").filter(Boolean);
  const pathSegs = pathname.split("/").filter(Boolean);
  if (hrefSegs.length >= 3) return pathSegs[pathSegs.length - 1] === hrefSegs[hrefSegs.length - 1];
  return pathSegs[0] === hrefSegs[0] && pathSegs.length <= 2;
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t md:hidden"
      style={{
        background:   "var(--surface)",
        borderColor:  "var(--border-hex,#ecedf4)",
        height:       64,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow:    "0 -4px 16px rgba(28,33,64,.07)",
      }}
    >
      {HANDLER_NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-[3px] transition-colors",
              active
                ? "text-[var(--primary-hex,#6366f1)]"
                : "text-[var(--text-faint)]"
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center w-9 h-6 rounded-full transition-all",
                active && "bg-[var(--primary-soft)]"
              )}
            >
              <Icon size={20} />
            </span>
            <span className="text-[10px] font-bold">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
