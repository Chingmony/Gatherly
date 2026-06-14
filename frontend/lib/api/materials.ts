import { materials as mockMaterials, catalog as mockCatalog } from '@/lib/mock-data'
import type { MaterialRow, CatalogItem } from './types'

/** All material work items (across events). */
export function listMaterials(): MaterialRow[] {
  return mockMaterials
}

/** Material work items for a single event (by event name). */
export function materialsForEvent(eventName: string): MaterialRow[] {
  return mockMaterials.filter((m) => m.ev === eventName)
}

/** The organization-wide supply catalog (stock listings). */
export function listCatalog(): CatalogItem[] {
  return mockCatalog
}
