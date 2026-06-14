import { registrationForm as mockForm } from '@/lib/event-data'
import type { RegistrationForm } from './types'

/** The active registration form (JSONB schema) for an event. */
export function getRegistrationForm(_eventId?: string): RegistrationForm {
  return mockForm
}
