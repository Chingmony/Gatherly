'use client'

import { useEffect, useRef, useState } from 'react'
import { Ic } from '@/components/ui/icon'
import { MatBadge } from '@/components/badges'
import { STS, SM, PC } from '@/lib/status'
import type { MaterialRow, MaterialStatus } from '@/lib/api'

function MatCard({
  mat,
  onCh,
}: {
  mat: MaterialRow
  onCh: (id: number, s: MaterialStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div
      style={{
        background: 'var(--ca)',
        border: '1px solid var(--bo)',
        borderRadius: 'var(--rs)',
        padding: 12,
        marginBottom: 8,
        boxShadow: 'var(--sh)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 8 }}>
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: PC[mat.p] ?? '#94A3B8',
            flexShrink: 0,
            marginTop: 5,
          }}
        />
        <div
          style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--t1)', flex: 1, lineHeight: 1.35 }}
        >
          {mat.name}
        </div>
      </div>
      <div
        style={{
          display: 'inline-block',
          padding: '2px 7px',
          background: 'var(--ad)',
          borderRadius: 5,
          fontSize: 11,
          color: 'var(--ac)',
          fontWeight: 500,
          marginBottom: 10,
        }}
      >
        {mat.ev.length > 20 ? mat.ev.slice(0, 19) + '…' : mat.ev}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {mat.hi ? (
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
            {mat.hi}
          </div>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--t3)' }}>Unassigned</span>
        )}
        <div style={{ position: 'relative' }} ref={ref}>
          <div onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
            <MatBadge s={mat.s} sm />
          </div>
          {open && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: 4,
                background: 'var(--ca)',
                border: '1px solid var(--bo)',
                borderRadius: 10,
                boxShadow: '0 8px 28px rgba(14,10,32,.16)',
                zIndex: 300,
                padding: 5,
                minWidth: 155,
              }}
            >
              {STS.map((st) => (
                <div
                  key={st}
                  onClick={() => {
                    onCh(mat.id, st)
                    setOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: mat.s === st ? 'var(--ad)' : 'transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = mat.s === st ? 'var(--ad)' : 'transparent')
                  }
                >
                  <MatBadge s={st} sm />
                  {mat.s === st && <Ic n="chk" sz={11} c="var(--ac)" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Kanban({ initial }: { initial: MaterialRow[] }) {
  const [mats, setMats] = useState<MaterialRow[]>(initial)
  const onCh = (id: number, s: MaterialStatus) =>
    setMats((prev) => prev.map((m) => (m.id === id ? { ...m, s } : m)))

  const byS = STS.reduce<Record<MaterialStatus, MaterialRow[]>>(
    (a, s) => {
      a[s] = mats.filter((m) => m.s === s)
      return a
    },
    {} as Record<MaterialStatus, MaterialRow[]>
  )

  return (
    <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6 }}>
      {STS.map((s) => {
        const m = SM[s]
        const ls = byS[s]
        return (
          <div
            key={s}
            style={{ minWidth: 210, flex: '0 0 210px', display: 'flex', flexDirection: 'column' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '6px 0 10px',
                borderBottom: `2px solid ${m.dot}`,
                marginBottom: 10,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.dot }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)' }}>{s}</span>
              <span
                style={{
                  marginLeft: 'auto',
                  background: m.bg,
                  color: m.c,
                  borderRadius: 99,
                  padding: '1px 7px',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {ls.length}
              </span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 480 }}>
              {ls.map((mat) => (
                <MatCard key={mat.id} mat={mat} onCh={onCh} />
              ))}
              {!ls.length && (
                <div
                  style={{
                    padding: '18px 0',
                    textAlign: 'center',
                    fontSize: 11,
                    color: 'var(--t3)',
                    fontStyle: 'italic',
                  }}
                >
                  No items
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
