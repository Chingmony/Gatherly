'use client'

import { type ReactNode } from 'react'
import { ActionDialog, Field } from '@/components/ui/action-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function CreateEventDialog({ trigger }: { trigger: ReactNode }) {
  return (
    <ActionDialog
      trigger={trigger}
      title="Propose a new event"
      description="Fill in the basics — you can add the agenda, materials and registration form afterwards."
      submitLabel="Create event"
      toastMessage="Event proposed — pending admin approval (prototype)"
    >
      <Field label="Event name">
        <Input placeholder="e.g. TechConf 2027" required />
      </Field>
      <Field label="Venue">
        <Input placeholder="Grand Hall A, Metro Center" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <Input type="date" />
        </Field>
        <Field label="Capacity">
          <Input type="number" placeholder="500" />
        </Field>
      </div>
      <Field label="Description">
        <Textarea placeholder="What is this event about?" rows={3} />
      </Field>
    </ActionDialog>
  )
}
