import { Ic } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ActionDialog, Field } from '@/components/ui/action-dialog'
import { ToastButton } from '@/components/ui/toast-button'
import { cardStyle } from '@/components/ui/primitives'
import { listEventMembers } from '@/lib/api'

export default function MembersPage() {
  return (
    <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          padding: '15px 18px',
          borderBottom: '1px solid var(--bo)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>
            Members & Delegation
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>
            Managers run the event; handlers own assigned materials
          </div>
        </div>
        <ActionDialog
          trigger={
            <Button size="sm">
              <Ic n="plus" sz={14} c="#fff" />
              Add member
            </Button>
          }
          title="Add member to event"
          description="Assign a manager or handler to this event."
          submitLabel="Add member"
          toastMessage="Member added to event (prototype)"
        >
          <Field label="Member email">
            <Input type="email" placeholder="member@gatherly.co" required />
          </Field>
        </ActionDialog>
      </div>
      {listEventMembers().map((u) => (
        <div
          key={u.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '13px 18px',
            borderBottom: '1px solid var(--bo)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: u.col,
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {u.ini}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t1)' }}>{u.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>{u.email}</div>
          </div>
          {u.role === 'Handler' && (
            <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>
              {u.assignedMaterials} material{u.assignedMaterials !== 1 ? 's' : ''}
            </span>
          )}
          <span
            style={{
              padding: '3px 11px',
              borderRadius: 99,
              background: u.role === 'Manager' ? 'var(--ad)' : '#EAE8F0',
              color: u.role === 'Manager' ? 'var(--ac)' : '#3A3550',
              fontSize: 11.5,
              fontWeight: 600,
            }}
          >
            {u.role}
          </span>
          <ToastButton variant="secondary" size="sm" message={`Manage ${u.name} (prototype)`}>
            Manage
          </ToastButton>
        </div>
      ))}
    </div>
  )
}
