import { org as mockOrg } from '@/lib/mock-data'
import type { Org } from './types'

/** The single organization's profile/branding (one-org platform). */
export function getOrganization(): Org {
  return mockOrg
}
