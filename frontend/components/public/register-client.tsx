'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Ic } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { FormRenderer } from '@/components/form-renderer/form-renderer'
import { QrTicket } from '@/components/qr/qr-ticket'
import { GradientSlot } from '@/components/ui/gradient-slot'
import { cardStyle } from '@/components/ui/primitives'
import { fd } from '@/lib/format'
import type { FormField, EventRow } from '@/lib/api'

function genToken(): string {
  // Prototype only — the real CSPRNG checkin_token is minted server-side.
  let h = 5381
  const seed = 'GTHR' + Math.floor(Date.now() % 1_000_000)
  for (let i = 0; i < seed.length; i++) h = (h * 33) ^ seed.charCodeAt(i)
  return 'GTHR-' + (h >>> 0).toString(16).toUpperCase().padStart(6, '0').slice(0, 6)
}

export function RegisterClient({ event, fields }: { event: EventRow; fields: FormField[] }) {
  const [done, setDone] = useState<{ email: string; token: string } | null>(null)

  if (done) {
    return (
      <div style={{ ...cardStyle, width: '100%', maxWidth: 560, textAlign: 'center', padding: '36px 28px' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--ad)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Ic n="chk" sz={28} c="var(--ac)" />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.01em' }}>
          You&apos;re registered for {event.name}
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--t2)', marginTop: 8, lineHeight: 1.5 }}>
          Your QR ticket has been emailed to <b style={{ color: 'var(--t1)' }}>{done.email}</b>. Show
          it at the door — or use the on-screen copy below.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '22px 0 14px' }}>
          <QrTicket token={done.token} />
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'ui-monospace,Menlo,monospace',
            fontSize: 13,
            color: 'var(--t2)',
            background: 'var(--bg)',
            border: '1px solid var(--bo)',
            borderRadius: 8,
            padding: '6px 12px',
          }}
        >
          <Ic n="ticket" sz={14} c="var(--ac)" />
          {done.token}
        </div>
        <div style={{ marginTop: 22 }}>
          <Button asChild>
            <Link href={`/tickets/${done.token}`}>
              View my ticket
              <Ic n="arr" sz={15} c="#fff" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* event hero */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ position: 'relative' }}>
          <GradientSlot height={150} gradient="linear-gradient(135deg,#7C3AED,#C026D3)" placeholder="" />
          <span
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              padding: '4px 11px',
              borderRadius: 99,
              background: 'rgba(255,255,255,.92)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--t1)',
            }}
          >
            Registration open
          </span>
        </div>
        <div style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.01em' }}>
            {event.name}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--t2)' }}>
              <Ic n="cal" sz={14} c="var(--ac)" />
              {fd(event.date)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--t2)' }}>
              <Ic n="pin" sz={14} c="#C026D3" />
              {event.venue}
            </span>
          </div>
        </div>
      </div>

      {/* form */}
      <div style={cardStyle}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>
          Register to attend
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--t3)', marginBottom: 18 }}>
          A QR ticket will be emailed to you on completion.
        </div>
        <FormRenderer
          fields={fields}
          submitLabel="Complete registration"
          onSubmit={(data) => {
            const email = String(data.email ?? 'your inbox')
            setDone({ email, token: genToken() })
          }}
        />
      </div>
    </div>
  )
}
