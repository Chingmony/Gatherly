---
name: agenda-mock-seam
description: frontend/lib/api/agenda.ts is mock-backed; AgendaTab in workspace page is already fully wired to it
metadata:
  type: project
---

`frontend/lib/api/agenda.ts` is fully implemented as a mock-backed module (no backend endpoint exists yet).

## What's in place
- `AgendaItem`, `AgendaItemType`, `AgendaStaff` TypeScript interfaces match the planned `AgendaItemResponse` DTO
- `MOCK_AGENDA` constant with 8 realistic run-of-show entries
- `listAgenda(eventId, signal?)` returns `Promise<AgendaItem[]>` via `Promise.resolve(MOCK_AGENDA.map(...))`
- `AGENDA_TYPE_STYLE` record maps `AgendaItemType` → chip/accent CSS vars used by the timeline UI
- The JSDoc comment in the file documents exactly which `apiFetch` call to substitute when the backend lands

## AgendaTab component (workspace/page.tsx lines ~1252-1342)
- Lives at the bottom of `frontend/app/(app)/events/[id]/workspace/page.tsx`
- Client component (the whole page is `"use client"`)
- Fetches on mount via `useEffect` with cancellation flag
- Handles loading spinner, error card (AlertTriangle), and success timeline view
- `sessions.length === 0` shows an empty-state message

## Spec'd backend endpoint (not yet implemented)
`GET /events/{eventId}/agenda` → `AgendaItem[]` wrapped in `{ success, message, data }`

**When backend lands:** Replace the body of `listAgenda` in `agenda.ts` with:
```ts
return apiFetch<AgendaItem[]>(`/events/${eventId}/agenda`, { signal })
```
No changes to the component or the types are needed.
