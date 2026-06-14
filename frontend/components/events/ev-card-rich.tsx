'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Ic } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { EvBadge } from '@/components/badges'
import { GradientSlot } from '@/components/ui/gradient-slot'
import { fd, initials } from '@/lib/format'
import { materialsForEvent } from '@/lib/api'
import type { EventRow } from '@/lib/api'

const EV_META: Record<string, { cat: string; grad: string }> = {
  '1': { cat: 'Conference', grad: 'linear-gradient(135deg,#7C3AED 0%,#C026D3 100%)' },
  '2': { cat: 'Launch', grad: 'linear-gradient(135deg,#6D28D9 0%,#A855F7 100%)' },
  '3': { cat: 'Gala', grad: 'linear-gradient(135deg,#C026D3 0%,#7C3AED 100%)' },
  '4': { cat: 'Summit', grad: 'linear-gradient(135deg,#2B2A3F 0%,#7C3AED 100%)' },
  '5': { cat: 'Dinner', grad: 'linear-gradient(135deg,#7C3AED 0%,#2B2A3F 100%)' },
}

export function EvCardRich({ ev }: { ev: EventRow }) {
  const [hov, setHov] = useState(false)
  const pct = ev.guests > 0 ? Math.round((ev.guests / ev.cap) * 100) : 0
  const meta = EV_META[ev.id] ?? EV_META['1']!
  const mats = materialsForEvent(ev.name)
  const doneMats = mats.filter((m) => m.s === 'Done').length
  const ini = initials(ev.sa)
  const bdr = 'rgba(228,225,244,.5)'

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--ca)',
        border: `1px solid ${bdr}`,
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: hov ? '0 10px 36px rgba(24,16,48,.11)' : '0 2px 10px rgba(24,16,48,.05)',
        transform: hov ? 'translateY(-4px)' : 'none',
        transition: 'all .25s cubic-bezier(.4,0,.2,1)',
        cursor: 'pointer',
      }}
    >
      <div style={{ position: 'relative', height: 186 }}>
        <GradientSlot
          height="100%"
          gradient={meta.grad}
          placeholder={`Drop ${meta.cat.toLowerCase()} photo`}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom,rgba(10,6,26,.08) 0%,rgba(10,6,26,.58) 100%)',
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            right: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 2,
          }}
        >
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 99,
              background: 'rgba(255,255,255,.15)',
              backdropFilter: 'blur(10px)',
              fontSize: 11,
              fontWeight: 600,
              color: '#fff',
              border: '1px solid rgba(255,255,255,.22)',
            }}
          >
            {meta.cat}
          </span>
          <EvBadge s={ev.status} />
        </div>
        <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 2 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-.02em',
              lineHeight: 1.2,
              textShadow: '0 2px 8px rgba(0,0,0,.28)',
            }}
          >
            {ev.name}
          </div>
        </div>
      </div>
      <div style={{ padding: '15px 17px 17px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
          {[
            { n: 'cal' as const, c: 'var(--ac)', bg: 'var(--ad)', t: fd(ev.date) },
            { n: 'pin' as const, c: '#C026D3', bg: '#F1EAFB', t: ev.venue },
          ].map(({ n, c, bg, t }) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Ic n={n} sz={13} c={c} />
              </div>
              <span
                style={{
                  fontSize: 12.5,
                  color: 'var(--t2)',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {t}
              </span>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: bdr, marginBottom: 13 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'var(--ac)',
              color: '#fff',
              fontSize: 10.5,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {ini}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.2 }}>
              {ev.sa}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>Sub-admin</div>
          </div>
          {mats.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 8,
                background: '#F1EAFB',
                border: '1px solid rgba(124,58,237,.1)',
              }}
            >
              <Ic n="pkg" sz={12} c="#C026D3" />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#C026D3' }}>
                {doneMats}/{mats.length}
              </span>
            </div>
          )}
        </div>
        {ev.status === 'Public' && ev.guests > 0 ? (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>
                Registrations
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ac)' }}>
                {ev.guests}
                <span style={{ color: 'var(--t3)', fontWeight: 400 }}>
                  /{ev.cap} ({pct}%)
                </span>
              </span>
            </div>
            <div
              style={{ height: 6, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}
            >
              <div
                style={{
                  height: '100%',
                  width: pct + '%',
                  background: 'linear-gradient(90deg,var(--ac),#C026D3)',
                  borderRadius: 99,
                  transition: 'width .6s cubic-bezier(.4,0,.2,1)',
                }}
              />
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              background: '#EFEDF4',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              marginBottom: 14,
            }}
          >
            <Ic n="alrt" sz={13} c="#6B6478" />
            <span style={{ fontSize: 11.5, color: '#6B6478', fontWeight: 500 }}>
              Draft — not yet published
            </span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <Button asChild variant="soft" className="flex-1">
            <Link href={`/events/${ev.id}/overview`}>Manage</Link>
          </Button>
          <Button
            asChild
            size="icon"
            title="Members & delegation"
            className="h-[38px] w-[38px] shrink-0 border border-[rgba(124,58,237,0.1)] bg-[#F1EAFB] text-[#C026D3] shadow-none hover:bg-[#F1EAFB]/80"
          >
            <Link href={`/events/${ev.id}/members`}>
              <Ic n="usr" sz={15} c="#C026D3" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
