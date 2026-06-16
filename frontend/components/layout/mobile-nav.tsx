"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, CheckSquare, QrCode, Settings } from "lucide-react";
import { cn } from "@/lib/cn";

const HANDLER_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events",    label: "Events",    icon: Calendar },
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
              "flex flex-1 flex-col items-center justify-center gap-1 transition-[transform,color] duration-200 ease-out",
              active
                ? "text-[var(--primary-hex,#6366f1)] -translate-y-1 motion-reduce:translate-y-0"
                : "text-[var(--text-faint)]"
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ease-out",
                active
                  ? "bg-[var(--primary-soft)] scale-110 shadow-[0_6px_14px_var(--primary-ring)] motion-reduce:scale-100"
                  : ""
              )}
            >
              <Icon
                size={20}
                className={cn("transition-transform duration-200 ease-out", active && "scale-110 motion-reduce:scale-100")}
              />
            </span>
            <span className={cn("text-[10px] transition-all", active ? "font-extrabold" : "font-bold")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
