"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Clock, Mail } from "lucide-react";
import { resetPassword, verifyOtp } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthHeading, BackLink, IconInput, OtpInput, PasswordField } from "../auth-ui";

/** Mirror of the server OTP lifetime (Redis TTL) — used only for the on-screen countdown. */
const OTP_TTL_SECONDS = 300;

/**
 * Forgot-password code entry (docs/04 §3.2): enter the emailed one-time code and a new password in
 * one step — verify the code for a single-use grant, then set the new password.
 */
function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const emailFromQuery = params.get("email") ?? "";
  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [remaining, setRemaining] = useState(OTP_TTL_SECONDS);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [remaining]);

  const expired = remaining <= 0;
  const pct = Math.round((remaining / OTP_TTL_SECONDS) * 100);
  const mmss = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.length < 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords don’t match.");
      return;
    }
    setPending(true);
    try {
      const { resetGrant } = await verifyOtp(email, code);
      await resetPassword(email, resetGrant, newPassword);
      router.push("/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That code is incorrect or has expired.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <BackLink href="/forgot-password">Back</BackLink>
      <AuthHeading title="Enter passcode" subtitle="We sent a 6-digit code to your email." className="mt-4" />

      {/* TTL countdown */}
      <div className="mt-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--text)]">
            <Clock className="h-4 w-4" />
            {expired ? "Code expired" : `Code expires in ${mmss}`}
          </span>
          <span className="font-[var(--mono)] text-[11px] text-[var(--text-faint)]">Redis TTL</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        {!emailFromQuery && (
          <div>
            <Label htmlFor="email">Email</Label>
            <IconInput
              id="email"
              type="email"
              required
              icon={<Mail className="h-[17px] w-[17px]" />}
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}

        <div>
          <Label>Passcode</Label>
          <OtpInput value={code} onChange={setCode} disabled={pending || expired} />
        </div>

        <div>
          <Label htmlFor="newPassword">New password</Label>
          <PasswordField
            id="newPassword"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <PasswordField
            id="confirm"
            autoComplete="new-password"
            required
            placeholder="Re-enter password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && <p className="text-[13px] font-semibold text-[var(--danger)]" role="alert">{error}</p>}

        {expired ? (
          <Link href={`/forgot-password`} className="block text-center text-[13px] font-bold text-[var(--primary)] hover:underline">
            Request a new code
          </Link>
        ) : (
          <Button type="submit" className="w-full" disabled={pending || code.length < 6}>
            {pending ? "Resetting…" : (<>Reset password <Check className="h-4 w-4" /></>)}
          </Button>
        )}
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
