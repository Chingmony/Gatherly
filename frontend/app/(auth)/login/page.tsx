'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Ic } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { AuthCard, AuthLabel, AuthButton } from '@/components/auth/auth-card'
import { signIn } from '@/lib/auth/session'

function LoginForm() {
  const params = useSearchParams()
  const next = params.get('next') || '/dashboard'
  const [show, setShow] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Prototype: any credentials sign in. Replace with POST /auth/login (M1).
    signIn('ADMIN')
    // Full navigation so proxy.ts re-evaluates with the new session cookie.
    window.location.assign(next)
  }

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your Gatherly operations console.">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label>
          <AuthLabel>Email</AuthLabel>
          <Input
            type="email"
            placeholder="you@gatherly.co"
            autoComplete="email"
            defaultValue="admin@gatherly.co"
          />
        </label>
        <label>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <AuthLabel>Password</AuthLabel>
            <Link
              href="/forgot-password"
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: 'var(--ac)',
                textDecoration: 'none',
              }}
            >
              Forgot?
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <Input
              type={show ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              defaultValue="demo-password"
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                color: 'var(--t3)',
                display: 'flex',
              }}
            >
              <Ic n={show ? 'x' : 'srch'} sz={15} c="var(--t3)" />
            </button>
          </div>
        </label>
        <AuthButton type="submit">Sign in</AuthButton>
      </form>

      <div
        style={{
          marginTop: 18,
          paddingTop: 16,
          borderTop: '1px solid var(--bo)',
          fontSize: 12.5,
          color: 'var(--t3)',
          textAlign: 'center',
        }}
      >
        Looking for an event?{' '}
        <Link href="/" style={{ color: 'var(--ac)', fontWeight: 600, textDecoration: 'none' }}>
          Browse events
        </Link>
      </div>
    </AuthCard>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
