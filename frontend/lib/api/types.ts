/**
 * Shared API types — the single type surface for FE/BE contracts.
 *
 * Spec target (03 §): these are generated from the backend OpenAPI spec into
 * `types.gen.ts`. Until the backend exists, they are hand-authored here and
 * re-exported from the mock-backed data modules. When codegen lands, replace
 * the bodies below with `export * from './types.gen'`.
 */
export type {
  MaterialStatus,
  Priority,
  EventStatus,
  GuestStatus,
  Role,
  EventRow,
  MaterialRow,
  CheckIn,
  CatalogItem,
  Guest,
  TeamMember,
  Org,
  FeaturedEvent,
} from '@/lib/mock-data'

export type { EventMember, AgendaItem } from '@/lib/event-data'

export type { FieldType, FormField, RegistrationForm } from '@/lib/validation/form-schema'
