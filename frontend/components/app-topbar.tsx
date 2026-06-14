"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Moon, Sun, Bell, ChevronDown, Eye, LogOut, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { displayRole, type UserResponse } from "@/lib/api/types";
import { logout } from "@/lib/api/auth";

/**
 * App shell topbar (design `ui.jsx` → Topbar): greeting block, theme toggle, a notifications bell
 * with a popover, and a user chip that opens a profile menu. Intentionally has **no** tickets /
 * "My Tickets" item (design App Shell note). Notifications have no backing domain yet, so the
 * popover shows an honest "all caught up" state rather than fabricated activity.
 */
export function AppTopbar({ me }: { me: UserResponse | null }) {
  const router = useRouter();
  const theme = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    if (next === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("gatherly-theme", next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  async function onLogout() {
    setMenuOpen(false);
    try {
      await logout();
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  const greet = greeting();
  const name = me?.fullName ?? "there";
  const firstName = name.split(/\s+/)[0];
  const role = me ? displayRole(me) : "Member";

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-transparent px-[30px] py-4 backdrop-blur-[14px] backdrop-saturate-[1.4] bg-[color-mix(in_srgb,var(--bg)_78%,transparent)]">
      <div className="shrink-0">
        <small className="block whitespace-nowrap text-[12px] font-semibold text-[var(--text-muted)]">
          Hello, {greet}
        </small>
        <h2 className="mt-px whitespace-nowrap text-[20px] font-extrabold tracking-[-0.01em] text-[var(--text-strong)]">
          {name}
        </h2>
      </div>
      <div className="flex-1" />

      <div className="flex items-center gap-[10px]">
        <Link
          href="/"
          title="Preview the public guest site"
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-[13px] py-2 text-[13px] font-bold text-[var(--text)] transition-colors hover:border-[var(--primary-ring)] hover:text-[var(--primary)]"
        >
          <Eye className="h-4 w-4" /> Guest site
        </Link>

        <IconButton onClick={toggleTheme} label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
          {theme === "dark" ? <Sun className="h-[19px] w-[19px]" /> : <Moon className="h-[19px] w-[19px]" />}
        </IconButton>

        <div ref={notifRef} className="relative">
          <IconButton onClick={() => setNotifOpen((o) => !o)} label="Notifications" expanded={notifOpen}>
            <Bell className="h-[19px] w-[19px]" />
          </IconButton>
          {notifOpen && (
            <div
              role="dialog"
              aria-label="Notifications"
              className="absolute right-0 top-[52px] z-[60] w-[322px] rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow-pop)]"
            >
              <div className="flex items-center justify-between px-3 pb-[10px] pt-2">
                <span className="text-[14px] font-extrabold text-[var(--text-strong)]">Notifications</span>
              </div>
              <hr className="border-0 border-t border-[var(--border)]" />
              <div className="px-3 py-8 text-center text-[13px] text-[var(--text-muted)]">
                You&apos;re all caught up — no new activity.
              </div>
            </div>
          )}
        </div>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-[9px] rounded-full border border-[var(--border)] bg-[var(--surface)] py-1 pl-1 pr-[10px] transition-shadow hover:border-[var(--primary-ring)] hover:shadow-[var(--shadow-sm)]"
          >
            <Avatar name={name} size={34} ring />
            <span className="flex items-center gap-1.5">
              <span className="text-[13.5px] font-bold text-[var(--text)]">{firstName}</span>
              <ChevronDown className="h-[15px] w-[15px] text-[var(--text-faint)]" />
            </span>
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-[52px] z-[60] w-[248px] rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow-pop)]"
            >
              <div className="flex items-center gap-[10px] px-3 py-[10px]">
                <Avatar name={name} size={42} />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-[14px] font-extrabold text-[var(--text-strong)]">{name}</span>
                  <span className="truncate text-[12px] text-[var(--text-muted)]">{me?.email}</span>
                </div>
              </div>
              <div className="px-3 pb-[10px] pt-0.5">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-[10px] py-1 text-[11.5px] font-extrabold"
                  style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
                >
                  <ShieldCheck className="h-3 w-3" aria-hidden /> {role}
                </span>
              </div>
              <hr className="border-0 border-t border-[var(--border)]" />
              <button
                onClick={onLogout}
                role="menuitem"
                className="mt-1 flex w-full items-center gap-3 rounded-[var(--radius-md)] px-[13px] py-[11px] text-[14px] font-semibold text-[var(--danger)] transition-colors hover:bg-[var(--surface-2)]"
              >
                <LogOut className="h-[18px] w-[18px]" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function IconButton({
  children,
  onClick,
  label,
  expanded,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  expanded?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-expanded={expanded}
      aria-haspopup={expanded !== undefined ? "dialog" : undefined}
      className="relative flex h-[42px] w-[42px] items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition-colors hover:border-[var(--primary-ring)] hover:text-[var(--primary)] motion-safe:hover:-translate-y-px"
    >
      {children}
    </button>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

const THEME_EVENT = "gatherly-theme-change";

/**
 * Reads the current theme straight from the DOM (set before paint by the no-flash script in the
 * root layout) via `useSyncExternalStore` — the idiomatic external-system read. The server snapshot
 * is "light"; React reconciles to the real client value at hydration without a flash or a
 * setState-in-effect. `toggleTheme` dispatches `THEME_EVENT` to notify subscribers.
 */
function useTheme(): "light" | "dark" {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(THEME_EVENT, cb);
      return () => window.removeEventListener(THEME_EVENT, cb);
    },
    () => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"),
    () => "light",
  );
}
