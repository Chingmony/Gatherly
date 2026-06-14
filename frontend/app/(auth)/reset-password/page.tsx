'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Lock, Eye, EyeOff, Check } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPassword } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { getResetEmail, getResetToken, clearResetFlow } from '@/lib/auth/session'

const MIN_PASSWORD = 8 // backend ResetPasswordRequest requires @Size(min = 8)

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')
  const [resetToken, setResetTokenState] = useState('')

  // This step needs the email (from forgot-password) and the grant token (from
  // verify-otp). Missing either means the user skipped a step — send them back.
  useEffect(() => {
    const storedEmail = getResetEmail()
    const storedToken = getResetToken()
    if (!storedEmail) {
      router.replace('/forgot-password')
      return
    }
    if (!storedToken) {
      router.replace('/verify-otp')
      return
    }
    setEmail(storedEmail)
    setResetTokenState(storedToken)
  }, [router])

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD
  const mismatch = confirm.length > 0 && password !== confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be ${MIN_PASSWORD}+ characters.`)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    try {
      // Consume the single-use grant from verify-otp to set the new password.
      await resetPassword(email, resetToken, password)
      clearResetFlow()
      router.push('/login')
    } catch (err) {
      if (err instanceof ApiError) {
        // 401 → the grant expired or was already used; the OTP must be re-verified.
        if (err.status === 401) {
          clearResetFlow()
          setError('Your reset session expired. Please request a new code.')
          setTimeout(() => router.replace('/forgot-password'), 1400)
        } else if (err.code === 'VALIDATION_ERROR') {
          setError(err.fieldErrors[0]?.message ?? 'Please choose a stronger password.')
          setBusy(false)
        } else {
          setError(err.message)
          setBusy(false)
        }
      } else {
        setError('Something went wrong. Please try again.')
        setBusy(false)
      }
    }
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Back */}
        <Link
          href="/verify-otp"
          className="mb-1 flex items-center gap-1.5 self-start text-sm font-bold"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronLeft size={15} /> Back
        </Link>

        {/* Heading */}
        <div className="flex flex-col gap-1.5">
          <h2 className="m-0 text-[24px] font-extrabold" style={{ color: 'var(--text-strong)' }}>
            Set a new password
          </h2>
          <span className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Choose a new password for{' '}
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
          {tooShort && (
            <span className="text-[11.5px] font-semibold" style={{ color: 'var(--danger)' }}>
              Must be at least {MIN_PASSWORD} characters.
            </span>
          )}
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
          disabled={busy || password.length < MIN_PASSWORD || password !== confirm}
          className="mt-1 h-[50px]"
        >
          {busy ? (
            'Resetting…'
          ) : (
            <>
              <Check size={16} /> Reset password
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  )
}
