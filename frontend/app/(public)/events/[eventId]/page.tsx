import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Ic } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { GradientSlot } from '@/components/ui/gradient-slot'
import { fd } from '@/lib/format'
import { getEvent, getAgenda } from '@/lib/api'
import { presentationFor } from '@/lib/event-presentation'

export default async function PublicEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  const event = getEvent(eventId)
  if (!event) notFound()

  const p = presentationFor(event.id)
  const agenda = getAgenda(eventId)
  const open = event.status === 'Public'
  const pct = event.cap > 0 ? Math.round((event.guests / event.cap) * 100) : 0

  return (
    <div
      style={{ width: '100%', maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <Link
        href="/"
        style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t2)', textDecoration: 'none' }}
      >
        ← All events
      </Link>

      {/* hero */}
      <div
        style={{
          background: 'var(--ca)',
          border: '1px solid var(--bo)',
          borderRadius: 'var(--r)',
          overflow: 'hidden',
          boxShadow: 'var(--sh)',
        }}
      >
        <div style={{ position: 'relative' }}>
          <GradientSlot height={220} gradient={p.grad} placeholder="" />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom,rgba(10,6,26,.05),rgba(10,6,26,.55))',
            }}
          />
          <span
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              padding: '5px 13px',
              borderRadius: 99,
              background: 'rgba(255,255,255,.92)',
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--t1)',
            }}
          >
            {p.cat}
          </span>
          <div style={{ position: 'absolute', bottom: 18, left: 20, right: 20 }}>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '-.02em',
                lineHeight: 1.15,
                textShadow: '0 2px 10px rgba(0,0,0,.3)',
              }}
            >
              {event.name}
            </h1>
          </div>
        </div>

        <div style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 16 }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13.5,
                color: 'var(--t2)',
              }}
            >
              <Ic n="cal" sz={15} c="var(--ac)" />
              {fd(event.date)}
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13.5,
                color: 'var(--t2)',
              }}
            >
              <Ic n="pin" sz={15} c="#C026D3" />
              {event.venue}
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13.5,
                color: 'var(--t2)',
              }}
            >
              <Ic n="usr" sz={15} c="var(--t3)" />
              {event.guests} registered
            </span>
          </div>

          <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.65, marginBottom: 18 }}>
            {p.blurb}
          </p>

          {event.cap > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>Capacity</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ac)' }}>
                  {event.guests}
                  <span style={{ color: 'var(--t3)', fontWeight: 400 }}>
                    {' '}
                    / {event.cap} ({pct}%)
                  </span>
                </span>
              </div>
              <div
                style={{ height: 7, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}
              >
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

          {open ? (
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={`/events/${event.id}/register`}>
                Register for this event
                <Ic n="arr" sz={16} c="#fff" />
              </Link>
            </Button>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 16px',
                borderRadius: 10,
                background: '#EFEDF4',
                color: '#6B6478',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <Ic n="alrt" sz={15} c="#6B6478" />
              Registration isn’t open for this event yet.
            </div>
          )}
        </div>
      </div>

      {/* agenda */}
      <div
        style={{
          background: 'var(--ca)',
          border: '1px solid var(--bo)',
          borderRadius: 'var(--r)',
          boxShadow: 'var(--sh)',
          padding: '18px 20px',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: 14 }}>
          What to expect
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {agenda.slice(0, 5).map((a) => (
            <div key={a.id} style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
              <span
                style={{
                  fontFamily: 'ui-monospace,Menlo,monospace',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'var(--ac)',
                  width: 48,
                  flexShrink: 0,
                }}
              >
                {a.time}
              </span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t1)' }}>{a.title}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>{a.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
