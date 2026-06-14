"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Sun, Moon, Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { AvatarUser } from "@/components/ui/avatar-user";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/cn";

type Role = "admin" | "subadmin" | "handler";

const USERS: Record<Role, { name: string; initials: string; email: string; hue: number }> = {
  admin:    { name: "Patrick Hale",  initials: "PH", email: "patrick@gatherly.io",  hue: 239 },
  subadmin: { name: "Jordan Lee",    initials: "JL", email: "jordan@gatherly.io",   hue: 210 },
  handler:  { name: "Sam Rivera",    initials: "SR", email: "sam@gatherly.io",       hue: 142 },
};

const ROLES: Record<Role, { label: string; sub: string; soft: string; color: string }> = {
  admin:    { label: "Admin",   sub: "Full access",        soft: "var(--violet-soft)", color: "var(--violet)" },
  subadmin: { label: "Manager", sub: "Event-scoped",       soft: "var(--blue-soft)",   color: "var(--blue)" },
  handler:  { label: "Handler", sub: "Task & scan access", soft: "var(--green-soft)",  color: "var(--green-600)" },
};

const NOTIFICATIONS = [
  { icon: "🚩", title: "Liam Carter",    body: "flagged an issue on Wi-Fi QA sweep.",          when: "12m ago", color: "var(--danger)",     bg: "var(--danger-soft)" },
  { icon: "📷", title: "Check-in:",      body: "48 guests arrived at NorthStar Summit.",        when: "40m ago", color: "var(--blue)",       bg: "var(--blue-soft)" },
  { icon: "✓",  title: "Ava Nguyen",    body: "completed Registration desk signage.",           when: "1h ago",  color: "var(--green-600)",  bg: "var(--green-soft)" },
  { icon: "👥", title: "New sign-ups:", body: "Lumen Festival reached 6,320 registrations.",   when: "2h ago",  color: "var(--violet)",     bg: "var(--violet-soft)" },
];

interface TopbarProps {
  role: Role;
  title?: string;
  subtitle?: string;
}

export function Topbar({ role, title, subtitle }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const u = USERS[role];
  const r = ROLES[role];
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const now = new Date();
  const greet = now.getHours() < 12 ? "Good Morning" : now.getHours() < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <header
      className="flex items-center gap-4 px-[30px] py-4 sticky top-0 z-30 border-b"
      style={{
        background: "color-mix(in srgb, var(--bg) 78%, transparent)",
        backdropFilter: "saturate(1.4) blur(14px)",
        borderColor: "transparent",
        minHeight: 68,
      }}
    >
      {/* Greeting */}
      <div className="flex-shrink-0">
        <p className="text-xs font-semibold m-0" style={{ color: "var(--text-muted)" }}>
          {subtitle || `Hello, ${greet}`}
        </p>
        <h2
          className="text-[20px] font-extrabold tracking-tight m-0 whitespace-nowrap"
          style={{ color: "var(--text-strong)" }}
        >
          {title || u.name}
        </h2>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        {/* Theme toggle */}
        <IconBtn onClick={toggleTheme} title="Toggle theme">
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </IconBtn>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <IconBtn onClick={() => setNotifOpen((o) => !o)} title="Notifications">
            <Bell size={19} />
            <span
              className="absolute top-[9px] right-[10px] w-2 h-2 rounded-full border-2"
              style={{ background: "var(--danger)", borderColor: "var(--surface)" }}
            />
          </IconBtn>

          {notifOpen && (
            <div
              className="absolute right-0 top-14 w-80 rounded-[var(--radius-xl)] border overflow-hidden"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-hex, #ecedf4)",
                boxShadow: "var(--shadow-pop)",
                zIndex: 60,
              }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border-hex, #ecedf4)" }}>
                <span className="text-sm font-extrabold" style={{ color: "var(--text-strong)" }}>Notifications</span>
                <button
                  className="text-xs font-bold"
                  style={{ color: "var(--primary-hex, #6366f1)", background: "none", border: "none", cursor: "pointer" }}
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {NOTIFICATIONS.map((n, i) => (
                  <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-[var(--radius-sm)] hover:bg-[var(--surface-2)] cursor-pointer transition-colors">
                    <div
                      className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-sm flex-shrink-0"
                      style={{ background: n.bg, color: n.color }}
                    >
                      {n.icon}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[13px] leading-snug">
                        <strong>{n.title}</strong> {n.body}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{n.when}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User chip */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => setUserOpen((o) => !o)}
            className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border cursor-pointer transition-all"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-hex, #ecedf4)",
            }}
          >
            <AvatarUser name={u.name} initials={u.initials} hue={u.hue} size={34} ring />
            <span className="flex items-center gap-1.5 text-[13.5px] font-bold hidden sm:flex">
              {u.name.split(" ")[0]}
              <ChevronDown size={15} style={{ color: "var(--text-faint)" }} />
            </span>
          </button>

          {userOpen && (
            <div
              className="absolute right-0 top-14 w-60 rounded-[var(--radius-xl)] border overflow-hidden"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-hex, #ecedf4)",
                boxShadow: "var(--shadow-pop)",
                zIndex: 60,
              }}
            >
              <div className="flex items-center gap-2.5 px-3 py-3">
                <AvatarUser name={u.name} initials={u.initials} hue={u.hue} size={42} />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-extrabold truncate" style={{ color: "var(--text-strong)" }}>{u.name}</span>
                  <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{u.email}</span>
                </div>
              </div>
              <div className="px-3 pb-2">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-1 rounded-full"
                  style={{ background: r.soft, color: r.color }}
                >
                  {r.label} · {r.sub}
                </span>
              </div>
              <div className="border-t" style={{ borderColor: "var(--border-hex, #ecedf4)" }} />
              {[
                { icon: User, label: "My Profile", href: "/settings" },
                { icon: Settings, label: "Account Settings", href: "/settings" },
              ].map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setUserOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--surface-2)]"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Icon size={17} style={{ color: "var(--text-faint)" }} />
                  {label}
                </Link>
              ))}
              <div className="border-t" style={{ borderColor: "var(--border-hex, #ecedf4)" }} />
              <Link
                href="/login"
                onClick={() => setUserOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--danger-soft)]"
                style={{ color: "var(--danger)" }}
              >
                <LogOut size={17} />
                Logout
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function IconBtn({ children, onClick, title, className }: { children: React.ReactNode; onClick?: () => void; title?: string; className?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn("relative w-[42px] h-[42px] rounded-[13px] flex items-center justify-center transition-all duration-150 cursor-pointer", className)}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-hex, #ecedf4)",
        color: "var(--text-muted)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.color = "var(--primary-hex, #6366f1)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-ring)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hex, #ecedf4)";
        (e.currentTarget as HTMLElement).style.transform = "";
      }}
    >
      {children}
    </button>
  );
}
