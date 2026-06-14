'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Ic } from '@/components/ui/icon'
import { GradientSlot } from '@/components/ui/gradient-slot'
import { fd } from '@/lib/format'
import type { FeaturedEvent } from '@/lib/api'

export function ImgEventCard({ ev }: { ev: FeaturedEvent }) {
  const [hov, setHov] = useState(false)
  const pct = Math.round((ev.guests / ev.cap) * 100)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--ca)',
        border: '1px solid var(--bo)',
        borderRadius: 'var(--r)',
        overflow: 'hidden',
        boxShadow: hov ? 'var(--sh2)' : 'var(--sh)',
        transform: hov ? 'translateY(-3px)' : 'none',
        transition: 'all .2s',
        cursor: 'pointer',
      }}
    >
      <div style={{ position: 'relative' }}>
        <GradientSlot
          height={152}
          gradient={ev.grad}
          placeholder={`Drop ${ev.cat.toLowerCase()} photo`}
        />
        <span
          style={{
            position: 'absolute',
            top: 11,
            left: 11,
            padding: '4px 11px',
            borderRadius: 99,
            background: 'rgba(255,255,255,.92)',
            backdropFilter: 'blur(4px)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--t1)',
            zIndex: 2,
          }}
        >
          {ev.cat}
        </span>
      </div>
      <div style={{ padding: '14px 15px 15px' }}>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 700,
            color: 'var(--t1)',
            marginBottom: 7,
            letterSpacing: '-.01em',
          }}
        >
          {ev.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Ic n="pin" sz={13} c="var(--t3)" />
          <span
            style={{
              fontSize: 12,
              color: 'var(--t2)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {ev.venue}
          </span>
        </div>
        <div style={{ height: 1, background: 'var(--bo)', marginBottom: 11 }} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 9,
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'var(--t2)',
            }}
          >
            <Ic n="cal" sz={13} c="var(--t3)" />
            {fd(ev.date)}
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ac)' }}>
            {ev.guests}
            <span style={{ color: 'var(--t3)', fontWeight: 500 }}>/{ev.cap}</span>
          </span>
        </div>
        <div
          style={{
            height: 5,
            background: 'var(--bg)',
            borderRadius: 99,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: pct + '%',
              background: 'var(--ac)',
              borderRadius: 99,
            }}
          />
        </div>
      </div>
    </div>
  )
}

export function UpcomingHero() {
  return (
    <div
      style={{
        background: 'var(--ca)',
        border: '1px solid var(--bo)',
        borderRadius: 'var(--r)',
        overflow: 'hidden',
        boxShadow: 'var(--sh)',
      }}
    >
      <div style={{ position: 'relative' }}>
        <GradientSlot
          height={168}
          gradient="linear-gradient(135deg,#7C3AED,#C026D3)"
          placeholder="Drop event photo"
        />
        <span
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            padding: '4px 11px',
            borderRadius: 99,
            background: 'rgba(255,255,255,.92)',
            backdropFilter: 'blur(4px)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--t1)',
            zIndex: 2,
          }}
        >
          Conference
        </span>
      </div>
      <div style={{ padding: '16px 17px 17px' }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--t1)',
            marginBottom: 4,
            letterSpacing: '-.01em',
          }}
        >
          TechConf 2026
        </div>
        <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 10 }}>
          Grand Hall A, Metro Center
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 14 }}>
          Two days of keynotes, hands-on labs and networking for 500 builders shaping what&apos;s
          next.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 12,
              color: 'var(--t2)',
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'var(--ad)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ic n="cal" sz={15} c="var(--ac)" />
            </div>
            <span>
              <b style={{ color: 'var(--t1)' }}>Jul 15, 2026</b>
              <br />
              09:00 AM – 06:00 PM
            </span>
          </span>
          <Link
            href="/events/1/overview"
            style={{
              padding: '8px 15px',
              borderRadius: 9,
              background: 'var(--ac)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12.5,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Manage
          </Link>
        </div>
      </div>
    </div>
  )
}
