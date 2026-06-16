"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { forgotPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthHeading, BackLink, IconInput } from "../auth-ui";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await forgotPassword(email);
      // Code sent — advance to the passcode screen.
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      // Gatherly is invite-only: an unknown email isn't an organizer account, so we say so.
      if (err instanceof ApiError && err.code === "ACCOUNT_NOT_FOUND") {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      setPending(false);
    }
  }

  return (
    <div>
      <BackLink href="/login">Back to sign in</BackLink>

      <span className="mt-5 grid h-12 w-12 place-items-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
        <Lock className="h-5 w-5" />
      </span>

      <AuthHeading
        title="Forgot password?"
        subtitle="Enter your organizer account email and we’ll send a one-time passcode to reset it."
        className="mt-4"
      />

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
        {error && (
          <p className="text-[13px] font-semibold text-[var(--danger)]" role="alert">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending…" : (<>Send OTP <Mail className="h-4 w-4" /></>)}
        </Button>
      </form>
    </div>
  );
}
