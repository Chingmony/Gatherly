"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ChevronLeft } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChipIco } from "@/components/ui/chip-ico";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    setBusy(false);
    router.push("/reset-password");
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Back */}
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm font-bold self-start mb-1"
          style={{ color: "var(--text-muted)" }}
        >
          <ChevronLeft size={15} /> Back to sign in
        </Link>

        {/* Icon */}
        <ChipIco variant="primary" size={52} radius={15}>
          <Lock size={24} />
        </ChipIco>

        {/* Heading */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[24px] font-extrabold m-0" style={{ color: "var(--text-strong)" }}>
            Forgot password?
          </h2>
          <span className="text-[13.5px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Enter your account email and we'll send a one-time passcode to reset it.
          </span>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-faint)" }}
            />
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <Button type="submit" size="block" disabled={busy} className="h-[50px] mt-2">
          {busy ? "Sending…" : <><Mail size={16} /> Send OTP</>}
        </Button>
      </form>
    </AuthShell>
  );
}
