'use client'

import { useState } from 'react'
import { Ic } from '@/components/ui/icon'
import { CardHead, cardStyle } from '@/components/ui/primitives'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormRenderer } from '@/components/form-renderer/form-renderer'
import type { FieldType, FormField } from '@/lib/validation/form-schema'

const TYPES: FieldType[] = [
  'text',
  'textarea',
  'email',
  'phone',
  'number',
  'date',
  'select',
  'multiselect',
  'checkbox',
]

let nextId = 1000

export function FormBuilder({ initial }: { initial: FormField[] }) {
  const [fields, setFields] = useState<FormField[]>([...initial].sort((a, b) => a.order - b.order))

  const hasReq = (t: FieldType) => fields.some((f) => f.type === t && f.required)
  const canActivate = hasReq('email') && hasReq('phone')

  const reorder = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= fields.length) return
    const next = [...fields]
    ;[next[i], next[j]] = [next[j], next[i]]
    setFields(next.map((f, k) => ({ ...f, order: k + 1 })))
  }

  const update = (id: string, patch: Partial<FormField>) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))

  const remove = (id: string) =>
    setFields((prev) => prev.filter((f) => f.id !== id).map((f, k) => ({ ...f, order: k + 1 })))

  const add = () =>
    setFields((prev) => [
      ...prev,
      {
        id: `field_${nextId++}`,
        label: 'New field',
        type: 'text',
        required: false,
        order: prev.length + 1,
      },
    ])

  return (
    <div className="dcharts">
      {/* editor */}
      <div style={cardStyle}>
        <CardHead
          title="Form Builder"
          sub="Edit the registration form · email + phone are required to activate"
          right={
            <Button onClick={add} variant="soft" size="sm">
              <Ic n="plus" sz={14} c="var(--ac)" />
              Add field
            </Button>
          }
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {fields.map((f, i) => (
            <div
              key={f.id}
              style={{
                border: '1px solid var(--bo)',
                borderRadius: 12,
                padding: 12,
                background: 'var(--bg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <button onClick={() => reorder(i, -1)} aria-label="Move up" style={arrowBtn}>
                    <Ic n="chv" sz={12} c="var(--t3)" />
                  </button>
                  <button
                    onClick={() => reorder(i, 1)}
                    aria-label="Move down"
                    style={{ ...arrowBtn, transform: 'rotate(180deg)' }}
                  >
                    <Ic n="chv" sz={12} c="var(--t3)" />
                  </button>
                </div>
                <Input
                  value={f.label}
                  onChange={(e) => update(f.id, { label: e.target.value })}
                  className="h-9 flex-1 bg-card text-[13px] font-semibold text-foreground"
                />
                <Button
                  onClick={() => remove(f.id)}
                  aria-label="Remove field"
                  variant="secondary"
                  size="icon-sm"
                  className="shrink-0"
                >
                  <Ic n="x" sz={13} c="#2B2A3F" />
                </Button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Select
                  value={f.type}
                  onValueChange={(v) => update(f.id, { type: v as FieldType })}
                >
                  <SelectTrigger className="h-9 w-[140px] bg-card text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12.5,
                    color: 'var(--t2)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={f.required}
                    onChange={(e) => update(f.id, { required: e.target.checked })}
                    style={{ accentColor: 'var(--ac)' }}
                  />
                  Required
                </label>
                {(f.type === 'select' || f.type === 'multiselect') && (
                  <Input
                    value={f.options?.join(', ') ?? ''}
                    onChange={(e) =>
                      update(f.id, {
                        options: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Options, comma separated"
                    className="h-9 flex-1 basis-[180px] bg-card text-xs"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <Button
            disabled={!canActivate}
            title={canActivate ? '' : 'Add a required email and phone field first'}
          >
            Activate form
          </Button>
          {!canActivate && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: '#2B2A3F',
                fontWeight: 500,
              }}
            >
              <Ic n="alrt" sz={13} c="#2B2A3F" />A required <b>email</b> and <b>phone</b> field are
              mandatory before activating.
            </span>
          )}
        </div>
      </div>

      {/* live preview */}
      <div style={cardStyle}>
        <CardHead title="Live Preview" sub="Exactly what guests will see (same renderer)" />
        <FormRenderer
          key={fields.map((f) => f.id + f.type + f.required).join('|')}
          fields={fields}
          onSubmit={() => {}}
          submitLabel="Register (preview)"
        />
      </div>
    </div>
  )
}

const arrowBtn: React.CSSProperties = {
  width: 20,
  height: 16,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}
