/**
 * Materials surface — wraps `/api/v1/events/{eventId}/materials` and `/api/v1/materials/{id}`
 * (see backend `MaterialController`). A material is an event task/item with a 5-state workflow.
 * Listing/history follow event view rights; create/edit/delete need manage rights (ADMIN or event
 * MANAGER); status changes are also allowed for the assigned HANDLER.
 */
import { apiFetch } from "./client";

/** Mirrors backend `MaterialStatus`. */
export type MaterialStatus = "PENDING" | "IN_PROGRESS" | "NEEDS_REVIEW" | "DONE" | "ISSUE";

/** Mirrors backend `MaterialResponse`. */
export interface MaterialResponse {
  id: string;
  eventId: string;
  catalogItemId: string | null;
  name: string;
  description: string | null;
  quantity: number | null;
  status: MaterialStatus;
  assignedTo: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors backend `MaterialRequest` (create/update; PUT replaces all of these fields). */
export interface MaterialWriteBody {
  name: string;
  description?: string | null;
  quantity?: number | null;
  catalogItemId?: string | null;
  assignedTo?: string | null;
}

/** Paginated, searchable list of an event's materials. Returns the page content. */
export function listMaterials(eventId: string, search?: string): Promise<MaterialResponse[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}&size=100` : "?size=100";
  return apiFetch<MaterialResponse[]>(`/events/${eventId}/materials${qs}`);
}

/** Create a material (Manager/Admin). Starts in PENDING. */
export function createMaterial(eventId: string, body: MaterialWriteBody): Promise<MaterialResponse> {
  return apiFetch<MaterialResponse>(`/events/${eventId}/materials`, { method: "POST", body });
}

/** Update a material's details, including its assignee (Manager/Admin). PUT replaces all fields. */
export function updateMaterial(
  eventId: string,
  materialId: string,
  body: MaterialWriteBody,
): Promise<MaterialResponse> {
  return apiFetch<MaterialResponse>(`/events/${eventId}/materials/${materialId}`, {
    method: "PUT",
    body,
  });
}

/** Drive a workflow transition (ADMIN, event MANAGER, or the assigned HANDLER). */
export function changeMaterialStatus(
  materialId: string,
  toStatus: MaterialStatus,
  note?: string,
): Promise<MaterialResponse> {
  return apiFetch<MaterialResponse>(`/materials/${materialId}/status`, {
    method: "PATCH",
    body: { toStatus, note: note ?? null },
  });
}

/** Remove a material (Manager/Admin). */
export function deleteMaterial(eventId: string, materialId: string): Promise<void> {
  return apiFetch<void>(`/events/${eventId}/materials/${materialId}`, { method: "DELETE" });
}

/** Ordered workflow columns for the board. */
export const MATERIAL_STATUSES: MaterialStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "NEEDS_REVIEW",
  "DONE",
  "ISSUE",
];

export const MATERIAL_STATUS_LABEL: Record<MaterialStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  NEEDS_REVIEW: "Needs Review",
  DONE: "Done",
  ISSUE: "Issue",
};
