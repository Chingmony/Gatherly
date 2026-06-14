'use client'

import { useState } from 'react'
import { CardHead, Pill, cardStyle } from '@/components/ui/primitives'

export interface DonutDatum {
  label: string
  value: number
  color: string
}

function Donut({
  data,
  size = 184,
  thick = 26,
  active,
  onHover,
}: {
  data: DonutDatum[]
  size?: number
  thick?: number
  active: string | null
  onHover: (label: string | null) => void
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const r = (size - thick - 8) / 2
  const C = 2 * Math.PI * r
  const gap = 3.5
  // Precompute each segment's cumulative offset (pure — no render-time reassignment).
  const visible = data.filter((d) => d.value > 0)
  const fracs = visible.map((d) => d.value / total)
  const segments = visible.map((d, i) => ({
    d,
    frac: fracs[i],
    off: -fracs.slice(0, i).reduce((a, b) => a + b, 0) * C,
  }))
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--bg)"
        strokeWidth={thick}
      />
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {segments.map(({ d, frac, off }, i) => {
          const len = Math.max(frac * C - gap, 0.1)
          const on = active === d.label
          const dim = active !== null && !on
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={on ? thick + 5 : thick}
              opacity={dim ? 0.3 : 1}
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={off}
              strokeLinecap="round"
              onMouseEnter={() => onHover(d.label)}
              onMouseLeave={() => onHover(null)}
              style={{ transition: 'opacity .2s, stroke-width .2s', cursor: 'pointer' }}
            />
          )
        })}
      </g>
    </svg>
  )
}

export function DonutCard({ data, total }: { data: DonutDatum[]; total: number }) {
  const [active, setActive] = useState<string | null>(null)
  const cur = active ? data.find((d) => d.label === active) : null
  return (
    <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
      <CardHead title="Material Status" right={<Pill>All events</Pill>} />
      <div style={{ position: 'relative', width: 184, height: 184, margin: '2px auto 18px' }}>
        <Donut data={data} active={active} onHover={setActive} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              color: cur ? cur.color : 'var(--t1)',
              lineHeight: 1,
              letterSpacing: '-.02em',
              transition: 'color .2s',
            }}
          >
            {cur ? cur.value : total}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--t3)',
              marginTop: 4,
              fontWeight: 500,
              maxWidth: 96,
              textAlign: 'center',
            }}
          >
            {cur ? cur.label : 'Total materials'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 'auto' }}>
        {data.map((d) => {
          const on = active === d.label
          return (
            <div
              key={d.label}
              onMouseEnter={() => setActive(d.label)}
              onMouseLeave={() => setActive(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 9px',
                borderRadius: 10,
                background: on ? 'var(--bg)' : 'transparent',
                cursor: 'pointer',
                transition: 'background .15s',
              }}
            >
              <span
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 4,
                  background: d.color,
                  flexShrink: 0,
                  transform: on ? 'scale(1.18)' : 'none',
                  transition: 'transform .15s',
                }}
              />
              <span
                style={{
                  fontSize: 12.5,
                  color: on ? 'var(--t1)' : 'var(--t2)',
                  fontWeight: on ? 600 : 500,
                  flex: 1,
                }}
              >
                {d.label}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{d.value}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: on ? d.color : 'var(--t3)',
                  background: on ? '#fff' : 'var(--bg)',
                  border: '1px solid var(--bo)',
                  borderRadius: 99,
                  padding: '2px 8px',
                  minWidth: 40,
                  textAlign: 'center',
                  transition: 'color .15s',
                }}
              >
                {Math.round((d.value / (total || 1)) * 100)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
