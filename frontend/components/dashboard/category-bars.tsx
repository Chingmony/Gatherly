import { CardHead, Pill, cardStyle } from '@/components/ui/primitives'

const CATS = [
  { label: 'Conferences', n: 9, pct: 38, color: 'var(--ac)' },
  { label: 'Galas & Socials', n: 6, pct: 25, color: '#C026D3' },
  { label: 'Product Launches', n: 5, pct: 21, color: '#A78BFA' },
  { label: 'Dinners', n: 4, pct: 16, color: '#2B2A3F' },
]

export function CategoryBars() {
  return (
    <div style={cardStyle}>
      <CardHead title="Events by Category" sub="24 events total" right={<Pill>All time</Pill>} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        {CATS.map((c) => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                width: 130,
                fontSize: 12.5,
                color: 'var(--t1)',
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              {c.label}
            </span>
            <div
              style={{
                flex: 1,
                height: 30,
                background: 'var(--bg)',
                borderRadius: 99,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: c.pct + '%',
                  background: c.color,
                  borderRadius: 99,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 10,
                  transition: 'width .6s cubic-bezier(.4,0,.2,1)',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{c.pct}%</span>
              </div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--t2)', minWidth: 64, textAlign: 'right' }}>
              <b style={{ color: 'var(--t1)' }}>{c.n}</b> events
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
