import { PublicEventCard } from '@/components/public/public-event-card'
import { listEvents } from '@/lib/api'

export default function HomePage() {
  const events = listEvents().filter((e) => e.status === 'Public')

  return (
    <div style={{ width: '100%', maxWidth: 1100 }}>
      {/* hero */}
      <section
        style={{
          textAlign: 'center',
          padding: '24px 16px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '6px 14px',
            borderRadius: 99,
            background: 'var(--ad)',
            color: 'var(--ac)',
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ac)' }} />
          {events.length} events open for registration
        </span>
        <h1
          style={{
            fontSize: 38,
            fontWeight: 700,
            letterSpacing: '-.03em',
            color: 'var(--t1)',
            lineHeight: 1.1,
            maxWidth: 720,
          }}
        >
          Discover events worth showing up for.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--t2)', maxWidth: 560, lineHeight: 1.6 }}>
          Browse upcoming events, grab your spot in seconds, and we’ll email you a QR ticket for a
          tap-and-go check-in at the door.
        </p>
      </section>

      {/* events grid */}
      <section>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h2
            style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.01em' }}
          >
            Upcoming events
          </h2>
          <span style={{ fontSize: 12.5, color: 'var(--t3)' }}>{events.length} events</span>
        </div>
        {events.length === 0 ? (
          <div
            style={{
              padding: '56px 16px',
              textAlign: 'center',
              color: 'var(--t3)',
              fontSize: 14,
              background: 'var(--ca)',
              border: '1px solid var(--bo)',
              borderRadius: 'var(--r)',
            }}
          >
            No events are open right now — check back soon.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))',
              gap: 18,
            }}
          >
            {events.map((event) => (
              <PublicEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
