"use client";

import { Sun, Moon, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/cn";

interface AuthShellProps {
  children: React.ReactNode;
  showSkip?: boolean;
  className?: string;
}

export function AuthShell({ children, showSkip = false, className }: AuthShellProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className={cn(
        "min-h-screen grid auth-grid",
        className
      )}
      style={{
        gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 1fr)",
        background: "var(--bg)",
      }}
    >
      {/* ── Brand panel (left) ── */}
      <div
        className="auth-brand relative overflow-hidden p-11 flex flex-col justify-between"
        style={{
          background: "linear-gradient(150deg, #5a57f0 0%, #8b5cf6 46%, #22c55e 120%)",
          color: "#fff",
        }}
      >
        {/* Decorative overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.5,
            background:
              "radial-gradient(360px 280px at 78% 8%, rgba(255,255,255,.34), transparent 70%), repeating-linear-gradient(125deg, rgba(255,255,255,.08) 0 1px, transparent 1px 17px)",
          }}
        />

        {/* Top: Logo */}
        <div className="relative flex items-center gap-2.5">
          <Logo size={32} showText={false} />
          <span className="text-[22px] font-extrabold">Gatherly</span>
        </div>

        {/* Middle: Headline + features */}
        <div className="relative">
          <h1
            className="text-[34px] font-extrabold tracking-tight leading-[1.12] mb-3.5 max-w-[420px]"
            style={{ margin: "0 0 14px" }}
          >
            Every event, perfectly coordinated.
          </h1>
          <p className="text-[15px] leading-relaxed max-w-[400px] m-0" style={{ opacity: 0.92 }}>
            From draft to doors-open: registrations, QR check-in, crew tasks and live oversight — all in one console.
          </p>
          <div className="flex flex-col gap-3 mt-7">
            {[
              ["🛡️", "Role-based access", "Admin · Sub-admin · Handler tiers"],
              ["📱", "Instant QR ticketing", "Issued the moment guests register"],
              ["📡", "Live event control", "Real-time attendance & task health"],
            ].map(([icon, title, sub]) => (
              <div key={title} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                  style={{ background: "rgba(255,255,255,.18)" }}
                >
                  {icon}
                </div>
                <div className="flex flex-col gap-0">
                  <span className="text-sm font-bold">{title}</span>
                  <span className="text-[12.5px]" style={{ opacity: 0.88 }}>{sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Footer */}
        <div className="relative text-[12.5px]" style={{ opacity: 0.85 }}>
          © 2026 Gatherly · Secured with JWT
        </div>
      </div>

      {/* ── Form panel (right) ── */}
      <div className="relative flex items-center justify-center p-8">
        {/* Top-right controls */}
        <div className="absolute top-5 right-6 flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-[42px] h-[42px] rounded-[13px] flex items-center justify-center transition-all border cursor-pointer"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-hex, #ecedf4)",
              color: "var(--text-muted)",
            }}
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {showSkip && (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-[var(--radius-sm)] border transition-all"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border-hex, #ecedf4)",
                color: "var(--text)",
              }}
            >
              Skip <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {/* Form content */}
        <div className="w-full max-w-[384px]">{children}</div>
      </div>

      <style jsx global>{`
        @media (max-width: 860px) {
          .auth-grid { grid-template-columns: 1fr !important; }
          .auth-brand { display: none !important; }
        }
      `}</style>
    </div>
  );
}
