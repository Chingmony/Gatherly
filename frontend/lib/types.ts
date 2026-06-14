export interface PageMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: PageMeta;
  timestamp: string;
}

export type GlobalRole = "ADMIN" | "SUB_ADMIN" | "USER";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  address: string | null;
  globalRole: GlobalRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  avatarUrl: string | null;
}

export interface LoginResponse {
  tokenType: string;
  accessToken: string;
  expiresInSeconds: number;
  user: UserResponse;
}

export type EventStatus = "DRAFT" | "PUBLIC" | "ARCHIVED";

export interface EventResponse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  venue: string | null;
  startsAt: string;
  endsAt: string | null;
  status: EventStatus;
  registrationQrToken: string | null;
  checkinOpensAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type MaterialStatus = "PENDING" | "IN_PROGRESS" | "NEEDS_REVIEW" | "DONE" | "ISSUE";

export interface MaterialResponse {
  id: string;
  eventId: string;
  catalogItemId: string | null;
  name: string;
  description: string | null;
  quantity: number | null;
  status: MaterialStatus;
  assignedTo: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
