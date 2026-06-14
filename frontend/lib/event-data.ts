import type { FormField, RegistrationForm } from './validation/form-schema'
import { events, guests, type EventRow, type Guest } from './mock-data'

export interface EventMember {
  id: number
  name: string
  ini: string
  col: string
  role: 'Manager' | 'Handler'
  email: string
  assignedMaterials: number
}

export interface AgendaItem {
  id: number
  time: string
  title: string
  detail: string
  track: string
}

export function getEvent(eventId: string): EventRow | undefined {
  return events.find((e) => String(e.id) === eventId)
}

export function guestsForEvent(eventName: string): Guest[] {
  return guests.filter((g) => g.ev === eventName)
}

export function getTicket(token: string): Guest | undefined {
  return guests.find((g) => g.tok.toLowerCase() === token.toLowerCase())
}

export const eventMembers: EventMember[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    ini: 'SC',
    col: '#7C3AED',
    role: 'Manager',
    email: 's.chen@gatherly.co',
    assignedMaterials: 0,
  },
  {
    id: 2,
    name: 'Alex Kim',
    ini: 'AK',
    col: '#C026D3',
    role: 'Handler',
    email: 'a.kim@gatherly.co',
    assignedMaterials: 2,
  },
  {
    id: 3,
    name: 'Carlos M.',
    ini: 'CM',
    col: '#2B2A3F',
    role: 'Handler',
    email: 'c.m@gatherly.co',
    assignedMaterials: 1,
  },
  {
    id: 4,
    name: 'Lena Cruz',
    ini: 'LC',
    col: '#7C3AED',
    role: 'Handler',
    email: 'l.cruz@gatherly.co',
    assignedMaterials: 1,
  },
  {
    id: 5,
    name: 'Jo Walsh',
    ini: 'JW',
    col: '#C026D3',
    role: 'Handler',
    email: 'j.walsh@gatherly.co',
    assignedMaterials: 1,
  },
]

export const eventAgenda: AgendaItem[] = [
  {
    id: 1,
    time: '09:00',
    title: 'Doors open & registration',
    detail: 'QR check-in at Grand Hall A entrance',
    track: 'General',
  },
  {
    id: 2,
    time: '09:30',
    title: 'Opening keynote',
    detail: 'The next decade of builders',
    track: 'Main Stage',
  },
  {
    id: 3,
    time: '11:00',
    title: 'Hands-on labs (Block 1)',
    detail: 'Parallel workshops across 4 rooms',
    track: 'Workshops',
  },
  {
    id: 4,
    time: '12:30',
    title: 'Networking lunch',
    detail: 'Catering in the atrium',
    track: 'General',
  },
  {
    id: 5,
    time: '14:00',
    title: 'Product deep-dives',
    detail: 'Customer stories & live demos',
    track: 'Main Stage',
  },
  {
    id: 6,
    time: '16:00',
    title: 'Hands-on labs (Block 2)',
    detail: 'Advanced tracks',
    track: 'Workshops',
  },
  {
    id: 7,
    time: '17:30',
    title: 'Closing & social',
    detail: 'Drinks on the rooftop',
    track: 'General',
  },
]

const defaultSchema: FormField[] = [
  {
    id: 'full_name',
    label: 'Full name',
    type: 'text',
    required: true,
    placeholder: 'Jane Doe',
    order: 1,
  },
  {
    id: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    placeholder: 'jane@email.com',
    order: 2,
  },
  {
    id: 'phone',
    label: 'Phone',
    type: 'phone',
    required: true,
    placeholder: '+1 555 000 0000',
    order: 3,
  },
  {
    id: 'company',
    label: 'Company / Organization',
    type: 'text',
    required: false,
    placeholder: 'Acme Inc.',
    order: 4,
  },
  {
    id: 'ticket_type',
    label: 'Ticket type',
    type: 'select',
    required: true,
    options: ['General Admission', 'VIP', 'Speaker', 'Press'],
    order: 5,
  },
  {
    id: 'dietary',
    label: 'Dietary preferences',
    type: 'multiselect',
    required: false,
    options: ['Vegetarian', 'Vegan', 'Halal', 'Gluten-free', 'No restrictions'],
    order: 6,
  },
  {
    id: 'notes',
    label: 'Anything we should know?',
    type: 'textarea',
    required: false,
    placeholder: 'Accessibility needs, questions…',
    order: 7,
  },
  {
    id: 'consent',
    label: 'I agree to receive event updates by email',
    type: 'checkbox',
    required: true,
    order: 8,
  },
]

export const registrationForm: RegistrationForm = {
  version: 3,
  active: true,
  schema: defaultSchema,
}

/** Map a public slug back to an event (prototype: slug = kebab of the name). */
export function slugFor(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function eventBySlug(slug: string): EventRow | undefined {
  return events.find((e) => slugFor(e.name) === slug)
}

/**
 * Resolve a public registration param that may be a slug ("techconf-2026") or a
 * numeric id. The dynamic segment is named `[eventId]` to share the slug name
 * with the (event) workspace route (Next.js requires one slug name per path
 * position), but public links use the friendly slug.
 */
export function eventBySlugOrId(value: string): EventRow | undefined {
  return eventBySlug(value) ?? getEvent(value)
}
