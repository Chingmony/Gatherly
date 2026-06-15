/**
 * Registration-form builder surface — wraps the organizer-facing form routes under
 * `/api/v1/events/{eventId}/form` (see backend `FormController`). Reading needs event view
 * rights; editing/activating need manage rights (ADMIN or event MANAGER). The JSONB field
 * schema here is the single source of truth shared with the public guest renderer and the
 * server-side validator.
 */
import { apiFetch, ApiError } from "./client";

/** Field input types (serialized lowercase in the schema; mirrors backend `FormFieldType`). */
export type FormFieldType =
  | "text"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "select"
  | "multiselect"
  | "checkbox"
  | "textarea";

/** Form lifecycle (mirrors backend `FormStatus`). Editable only while DRAFT. */
export type FormStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

/** Optional per-field validation constraints (mirrors backend `FormFieldValidation`). */
export interface FormFieldValidation {
  minLength?: number | null;
  maxLength?: number | null;
  min?: number | null;
  max?: number | null;
  pattern?: string | null;
}

/** One field definition in the schema. `key` is unique within a form; `order` drives render order. */
export interface FormField {
  key: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  order: number;
  options?: string[] | null;
  validation?: FormFieldValidation | null;
}

/** Form projection returned by the API (mirrors backend `FormResponse`). */
export interface FormResponse {
  id: string;
  eventId: string;
  title: string;
  status: FormStatus;
  version: number;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
}

/** Upsert body (mirrors backend `FormSchemaRequest`). */
export interface FormSchemaRequest {
  title: string;
  fields: FormField[];
}

// ── Reusable form templates (not event-scoped) ───────────────────────────────

/** A reusable registration-form template (mirrors backend `FormTemplateResponse`). */
export interface FormTemplate {
  id: string;
  name: string;
  /** Free-form event category, e.g. "Conference", "Workshop". */
  eventType: string;
  title: string;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
}

/** Create/edit body for a template (mirrors backend `FormTemplateRequest`). */
export interface FormTemplateRequest {
  name: string;
  eventType: string;
  title: string;
  fields: FormField[];
}

/** All templates, most-recently-updated first. ADMIN or SUB_ADMIN only. */
export function listTemplates(): Promise<FormTemplate[]> {
  return apiFetch<FormTemplate[]>("/form-templates");
}

/** Create a new reusable template. */
export function createTemplate(body: FormTemplateRequest): Promise<FormTemplate> {
  return apiFetch<FormTemplate>("/form-templates", { method: "POST", body });
}

/** Update an existing template. */
export function updateTemplate(id: string, body: FormTemplateRequest): Promise<FormTemplate> {
  return apiFetch<FormTemplate>(`/form-templates/${id}`, { method: "PUT", body });
}

/** Delete a template. */
export function deleteTemplate(id: string): Promise<void> {
  return apiFetch<void>(`/form-templates/${id}`, { method: "DELETE" });
}

/**
 * Fetch the event's registration form, or `null` if none has been created yet (the API 404s
 * before the first save). Other errors propagate as {@link ApiError}.
 */
export async function getForm(eventId: string): Promise<FormResponse | null> {
  try {
    return await apiFetch<FormResponse>(`/events/${eventId}/form`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Create or update the form schema while DRAFT. 409 CONFLICT if the form is already ACTIVE. */
export function saveForm(eventId: string, body: FormSchemaRequest): Promise<FormResponse> {
  return apiFetch<FormResponse>(`/events/${eventId}/form`, { method: "PUT", body });
}

/**
 * Activate the form so the event can accept public registrations. The server re-checks that a
 * required `email` and a required `phone` field exist (400 VALIDATION_ERROR otherwise).
 */
export function activateForm(eventId: string): Promise<FormResponse> {
  return apiFetch<FormResponse>(`/events/${eventId}/form/activate`, { method: "POST" });
}
