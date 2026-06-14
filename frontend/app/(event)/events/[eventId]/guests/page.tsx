import { Ic } from '@/components/ui/icon'
import { GuestBadge } from '@/components/badges'
import { StatCard } from '@/components/dashboard/stat-card'
import { ToastButton } from '@/components/ui/toast-button'
import { cardStyle } from '@/components/ui/primitives'
import { fd } from '@/lib/format'
import { getEvent, guestsForEvent } from '@/lib/api'

export default async function EventGuestsPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  const event = getEvent(eventId)!
  const list = guestsForEvent(event.name)
  const checked = list.filter((g) => g.st === 'Checked-in').length
  const rate = list.length ? Math.round((checked / list.length) * 100) : 0

  const cell: React.CSSProperties = { padding: '12px 16px', borderBottom: '1px solid var(--bo)' }
  const th: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: '.06em',
    textTransform: 'uppercase',
    color: 'var(--t3)',
    borderBottom: '1px solid var(--bo)',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        <StatCard
          ic="usr"
          icC="#7C3AED"
          value={list.length}
          label="Registered"
          badgeType="info"
          sub="for this event"
        />
        <StatCard
          ic="qr"
          icC="#C026D3"
          value={checked}
          label="Checked In"
          badge={`${rate}%`}
          badgeType="up"
          sub="via QR scan"
        />
        <StatCard
          ic="ticket"
          icC="#2B2A3F"
          value={list.length - checked}
          label="Awaiting"
          badgeType="info"
          sub="not yet scanned"
        />
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFE' }}>
                {['Guest', 'Phone', 'Registered', 'Ticket', 'Status', ''].map((h, i) => (
                  <th key={i} style={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((g) => (
                <tr key={g.id}>
                  <td style={cell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: g.col,
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {g.ini}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>
                          {g.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>{g.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...cell, fontSize: 12.5, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                    {g.phone}
                  </td>
                  <td style={{ ...cell, fontSize: 12.5, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                    {fd(g.reg)}
                  </td>
                  <td style={cell}>
                    <span
                      style={{
                        fontFamily: 'ui-monospace,Menlo,monospace',
                        fontSize: 11.5,
                        color: 'var(--t2)',
                        background: 'var(--bg)',
                        border: '1px solid var(--bo)',
                        borderRadius: 6,
                        padding: '3px 8px',
                      }}
                    >
                      {g.tok}
                    </span>
                  </td>
                  <td style={cell}>
                    <GuestBadge s={g.st} />
                  </td>
                  <td style={{ ...cell, textAlign: 'right' }}>
                    <ToastButton
                      title="Resend QR ticket"
                      variant="secondary"
                      size="sm"
                      message={`Ticket re-sent to ${g.email}`}
                    >
                      <Ic n="mail" sz={13} c="var(--ac)" />
                      Resend
                    </ToastButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>
            No guests have registered for this event yet.
          </div>
        )}
      </div>
    </div>
  )
}
