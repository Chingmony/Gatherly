import { apiFetch } from "./client";
import type { OrganizationResponse, UpdateOrganizationBody } from "./types";

/** Client-side org-profile mutation (docs/03 §4.3). The read is done server-side (see server.ts). */
export function updateOrganization(body: UpdateOrganizationBody): Promise<OrganizationResponse> {
  return apiFetch<OrganizationResponse>("/organization", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
