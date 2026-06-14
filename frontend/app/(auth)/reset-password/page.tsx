"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword, verifyOtp } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { resetGrant } = await verifyOtp(email, code);
      await resetPassword(email, resetGrant, newPassword);
      router.push("/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reset password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter your code</CardTitle>
        <CardDescription>Use the code we emailed you to set a new password.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email}
                 onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="code">Reset code</Label>
          <Input id="code" inputMode="numeric" required value={code}
                 onChange={(e) => setCode(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="newPassword">New password</Label>
          <Input id="newPassword" type="password" autoComplete="new-password" required minLength={8}
                 value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        {error && <p className="text-[13px] font-medium text-[var(--ac-2)]" role="alert">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Updating…" : "Set new password"}
        </Button>
      </form>
      <p className="mt-5 text-center text-[13px] text-[var(--t2)]">
        <Link href="/login" className="font-semibold text-[var(--ac)] hover:underline">Back to sign in</Link>
      </p>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
