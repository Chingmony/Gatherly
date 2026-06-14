'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ShieldCheck, Loader2 } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { verifyOtp, resendOtp } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { getResetEmail, setResetToken } from '@/lib/auth/session'

const TTL = 300 // 5 minutes — mirrors the backend OTP TTL (OTP_TTL_SECONDS)
const RESEND_COOLDOWN = 60 // seconds — mirrors backend OTP_RESEND_COOLDOWN_SECONDS; a resend
// inside this window is silently ignored server-side, so resend stays disabled until it elapses.

export default function VerifyOtpPage() {
  const router = useRouter()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timeLeft, setTimeLeft] = useState(TTL)
  const [resendIn, setResendIn] = useState(RESEND_COOLDOWN)
  const [resendMsg, setResendMsg] = useState('')
  const [error, setError] = useState('')
  const [invalid, setInvalid] = useState(false)
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

  // One ticker drives both the OTP TTL and the resend cooldown; each floors at 0.
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((l) => Math.max(0, l - 1))
      setResendIn((r) => Math.max(0, r - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const mmss = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`
  const expired = timeLeft <= 0
  const otpFilled = otp.every((d) => d)

  function clearErrors() {
    setError('')
    setInvalid(false)
    setResendMsg('')
  }

  function setDigit(i: number, val: string) {
    const v = val.replace(/\D/g, '').slice(-1)
    setOtp((prev) => {
      const c = [...prev]
      c[i] = v
      return c
    })
    clearErrors()
    if (v && refs.current[i + 1]) refs.current[i + 1]?.focus() // auto-advance
  }

  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[i] && refs.current[i - 1]) refs.current[i - 1]?.focus()
  }

  // Paste the whole 6-digit code into any box → populate all six and focus the next empty.
  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!digits) return
    e.preventDefault()
    const next = ['', '', '', '', '', '']
    for (let i = 0; i < digits.length; i++) next[i] = digits[i]
    setOtp(next)
    clearErrors()
    refs.current[Math.min(digits.length, 5)]?.focus()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    clearErrors()
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
        if (err.code === 'OTP_EXPIRED') {
          setError('That code has expired. Request a new one.')
          setInvalid(true)
        } else if (err.code === 'OTP_INVALID') {
          setError('Invalid code. Please check your email and try again.')
          setInvalid(true)
        } else {
          setError(err.message)
        }
      } else {
        setError('Something went wrong. Please try again.')
      }
      setBusy(false)
    }
  }

  async function handleResend() {
    if (resendIn > 0) return // still within the backend cooldown — a resend would be ignored
    clearErrors()
    try {
      await resendOtp(email)
      setTimeLeft(TTL)
      setResendIn(RESEND_COOLDOWN)
      setOtp(['', '', '', '', '', ''])
      setResendMsg('A new code has been sent to your email.')
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
            Verify your identity
          </h2>
          <span className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Please enter the 6-digit code sent to{' '}
            <span className="font-bold" style={{ color: 'var(--text)' }}>
              {email || 'your email'}
            </span>
            .
          </span>
        </div>

        {/* OTP boxes */}
        <div className="flex items-center justify-between gap-2.5">
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
              type="tel"
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              disabled={expired}
              aria-label={`Digit ${i + 1}`}
              aria-invalid={invalid}
              className="h-14 w-full rounded-[14px] border text-center text-[22px] font-extrabold transition-all focus:outline-none disabled:opacity-50"
              style={{
                borderColor: invalid ? 'var(--danger)' : 'var(--border-hex, #ecedf4)',
                background: invalid ? 'var(--danger-soft)' : 'var(--surface-2)',
                color: invalid ? 'var(--danger)' : 'var(--text)',
                fontFamily: 'var(--font)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = invalid ? 'var(--danger)' : 'var(--primary-hex, #6366f1)'
                e.target.style.boxShadow = invalid
                  ? '0 0 0 4px var(--danger-soft)'
                  : '0 0 0 4px var(--primary-ring)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = invalid ? 'var(--danger)' : 'var(--border-hex, #ecedf4)'
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

        {/* Verify (primary action) */}
        <Button type="submit" size="block" disabled={busy || expired || !otpFilled} className="mt-1 h-[50px]">
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Verifying…
            </>
          ) : (
            <>
              <ShieldCheck size={16} /> Verify code
            </>
          )}
        </Button>

        {/* Expiry countdown — sits under the Verify button */}
        <div
          className="flex flex-col gap-2 rounded-xl border p-3.5"
          style={{
            background: expired ? 'var(--danger-soft)' : 'var(--surface-2)',
            borderColor: expired ? 'var(--danger)' : 'var(--border-hex, #ecedf4)',
          }}
        >
          <span
            className="text-[12.5px] font-bold"
            style={{ color: expired ? 'var(--danger)' : 'var(--text)' }}
          >
            ⏱ {expired ? 'Code expired' : `Expires in ${mmss}`}
          </span>
          <Progress
            value={(timeLeft / TTL) * 100}
            indicatorColor={timeLeft > 60 ? 'var(--primary-hex, #6366f1)' : 'var(--danger)'}
          />
        </div>

        {/* Resend — a disabled-looking text link during the cooldown, an active link after */}
        {resendMsg && (
          <p
            className="m-0 -mb-1 self-center text-[12.5px] font-semibold"
            style={{ color: 'var(--green-600)' }}
          >
            {resendMsg}
          </p>
        )}
        {resendIn > 0 ? (
          <span
            className="select-none self-center text-[13px] font-bold"
            style={{ color: 'var(--text-faint)' }}
          >
            Resend code in {resendIn}s
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="cursor-pointer self-center text-[13px] font-extrabold transition-colors hover:underline"
            style={{ color: 'var(--violet)', background: 'none', border: 'none' }}
          >
            Didn&apos;t receive the code? Resend now
          </button>
        )}
      </form>
    </AuthShell>
  )
}
