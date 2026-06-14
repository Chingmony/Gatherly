"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MOCK_ACCOUNTS = [
  {
    role:     "Admin",
    email:    "patrick@gatherly.io",
    password: "admin123",
    redirect: "/dashboard",
    soft:     "var(--violet-soft)",
    color:    "var(--violet)",
    desc:     "Full platform access",
  },
  {
    role:     "Manager",
    email:    "jordan@gatherly.io",
    password: "manager123",
    redirect: "/events/ev1/workspace",
    soft:     "var(--blue-soft)",
    color:    "var(--blue)",
    desc:     "Event sub-admin",
  },
  {
    role:     "Handler",
    email:    "sam@gatherly.io",
    password: "handler123",
    redirect: "/tasks",
    soft:     "var(--green-soft)",
    color:    "var(--green-600)",
    desc:     "Task & scanner",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [show, setShow]       = useState(false);
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState("");

  function fillAccount(acc: typeof MOCK_ACCOUNTS[0]) {
    setEmail(acc.email);
    setPassword(acc.password);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate against mock accounts
    const match = MOCK_ACCOUNTS.find(
      (a) => a.email === email.trim() && a.password === password
    );
    if (!match) {
      setError("Invalid email or password. Use one of the demo accounts below.");
      return;
    }

    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    setBusy(false);
    const roleKey = match.role === "Manager" ? "subadmin" : match.role === "Handler" ? "handler" : "admin";
    sessionStorage.setItem("gatherly_role", roleKey);
    router.push(match.redirect);
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Heading */}
        <div className="flex flex-col gap-1.5 mb-1">
          <h2 className="text-[25px] font-extrabold tracking-tight m-0" style={{ color: "var(--text-strong)" }}>
            Welcome back
          </h2>
          <span className="text-[13.5px]" style={{ color: "var(--text-muted)" }}>
            Sign in to your Gatherly console
          </span>
        </div>

        {/* Mock account quick-select */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
            Demo accounts — click to fill
          </span>
          <div className="grid grid-cols-3 gap-2">
            {MOCK_ACCOUNTS.map((acc) => {
              const active = email === acc.email;
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => fillAccount(acc)}
                  className="flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-[var(--radius-md)] border text-left transition-all cursor-pointer"
                  style={{
                    background:  active ? acc.soft : "var(--surface-2)",
                    borderColor: active ? acc.color : "var(--border-hex,#ecedf4)",
                    boxShadow:   active ? `0 0 0 3px color-mix(in srgb, ${acc.color} 16%, transparent)` : "none",
                  }}
                >
                  <span className="text-[12px] font-extrabold" style={{ color: acc.color }}>
                    {acc.role}
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {acc.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              className="pl-10"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
            <Input
              id="password"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              className="pl-10 pr-10"
              autoComplete="current-password"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors cursor-pointer"
              style={{ color: "var(--text-muted)", background: "none", border: "none" }}
            >
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-[12.5px] font-semibold m-0" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer" style={{ color: "var(--text)" }}>
            <input type="checkbox" defaultChecked className="accent-[var(--primary-hex,#6366f1)]" />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-sm font-bold hover:underline" style={{ color: "var(--primary-hex,#6366f1)" }}>
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <Button type="submit" size="block" disabled={busy} className="mt-1 h-[50px]">
          {busy ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" style={{ animation: "spin360 .7s linear infinite" }} />
              Signing in…
            </span>
          ) : (
            <>Sign in <ArrowRight size={16} /></>
          )}
        </Button>

      </form>
    </AuthShell>
  );
}
