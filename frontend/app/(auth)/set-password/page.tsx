"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { setPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function SetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
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
      await setPassword(token, newPassword);
      router.push("/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "This link is invalid or has expired.");
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
          <CardDescription>This activation link is missing its token.</CardDescription>
        </CardHeader>
        <Link href="/login" className="text-[13px] font-semibold text-[var(--ac)] hover:underline">
          Back to sign in
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set your password</CardTitle>
        <CardDescription>Activate your account by choosing a password.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="newPassword">New password</Label>
          <Input id="newPassword" type="password" autoComplete="new-password" required minLength={8}
                 value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" autoComplete="new-password" required minLength={8}
                 aria-invalid={confirm.length > 0 && confirm !== newPassword}
                 value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {error && <p className="text-[13px] font-medium text-[var(--ac-2)]" role="alert">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Activating…" : "Set password & activate"}
        </Button>
      </form>
      <p className="mt-5 text-center text-[13px] text-[var(--t2)]">
        <Link href="/login" className="font-semibold text-[var(--ac)] hover:underline">Back to sign in</Link>
      </p>
    </Card>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense>
      <SetPasswordForm />
    </Suspense>
  );
}
