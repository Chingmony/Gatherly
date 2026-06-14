"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await forgotPassword(email);
    } finally {
      // Always show the same outcome — the API never reveals whether the account exists.
      setSent(true);
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>We’ll email you a one-time code.</CardDescription>
      </CardHeader>
      {sent ? (
        <div className="space-y-4">
          <p className="text-sm text-neutral-300">
            If an account exists for <span className="font-medium">{email}</span>, a reset code
            has been sent. Enter it on the next screen.
          </p>
          <Link href={`/reset-password?email=${encodeURIComponent(email)}`}>
            <Button className="w-full">Enter code</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required
                   value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending…" : "Send code"}
          </Button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-neutral-400">
        <Link href="/login" className="text-indigo-400 hover:underline">Back to sign in</Link>
      </p>
    </Card>
  );
}
