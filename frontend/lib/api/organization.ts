/**
 * Organization profile surface — wraps `/api/v1/organization` (see backend `OrganizationController`).
 * The org is a SINGLETON row: any authenticated user can read it; only ADMIN can edit. On update,
 * null fields are left unchanged server-side. `logoKey`/`bannerKey` are Rustfs object keys;
 * `logoUrl`/`bannerUrl` are the resolved public (presigned) URLs for display.
 */
import { apiFetch } from "./client";

/** Mirrors backend `OrganizationResponse`. `logoUrl`/`bannerUrl` are viewable (presigned) URLs. */
export interface Organization {
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

/** Backwards-compatible alias — some callers import the response type as `OrganizationResponse`. */
export type OrganizationResponse = Organization;

/** Mirrors backend `OrganizationUpdateRequest`. Omitted/null fields are left unchanged. */
export interface OrganizationUpdateBody {
  name?: string | null;
  description?: string | null;
  logoKey?: string | null;
  bannerKey?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

/** Read the singleton org profile. Any authenticated user may call this. */
export function getOrganization(signal?: AbortSignal): Promise<Organization> {
  return apiFetch<Organization>("/organization", { signal });
}

/** Update the org profile (ADMIN only). 403 for sub-admins. */
export function updateOrganization(body: OrganizationUpdateBody): Promise<Organization> {
  return apiFetch<Organization>("/organization", { method: "PUT", body });
}
