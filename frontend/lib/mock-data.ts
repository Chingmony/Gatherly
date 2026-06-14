/**
 * Mock data ported from the design prototype (window.G).
 * Stands in for the typed API client (lib/api/) until the backend is wired.
 */

export type MaterialStatus = 'Pending' | 'In Progress' | 'Needs Review' | 'Done' | 'Issue'
export type Priority = 'High' | 'Medium' | 'Low'
export type EventStatus = 'Public' | 'Draft'
export type GuestStatus = 'Checked-in' | 'Registered' | 'Cancelled'
export type Role = 'Sub-admin' | 'Handler'

export interface EventRow {
  id: number
  name: string
  date: string
  venue: string
  status: EventStatus
  sa: string
  guests: number
  cap: number
}

export interface MaterialRow {
  id: number
  name: string
  ev: string
  h: string | null
  hi: string | null
  s: MaterialStatus
  p: Priority
}

export interface CheckIn {
  id: number
  guest: string
  ev: string
  ini: string
  col: string
  at: string
}

export interface CatalogItem {
  id: number
  name: string
  cat: string
  unit: string
  stock: number
}

export interface Guest {
  id: number
  name: string
  email: string
  phone: string
  ev: string
  reg: string
  st: GuestStatus
  tok: string
  ini: string
  col: string
}

export interface TeamMember {
  id: number
  name: string
  role: Role
  email: string
  ini: string
  col: string
  evs: number
}

export interface Org {
  name: string
  tagline: string
  website: string
  email: string
  telegram: string
  members: number
}

export const events: EventRow[] = [
  {
    id: 1,
    name: 'TechConf 2026',
    date: '2026-07-15',
    venue: 'Grand Hall A, Metro Center',
    status: 'Public',
    sa: 'Sarah Chen',
    guests: 342,
    cap: 500,
  },
  {
    id: 2,
    name: 'Product Launch Q3',
    date: '2026-07-28',
    venue: 'Innovation Hub, Floor 12',
    status: 'Draft',
    sa: 'Marcus Webb',
    guests: 0,
    cap: 200,
  },
  {
    id: 3,
    name: 'Annual Gala 2026',
    date: '2026-08-10',
    venue: 'Skyline Ballroom',
    status: 'Public',
    sa: 'Priya Nair',
    guests: 189,
    cap: 300,
  },
  {
    id: 4,
    name: 'Dev Summit Fall',
    date: '2026-08-22',
    venue: 'Tech Campus B',
    status: 'Draft',
    sa: 'James Park',
    guests: 0,
    cap: 150,
  },
  {
    id: 5,
    name: 'Founders Dinner',
    date: '2026-09-05',
    venue: 'The Rooftop, 42F',
    status: 'Public',
    sa: 'Sarah Chen',
    guests: 67,
    cap: 80,
  },
]

export const materials: MaterialRow[] = [
  {
    id: 1,
    name: 'Venue Setup Diagram',
    ev: 'TechConf 2026',
    h: 'Alex Kim',
    hi: 'AK',
    s: 'Pending',
    p: 'High',
  },
  {
    id: 2,
    name: 'Catering Order Form',
    ev: 'Annual Gala 2026',
    h: null,
    hi: null,
    s: 'Pending',
    p: 'Medium',
  },
  {
    id: 3,
    name: 'Welcome Banners',
    ev: 'Founders Dinner',
    h: 'Lena Cruz',
    hi: 'LC',
    s: 'Pending',
    p: 'Low',
  },
  {
    id: 4,
    name: 'AV Equipment Setup',
    ev: 'TechConf 2026',
    h: 'Carlos M.',
    hi: 'CM',
    s: 'In Progress',
    p: 'High',
  },
  {
    id: 5,
    name: 'Speaker Info Pack',
    ev: 'Dev Summit Fall',
    h: 'Jo Walsh',
    hi: 'JW',
    s: 'In Progress',
    p: 'High',
  },
  {
    id: 6,
    name: 'Branding Kit v2',
    ev: 'Annual Gala 2026',
    h: 'Lena Cruz',
    hi: 'LC',
    s: 'Needs Review',
    p: 'Medium',
  },
  {
    id: 7,
    name: 'Safety Checklist',
    ev: 'TechConf 2026',
    h: 'Alex Kim',
    hi: 'AK',
    s: 'Needs Review',
    p: 'High',
  },
  {
    id: 8,
    name: 'Guest List Export',
    ev: 'TechConf 2026',
    h: 'Jo Walsh',
    hi: 'JW',
    s: 'Done',
    p: 'Low',
  },
  {
    id: 9,
    name: 'QR Ticket Template',
    ev: 'Annual Gala 2026',
    h: 'Carlos M.',
    hi: 'CM',
    s: 'Done',
    p: 'Medium',
  },
  {
    id: 10,
    name: 'Stage Lighting Rig',
    ev: 'Annual Gala 2026',
    h: 'Alex Kim',
    hi: 'AK',
    s: 'Issue',
    p: 'High',
  },
  {
    id: 11,
    name: 'Signage Placement',
    ev: 'TechConf 2026',
    h: 'Lena Cruz',
    hi: 'LC',
    s: 'Issue',
    p: 'Medium',
  },
]

