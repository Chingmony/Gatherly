"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { resetPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthHeading, BackLink, PasswordField } from "../auth-ui";

/**
 * Set a password using a one-time grant (docs/04 §3.2). Reached from the login page after an
 * invited account's one-time code is accepted — the user activates by choosing a password.
 */
function SetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const grant = params.get("grant") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirm) {
      setError("Passwords don’t match.");
      return;
    }
    setPending(true);
    try {
      await resetPassword(email, grant, newPassword);
      router.push("/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "This request is invalid or has expired.");
    } finally {
      setPending(false);
    }
  }

  if (!email || !grant) {
    return (
      <div>
        <AuthHeading title="Invalid request" subtitle="This set-password link is missing its details — start from sign in." />
        <div className="mt-6">
          <BackLink href="/login">Back to sign in</BackLink>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AuthHeading title="Set your password" subtitle="Activate your account by choosing a password." />
      <form onSubmit={onSubmit} className="mt-7 space-y-4">
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
            minLength={8}
            placeholder="Re-enter password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {error && <p className="text-[13px] font-semibold text-[var(--danger)]" role="alert">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Activating…" : (<>Set password &amp; activate <Check className="h-4 w-4" /></>)}
        </Button>
      </form>
      <div className="mt-6">
        <BackLink href="/login">Back to sign in</BackLink>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense>
      <SetPasswordForm />
    </Suspense>
  );
}
