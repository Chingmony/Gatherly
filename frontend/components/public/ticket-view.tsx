'use client'

import { useState } from 'react'
import { Ic } from '@/components/ui/icon'
import { QrTicket } from '@/components/qr/qr-ticket'
import { Button } from '@/components/ui/button'
import { GuestBadge } from '@/components/badges'
import { cardStyle } from '@/components/ui/primitives'
import { fd } from '@/lib/format'
import type { Guest } from '@/lib/api'

export function TicketView({ guest, eventDate, venue }: { guest: Guest; eventDate: string; venue: string }) {
  const [resent, setResent] = useState(false)

  return (
    <div style={{ ...cardStyle, width: '100%', maxWidth: 460, padding: '28px 24px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
          Gatherly Ticket
        </div>
        <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--t1)', marginTop: 6, letterSpacing: '-.01em' }}>
          {guest.ev}
        </div>
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
          <GuestBadge s={guest.st} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '22px 0' }}>
        <QrTicket token={guest.tok} />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          borderTop: '1px dashed var(--bo)',
          paddingTop: 18,
        }}
      >
        {[
          { ic: 'usr' as const, l: 'Guest', v: guest.name },
          { ic: 'cal' as const, l: 'Date', v: fd(eventDate) },
          { ic: 'pin' as const, l: 'Venue', v: venue },
          { ic: 'ticket' as const, l: 'Ticket code', v: guest.tok, mono: true },
        ].map((row) => (
          <div key={row.l} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'var(--ad)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Ic n={row.ic} sz={14} c="var(--ac)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>{row.l}</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--t1)',
                  fontFamily: row.mono ? 'ui-monospace,Menlo,monospace' : 'inherit',
                }}
              >
                {row.v}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={() => setResent(true)}
        disabled={resent}
        variant={resent ? 'soft' : 'default'}
        className="mt-5 w-full disabled:opacity-100"
      >
        <Ic n={resent ? 'chk' : 'mail'} sz={15} c={resent ? 'var(--ac)' : '#fff'} />
        {resent ? `Ticket re-sent to ${guest.email}` : 'Resend ticket email'}
      </Button>
    </div>
  )
}
