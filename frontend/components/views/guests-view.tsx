'use client'

import { useState, type CSSProperties } from 'react'
import { Ic } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { StatCard } from '@/components/dashboard/stat-card'
import { GuestBadge } from '@/components/badges'
import { cardStyle } from '@/components/ui/primitives'
import { fd } from '@/lib/format'
import { listGuests } from '@/lib/api'
import type { Guest } from '@/lib/api'

const ALL = listGuests()

type SortKey = 'name' | 'ev' | 'reg'

export function GuestsView() {
  const [q, setQ] = useState('')
  const [ev, setEv] = useState('All')
  const [st, setSt] = useState<'All' | 'Checked-in' | 'Registered'>('All')
  const [sort, setSort] = useState<{ k: SortKey; dir: 'asc' | 'desc' }>({ k: 'reg', dir: 'desc' })
  const sortBy = (k: SortKey) =>
    setSort((s) => ({ k, dir: s.k === k && s.dir === 'asc' ? 'desc' : 'asc' }))

  const evs = ['All', ...Array.from(new Set(ALL.map((g) => g.ev)))]

  let list = ALL.filter(
    (g) =>
      (ev === 'All' || g.ev === ev) &&
      (st === 'All' || g.st === st) &&
      (!q || `${g.name} ${g.email} ${g.phone}`.toLowerCase().includes(q.toLowerCase()))
  )
  list = [...list].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1
    if (sort.k === 'name') return a.name.localeCompare(b.name) * dir
    if (sort.k === 'ev') return a.ev.localeCompare(b.ev) * dir
    return (new Date(a.reg).getTime() - new Date(b.reg).getTime()) * dir
  })

  const checked = ALL.filter((g) => g.st === 'Checked-in').length
  const awaiting = ALL.filter((g) => g.st === 'Registered').length
  const rate = Math.round((checked / ALL.length) * 100)

  const ths: { k: SortKey | 'phone' | 'tok' | 'st' | 'act'; l: string; s: boolean }[] = [
    { k: 'name', l: 'Guest', s: true },
    { k: 'phone', l: 'Phone', s: false },
    { k: 'ev', l: 'Event', s: true },
    { k: 'reg', l: 'Registered', s: true },
    { k: 'tok', l: 'Ticket', s: false },
    { k: 'st', l: 'Status', s: false },
    { k: 'act', l: '', s: false },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="dstats">
        <StatCard
          ic="usr"
          icC="#7C3AED"
          value={ALL.length}
          label="Total Registered"
          badge="+12"
          badgeType="up"
          sub="across all events"
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
          value={awaiting}
          label="Awaiting Arrival"
          badge="pending"
          badgeType="info"
          sub="not yet scanned"
        />
        <StatCard
          ic="report"
          icC="#7C3AED"
          value={`${rate}%`}
          label="Check-in Rate"
          badge="live"
          badgeType="info"
          sub="of registrations"
        />
      </div>

      <div
        style={{
          ...cardStyle,
          padding: '13px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
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
            placeholder="Search guests, email, phone…"
            className="h-9 pl-9 text-[13px]"
          />
        </div>
        <Select value={ev} onValueChange={setEv}>
          <SelectTrigger className="h-9 max-w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {evs.map((e) => (
              <SelectItem key={e} value={e}>
                {e === 'All' ? 'All events' : e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div
          style={{ display: 'flex', background: 'var(--bg)', borderRadius: 10, padding: 3, gap: 2 }}
        >
          {(['All', 'Checked-in', 'Registered'] as const).map((o) => (
            <button
              key={o}
              onClick={() => setSt(o)}
              style={{
                padding: '6px 12px',
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12.5,
                fontWeight: st === o ? 600 : 500,
                background: st === o ? 'var(--ca)' : 'transparent',
                color: st === o ? 'var(--ac)' : 'var(--t2)',
                boxShadow: st === o ? 'var(--sh)' : 'none',
                transition: 'all .15s',
                whiteSpace: 'nowrap',
              }}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFE' }}>
                {ths.map((h) => (
                  <th
                    key={h.k}
                    onClick={() => h.s && sortBy(h.k as SortKey)}
                    style={{
                      padding: '12px 16px',
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
              {list.map((g) => (
                <GuestRow key={g.id} g={g} />
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>
            No guests match your filters.
          </div>
        )}
      </div>
    </div>
  )
}

function GuestRow({ g }: { g: Guest }) {
  const [hov, setHov] = useState(false)
  const { toast } = useToast()
  const td: CSSProperties = { padding: '12px 16px', borderBottom: '1px solid var(--bo)' }
  return (
    <tr
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ cursor: 'pointer', background: hov ? '#FAFAFE' : 'transparent' }}
    >
      <td style={td}>
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
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{g.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>{g.email}</div>
          </div>
        </div>
      </td>
      <td style={{ ...td, fontSize: 12.5, color: 'var(--t2)', whiteSpace: 'nowrap' }}>{g.phone}</td>
      <td style={{ ...td, fontSize: 12.5, color: 'var(--t2)', whiteSpace: 'nowrap' }}>{g.ev}</td>
      <td style={{ ...td, fontSize: 12.5, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
        {fd(g.reg)}
      </td>
      <td style={td}>
        <span
          style={{
            fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace',
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
      <td style={td}>
        <GuestBadge s={g.st} />
      </td>
      <td style={{ ...td, textAlign: 'right' }}>
        <button
          title="Resend QR ticket"
          onClick={() => toast(`Ticket re-sent to ${g.email}`)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 11px',
            borderRadius: 8,
            border: '1px solid var(--bo)',
            background: 'var(--ca)',
            color: 'var(--t2)',
            fontSize: 11.5,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Ic n="mail" sz={13} c="var(--ac)" />
          Resend
        </button>
      </td>
    </tr>
  )
}
