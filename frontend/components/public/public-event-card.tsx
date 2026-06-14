'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Ic } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { GradientSlot } from '@/components/ui/gradient-slot'
import { fd } from '@/lib/format'
import { presentationFor } from '@/lib/event-presentation'
import type { EventRow } from '@/lib/api'

export function PublicEventCard({ event }: { event: EventRow }) {
  const [hov, setHov] = useState(false)
  const p = presentationFor(event.id)
  const pct = event.cap > 0 ? Math.round((event.guests / event.cap) * 100) : 0

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--ca)',
        border: '1px solid var(--bo)',
        borderRadius: 'var(--r)',
        overflow: 'hidden',
        boxShadow: hov ? 'var(--sh2)' : 'var(--sh)',
        transform: hov ? 'translateY(-3px)' : 'none',
        transition: 'all .2s',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Link href={`/events/${event.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ position: 'relative' }}>
          <GradientSlot height={150} gradient={p.grad} placeholder="" />
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
            {p.cat}
          </span>
        </div>
      </Link>
      <div style={{ padding: '16px 17px 17px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Link href={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--t1)',
              letterSpacing: '-.01em',
              marginBottom: 10,
            }}
          >
            {event.name}
          </div>
        </Link>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--t2)' }}>
            <Ic n="cal" sz={14} c="var(--ac)" />
            {fd(event.date)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--t2)' }}>
            <Ic n="pin" sz={14} c="#C026D3" />
            {event.venue}
          </span>
        </div>
        {event.cap > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>Spots filled</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ac)' }}>
                {event.guests}
                <span style={{ color: 'var(--t3)', fontWeight: 400 }}>/{event.cap}</span>
              </span>
            </div>
            <div style={{ height: 6, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: pct + '%',
                  background: 'linear-gradient(90deg,var(--ac),#C026D3)',
                  borderRadius: 99,
                }}
              />
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          <Button asChild variant="secondary" className="flex-1">
            <Link href={`/events/${event.id}`}>Details</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href={`/events/${event.id}/register`}>Register</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
