"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Lock, Moon, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Shared building blocks for the auth split-screen (design Auth): a no-flash theme toggle, icon /
 * password inputs, a segmented OTP field, and the page heading. Kept here (colocated, not a route)
 * so all four auth pages share one look. Padding for the leading icon is set inline so it reliably
 * beats the Input's own `px` utility.
 */

const THEME_EVENT = "gatherly-theme-change";

/** Light/dark toggle reusing the root layout's no-flash mechanism (localStorage `gatherly-theme`). */
export function AuthThemeToggle() {
  const theme = useTheme();
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    if (next === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    try {
      localStorage.setItem("gatherly-theme", next);
    } catch {
      /* private mode — ignore */
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition-colors hover:border-[var(--primary-ring)] hover:text-[var(--primary)]"
    >
      {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

function useTheme(): "light" | "dark" {
  return React.useSyncExternalStore(
    (cb) => {
      window.addEventListener(THEME_EVENT, cb);
      return () => window.removeEventListener(THEME_EVENT, cb);
    },
    () => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"),
    () => "light",
  );
}

/** Page heading: bold title + muted subtitle. */
export function AuthHeading({ title, subtitle, className }: { title: string; subtitle?: string; className?: string }) {
  return (
    <div className={className}>
      <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-[var(--text-strong)]">{title}</h1>
      {subtitle && <p className="mt-1.5 text-[14px] font-medium text-[var(--text-muted)]">{subtitle}</p>}
    </div>
  );
}

/** Small "← label" link used at the top of the secondary auth screens. */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </Link>
  );
}

/** Text input with a leading icon. */
export function IconInput({ icon, ...props }: { icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]">{icon}</span>
      <Input style={{ paddingLeft: 40 }} {...props} />
    </div>
  );
}

/** Password input with a lock icon and a show/hide eye toggle. */
export function PasswordField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]">
        <Lock className="h-[17px] w-[17px]" />
      </span>
      <Input type={show ? "text" : "password"} style={{ paddingLeft: 40, paddingRight: 40 }} {...props} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] transition-colors hover:text-[var(--text)]"
      >
        {show ? <EyeOff className="h-[17px] w-[17px]" /> : <Eye className="h-[17px] w-[17px]" />}
      </button>
    </div>
  );
}

/** Segmented numeric code field. `value` is the joined digit string; auto-advances and accepts paste. */
export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  disabled?: boolean;
}) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);
  const chars = Array.from({ length }, (_, i) => value[i] ?? "");

  function setAt(i: number, digit: string) {
    const next = (value.slice(0, i) + digit + value.slice(i + 1)).slice(0, length);
    onChange(next.replace(/\D/g, ""));
  }

  return (
    <div className="flex gap-2">
      {chars.map((c, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          maxLength={1}
          value={c}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "").slice(-1);
            setAt(i, d);
            if (d && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !chars[i] && i > 0) refs.current[i - 1]?.focus();
          }}
          onPaste={(e) => {
            e.preventDefault();
            const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            if (digits) {
              onChange(digits);
              refs.current[Math.min(digits.length, length - 1)]?.focus();
            }
          }}
          className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] text-center text-[18px] font-bold text-[var(--text-strong)] outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-ring)] disabled:opacity-60"
        />
      ))}
    </div>
  );
}
