/**
 * Organization profile — the single org-wide profile (name, logo, banner, contact).
 * Wraps `GET /organization` (backend `OrganizationController`). Reading is open to any
 * authenticated user (`isAuthenticated()`); editing is ADMIN-only and not wrapped here.
 */
import { apiFetch } from "./client";

/** Mirrors backend `OrganizationResponse`. `logoUrl`/`bannerUrl` are viewable (presigned) URLs. */
export interface OrganizationResponse {
  id: string;
  name: string;
  description: string | null;
  logoKey: string | null;
  bannerKey: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  updatedAt: string;
}

/** Read the organization profile. Any authenticated user may call this. */
export async function getOrganization(signal?: AbortSignal): Promise<OrganizationResponse> {
  return apiFetch<OrganizationResponse>("/organization", { signal });
}
