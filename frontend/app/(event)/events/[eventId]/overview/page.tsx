import Link from 'next/link'
import { StatCard } from '@/components/dashboard/stat-card'
import { Ic, type IconName } from '@/components/ui/icon'
import { CardHead, cardStyle } from '@/components/ui/primitives'
import { MatBadge } from '@/components/badges'
import { getEvent, guestsForEvent, listEventMembers, getAgenda, materialsForEvent } from '@/lib/api'
import { STS, SM } from '@/lib/status'

export default async function OverviewPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const event = getEvent(eventId)!
  const evGuests = guestsForEvent(event.name)
  const checkedIn = evGuests.filter((g) => g.st === 'Checked-in').length
  const evMats = materialsForEvent(event.name)
  const eventMembers = listEventMembers(eventId)
  const eventAgenda = getAgenda(eventId)
  const doneMats = evMats.filter((m) => m.s === 'Done').length
  const pct = event.cap > 0 ? Math.round((event.guests / event.cap) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="dstats">
        <StatCard
          ic="usr"
          icC="#7C3AED"
          value={`${event.guests}/${event.cap}`}
          label="Registrations"
          badge={`${pct}%`}
          badgeType="up"
          sub="of capacity"
        />
        <StatCard
          ic="qr"
          icC="#C026D3"
          value={checkedIn}
          label="Checked In"
          badge="live"
          badgeType="info"
          sub="via QR scan"
        />
        <StatCard
          ic="pkg"
          icC="#7C3AED"
          value={`${doneMats}/${evMats.length}`}
          label="Materials Done"
          badgeType="info"
          sub="across the event"
        />
        <StatCard
          ic="usr"
          icC="#2B2A3F"
          value={eventMembers.length}
          label="Team Members"
          badgeType="info"
          sub="managers & handlers"
        />
      </div>

      <div className="dcharts">
        {/* materials breakdown */}
        <div style={cardStyle}>
          <CardHead title="Material Status" sub={`${evMats.length} items for this event`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {STS.map((s) => {
              const n = evMats.filter((m) => m.s === s).length
              const w = evMats.length ? Math.round((n / evMats.length) * 100) : 0
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 110, flexShrink: 0 }}>
                    <MatBadge s={s} sm />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      background: 'var(--bg)',
                      borderRadius: 99,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${w}%`,
                        background: SM[s].dot,
                        borderRadius: 99,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      width: 24,
                      textAlign: 'right',
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--t1)',
                    }}
                  >
                    {n}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* next agenda + quick actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={cardStyle}>
            <CardHead title="Agenda preview" sub="First sessions" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {eventAgenda.slice(0, 3).map((a) => (
                <div key={a.id} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                  <span
                    style={{
                      fontFamily: 'ui-monospace,Menlo,monospace',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--ac)',
                      width: 44,
                      flexShrink: 0,
                    }}
                  >
                    {a.time}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>{a.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={cardStyle}>
            <CardHead title="Quick actions" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(
                [
                  { seg: 'form-builder', label: 'Edit form', icon: 'edit' },
                  { seg: 'members', label: 'Delegate', icon: 'usr' },
                  { seg: 'scan', label: 'Open scanner', icon: 'qr' },
                  { seg: 'guests', label: 'Guest list', icon: 'ticket' },
                ] as { seg: string; label: string; icon: IconName }[]
              ).map((a) => (
                <Link
                  key={a.seg}
                  href={`/events/${eventId}/${a.seg}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '12px 14px',
                    borderRadius: 11,
                    background: 'var(--bg)',
                    border: '1px solid var(--bo)',
                    textDecoration: 'none',
                    color: 'var(--t1)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <Ic n={a.icon} sz={16} c="var(--ac)" />
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
