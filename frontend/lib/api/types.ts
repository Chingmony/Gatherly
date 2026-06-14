/** Mirrors the backend DTOs (docs/03). Generated from OpenAPI in a later milestone. */

export type GlobalRole = "ADMIN" | "MEMBER";
export type EventRole = "MANAGER" | "HANDLER";
export type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING_ACTIVATION";
export type Gender = "MALE" | "FEMALE" | "OTHER";

/** Role designation offered in the Add-User form — never ADMIN (docs/05 §7a). */
export type InviteRole = "SUB_ADMIN" | "HANDLER";

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: string;
  address?: string;
  avatarKey?: string;
  globalRole: GlobalRole;
  defaultEventRole?: EventRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

/** Display label for the "Role" column: Admin, or the event-role designation, else Member. */
export function displayRole(u: Pick<UserResponse, "globalRole" | "defaultEventRole">): string {
  if (u.globalRole === "ADMIN") return "Admin";
  if (u.defaultEventRole === "MANAGER") return "Sub-admin";
  if (u.defaultEventRole === "HANDLER") return "Handler";
  return "Member";
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Add-User invite payload — no password (docs/03 §4.2). */
export interface InviteUserBody {
  fullName: string;
  email: string;
  role: InviteRole;
}

// ---- Organization (docs/03 §4.3) ------------------------------------------

export interface OrganizationResponse {
  id: string;
  name: string;
  description?: string;
  logoKey?: string;
  bannerKey?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrganizationBody {
  name: string;
  description?: string;
  logoKey?: string;
  bannerKey?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// ---- Events (docs/03 §4.4) ------------------------------------------------

export type EventStatus = "DRAFT" | "PUBLIC" | "ARCHIVED";

export interface EventResponse {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  venue?: string;
  startsAt?: string;
  endsAt?: string;
  status: EventStatus;
  checkinOpensAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventBody {
  title: string;
  description?: string;
  venue?: string;
  startsAt?: string;
  endsAt?: string;
}

export type UpdateEventBody = CreateEventBody;

// ---- Agenda (docs/03 §4.4, docs/02 §3.8) ----------------------------------

export interface AgendaItemResponse {
  id: string;
  title: string;
  startsAt?: string;
  endsAt?: string;
  position: number;
}

export interface AgendaResponse {
  eventId: string;
  items: AgendaItemResponse[];
}

/** A single agenda line submitted on replace — order is the array index. */
export interface AgendaItemInput {
  title: string;
  startsAt?: string;
  endsAt?: string;
}

export interface UpdateAgendaBody {
  items: AgendaItemInput[];
}

/** A built-in/custom agenda template item ([{title, durationMin, order}], docs/02 §6/§3.8). */
export interface AgendaTemplateItem {
  title: string;
  durationMin?: number;
  order?: number;
}

export interface AgendaTemplateResponse {
  id: string;
  name: string;
  items: AgendaTemplateItem[];
  isDefault: boolean;
}

// ---- Storage presign (docs/04 §4.4) ---------------------------------------

export type StoragePurpose = "ORG_LOGO" | "ORG_BANNER" | "USER_AVATAR";

export interface PresignBody {
  purpose: StoragePurpose;
  contentType: string;
  sizeBytes: number;
}

export interface PresignResponse {
  uploadUrl: string;
  objectKey: string;
  publicUrl?: string;
}
