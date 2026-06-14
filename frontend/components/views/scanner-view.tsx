'use client'

import { useState, type CSSProperties } from 'react'
import { Ic, type IconName } from '@/components/ui/icon'
import { CardHead, cardStyle } from '@/components/ui/primitives'
import { listGuests } from '@/lib/api'
import type { Guest } from '@/lib/api'

type ResultType = 'ok' | 'dup' | 'bad'

const SCAN_RES: Record<ResultType, { bg: string; fg: string; ic: IconName; sub: string }> = {
  ok: {
    bg: 'var(--ac)',
    fg: '#fff',
    ic: 'chk',
    sub: 'Attendance confirmed · forwarded to Telegram',
  },
  dup: {
    bg: 'var(--ad)',
    fg: 'var(--ac)',
    ic: 'alrt',
    sub: 'This ticket was already scanned earlier',
  },
  bad: { bg: '#2B2A3F', fg: '#fff', ic: 'x', sub: 'QR not recognized for this event' },
}

interface Result {
  type: ResultType
  guest?: Guest
  time: string
}
interface FeedItem {
  id: number
  type: ResultType
  name: string
  at: string
}

export function ScannerView() {
  const DB = listGuests().filter((g) => g.st !== 'Cancelled')
  const [checked, setChecked] = useState<Set<number>>(
    () => new Set(DB.filter((g) => g.st === 'Checked-in').map((g) => g.id))
  )
  const [result, setResult] = useState<Result | null>(null)
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [tok, setTok] = useState('')
  const [stats, setStats] = useState({ scanned: 0, ok: 0, dup: 0, bad: 0 })
  const evName = 'TechConf 2026'

  const now = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const record = (type: ResultType, name: string) => {
    setStats((s) => ({ ...s, scanned: s.scanned + 1, [type]: s[type] + 1 }))
    setFeed((f) => [{ id: Date.now() + Math.random(), type, name, at: now() }, ...f.slice(0, 7)])
  }

  const doScan = (g: Guest | null) => {
    if (!g) {
      setResult({ type: 'bad', time: now() })
      record('bad', 'Unknown ticket')
      return
    }
    if (checked.has(g.id)) {
      setResult({ type: 'dup', guest: g, time: now() })
      record('dup', g.name)
      return
    }
    setChecked((c) => {
      const n = new Set(c)
      n.add(g.id)
      return n
    })
    setResult({ type: 'ok', guest: g, time: now() })
    record('ok', g.name)
  }

  const simulate = () => {
    const open = DB.filter((g) => !checked.has(g.id))
    const pool = open.length && Math.random() > 0.18 ? open : DB
    doScan(pool[Math.floor(Math.random() * pool.length)])
  }

  const manual = () => {
    const g = DB.find((x) => x.tok.toLowerCase() === tok.trim().toLowerCase())
    doScan(g ?? null)
    setTok('')
  }

  const r = result ? SCAN_RES[result.type] : null

  return (
    <div className="dgrid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <div style={cardStyle}>
          <CardHead
            title="Organizer Scanner"
            sub="Scan a guest's QR ticket to confirm attendance"
            right={
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '6px 12px',
                  borderRadius: 9,
                  background: 'var(--ad)',
                  color: 'var(--ac)',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Ic n="cal" sz={13} c="var(--ac)" />
                {evName}
              </span>
            }
          />
          {/* camera viewport */}
          <div
            onClick={simulate}
            title="Tap to simulate a scan"
            style={{
              position: 'relative',
              height: 240,
              borderRadius: 16,
              overflow: 'hidden',
              cursor: 'pointer',
              background: 'radial-gradient(circle at 50% 40%,#3B2A63,#15101F)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 28,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 168,
                height: 2,
                background: 'linear-gradient(90deg,transparent,var(--ac),transparent)',
                animation: 'scan 2.4s ease-in-out infinite',
                boxShadow: '0 0 12px var(--ac)',
              }}
            />
            <div style={{ position: 'relative', width: 168, height: 168 }}>
              {(
                [
                  [
                    'nw',
                    {
                      top: 0,
                      left: 0,
                      borderTop: '3px solid rgba(255,255,255,.85)',
                      borderLeft: '3px solid rgba(255,255,255,.85)',
                      borderRadius: '8px 0 0 0',
                    },
                  ],
                  [
                    'ne',
                    {
                      top: 0,
                      right: 0,
                      borderTop: '3px solid rgba(255,255,255,.85)',
                      borderRight: '3px solid rgba(255,255,255,.85)',
                      borderRadius: '0 8px 0 0',
                    },
                  ],
                  [
                    'sw',
                    {
                      bottom: 0,
                      left: 0,
                      borderBottom: '3px solid rgba(255,255,255,.85)',
                      borderLeft: '3px solid rgba(255,255,255,.85)',
                      borderRadius: '0 0 0 8px',
                    },
                  ],
                  [
                    'se',
                    {
                      bottom: 0,
                      right: 0,
                      borderBottom: '3px solid rgba(255,255,255,.85)',
                      borderRight: '3px solid rgba(255,255,255,.85)',
                      borderRadius: '0 0 8px 0',
                    },
                  ],
                ] as [string, CSSProperties][]
              ).map(([k, st]) => (
                <span key={k} style={{ position: 'absolute', width: 30, height: 30, ...st }} />
              ))}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  color: 'rgba(255,255,255,.6)',
                }}
              >
                <Ic n="qr" sz={34} c="rgba(255,255,255,.55)" />
                <span style={{ fontSize: 11, fontWeight: 500 }}>Tap to scan</span>
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                color: 'rgba(255,255,255,.55)',
              }}
            >
              <Ic n="cam" sz={13} c="rgba(255,255,255,.55)" />
              Camera active
            </div>
          </div>

          {/* result banner */}
          {r && result && (
            <div
              style={{
                marginTop: 14,
                borderRadius: 13,
                background: r.bg,
                color: r.fg,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 13,
                animation: 'slideIn .3s ease',
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: result.type === 'dup' ? 'var(--ac)' : 'rgba(255,255,255,.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Ic n={r.ic} sz={20} c={result.type === 'dup' ? '#fff' : r.fg} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>
                  {result.type === 'ok'
                    ? `${result.guest?.name} checked in`
                    : result.type === 'dup'
                      ? `${result.guest?.name} — already checked in`
                      : 'Invalid or revoked ticket'}
                </div>
                <div style={{ fontSize: 12, opacity: 0.85, marginTop: 1 }}>{r.sub}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.9, whiteSpace: 'nowrap' }}>
                {result.time}
              </span>
            </div>
          )}

          {/* manual entry */}
          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              >
                <Ic n="ticket" sz={14} c="var(--t3)" />
              </div>
              <input
                value={tok}
                onChange={(e) => setTok(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && manual()}
                placeholder="Enter ticket code (e.g. GTHR-7F3A9C)"
                style={{
                  width: '100%',
                  border: '1px solid var(--bo)',
                  borderRadius: 10,
                  background: 'var(--bg)',
                  padding: '11px 12px 11px 36px',
                  fontSize: 13,
                  color: 'var(--t1)',
                  outline: 'none',
                  fontFamily: 'ui-monospace,Menlo,monospace',
                }}
              />
            </div>
            <button
              onClick={manual}
              style={{
                padding: '11px 20px',
                borderRadius: 10,
                background: 'var(--ac)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Check in
            </button>
          </div>
          <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--t3)' }}>
            Manual entry is a fallback when the camera can&apos;t read a code. Try{' '}
            <b style={{ color: 'var(--t2)' }}>GTHR-9D44A1</b> or{' '}
            <b style={{ color: 'var(--t2)' }}>GTHR-XXXX</b> for an invalid result.
          </div>
        </div>
      </div>

      {/* right rail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 14 }}>
            This Session
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { l: 'Scanned', v: stats.scanned, c: 'var(--t1)' },
              { l: 'Checked in', v: stats.ok, c: 'var(--ac)' },
              { l: 'Duplicates', v: stats.dup, c: '#C026D3' },
              { l: 'Invalid', v: stats.bad, c: '#2B2A3F' },
            ].map((s) => (
              <div
                key={s.l}
                style={{ background: 'var(--bg)', borderRadius: 12, padding: '13px 14px' }}
              >
                <div style={{ fontSize: 24, fontWeight: 700, color: s.c, lineHeight: 1 }}>
                  {s.v}
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            ...cardStyle,
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 280,
          }}
        >
          <div
            style={{
              padding: '14px 16px 12px',
              borderBottom: '1px solid var(--bo)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>
              Recent Scans
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--ac)',
                  animation: 'pulse 2s infinite',
                }}
              />
              <span style={{ fontSize: 10.5, color: 'var(--ac)', fontWeight: 700 }}>LIVE</span>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {feed.length === 0 && (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--t3)',
                  fontSize: 12,
                }}
              >
                Scans will appear here as you check guests in.
              </div>
            )}
            {feed.map((f) => {
              const m = SCAN_RES[f.type]
              return (
                <div
                  key={f.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--bo)',
                    animation: 'slideIn .3s ease',
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background:
                        f.type === 'ok' ? 'var(--ac)' : f.type === 'dup' ? 'var(--ad)' : '#EAE8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Ic
                      n={m.ic}
                      sz={14}
                      c={f.type === 'ok' ? '#fff' : f.type === 'dup' ? 'var(--ac)' : '#2B2A3F'}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: 'var(--t1)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {f.name}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>
                      {f.type === 'ok'
                        ? 'Checked in'
                        : f.type === 'dup'
                          ? 'Already checked in'
                          : 'Invalid ticket'}
                    </div>
                  </div>
                  <span style={{ fontSize: 10.5, color: 'var(--t3)', whiteSpace: 'nowrap' }}>
                    {f.at}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
