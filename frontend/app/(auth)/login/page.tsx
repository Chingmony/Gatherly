"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { login, isSetupRequired } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthHeading, IconInput, PasswordField } from "../auth-ui";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await login(email, password);
      // Invited account: the one-time code was accepted — go set a real password (no session yet).
      if (isSetupRequired(result)) {
        const q = new URLSearchParams({ email: result.email, grant: result.resetGrant });
        router.push(`/set-password?${q.toString()}`);
        return;
      }
      const next = params.get("next");
      // Admins land on the user console; organizers (Sub-admin/Handler) land on their events workspace.
      router.push(next || (result.globalRole === "ADMIN" ? "/users" : "/events"));
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <AuthHeading title="Welcome back" subtitle="Sign in to your Gatherly console" />
      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <IconInput
            id="email"
            type="email"
            autoComplete="email"
            required
            icon={<Mail className="h-[17px] w-[17px]" />}
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">Password or invite code</Label>
          <PasswordField
            id="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-[var(--text)]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]"
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-[13px] font-bold text-[var(--primary)] hover:underline">
            Forgot password?
          </Link>
        </div>

        {error && (
          <p className="text-[13px] font-semibold text-[var(--danger)]" role="alert">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : (<>Sign in <ArrowRight className="h-4 w-4" /></>)}
        </Button>
      </form>
      <p className="mt-4 text-center text-[12px] text-[var(--text-muted)]">
        Invited? Enter your email and the one-time code we emailed you.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