export const checkIns: CheckIn[] = [
  {
    id: 1,
    guest: 'Maya Rodriguez',
    ev: 'TechConf 2026',
    ini: 'MR',
    col: '#7C3AED',
    at: 'Just now',
  },
  { id: 2, guest: 'Theo Nakamura', ev: 'TechConf 2026', ini: 'TN', col: '#C026D3', at: '2m ago' },
  { id: 3, guest: 'Priya Singh', ev: 'Annual Gala 2026', ini: 'PS', col: '#2B2A3F', at: '5m ago' },
  {
    id: 4,
    guest: 'Luke Fernandez',
    ev: 'Annual Gala 2026',
    ini: 'LF',
    col: '#7C3AED',
    at: '7m ago',
  },
  {
    id: 5,
    guest: 'Aisha Okonkwo',
    ev: 'Founders Dinner',
    ini: 'AO',
    col: '#C026D3',
    at: '12m ago',
  },
  { id: 6, guest: 'Ben Carter', ev: 'TechConf 2026', ini: 'BC', col: '#2B2A3F', at: '15m ago' },
]

export const catalog: CatalogItem[] = [
  { id: 1, name: 'Welcome Banners', cat: 'Signage', unit: 'pcs', stock: 120 },
  { id: 2, name: 'Lanyards & Name Badges', cat: 'Access', unit: 'pcs', stock: 850 },
  { id: 3, name: 'AV Cables & Adapters', cat: 'Technical', unit: 'sets', stock: 64 },
  { id: 4, name: 'Folding Tables', cat: 'Furniture', unit: 'pcs', stock: 40 },
  { id: 5, name: 'Branded Tote Bags', cat: 'Merchandise', unit: 'pcs', stock: 500 },
  { id: 6, name: 'Stage Lighting Rigs', cat: 'Technical', unit: 'units', stock: 8 },
  { id: 7, name: 'Registration Kiosks', cat: 'Technical', unit: 'units', stock: 12 },
  { id: 8, name: 'Pop-up Booths', cat: 'Structures', unit: 'units', stock: 18 },
  { id: 9, name: 'First-Aid Kits', cat: 'Safety', unit: 'kits', stock: 30 },
  { id: 10, name: 'Catering Trays', cat: 'Catering', unit: 'pcs', stock: 200 },
  { id: 11, name: 'Wireless Microphones', cat: 'Technical', unit: 'pcs', stock: 45 },
  { id: 12, name: 'Directional Signage', cat: 'Signage', unit: 'pcs', stock: 90 },
]

export const guests: Guest[] = [
  {
    id: 1,
    name: 'Maya Rodriguez',
    email: 'maya.r@email.com',
    phone: '+1 415 555 0192',
    ev: 'TechConf 2026',
    reg: '2026-07-02',
    st: 'Checked-in',
    tok: 'GTHR-7F3A9C',
    ini: 'MR',
    col: '#7C3AED',
  },
  {
    id: 2,
    name: 'Theo Nakamura',
    email: 'theo.n@email.com',
    phone: '+1 206 555 0148',
    ev: 'TechConf 2026',
    reg: '2026-07-03',
    st: 'Checked-in',
    tok: 'GTHR-2B81E4',
    ini: 'TN',
    col: '#C026D3',
  },
  {
    id: 3,
    name: 'Priya Singh',
    email: 'priya.s@email.com',
    phone: '+44 20 7946 0321',
    ev: 'Annual Gala 2026',
    reg: '2026-07-05',
    st: 'Registered',
    tok: 'GTHR-9D44A1',
    ini: 'PS',
    col: '#2B2A3F',
  },
  {
    id: 4,
    name: 'Luke Fernandez',
    email: 'luke.f@email.com',
    phone: '+1 312 555 0177',
    ev: 'Annual Gala 2026',
    reg: '2026-07-06',
    st: 'Registered',
    tok: 'GTHR-5E62F8',
    ini: 'LF',
    col: '#7C3AED',
  },
  {
    id: 5,
    name: 'Aisha Okonkwo',
    email: 'aisha.o@email.com',
    phone: '+234 80 5550 1290',
    ev: 'Founders Dinner',
    reg: '2026-07-08',
    st: 'Checked-in',
    tok: 'GTHR-1A07C3',
    ini: 'AO',
    col: '#C026D3',
  },
  {
    id: 6,
    name: 'Ben Carter',
    email: 'ben.c@email.com',
    phone: '+1 646 555 0103',
    ev: 'TechConf 2026',
    reg: '2026-07-09',
    st: 'Registered',
    tok: 'GTHR-8C39B2',
    ini: 'BC',
    col: '#2B2A3F',
  },
  {
    id: 7,
    name: 'Sofia Marino',
    email: 'sofia.m@email.com',
    phone: '+39 06 5550 712',
    ev: 'TechConf 2026',
    reg: '2026-07-10',
    st: 'Registered',
    tok: 'GTHR-4F90D7',
    ini: 'SM',
    col: '#7C3AED',
  },
  {
    id: 8,
    name: 'Daniel Cho',
    email: 'daniel.c@email.com',
    phone: '+82 2 555 0184',
    ev: 'Founders Dinner',
    reg: '2026-07-11',
    st: 'Checked-in',
    tok: 'GTHR-6B23E9',
    ini: 'DC',
    col: '#C026D3',
  },
  {
    id: 9,
    name: 'Hannah Weiss',
    email: 'hannah.w@email.com',
    phone: '+49 30 5550 466',
    ev: 'Annual Gala 2026',
    reg: '2026-07-12',
    st: 'Cancelled',
    tok: 'GTHR-3D71A0',
    ini: 'HW',
    col: '#2B2A3F',
  },
  {
    id: 10,
    name: 'Marcus Reyes',
    email: 'marcus.r@email.com',
    phone: '+1 213 555 0159',
    ev: 'TechConf 2026',
    reg: '2026-07-13',
    st: 'Registered',
    tok: 'GTHR-7E18C5',
    ini: 'MR',
    col: '#7C3AED',
  },
  {
    id: 11,
    name: 'Yuki Tanaka',
    email: 'yuki.t@email.com',
    phone: '+81 3 5550 290',
    ev: 'Annual Gala 2026',
    reg: '2026-07-14',
    st: 'Registered',
    tok: 'GTHR-2C56F1',
    ini: 'YT',
    col: '#C026D3',
  },
  {
    id: 12,
    name: 'Olivia Bennett',
    email: 'olivia.b@email.com',
    phone: '+1 415 555 0136',
    ev: 'Founders Dinner',
    reg: '2026-07-15',
    st: 'Checked-in',
    tok: 'GTHR-9A82B6',
    ini: 'OB',
    col: '#2B2A3F',
  },
]

