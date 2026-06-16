---
name: workspace-page-data-fetching
description: How WorkspacePage fetches data — "use client" page, tab-scoped child components own their own fetches
metadata:
  type: project
---

`frontend/app/(app)/events/[id]/workspace/page.tsx` is a **Client Component** (`"use client"` at top).

## Fetching strategy
- The main `WorkspacePage` component fetches: the current event (`getEvent`), all events for the switcher dropdown (`listEvents`), materials + assignments (`listMaterials` + `listAssignments` in a `Promise.all`), and users (Admin-only, silently fails for non-admins).
- Each tab's data is owned by its own child component (`GuestsTab`, `AgendaTab`) which fetches on mount via `useEffect` with a cancellation flag pattern.
- There is NO server-side pre-fetching. All data is fetched client-side on mount/tab switch.

## Cancellation pattern used throughout
```ts
useEffect(() => {
  let cancelled = false
  setLoading(true)
  someApiCall(id)
    .then((data) => { if (!cancelled) setState(data) })
    .catch((e) => { if (!cancelled) setError(e instanceof ApiError ? e.message : "Fallback msg.") })
    .finally(() => { if (!cancelled) setLoading(false) })
  return () => { cancelled = true }
}, [id])
```

## Error handling pattern
- `ApiError` is imported from `lib/api/client` — always check `e instanceof ApiError` before `e.message`
- `409 ALREADY_CHECKED_IN` is handled as idempotent success in `GuestsTab.checkIn()`
- Non-blocking failures (switcher dropdown, user list for non-admins) use empty catch blocks intentionally

## Loading/error UI pattern
- Loading: centered `<Loader2 className="animate-spin" />` with descriptive text
- Error: `<Card><CardContent>` with `<AlertTriangle>` icon + message from `ApiError.message`
- Empty state: inline paragraph within the success render path
