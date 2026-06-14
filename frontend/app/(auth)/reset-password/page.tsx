'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Ic } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AuthCard, AuthLabel, AuthButton } from '@/components/auth/auth-card'
import { OtpInput } from '@/components/auth/otp-input'

function ResetForm() {
  const params = useSearchParams()
  const email = params.get('email') ?? 'your email'
  const [step, setStep] = useState<'otp' | 'password' | 'done'>('otp')
  const [otp, setOtp] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')

  if (step === 'done') {
    return (
      <AuthCard title="Password updated" subtitle="You can now sign in with your new password.">
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 22px' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--ad)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ic n="chk" sz={28} c="var(--ac)" />
          </div>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href="/login">Continue to sign in</Link>
        </Button>
      </AuthCard>
    )
  }

  if (step === 'password') {
    const mismatch = pw2.length > 0 && pw !== pw2
    const valid = pw.length >= 8 && pw === pw2
    return (
      <AuthCard
        title="Set a new password"
        subtitle="Choose a strong password of at least 8 characters."
      >
        <form
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          onSubmit={(e) => {
            e.preventDefault()
            if (valid) setStep('done')
          }}
        >
          <label>
            <AuthLabel>New password</AuthLabel>
            <Input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          <label>
            <AuthLabel>Confirm password</AuthLabel>
            <Input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="••••••••"
              className={mismatch ? 'border-[#2B2A3F]' : undefined}
            />
            {mismatch && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  marginTop: 6,
                  fontSize: 11.5,
                  color: '#2B2A3F',
                  fontWeight: 500,
                }}
              >
                <Ic n="alrt" sz={12} c="#2B2A3F" />
                Passwords don&apos;t match
              </div>
            )}
          </label>
          <AuthButton type="submit" disabled={!valid}>
            Update password
          </AuthButton>
        </form>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Enter verification code"
      subtitle={
        <>
          We sent a 6-digit code to <b style={{ color: 'var(--t1)' }}>{email}</b>. It expires in 5
          minutes.
        </>
      }
    >
      <form
        style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
        onSubmit={(e) => {
          e.preventDefault()
          if (otp.length === 6) setStep('password')
        }}
      >
        <OtpInput value={otp} onChange={setOtp} />
        <AuthButton type="submit" disabled={otp.length !== 6}>
          Verify code
        </AuthButton>
      </form>
      <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12.5, color: 'var(--t3)' }}>
        Didn&apos;t get it?{' '}
        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ac)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 12.5,
          }}
        >
          Resend code
        </button>
      </div>
    </AuthCard>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  )
}