export interface FeaturedEvent {
  id: string
  cat: string
  name: string
  venue: string
  date: string
  guests: number
  cap: number
  grad: string
}

/** Featured photo cards for the dashboard "All Events" row. */
export const featured: FeaturedEvent[] = [
  {
    id: 'ev-img-1',
    cat: 'Conference',
    name: 'TechConf 2026',
    venue: 'Grand Hall A, Metro Center',
    date: '2026-07-15',
    guests: 342,
    cap: 500,
    grad: 'linear-gradient(135deg,#C026D3,#7C3AED)',
  },
  {
    id: 'ev-img-2',
    cat: 'Gala',
    name: 'Annual Gala 2026',
    venue: 'Skyline Ballroom',
    date: '2026-08-10',
    guests: 189,
    cap: 300,
    grad: 'linear-gradient(135deg,#6D28D9,#A855F7)',
  },
  {
    id: 'ev-img-3',
    cat: 'Dinner',
    name: 'Founders Dinner',
    venue: 'The Rooftop, 42F',
    date: '2026-09-05',
    guests: 67,
    cap: 80,
    grad: 'linear-gradient(135deg,#2B2A3F,#C026D3)',
  },
]

export const org: Org = {
  name: 'Gatherly',
  tagline: 'Events, orchestrated end to end.',
  website: 'gatherly.co',
  email: 'events@gatherly.co',
  telegram: '@gatherly_ops',
  members: 8,
}

export const team: TeamMember[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Sub-admin',
    email: 's.chen@gatherly.co',
    ini: 'SC',
    col: '#7C3AED',
    evs: 2,
  },
  {
    id: 2,
    name: 'Marcus Webb',
    role: 'Sub-admin',
    email: 'm.webb@gatherly.co',
    ini: 'MW',
    col: '#C026D3',
    evs: 1,
  },
  {
    id: 3,
    name: 'Priya Nair',
    role: 'Sub-admin',
    email: 'p.nair@gatherly.co',
    ini: 'PN',
    col: '#2B2A3F',
    evs: 1,
  },
  {
    id: 4,
    name: 'James Park',
    role: 'Sub-admin',
    email: 'j.park@gatherly.co',
    ini: 'JP',
    col: '#7C3AED',
    evs: 1,
  },
  {
    id: 5,
    name: 'Alex Kim',
    role: 'Handler',
    email: 'a.kim@gatherly.co',
    ini: 'AK',
    col: '#C026D3',
    evs: 1,
  },
  {
    id: 6,
    name: 'Carlos M.',
    role: 'Handler',
    email: 'c.m@gatherly.co',
    ini: 'CM',
    col: '#2B2A3F',
    evs: 2,
  },
  {
    id: 7,
    name: 'Lena Cruz',
    role: 'Handler',
    email: 'l.cruz@gatherly.co',
    ini: 'LC',
    col: '#7C3AED',
    evs: 3,
  },
  {
    id: 8,
    name: 'Jo Walsh',
    role: 'Handler',
    email: 'j.walsh@gatherly.co',
    ini: 'JW',
    col: '#C026D3',
    evs: 2,
  },
]
