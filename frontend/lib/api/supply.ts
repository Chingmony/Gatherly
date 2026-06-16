/**
 * Supply catalog surface — wraps `/api/v1/supply-items` (see backend `SupplyItemController`).
 * The catalog is GLOBAL (not per-event): any authenticated user can read it; create/edit/delete
 * are ADMIN-only. Items are referenced by event materials via `catalogItemId`, so deleting an
 * in-use item returns `409 CONFLICT`.
 */
import { apiFetch } from "./client";

/** Mirrors backend `SupplyItemResponse`. */
export interface SupplyItem {
  id: string;
  name: string;
  description: string | null;
  /** Unit of measure, e.g. "pcs", "boxes". */
  unit: string | null;
  defaultQuantity: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors backend `SupplyItemRequest` (create/update; PUT replaces all of these fields). */
export interface SupplyItemWriteBody {
  name: string;
  description?: string | null;
  unit?: string | null;
  defaultQuantity?: number | null;
  active?: boolean;
}

/** Whitelisted sort keys — mirrors backend `SupplyItemSort`. */
export type SupplyItemSort = "NAME" | "QUANTITY" | "CREATED_AT";

/** Paginated, searchable catalog list. Returns the page content (single page of up to 100). */
export function listSupplyItems(search?: string): Promise<SupplyItem[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}&size=100` : "?size=100";
  return apiFetch<SupplyItem[]>(`/supply-items${qs}`);
}

/** Create a catalog item (Admin). `active` defaults to true when omitted. */
export function createSupplyItem(body: SupplyItemWriteBody): Promise<SupplyItem> {
  return apiFetch<SupplyItem>(`/supply-items`, { method: "POST", body });
}

/** Update a catalog item (Admin). PUT replaces all fields. */
export function updateSupplyItem(itemId: string, body: SupplyItemWriteBody): Promise<SupplyItem> {
  return apiFetch<SupplyItem>(`/supply-items/${itemId}`, { method: "PUT", body });
}

/** Delete a catalog item (Admin). `409 CONFLICT` if still referenced by event materials. */
export function deleteSupplyItem(itemId: string): Promise<void> {
  return apiFetch<void>(`/supply-items/${itemId}`, { method: "DELETE" });
}
