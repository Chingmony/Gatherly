import { apiFetch } from "./client";
import type {
  ChangeStatusBody, CreateMaterialBody, MaterialHistoryResponse, MaterialResponse,
  MyTaskResponse, SupplyItemBody, SupplyItemResponse, UpdateMaterialBody,
} from "./types";

/**
 * Materials & workflow (docs/03 §4.6/§4.7). Server Components read via `serverFetch`; these client
 * helpers cover mutations and on-demand reads (history, my-tasks) from client islands.
 */

// ---- Main supply catalog (Admin-only mutation, docs/03 §4.6) --------------

export function listSupplyItems(): Promise<SupplyItemResponse[]> {
  return apiFetch<SupplyItemResponse[]>("/supply-items");
}

export function createSupplyItem(body: SupplyItemBody): Promise<SupplyItemResponse> {
  return apiFetch<SupplyItemResponse>("/supply-items", { method: "POST", body: JSON.stringify(body) });
}

export function updateSupplyItem(id: string, body: SupplyItemBody): Promise<SupplyItemResponse> {
  return apiFetch<SupplyItemResponse>(`/supply-items/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export function deleteSupplyItem(id: string): Promise<void> {
  return apiFetch<void>(`/supply-items/${id}`, { method: "DELETE" });
}

// ---- Event materials (docs/03 §4.7) ---------------------------------------

export function listMaterials(eventId: string): Promise<MaterialResponse[]> {
  return apiFetch<MaterialResponse[]>(`/events/${eventId}/materials`);
}

export function createMaterial(eventId: string, body: CreateMaterialBody): Promise<MaterialResponse> {
  return apiFetch<MaterialResponse>(`/events/${eventId}/materials`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateMaterial(
  eventId: string,
  materialId: string,
  body: UpdateMaterialBody,
): Promise<MaterialResponse> {
  return apiFetch<MaterialResponse>(`/events/${eventId}/materials/${materialId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteMaterial(eventId: string, materialId: string): Promise<void> {
  return apiFetch<void>(`/events/${eventId}/materials/${materialId}`, { method: "DELETE" });
}

/** Advance a material's workflow state (state machine + authority enforced server-side). */
export function changeMaterialStatus(materialId: string, body: ChangeStatusBody): Promise<MaterialResponse> {
  return apiFetch<MaterialResponse>(`/materials/${materialId}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function materialHistory(materialId: string): Promise<MaterialHistoryResponse[]> {
  return apiFetch<MaterialHistoryResponse[]>(`/materials/${materialId}/history`);
}

/** The caller's own assigned tasks across every event (Handler "My Tasks"). */
export function myTasks(): Promise<MyTaskResponse[]> {
  return apiFetch<MyTaskResponse[]>("/materials/mine");
}
