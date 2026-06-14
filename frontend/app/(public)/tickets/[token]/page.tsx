import Link from 'next/link'
import { Ic } from '@/components/ui/icon'
import { TicketView } from '@/components/public/ticket-view'
import { cardStyle } from '@/components/ui/primitives'
import { getTicket, getEvent, listEvents } from '@/lib/api'

export default async function TicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const guest = getTicket(token)

  if (!guest) {
    return (
      <div
        style={{
          ...cardStyle,
          width: '100%',
          maxWidth: 420,
          textAlign: 'center',
          padding: '36px 28px',
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: '#EAE8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
          }}
        >
          <Ic n="x" sz={24} c="#2B2A3F" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)' }}>Ticket not found</div>
        <p style={{ fontSize: 13, color: 'var(--t2)', marginTop: 8 }}>
          That ticket code doesn&apos;t match any registration. Check the link in your email.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            marginTop: 18,
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--ac)',
            textDecoration: 'none',
          }}
        >
          ← Back to Gatherly
        </Link>
      </div>
    )
  }

  const event = listEvents().find((e) => e.name === guest.ev) ?? getEvent('1')!
  return <TicketView guest={guest} eventDate={event.date} venue={event.venue} />
}
