'use client'

import { useEffect, useRef, useState } from 'react'
import { Ic } from '@/components/ui/icon'
import type { CheckIn } from '@/lib/api'

const MG = [
  { guest: 'Ryo Tanaka', ev: 'TechConf 2026', ini: 'RT', col: '#7C3AED' },
  { guest: 'Fatima Al-Hassan', ev: 'Annual Gala 2026', ini: 'FH', col: '#C026D3' },
  { guest: 'David Osei', ev: 'TechConf 2026', ini: 'DO', col: '#2B2A3F' },
  { guest: 'Lia Kowalski', ev: 'Founders Dinner', ini: 'LK', col: '#7C3AED' },
  { guest: 'Kenji Park', ev: 'Annual Gala 2026', ini: 'KP', col: '#C026D3' },
]

export function Ticker({ init }: { init: CheckIn[] }) {
  const [feed, setFeed] = useState<CheckIn[]>(init)
  const idx = useRef(0)

  useEffect(() => {
    const t = setInterval(() => {
      const n = MG[idx.current % MG.length]
      idx.current++
      setFeed((p) => [{ ...n, id: Date.now(), at: 'Just now' }, ...p.slice(0, 7)])
    }, 5500)
    return () => clearInterval(t)
  }, [])

  return (
    <div
      style={{
        background: 'var(--ca)',
        border: '1px solid var(--bo)',
        borderRadius: 'var(--r)',
        boxShadow: 'var(--sh)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 420,
      }}
    >
      <div
        style={{
          padding: '13px 17px 11px',
          borderBottom: '1px solid var(--bo)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Live Check-ins</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>Real-time attendance</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--ac)',
              animation: 'pulse 2s infinite',
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--ac)', fontWeight: 700 }}>LIVE</span>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          borderBottom: '1px solid var(--bo)',
        }}
      >
        {[
          { l: 'Today', v: feed.length + 842 },
          { l: 'Session', v: feed.length },
          { l: 'Active', v: 3 },
        ].map(({ l, v }) => (
          <div
            key={l}
            style={{
              padding: '9px 14px',
              textAlign: 'center',
              borderRight: '1px solid var(--bo)',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)' }}>{v}</div>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {feed.map((c, i) => (
          <div
            key={c.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 17px',
              borderBottom: '1px solid var(--bo)',
              animation: i === 0 ? 'slideIn .35s ease' : 'none',
              background: i === 0 ? 'var(--ad)' : 'transparent',
              transition: 'background 2s',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: c.col,
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {c.ini}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--t1)' }}>{c.guest}</div>
              <div
                style={{
                  fontSize: 10.5,
                  color: 'var(--t3)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.ev}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 2,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'var(--ad)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ic n="chk" sz={10} c="var(--ac)" />
              </div>
              <span style={{ fontSize: 10, color: 'var(--t3)' }}>{c.at}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
