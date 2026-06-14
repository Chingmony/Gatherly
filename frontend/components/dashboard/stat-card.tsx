'use client'

import { useState } from 'react'
import { Ic, type IconName } from '@/components/ui/icon'

type BadgeType = 'up' | 'down' | 'warn' | 'info'

const BADGE: Record<BadgeType, { bg: string; c: string; ic: IconName | null }> = {
  up: { bg: 'var(--ad)', c: 'var(--ac)', ic: 'up' },
  down: { bg: '#EAE8F0', c: '#3A3550', ic: 'down' },
  warn: { bg: '#EAE8F0', c: '#3A3550', ic: 'alrt' },
  info: { bg: '#EFEDF4', c: '#6B6478', ic: null },
}

export interface StatCardProps {
  label: string
  value: string | number
  ic: IconName
  icC: string
  badge?: string
  badgeType?: BadgeType
  sub?: string
}

export function StatCard({ label, value, ic, icC, badge, badgeType = 'up', sub }: StatCardProps) {
  const [hov, setHov] = useState(false)
  const b = BADGE[badgeType] ?? BADGE.up
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--ca)',
        border: '1px solid var(--bo)',
        borderRadius: 'var(--r)',
        padding: '18px 20px',
        boxShadow: hov ? 'var(--sh2)' : 'var(--sh)',
        transition: 'box-shadow .2s,transform .2s',
        transform: hov ? 'translateY(-2px)' : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 13,
            background: icC + '1f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ic n={ic} sz={21} c={icC} />
        </div>
        {badge && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '4px 9px',
              borderRadius: 99,
              background: b.bg,
              color: b.c,
              fontSize: 11.5,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {b.ic && <Ic n={b.ic} sz={12} c={b.c} />}
            {badge}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          color: 'var(--t1)',
          lineHeight: 1,
          marginBottom: 5,
          letterSpacing: '-.02em',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t2)' }}>{label}</div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}
