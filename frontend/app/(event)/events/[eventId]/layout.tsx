'use client'

import { notFound, useParams } from 'next/navigation'
import Link from 'next/link'
import { Ic } from '@/components/ui/icon'
import { EvBadge } from '@/components/badges'
import { EventTabs } from '@/components/events/event-tabs'
import { fd, initials } from '@/lib/format'
import { getEvent, useApiData } from '@/lib/api'

export default function EventWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { eventId } = useParams<{ eventId: string }>()
  const { data: event, loading } = useApiData(() => getEvent(eventId), [eventId])
  if (loading) return null
  if (!event) notFound()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* context header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Link
          href="/events"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12.5,
            fontWeight: 600,
            color: 'var(--t2)',
            textDecoration: 'none',
          }}
        >
          ← Event Monitoring
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 13,
              background: 'linear-gradient(135deg,#7C3AED,#C026D3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Ic n="cal" sz={22} c="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--t1)',
                  letterSpacing: '-.02em',
                }}
              >
                {event.name}
              </span>
              <EvBadge s={event.status} />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 5, flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12.5,
                  color: 'var(--t2)',
                }}
              >
                <Ic n="cal" sz={13} c="var(--t3)" />
                {fd(event.date)}
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12.5,
                  color: 'var(--t2)',
                }}
              >
                <Ic n="pin" sz={13} c="var(--t3)" />
                {event.venue}
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12.5,
                  color: 'var(--t2)',
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: 'var(--ac)',
                    color: '#fff',
                    fontSize: 8,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {initials(event.sa)}
                </span>
                {event.sa} · Sub-admin
              </span>
            </div>
          </div>
        </div>
        <EventTabs eventId={eventId} />
      </div>

      {children}
    </div>
  )
}
