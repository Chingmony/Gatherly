"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

const TTL = 300; // 5 minutes

export default function ResetPasswordPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(TTL);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const mmss = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`;
  const expired = timeLeft <= 0;
  const otpFilled = otp.every((d) => d);

  function setDigit(i: number, val: string) {
    const v = val.replace(/\D/g, "").slice(-1);
    setOtp((prev) => { const c = [...prev]; c[i] = v; return c; });
    if (v && refs.current[i + 1]) refs.current[i + 1]?.focus();
  }

  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[i] && refs.current[i - 1]) refs.current[i - 1]?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!otpFilled) { setError("Enter the 6-digit code."); return; }
    if (password.length < 6) { setError("Password must be 6+ characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    router.push("/login");
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Back */}
        <Link href="/forgot-password" className="flex items-center gap-1.5 text-sm font-bold self-start mb-1" style={{ color: "var(--text-muted)" }}>
          <ChevronLeft size={15} /> Back
        </Link>

        {/* Heading */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[24px] font-extrabold m-0" style={{ color: "var(--text-strong)" }}>
            Enter passcode
          </h2>
          <span className="text-[13.5px]" style={{ color: "var(--text-muted)" }}>
            We sent a 6-digit code to your email.
          </span>
        </div>

        {/* TTL bar */}
        <div
          className="flex flex-col gap-2 p-3.5 rounded-xl border"
          style={{
            background: expired ? "var(--danger-soft)" : "var(--surface-2)",
            borderColor: expired ? "var(--danger)" : "var(--border-hex, #ecedf4)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-bold" style={{ color: expired ? "var(--danger)" : "var(--text)" }}>
              ⏱ {expired ? "Code expired" : `Code expires in ${mmss}`}
            </span>
            <span className="text-[11px] font-mono" style={{ color: "var(--text-faint)" }}>Redis TTL</span>
          </div>
          <Progress
            value={(timeLeft / TTL) * 100}
            indicatorColor={timeLeft > 60 ? "var(--primary-hex, #6366f1)" : "var(--danger)"}
          />
        </div>

        {/* OTP boxes */}
        <div className="flex items-center gap-2 justify-between">
          {otp.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              inputMode="numeric"
              maxLength={1}
              disabled={expired}
              className="w-12 h-14 text-center text-[22px] font-extrabold rounded-xl border transition-all focus:outline-none"
              style={{
                borderColor: "var(--border-hex, #ecedf4)",
                background: "var(--surface-2)",
                color: "var(--text)",
                fontFamily: "var(--font)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--primary-hex, #6366f1)";
                e.target.style.boxShadow = "0 0 0 4px var(--primary-ring)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border-hex, #ecedf4)";
                e.target.style.boxShadow = "";
              }}
            />
          ))}
        </div>

        {expired ? (
          <Button
            type="button"
            variant="soft"
            size="block"
            onClick={() => { setTimeLeft(TTL); setOtp(["", "", "", "", "", ""]); }}
          >
            🔄 Resend code
          </Button>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-pw">New password</Label>
              <Input
                id="new-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-pw">Confirm password</Label>
              <Input
                id="confirm-pw"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
              />
            </div>
            {error && (
              <p className="text-sm font-semibold" style={{ color: "var(--danger)" }}>{error}</p>
            )}
            <Button type="submit" size="block" className="h-[50px] mt-1">
              <Check size={16} /> Reset password
            </Button>
          </>
        )}
      </form>
    </AuthShell>
  );
}
