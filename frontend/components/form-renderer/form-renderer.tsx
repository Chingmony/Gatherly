'use client'

import { useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Ic } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { buildZodSchema, defaultValues, type FormField } from '@/lib/validation/form-schema'

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-medium text-[#2B2A3F]">
      <Ic n="alrt" sz={12} c="#2B2A3F" />
      {msg}
    </div>
  )
}

function FieldLabel({ field }: { field: FormField }) {
  return (
    <Label className="mb-1.5 block">
      {field.label}
      {field.required && <span className="ml-0.5 text-primary">*</span>}
    </Label>
  )
}

export function FormRenderer({
  fields,
  onSubmit,
  submitLabel = 'Register',
}: {
  fields: FormField[]
  onSubmit: (data: Record<string, unknown>) => void
  submitLabel?: string
}) {
  const ordered = useMemo(() => [...fields].sort((a, b) => a.order - b.order), [fields])
  const schema = useMemo(() => buildZodSchema(ordered), [ordered])
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues(ordered),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {ordered.map((f) => {
        const err = errors[f.id]?.message as string | undefined

        if (f.type === 'checkbox') {
          return (
            <label key={f.id} className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                {...register(f.id)}
                className="mt-0.5 h-[18px] w-[18px] accent-[var(--ac)]"
              />
              <span className="text-[13px] leading-snug text-muted-foreground">
                {f.label}
                {f.required && <span className="ml-0.5 text-primary">*</span>}
                <ErrorText msg={err} />
              </span>
            </label>
          )
        }

        return (
          <div key={f.id}>
            <FieldLabel field={f} />
            {f.type === 'textarea' ? (
              <Textarea {...register(f.id)} placeholder={f.placeholder} rows={3} />
            ) : f.type === 'select' ? (
              <Controller
                control={control}
                name={f.id}
                render={({ field }) => (
                  <Select
                    value={(field.value as string) || undefined}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="font-normal text-foreground data-[placeholder]:text-muted-foreground">
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options?.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : f.type === 'multiselect' ? (
              <Controller
                control={control}
                name={f.id}
                render={({ field }) => {
                  const val = (field.value as string[]) ?? []
                  return (
                    <div className="flex flex-wrap gap-2">
                      {f.options?.map((o) => {
                        const on = val.includes(o)
                        return (
                          <Button
                            type="button"
                            key={o}
                            size="sm"
                            variant={on ? 'soft' : 'secondary'}
                            className="rounded-full"
                            onClick={() =>
                              field.onChange(on ? val.filter((v) => v !== o) : [...val, o])
                            }
                          >
                            {o}
                          </Button>
                        )
                      })}
                    </div>
                  )
                }}
              />
            ) : (
              <Input
                type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                {...register(f.id)}
                placeholder={f.placeholder}
              />
            )}
            <ErrorText msg={err} />
          </div>
        )
      })}

      <Button type="submit" size="lg" className="mt-1 w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting…' : submitLabel}
      </Button>
    </form>
  )
}
