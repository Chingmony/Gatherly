'use client'

import { useState } from 'react'
import { Ic } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { CreateEventDialog } from '@/components/events/create-event-dialog'
import { EvBadge } from '@/components/badges'
import { fd, initials } from '@/lib/format'
import { listEvents, useApiData } from '@/lib/api'

export function EvTable() {
  const { data } = useApiData(() => listEvents(), [])
  const events = data ?? []
  const [filt, setFilt] = useState<'All' | 'Public' | 'Draft'>('All')
  const [hov, setHov] = useState<string | null>(null)
  const list = filt === 'All' ? events : events.filter((e) => e.status === filt)

  return (
    <div
      style={{
        background: 'var(--ca)',
        border: '1px solid var(--bo)',
        borderRadius: 'var(--r)',
        boxShadow: 'var(--sh)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '13px 18px 0', borderBottom: '1px solid var(--bo)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Events Overview</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>
              {events.length} total events
            </div>
          </div>
          <CreateEventDialog
            trigger={
              <Button size="sm">
                <Ic n="plus" sz={13} c="#fff" />
                New Event
              </Button>
            }
          />
        </div>
        <div style={{ display: 'flex' }}>
          {(['All', 'Public', 'Draft'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilt(f)}
              style={{
                padding: '6px 14px',
                background: 'none',
                border: 'none',
                borderBottom: filt === f ? '2px solid var(--ac)' : '2px solid transparent',
                color: filt === f ? 'var(--ac)' : 'var(--t2)',
                fontSize: 13,
                fontWeight: filt === f ? 600 : 400,
                cursor: 'pointer',
                transition: 'all .15s',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FAFAFA' }}>
              {['Event', 'Date', 'Venue', 'Sub-admin', 'Guests', 'Status'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '8px 14px',
                    textAlign: 'left',
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    color: 'var(--t3)',
                    borderBottom: '1px solid var(--bo)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((ev) => (
              <tr
                key={ev.id}
                onMouseEnter={() => setHov(ev.id)}
                onMouseLeave={() => setHov(null)}
                style={{
                  background: hov === ev.id ? '#FAFAFE' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background .1s',
                }}
              >
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--bo)' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)' }}>
                    {ev.name}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--bo)' }}>
                  <span style={{ fontSize: 12, color: 'var(--t2)' }}>{fd(ev.date)}</span>
                </td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--bo)' }}>
                  <span
                    style={{
                      fontSize: 11.5,
                      color: 'var(--t2)',
                      display: 'block',
                      maxWidth: 130,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {ev.venue}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--bo)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'var(--ac)',
                        color: '#fff',
                        fontSize: 8.5,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {initials(ev.sa)}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--t2)' }}>{ev.sa}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--bo)' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--t1)' }}>
                    {ev.guests > 0 ? `${ev.guests} / ${ev.cap}` : '—'}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--bo)' }}>
                  <EvBadge s={ev.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
