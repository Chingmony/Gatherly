'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ShieldCheck } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { verifyOtp, forgotPassword } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { getResetEmail, setResetToken } from '@/lib/auth/session'

const TTL = 300 // 5 minutes — mirrors the backend OTP TTL (OTP_TTL_SECONDS)

export default function VerifyOtpPage() {
  const router = useRouter()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timeLeft, setTimeLeft] = useState(TTL)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')
  const refs = useRef<(HTMLInputElement | null)[]>([])

  // The email is set by the forgot-password step; without it we can't verify.
  useEffect(() => {
    const stored = getResetEmail()
    if (!stored) {
      router.replace('/forgot-password')
      return
    }
    setEmail(stored)
  }, [router])

  useEffect(() => {
    if (timeLeft <= 0) return
    const t = setInterval(() => setTimeLeft((l) => l - 1), 1000)
    return () => clearInterval(t)
  }, [timeLeft])

  const mmss = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`
  const expired = timeLeft <= 0
  const otpFilled = otp.every((d) => d)

  function setDigit(i: number, val: string) {
    const v = val.replace(/\D/g, '').slice(-1)
    setOtp((prev) => {
      const c = [...prev]
      c[i] = v
      return c
    })
    setError('')
    if (v && refs.current[i + 1]) refs.current[i + 1]?.focus()
  }

  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[i] && refs.current[i - 1]) refs.current[i - 1]?.focus()
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!digits) return
    e.preventDefault()
    const next = ['', '', '', '', '', '']
    for (let i = 0; i < digits.length; i++) next[i] = digits[i]
    setOtp(next)
    setError('')
    refs.current[Math.min(digits.length, 5)]?.focus()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!otpFilled) {
      setError('Enter the 6-digit code.')
      return
    }

    setBusy(true)
    try {
      // Exchange the OTP for a single-use reset grant, then move to the password step.
      const { resetToken } = await verifyOtp(email, otp.join(''))
      setResetToken(resetToken)
      router.push('/reset-password')
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'OTP_EXPIRED') setError('That code has expired. Request a new one.')
        else if (err.code === 'OTP_INVALID') setError('Incorrect code. Check it and try again.')
        else setError(err.message)
      } else {
        setError('Something went wrong. Please try again.')
      }
      setBusy(false)
    }
  }

  async function handleResend() {
    setError('')
    try {
      await forgotPassword(email)
      setTimeLeft(TTL)
      setOtp(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't resend the code. Try again.")
    }
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Back */}
        <Link
          href="/forgot-password"
          className="mb-1 flex items-center gap-1.5 self-start text-sm font-bold"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronLeft size={15} /> Back
        </Link>

        {/* Heading */}
        <div className="flex flex-col gap-1.5">
          <h2 className="m-0 text-[24px] font-extrabold" style={{ color: 'var(--text-strong)' }}>
            Enter passcode
          </h2>
          <span className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            We sent a 6-digit code to{' '}
            <span className="font-bold" style={{ color: 'var(--text)' }}>
              {email || 'your email'}
            </span>
            .
          </span>
        </div>

        {/* TTL bar */}
        <div
          className="flex flex-col gap-2 rounded-xl border p-3.5"
          style={{
            background: expired ? 'var(--danger-soft)' : 'var(--surface-2)',
            borderColor: expired ? 'var(--danger)' : 'var(--border-hex, #ecedf4)',
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[12.5px] font-bold"
              style={{ color: expired ? 'var(--danger)' : 'var(--text)' }}
            >
              ⏱ {expired ? 'Code expired' : `Code expires in ${mmss}`}
            </span>
            <span className="font-mono text-[11px]" style={{ color: 'var(--text-faint)' }}>
              Redis TTL
            </span>
          </div>
          <Progress
            value={(timeLeft / TTL) * 100}
            indicatorColor={timeLeft > 60 ? 'var(--primary-hex, #6366f1)' : 'var(--danger)'}
          />
        </div>

        {/* OTP boxes */}
        <div className="flex items-center justify-between gap-2">
          {otp.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el
              }}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              onPaste={onPaste}
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              disabled={expired}
              aria-label={`Digit ${i + 1}`}
              className="h-14 w-12 rounded-xl border text-center text-[22px] font-extrabold transition-all focus:outline-none"
              style={{
                borderColor: 'var(--border-hex, #ecedf4)',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontFamily: 'var(--font)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary-hex, #6366f1)'
                e.target.style.boxShadow = '0 0 0 4px var(--primary-ring)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-hex, #ecedf4)'
                e.target.style.boxShadow = ''
              }}
            />
          ))}
        </div>

        {error && (
          <p className="m-0 text-[12.5px] font-semibold" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        {expired ? (
          <Button type="button" variant="soft" size="block" onClick={handleResend}>
            🔄 Resend code
          </Button>
        ) : (
          <>
            <Button
              type="submit"
              size="block"
              disabled={busy || !otpFilled}
              className="mt-1 h-[50px]"
            >
              {busy ? (
                'Verifying…'
              ) : (
                <>
                  <ShieldCheck size={16} /> Verify code
                </>
              )}
            </Button>
            <button
              type="button"
              onClick={handleResend}
              className="cursor-pointer self-center text-[12.5px] font-bold"
              style={{ color: 'var(--text-muted)', background: 'none', border: 'none' }}
            >
              Didn&apos;t get it? Resend code
            </button>
          </>
        )}
      </form>
    </AuthShell>
  )
}
