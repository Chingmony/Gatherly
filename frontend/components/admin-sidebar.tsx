"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

const NAV = [{ href: "/users", label: "Users" }];

/** Flat white sidebar (docs/05 §2/§4). Active nav uses the --ad fill / --ac text treatment. */
export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--bo)] bg-[var(--sidebar)] p-4">
      <div className="mb-8 flex items-center gap-2 px-2 pt-1">
        <span aria-hidden className="inline-block h-6 w-6 rounded-[8px]" style={{ background: "var(--ac)" }} />
        <span className="text-[16px] font-bold tracking-[-0.01em] text-[var(--t1)]">Gatherly</span>
      </div>

      <div className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--t3)]">
        Manage
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-[10px] px-3 py-2 text-[14px] transition-colors",
                active
                  ? "font-semibold"
                  : "font-medium text-[var(--t2)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--t1)]",
              )}
              style={active ? { background: "var(--ad)", color: "var(--ac)" } : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-[var(--bo)] pt-3">
        <LogoutButton />
      </div>
    </aside>
  );
}
