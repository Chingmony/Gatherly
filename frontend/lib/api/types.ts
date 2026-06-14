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
  category?: string;
  capacity?: number | null;
  coverGradient?: string;
  coverImageKey?: string;
  checkinOpensAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventBody {
  title: string;
  description?: string;
  venue?: string;
  category?: string;
  capacity?: number;
  coverGradient?: string;
  coverImageKey?: string;
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

// ---- Dynamic form schema (docs/02 §6) -------------------------------------

export type FieldType =
  | "text" | "textarea" | "email" | "phone" | "number" | "date"
  | "select" | "multiselect" | "checkbox";

export interface FormFieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface FormField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  order?: number;
  options?: string[];
  validation?: FormFieldValidation;
  placeholder?: string;
  /** Email field is locked (required-for-ticket, undeletable) in the builder (docs/05 §5.1). */
  locked?: boolean;
}

export type FormStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

export interface FormResponse {
  id: string;
  eventId: string;
  title: string;
  status: FormStatus;
  schema: FormField[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateFormBody {
  title?: string;
  schema: FormField[];
}

// ---- Public guest surface (docs/03 §4.9) ----------------------------------

export interface PublicEventCard {
  id: string;
  slug: string;
  title: string;
  category?: string;
  venue?: string;
  startsAt?: string;
  coverGradient?: string;
  coverImageKey?: string;
  registered: number;
  capacity?: number | null;
}

export interface PublicFormResponse {
  eventId: string;
  eventTitle: string;
  formTitle: string;
  schema: FormField[];
  version: number;
}

export interface RegisterResponse {
  submissionId: string;
  ticketStatus: string;
  checkinToken: string;
  ticketUrl: string;
  message: string;
}

export interface PublicTicket {
  checkinToken: string;
  guestName?: string;
  eventTitle: string;
  venue?: string;
  startsAt?: string;
  qrStatus: string;
}

// ---- Event delegation / members (docs/03 §4.5) ----------------------------

export interface AssignmentResponse {
  id: string;
  userId: string;
  fullName?: string;
  email?: string;
  eventRole: EventRole;
  assignedBy?: string;
  createdAt: string;
}

export interface AssignMemberBody {
  userId: string;
  role: InviteRole;
}

// ---- Submissions / manage guests (docs/03 §4.8) ---------------------------

export type TicketStatus = "PENDING" | "DELIVERED" | "CHECKED_IN" | "REVOKED";

export interface SubmissionResponse {
  id: string;
  guestName?: string;
  guestEmail: string;
  guestPhone: string;
  qrStatus: TicketStatus;
  submittedAt: string;
}

// ---- Admin Command Center dashboard (docs/03 §4.13, docs/06 §11) ----------

export interface CommandCenterLifecycle {
  total: number;
  draft: number;
  live: number;
  completed: number;
}

export interface CommandCenterRegistration {
  totalRegistered: number;
  totalCheckedIn: number;
  totalCapacity: number;
  fillPct: number;
}

export interface CommandCenterMaterialBucket {
  id: string;
  label: string;
  count: number;
}

export interface CommandCenterMaterialHealth {
  total: number;
  onTrackPct: number;
  issues: number;
  buckets: CommandCenterMaterialBucket[];
}

export interface CommandCenterEventRow {
  id: string;
  title: string;
  slug?: string;
  status: EventStatus;
  startsAt?: string;
  venue?: string;
  category?: string;
  coverGradient?: string;
  coverImageKey?: string;
  capacity?: number | null;
  registered: number;
  checkedIn: number;
  managerId?: string | null;
  managerName?: string | null;
  issueCount: number;
}

export interface CommandCenterIssue {
  eventId: string;
  eventName: string;
  coverGradient?: string;
  handlerName?: string;
  task: string;
  note?: string;
  when?: string;
}

export interface CommandCenterResponse {
  lifecycle: CommandCenterLifecycle;
  registration: CommandCenterRegistration;
  /** Null until the material/task domain lands (docs/06 §11) — UI shows a "not tracked" state. */
  materialHealth: CommandCenterMaterialHealth | null;
  events: CommandCenterEventRow[];
  critical: CommandCenterIssue[];
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

// ---- Materials & workflow (docs/03 §4.6/§4.7, docs/02 §5) -----------------

export type MaterialStatus = "PENDING" | "IN_PROGRESS" | "NEEDS_REVIEW" | "DONE" | "ISSUE";

export interface SupplyItemResponse {
  id: string;
  name: string;
  description?: string;
  unit?: string;
  defaultQuantity?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplyItemBody {
  name: string;
  description?: string;
  unit?: string;
  defaultQuantity?: number;
  active?: boolean;
}

export interface MaterialResponse {
  id: string;
  eventId: string;
  catalogItemId?: string;
  name: string;
  description?: string;
  quantity?: number;
  status: MaterialStatus;
  assignedTo?: string;
  assignedToName?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialBody {
  name: string;
  description?: string;
  quantity?: number;
  catalogItemId?: string;
  assignedTo?: string;
}

export type UpdateMaterialBody = CreateMaterialBody;

/** Handler's primary action — body `{ toStatus, note? }` (docs/03 §4.7). */
export interface ChangeStatusBody {
  toStatus: MaterialStatus;
  note?: string;
}

export interface MaterialHistoryResponse {
  id: string;
  materialId: string;
  fromStatus?: MaterialStatus;
  toStatus: MaterialStatus;
  changedBy?: string;
  changedByName?: string;
  note?: string;
  createdAt: string;
}

/** A Handler's assigned task with event context (docs/03 §4.7 — `GET /materials/mine`). */
export interface MyTaskResponse {
  id: string;
  eventId: string;
  eventTitle?: string;
  name: string;
  description?: string;
  quantity?: number;
  status: MaterialStatus;
  createdAt: string;
  updatedAt: string;
}
