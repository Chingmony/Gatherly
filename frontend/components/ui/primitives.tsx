import type { CSSProperties, ReactNode } from 'react'
import { Ic } from './icon'

/** Shared card surface style (--ca / --bo / --r / --sh). */
export const cardStyle: CSSProperties = {
  background: 'var(--ca)',
  border: '1px solid var(--bo)',
  borderRadius: 'var(--r)',
  boxShadow: 'var(--sh)',
  padding: '18px 20px',
}

export function CardHead({
  title,
  sub,
  right,
}: {
  title: ReactNode
  sub?: ReactNode
  right?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 10,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--t1)',
            letterSpacing: '-.01em',
          }}
        >
          {title}
        </div>
        {sub && <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  )
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 11px',
        borderRadius: 8,
        background: 'var(--bg)',
        border: '1px solid var(--bo)',
        fontSize: 11.5,
        fontWeight: 600,
        color: 'var(--t2)',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
      }}
    >
      {children}
      <Ic n="chv" sz={12} c="var(--t3)" />
    </span>
  )
}
