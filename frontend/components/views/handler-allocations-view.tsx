'use client'

import { useState } from 'react'
import { Ic, type IconName } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ActionDialog, Field } from '@/components/ui/action-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { listTeam } from '@/lib/api'

export function HandlerAllocationsView() {
  const [hov, setHov] = useState<number | null>(null)
  const team = listTeam()
  const subs = team.filter((u) => u.role === 'Sub-admin')
  const hnds = team.filter((u) => u.role === 'Handler')

  const summary: { label: string; v: number; c: string; n: IconName }[] = [
    { label: 'Total Members', v: team.length, c: '#2B2A3F', n: 'usr' },
    { label: 'Sub-admins', v: subs.length, c: '#7C3AED', n: 'cal' },
    { label: 'Handlers', v: hnds.length, c: '#C026D3', n: 'pkg' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {summary.map(({ label, v, c, n }) => (
          <div
            key={label}
            style={{
              background: 'var(--ca)',
              border: '1px solid var(--bo)',
              borderRadius: 'var(--r)',
              padding: '16px 18px',
              boxShadow: 'var(--sh)',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: c + '1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ic n={n} sz={20} c={c} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)' }}>{v}</div>
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: 'var(--ca)',
          border: '1px solid var(--bo)',
          borderRadius: 'var(--r)',
          boxShadow: 'var(--sh)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '13px 18px',
            borderBottom: '1px solid var(--bo)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Team Members</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>
              Sub-admins &amp; handlers
            </div>
          </div>
          <ActionDialog
            trigger={
              <Button size="sm">
                <Ic n="plus" sz={13} c="#fff" />
                Invite
              </Button>
            }
            title="Invite a member"
            description="They'll receive an email to set their password and join the organization."
            submitLabel="Send invite"
            toastMessage="Invitation sent (prototype)"
          >
            <Field label="Full name">
              <Input placeholder="Jane Doe" required />
            </Field>
            <Field label="Email">
              <Input type="email" placeholder="jane@gatherly.co" required />
            </Field>
            <Field label="Role">
              <Select defaultValue="Handler">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sub-admin">Sub-admin</SelectItem>
                  <SelectItem value="Handler">Handler</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </ActionDialog>
        </div>
        {team.map((u) => (
          <div
            key={u.id}
            onMouseEnter={() => setHov(u.id)}
            onMouseLeave={() => setHov(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '11px 18px',
              background: hov === u.id ? '#FAFAFE' : 'transparent',
              borderBottom: '1px solid var(--bo)',
              transition: 'background .1s',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: u.col,
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {u.ini}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)' }}>{u.name}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>{u.email}</div>
            </div>
            <div
              style={{
                padding: '2px 9px',
                borderRadius: 99,
                background: u.role === 'Sub-admin' ? 'var(--ad)' : '#EAE8F0',
                color: u.role === 'Sub-admin' ? 'var(--ac)' : '#3A3550',
                fontSize: 11.5,
                fontWeight: 500,
              }}
            >
              {u.role}
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)', minWidth: 55, textAlign: 'right' }}>
              {u.evs} event{u.evs !== 1 ? 's' : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
