'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Ic } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { AuthCard, AuthLabel, AuthButton } from '@/components/auth/auth-card'
import { auth, ApiError } from '@/lib/api'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required.').email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

type LoginValues = z.infer<typeof loginSchema>

function FieldError({ children }: { children?: string }) {
  if (!children) return null
  return (
    <p
      role="alert"
      style={{ marginTop: 4, fontSize: 12, fontWeight: 600, color: 'var(--dg, #dc2626)' }}
    >
      {children}
    </p>
  )
}

function LoginForm() {
  const params = useSearchParams()
  const next = params.get('next') || '/dashboard'
  const [show, setShow] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await auth.login(values)
      // Full navigation so proxy.ts re-evaluates with the new session cookie.
      window.location.assign(next)
    } catch (err) {
      if (err instanceof ApiError) {
        // Map any field-level errors from the backend onto the inputs…
        if (err.fieldErrors) {
          for (const [field, message] of Object.entries(err.fieldErrors)) {
            if (field === 'email' || field === 'password') {
              setError(field, { type: 'server', message })
            }
          }
        }
        // …and surface the top-level message (401, 429, etc.).
        setFormError(err.message)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    }
  })

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your Gatherly operations console.">
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <label>
          <AuthLabel>Email</AuthLabel>
          <Input
            type="email"
            placeholder="you@gatherly.co"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && <FieldError>{errors.email.message}</FieldError>}
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
              aria-invalid={!!errors.password}
              className="pr-11"
              {...register('password')}
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
          {errors.password && <FieldError>{errors.password.message}</FieldError>}
        </label>
        {formError && (
          <p role="alert" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--dg, #dc2626)' }}>
            {formError}
          </p>
        )}
        <AuthButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </AuthButton>
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
