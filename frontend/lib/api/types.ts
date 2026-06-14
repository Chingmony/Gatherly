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
