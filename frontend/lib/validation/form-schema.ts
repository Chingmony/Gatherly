import { z, type ZodTypeAny } from 'zod'

/**
 * Dynamic registration form contract — mirrors the JSONB `schema` array stored
 * per event (docs/02 §6). One renderer, one builder, one source of truth.
 * `email` and `phone` are always required regardless of schema (QR delivery +
 * product requirement) and are re-checked server-side.
 */
export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'checkbox'

export interface FormField {
  id: string
  label: string
  type: FieldType
  required: boolean
  options?: string[]
  placeholder?: string
  order: number
}

export interface RegistrationForm {
  version: number
  active: boolean
  schema: FormField[]
}

const PHONE_RE = /^[+]?[\d\s()-]{7,}$/

/** Build a Zod schema at runtime from the field definitions (matches the server). */
export function buildZodSchema(fields: FormField[]): z.ZodObject<Record<string, ZodTypeAny>> {
  const shape: Record<string, ZodTypeAny> = {}

  for (const f of fields) {
    let base: ZodTypeAny

    switch (f.type) {
      case 'email':
        base = z.string().email('Enter a valid email')
        break
      case 'phone':
        base = z.string().regex(PHONE_RE, 'Enter a valid phone number')
        break
      case 'number':
        base = z.coerce.number({ invalid_type_error: 'Enter a number' })
        break
      case 'date':
        base = z.string().min(1, 'Select a date')
        break
      case 'select':
        base = z.string()
        break
      case 'multiselect':
        base = z.array(z.string())
        break
      case 'checkbox':
        base = z.boolean()
        break
      default:
        base = z.string()
    }

    if (f.required) {
      if (f.type === 'checkbox') {
        base = z.literal(true, { errorMap: () => ({ message: 'Required' }) })
      } else if (f.type === 'multiselect') {
        base = z.array(z.string()).min(1, 'Select at least one')
      } else if (base instanceof z.ZodString) {
        base = base.min(1, `${f.label} is required`)
      }
    } else {
      base = base.optional()
    }

    shape[f.id] = base
  }

  return z.object(shape)
}

/** Default values keyed by field id, suitable for React Hook Form. */
export function defaultValues(fields: FormField[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of fields) {
    out[f.id] = f.type === 'checkbox' ? false : f.type === 'multiselect' ? [] : ''
  }
  return out
}
