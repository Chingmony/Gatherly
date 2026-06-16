---
name: backend-controller-inventory
description: Which Spring Boot controllers exist in the backend; agenda endpoints are NOT yet implemented
metadata:
  type: project
---

Controllers that exist in `backend/src/main/java/com/gatherly/controller/` (as of 2026-06-16):

- `AttendanceController` — GET/POST submissions, attendance, scan, manual, revoke
- `AuthController`
- `EventAssignmentController`
- `EventController`
- `FormController`, `FormTemplateController`
- `MaterialController`
- `OrganizationController`
- `PingController`, `PublicController`
- `StorageController`
- `SupplyItemController`
- `TelegramController`
- `UserController`

**No `AgendaController` exists.** The spec (`docs/03-api-routes-security.md` §4.4) defines:
- `GET /events/{eventId}/agenda` (canView)
- `PUT /events/{eventId}/agenda` (canManage)
- `GET /agenda-templates` (authenticated)

The `agenda_template` / `agenda_item` tables are in the DB schema (`docs/02-database-schema.md` §3.8) but no service or controller has been implemented. The frontend `lib/api/agenda.ts` is mock-backed until this lands.

**How to apply:** When a task touches agenda data fetching, confirm the backend still lacks an AgendaController before swapping from mock to real. When the controller is added, the swap in `agenda.ts` is a one-line body replacement in `listAgenda`.
