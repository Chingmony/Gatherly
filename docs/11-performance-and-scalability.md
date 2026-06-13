# 11 — Performance & Scalability

> **Status:** Draft · **Depends on:** [`02`](02-database-schema.md) (indexes), [`06`](06-backend-services-spec.md), [`08`](08-observability-and-operations.md)
> Performance budgets, data-access patterns, caching, and the scaling story — with special attention to the **door-rush** check-in burst.

---

## 1. Performance budgets (SLOs)

| Surface | Target |
|---------|--------|
| Standard authenticated reads (lists, dashboards) | p95 < 300 ms |
| Material status update / attendance scan | p95 < 250 ms |
| Public registration submit (excl. async email) | p95 < 400 ms |
| Attendee search (JSONB containment) | p95 < 500 ms at v1 volumes |
| Frontend interactive route TTI | < 2.5 s on mid-tier mobile |

Measured continuously via `http.server.requests` ([`08` §3](08-observability-and-operations.md)); regressions alerted.

## 2. The critical path: check-in burst

The hardest load is a **door rush** — many organizer scans in a short window for one event.

- Each scan is a single indexed lookup (`UNIQUE(checkin_token)`) + one insert + one update, in a short transaction — cheap and concurrency-safe.
- **Idempotency without contention:** correctness comes from the `UNIQUE(event_checkin.submission_id)` constraint, not row locks; concurrent duplicate scans resolve to `409` at the DB, no app-level lock needed ([`06` §4](06-backend-services-spec.md)).
- Telegram ops push is **after-commit/async** — it never sits in the scan's latency path.
- Live attendance view uses incremental updates (SSE/poll), not full re-counts per scan.

## 3. Database performance

- **Indexes** ([`02` §7](02-database-schema.md)): every filtered FK B-tree'd; `UNIQUE(checkin_token)` for O(1) scan resolution; GIN on `answers`/`schema` for containment search; composite `(event_id, checked_in_at)` and `(material_id, created_at)` for timelines.
- **N+1 avoidance:** `@EntityGraph`/join-fetch on list endpoints (event+assignments, material+assignee, submissions) ([`06` §8](06-backend-services-spec.md)).
- **Pagination** mandatory on growable collections (users, submissions, materials, attendance) — keyset pagination for large attendee/attendance lists where ordering allows.
- **Connection pool:** HikariCP sized to DB capacity (start ~10/instance); monitor saturation ([`08` §7](08-observability-and-operations.md)).
- **Projections:** read DTOs/`@Query` projections for heavy lists to avoid loading full entities + JSONB when not needed.

## 4. Caching (Redis & HTTP)

- **Redis** already in-stack: OTP + rate-limit; extend to cache hot, rarely-changing reads — the **org profile** and an **active-form schema per event** (read on every public registration). Invalidate on update; short TTL fallback.
- **Per-request memoization:** `EventSecurityService` results cached within a request to avoid repeated assignment lookups across multiple `@PreAuthorize` evaluations.
- **HTTP caching:** public form schema and Rustfs public assets (logo/banner) served with cache headers / CDN; `next/image` optimization on the frontend.
- Avoid caching anything authorization-sensitive across users.

## 5. Asynchronous & background work

- Email + Telegram dispatched on a bounded `@Async` executor after commit; backpressure via queue size + retry sweeps ([`06` §7](06-backend-services-spec.md)).
- Scheduled sweeps use `FOR UPDATE SKIP LOCKED` / ShedLock so they don't double-send or contend under multiple instances.
- QR PNG rendering is light; cache/reuse not needed, but rendering happens off the request path (during async email build).

## 6. Scaling model

- **Backend is stateless** (JWT, no server session) → scale horizontally behind a load balancer; no sticky sessions.
- **Shared state** lives in Postgres + Redis; both scale vertically first, then read-replicas (Postgres) / managed cluster (Redis) as needed.
- **Frontend** (Next.js) scales as stateless containers / edge; static and cacheable surfaces offloaded to CDN.
- **Bottleneck order (expected):** Postgres write throughput → connection pool → email provider rate. Scale reads via replicas + caching before sharding (not anticipated at v1 scale).

## 7. Frontend performance (cross-ref [`05` §10](05-frontend-spec.md))

- Server-first rendering; client JS budget < 130 KB gzip on interactive routes; heavy islands (scanner, builder) dynamically imported.
- Virtualize long tables (submissions/attendance); debounce search; parallelize server fetches (no waterfalls).

## 8. Load & capacity testing

- **Tools:** k6 or Gatling against staging.
- **Scenarios:** (a) door-rush — N concurrent scans/sec for one event incl. duplicate-scan mix; (b) registration spike when an event goes Public; (c) attendee-search under a large submission set.
- **Pass criteria:** SLOs in §1 hold; zero double-confirmations under concurrent scans; error rate < 1%.
- Capacity planning: derive instance count + pool sizes from measured throughput; document headroom.

## 9. Open questions

- **SSE vs polling** for live attendance? *(Default: SSE behind the LB if supported; else 5 s polling — affects connection counts.)*
- **Read replica** needed at target scale, or single primary sufficient for v1? *(Default: single primary v1; design queries replica-friendly.)*
- **Keyset vs offset** pagination default? *(Default: offset for admin tables, keyset for attendance/submission feeds.)*
