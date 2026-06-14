"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { startSession, landingFor } from "@/lib/auth/session";

export default function LoginPage() {
  const router = useRouter();
  const [show, setShow]       = useState(false);
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { user } = await login(email.trim(), password);
      const role = startSession(user);
      router.push(landingFor(role));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.code === "INVALID_CREDENTIALS"
            ? "Invalid email or password."
            : err.message
          : "Something went wrong. Please try again.",
      );
      setBusy(false);
    }
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
