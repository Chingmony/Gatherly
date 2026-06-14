'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ChevronLeft } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChipIco } from '@/components/ui/chip-ico'
import { forgotPassword } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { setResetEmail } from '@/lib/auth/session'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      // Always 202 with a neutral message (no account enumeration) — proceed regardless.
      await forgotPassword(email.trim())
      setResetEmail(email.trim())
      router.push('/verify-otp')
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.code === 'RATE_LIMITED'
            ? 'Too many requests. Please wait a moment and try again.'
            : err.message
          : 'Something went wrong. Please try again.'
      )
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Back */}
        <Link
          href="/login"
          className="mb-1 flex items-center gap-1.5 self-start text-sm font-bold"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronLeft size={15} /> Back to sign in
        </Link>

        {/* Icon */}
        <ChipIco variant="primary" size={52} radius={15}>
          <Lock size={24} />
        </ChipIco>

        {/* Heading */}
        <div className="flex flex-col gap-1.5">
          <h2 className="m-0 text-[24px] font-extrabold" style={{ color: 'var(--text-strong)' }}>
            Forgot password?
          </h2>
          <span className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Enter your account email and we'll send a one-time passcode to reset it.
          </span>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-faint)' }}
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

        {error && (
          <p className="m-0 text-[12.5px] font-semibold" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <Button type="submit" size="block" disabled={busy} className="mt-2 h-[50px]">
          {busy ? (
            'Sending…'
          ) : (
            <>
              <Mail size={16} /> Send OTP
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  )
}
