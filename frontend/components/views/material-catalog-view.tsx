'use client'

import { useState, type CSSProperties } from 'react'
import { Ic } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ActionDialog, Field } from '@/components/ui/action-dialog'
import { StatCard } from '@/components/dashboard/stat-card'
import { listCatalog } from '@/lib/api'
import type { CatalogItem } from '@/lib/api'

const ALL = listCatalog()

type SortKey = 'name' | 'cat' | 'stock'

export function MaterialCatalogView() {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<{ k: SortKey; dir: 'asc' | 'desc' }>({ k: 'name', dir: 'asc' })
  const sortBy = (k: SortKey) =>
    setSort((s) => ({ k, dir: s.k === k && s.dir === 'asc' ? 'desc' : 'asc' }))

  let cat: CatalogItem[] = ALL.filter(
    (c) => !q || `${c.name} ${c.cat}`.toLowerCase().includes(q.toLowerCase())
  )
  cat = [...cat].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1
    if (sort.k === 'stock') return (a.stock - b.stock) * dir
    if (sort.k === 'cat') return a.cat.localeCompare(b.cat) * dir
    return a.name.localeCompare(b.name) * dir
  })

  const totalUnits = ALL.reduce((s, c) => s + c.stock, 0)
  const cats = new Set(ALL.map((c) => c.cat)).size
  const ths: { k: SortKey; l: string; r: boolean }[] = [
    { k: 'name', l: 'Material', r: false },
    { k: 'cat', l: 'Category', r: false },
    { k: 'stock', l: 'Total in Stock', r: true },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        <StatCard
          ic="pkg"
          icC="#7C3AED"
          value={ALL.length}
          label="Material Types"
          badge="catalog"
          badgeType="info"
          sub="distinct listings"
        />
        <StatCard
          ic="lst"
          icC="#C026D3"
          value={totalUnits.toLocaleString()}
          label="Total Units in Stock"
          badge="+340"
          badgeType="up"
          sub="restocked this month"
        />
        <StatCard
          ic="bld"
          icC="#2B2A3F"
          value={cats}
          label="Categories"
          badgeType="info"
          sub="across the catalog"
        />
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
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '15px 18px',
            borderBottom: '1px solid var(--bo)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>
              Material Catalog
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>
              {ALL.length} listings · {totalUnits.toLocaleString()} units in stock
            </div>
          </div>
          <div style={{ position: 'relative', flex: '0 1 240px' }}>
            <div
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            >
              <Ic n="srch" sz={14} c="var(--t3)" />
            </div>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search catalog…"
              className="h-9 pl-9 text-[13px]"
            />
          </div>
          <ActionDialog
            trigger={
              <Button>
                <Ic n="plus" sz={14} c="#fff" />
                Add Material
              </Button>
            }
            title="Add material"
            description="Add a new listing to the supply catalog."
            submitLabel="Add material"
            toastMessage="Material added to catalog (prototype)"
          >
            <Field label="Material name">
              <Input placeholder="e.g. Wireless Microphones" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <Input placeholder="Technical" />
              </Field>
              <Field label="Unit">
                <Input placeholder="pcs" />
              </Field>
            </div>
            <Field label="Stock quantity">
              <Input type="number" placeholder="0" />
            </Field>
          </ActionDialog>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFE' }}>
                {ths.map((h) => (
                  <th
                    key={h.k}
                    onClick={() => sortBy(h.k)}
                    style={{
                      padding: '12px 18px',
                      textAlign: h.r ? 'right' : 'left',
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      color: 'var(--t3)',
                      borderBottom: '1px solid var(--bo)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        flexDirection: h.r ? 'row-reverse' : 'row',
                      }}
                    >
                      {h.l}
                      {sort.k === h.k && (
                        <span
                          style={{
                            transform: sort.dir === 'desc' ? 'rotate(180deg)' : 'none',
                            display: 'inline-flex',
                          }}
                        >
                          <Ic n="chv" sz={12} c="var(--ac)" />
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cat.map((c) => (
                <CatRow key={c.id} c={c} />
              ))}
            </tbody>
          </table>
        </div>
        {cat.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>
            No materials match your search.
          </div>
        )}
      </div>
    </div>
  )
}

function CatRow({ c }: { c: CatalogItem }) {
  const [hov, setHov] = useState(false)
  const td: CSSProperties = { padding: '13px 18px', borderBottom: '1px solid var(--bo)' }
  return (
    <tr
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ cursor: 'pointer', background: hov ? '#FAFAFE' : 'transparent' }}
    >
      <td style={td}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--ad)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Ic n="pkg" sz={17} c="var(--ac)" />
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t1)' }}>{c.name}</span>
        </div>
      </td>
      <td style={td}>
        <span
          style={{
            fontSize: 12,
            color: 'var(--t2)',
            background: 'var(--bg)',
            border: '1px solid var(--bo)',
            borderRadius: 99,
            padding: '3px 11px',
            fontWeight: 500,
          }}
        >
          {c.cat}
        </span>
      </td>
      <td style={{ ...td, textAlign: 'right' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>
          {c.stock.toLocaleString()}
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--t3)', marginLeft: 5 }}>{c.unit}</span>
      </td>
    </tr>
  )
}
