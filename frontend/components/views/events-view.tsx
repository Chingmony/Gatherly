'use client'

import { useState, type CSSProperties } from 'react'
import { Ic } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreateEventDialog } from '@/components/events/create-event-dialog'
import { EvBadge } from '@/components/badges'
import { EvCardRich } from '@/components/events/ev-card-rich'
import { fd, initials } from '@/lib/format'
import { listEvents } from '@/lib/api'
import type { EventRow } from '@/lib/api'

const ALL = listEvents()

type SortKey = 'name' | 'date' | 'guests'
type Filt = 'All' | 'Public' | 'Draft'

export function EventsView() {
  const [filt, setFilt] = useState<Filt>('All')
  const [mode, setMode] = useState<'grid' | 'table'>('grid')
  const [sort, setSort] = useState<{ k: SortKey; dir: 'asc' | 'desc' }>({ k: 'date', dir: 'asc' })
  const [q, setQ] = useState('')

  const sortBy = (k: SortKey) =>
    setSort((s) => ({ k, dir: s.k === k && s.dir === 'asc' ? 'desc' : 'asc' }))

  const tabs: { k: Filt; l: string; v: number }[] = [
    { k: 'All', l: 'All Events', v: ALL.length },
    { k: 'Public', l: 'Published', v: ALL.filter((e) => e.status === 'Public').length },
    { k: 'Draft', l: 'Draft', v: ALL.filter((e) => e.status === 'Draft').length },
  ]

  let filtered = ALL.filter(
    (e) =>
      (filt === 'All' || e.status === filt) &&
      (!q || `${e.name} ${e.venue} ${e.sa}`.toLowerCase().includes(q.toLowerCase()))
  )
  filtered = [...filtered].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1
    if (sort.k === 'name') return a.name.localeCompare(b.name) * dir
    if (sort.k === 'guests') return (a.guests - b.guests) * dir
    return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir
  })

  const ths: { k: SortKey | 'venue' | 'sa' | 'status'; l: string; s: boolean }[] = [
    { k: 'name', l: 'Event', s: true },
    { k: 'date', l: 'Date', s: true },
    { k: 'venue', l: 'Venue', s: false },
    { k: 'sa', l: 'Sub-admin', s: false },
    { k: 'guests', l: 'Guests', s: true },
    { k: 'status', l: 'Status', s: false },
  ]

  const ctlBox: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    background: 'var(--ca)',
    border: '1px solid rgba(228,225,244,.6)',
    borderRadius: 11,
    padding: 3,
    boxShadow: '0 2px 8px rgba(24,16,48,.04)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: 4,
            background: 'var(--ca)',
            border: '1px solid rgba(228,225,244,.6)',
            borderRadius: 13,
            boxShadow: '0 2px 8px rgba(24,16,48,.04)',
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.k}
              onClick={() => setFilt(t.k)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 15px',
                borderRadius: 10,
                background: filt === t.k ? 'var(--ac)' : 'transparent',
                border: 'none',
                color: filt === t.k ? '#fff' : 'var(--t2)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all .15s',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1 }}>{t.v}</span>
              {t.l}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <CreateEventDialog
          trigger={
            <Button>
              <Ic n="plus" sz={15} c="#fff" />
              Propose New Event
            </Button>
          }
        />
      </div>

      {/* toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 170 }}>
          <div
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          >
            <Ic n="srch" sz={14} c="var(--t3)" />
          </div>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events…"
            className="bg-card pl-9 text-[13px]"
          />
        </div>
        <Select value={sort.k} onValueChange={(v) => setSort({ k: v as SortKey, dir: 'asc' })}>
          <SelectTrigger className="w-[150px] bg-card">
            <span className="text-muted-foreground">
              Sort: <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="guests">Guests</SelectItem>
          </SelectContent>
        </Select>
        <div style={ctlBox}>
          {(
            [
              { m: 'grid', n: 'dash' },
              { m: 'table', n: 'lst' },
            ] as const
          ).map(({ m, n }) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              title={`${m} view`}
              style={{
                width: 36,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                background: mode === m ? 'var(--ad)' : 'transparent',
                transition: 'all .15s',
              }}
            >
              <Ic n={n} sz={17} c={mode === m ? 'var(--ac)' : 'var(--t3)'} />
            </button>
          ))}
        </div>
      </div>

      {mode === 'grid' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))',
            gap: 18,
          }}
        >
          {filtered.map((ev) => (
            <EvCardRich key={ev.id} ev={ev} />
          ))}
          <CreateEventDialog
            trigger={
              <button
                style={{
                  border: '1.5px dashed rgba(124,58,237,.3)',
                  borderRadius: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  minHeight: 200,
                  color: 'var(--t3)',
                  transition: 'all .2s',
                  background: 'transparent',
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: 'var(--ad)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background .2s',
                  }}
                >
                  <Ic n="plus" sz={22} c="var(--ac)" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac)' }}>
                  Propose New Event
                </span>
              </button>
            }
          />
        </div>
      ) : (
        <div
          style={{
            background: 'var(--ca)',
            border: '1px solid var(--bo)',
            borderRadius: 'var(--r)',
            boxShadow: 'var(--sh)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAFE' }}>
                  {ths.map((h) => (
                    <th
                      key={h.k}
                      onClick={() => h.s && sortBy(h.k as SortKey)}
                      style={{
                        padding: '13px 16px',
                        textAlign: 'left',
                        fontSize: 10.5,
                        fontWeight: 600,
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        color: 'var(--t3)',
                        borderBottom: '1px solid var(--bo)',
                        cursor: h.s ? 'pointer' : 'default',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {h.l}
                        {h.s && sort.k === h.k && (
                          <span
                            style={{
                              transform: sort.dir === 'desc' ? 'rotate(180deg)' : 'none',
                              display: 'inline-flex',
                            }}
                          >
                            <Ic n="chv" sz={12} c="var(--ac)" />
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((ev) => (
                  <Row key={ev.id} ev={ev} />
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>
              No events match your filters.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ ev }: { ev: EventRow }) {
  const [hov, setHov] = useState(false)
  const td: CSSProperties = { padding: '13px 16px', borderBottom: '1px solid var(--bo)' }
  return (
    <tr
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ cursor: 'pointer', background: hov ? '#FAFAFE' : 'transparent' }}
    >
      <td style={{ ...td, fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{ev.name}</td>
      <td style={{ ...td, fontSize: 12.5, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
        {fd(ev.date)}
      </td>
      <td
        style={{
          ...td,
          fontSize: 12,
          color: 'var(--t2)',
          maxWidth: 220,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {ev.venue}
      </td>
      <td style={td}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'var(--ac)',
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {initials(ev.sa)}
          </div>
          <span style={{ fontSize: 12.5, color: 'var(--t2)', whiteSpace: 'nowrap' }}>{ev.sa}</span>
        </div>
      </td>
      <td
        style={{ ...td, fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap' }}
      >
        {ev.guests > 0 ? `${ev.guests} / ${ev.cap}` : '—'}
      </td>
      <td style={td}>
        <EvBadge s={ev.status} />
      </td>
    </tr>
  )
}
