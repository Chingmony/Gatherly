'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, Check } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPassword } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'

// Light policy: 8+ chars, at least one uppercase, and at least one number or symbol.
// (Backend ResetPasswordRequest only enforces @Size(min = 8); this adds friendly UX guidance.)
const STRONG_RE = /^(?=.*[A-Z])(?=.*[\d\W]).{8,}$/
const PASSWORD_HINT =
  'Use 8+ characters with at least one uppercase letter and one number or symbol — e.g. Gatherly#123'
const isStrong = (pw: string) => STRONG_RE.test(pw)

/**
 * One-click "set your password" landing page for admin-created members. The welcome email links
 * here with `?email=&token=` (a single-use grant). We redeem them against the standard
 * reset-password endpoint — no OTP step. Missing params means a malformed/expired link.
 */
export default function SetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const e = params.get('email')
    // Defensive: if an email client failed to decode `&amp;`, the token key arrives as `amp;token`.
    const t = params.get('token') ?? params.get('amp;token')
    if (e && t) {
      setEmail(e)
      setToken(t)
    } else {
      setError('This link is invalid or incomplete. Please use the link from your welcome email.')
    }
    setReady(true)
  }, [])

  const weak = password.length > 0 && !isStrong(password)
  const mismatch = confirm.length > 0 && password !== confirm

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setError('')
    if (!isStrong(password)) {
      setError(PASSWORD_HINT)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    try {
      // Consume the single-use grant from the welcome email to set the password.
      await resetPassword(email, token, password)
      setDone(true)
      setTimeout(() => router.push('/login'), 1400)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors.length > 0) {
          // A field-level validation error → it really is the password (e.g. backend @Size).
          setError(err.fieldErrors[0].message)
        } else {
          // No field errors → the link/token is the problem: invalid, expired, already used, or the
          // account no longer exists (backend "Invalid reset request." / "reset token is invalid").
          // Show one clear, friendly message rather than the cryptic backend text.
          setError(
            'This link is no longer valid — it may have already been used, expired, or the account was removed. Ask an admin to resend the invite.',
          )
        }
      } else {
        setError('Something went wrong. Please try again.')
      }
      setBusy(false)
    }
  }

  if (done) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: 'var(--green-soft)', color: 'var(--green-600)' }}
          >
            <Check size={22} />
          </span>
          <h2 className="m-0 text-[22px] font-extrabold" style={{ color: 'var(--text-strong)' }}>
            Password set
          </h2>
          <span className="text-[13.5px]" style={{ color: 'var(--text-muted)' }}>
            Redirecting you to sign in…
          </span>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Heading */}
        <div className="flex flex-col gap-1.5">
          <h2 className="m-0 text-[24px] font-extrabold" style={{ color: 'var(--text-strong)' }}>
            Set your password
          </h2>
          <span className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Welcome to Gatherly! Choose a password for{' '}
            <span className="font-bold" style={{ color: 'var(--text)' }}>
              {email || 'your account'}
            </span>
            .
          </span>
        </div>

        {/* New password */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-pw">New password</Label>
          <div className="relative">
            <Lock
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-faint)' }}
            />
            <Input
              id="new-pw"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              className="pl-10 pr-10"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              disabled={!token}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1"
              style={{ color: 'var(--text-muted)', background: 'none', border: 'none' }}
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <span
            className="text-[11.5px] font-semibold leading-relaxed"
            style={{ color: weak ? 'var(--danger)' : 'var(--text-faint)' }}
          >
            {PASSWORD_HINT}
          </span>
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-pw">Confirm password</Label>
          <div className="relative">
            <Lock
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-faint)' }}
            />
            <Input
              id="confirm-pw"
              type={show ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value)
                setError('')
              }}
              className="pl-10"
              autoComplete="new-password"
              placeholder="Re-enter password"
              disabled={!token}
            />
          </div>
          {mismatch && (
            <span className="text-[11.5px] font-semibold" style={{ color: 'var(--danger)' }}>
              Passwords do not match.
            </span>
          )}
        </div>

        {error && (
          <p className="m-0 text-[12.5px] font-semibold" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="block"
          disabled={busy || !ready || !token || !isStrong(password) || password !== confirm}
          className="mt-1 h-[50px]"
        >
          {busy ? (
            'Saving…'
          ) : (
            <>
              <Check size={16} /> Set password
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  )
}
