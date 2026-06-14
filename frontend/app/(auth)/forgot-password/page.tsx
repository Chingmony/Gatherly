'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { AuthCard, AuthLabel, AuthButton } from '@/components/auth/auth-card'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your account email and we'll send a 6-digit verification code."
    >
      <form
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        onSubmit={(e) => {
          e.preventDefault()
          router.push(`/reset-password?email=${encodeURIComponent(email)}`)
        }}
      >
        <label>
          <AuthLabel>Email</AuthLabel>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@gatherly.co"
            autoComplete="email"
          />
        </label>
        <AuthButton type="submit" disabled={!email}>
          Send verification code
        </AuthButton>
      </form>

      <Link
        href="/login"
        style={{
          marginTop: 18,
          display: 'inline-block',
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--t2)',
          textDecoration: 'none',
        }}
      >
        ← Back to sign in
      </Link>
    </AuthCard>
  )
}
