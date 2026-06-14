import { Ic } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ActionDialog, Field } from '@/components/ui/action-dialog'
import { CardHead, cardStyle } from '@/components/ui/primitives'
import { getAgenda } from '@/lib/api'

const TRACK_COLOR: Record<string, string> = {
  General: '#9CA3AF',
  'Main Stage': '#7C3AED',
  Workshops: '#C026D3',
}

export default function AgendaPage() {
  const eventAgenda = getAgenda()
  return (
    <div style={cardStyle}>
      <CardHead
        title="Agenda"
        sub="Day-of schedule · built from templates"
        right={
          <ActionDialog
            trigger={
              <Button variant="soft" size="sm">
                <Ic n="plus" sz={14} c="var(--ac)" />
                Add session
              </Button>
            }
            title="Add agenda session"
            submitLabel="Add session"
            toastMessage="Session added to agenda (prototype)"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Time">
                <Input placeholder="09:00" />
              </Field>
              <Field label="Track">
                <Input placeholder="Main Stage" />
              </Field>
            </div>
            <Field label="Title">
              <Input placeholder="Opening keynote" required />
            </Field>
            <Field label="Detail">
              <Input placeholder="Short description" />
            </Field>
          </ActionDialog>
        }
      />
      <div style={{ position: 'relative', paddingLeft: 8 }}>
        {eventAgenda.map((a, i) => {
          const color = TRACK_COLOR[a.track] ?? '#9CA3AF'
          const last = i === eventAgenda.length - 1
          return (
            <div key={a.id} style={{ display: 'flex', gap: 16 }}>
              {/* timeline rail */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 12,
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: color,
                    flexShrink: 0,
                    marginTop: 4,
                  }}
                />
                {!last && <span style={{ flex: 1, width: 2, background: 'var(--bo)' }} />}
              </div>
              <div style={{ flex: 1, paddingBottom: last ? 0 : 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: 'ui-monospace,Menlo,monospace',
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: 'var(--t1)',
                    }}
                  >
                    {a.time}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color,
                      background: color + '1a',
                      borderRadius: 99,
                      padding: '2px 9px',
                    }}
                  >
                    {a.track}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginTop: 4 }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--t2)', marginTop: 2 }}>{a.detail}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
