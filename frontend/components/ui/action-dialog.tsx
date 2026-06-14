'use client'

import { useState, type ReactNode } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'

/** A labelled field row for use inside ActionDialog. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </label>
  )
}

/**
 * Generic create/edit dialog: a trigger button opens a modal form. On submit it
 * shows a confirmation toast and closes. Form data is not persisted (prototype —
 * wire to the relevant Server Action / lib/api mutation when the backend lands).
 */
export function ActionDialog({
  trigger,
  title,
  description,
  submitLabel = 'Save',
  toastMessage,
  children,
}: {
  trigger: ReactNode
  title: string
  description?: string
  submitLabel?: string
  toastMessage?: string
  children?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            toast(toastMessage ?? `${title} — saved`)
            setOpen(false)
          }}
        >
          {children}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
