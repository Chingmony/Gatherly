# Load test — door rush (docs/11 §8)

Validates the differentiated hot path (organizer QR check-in + registration burst) under concurrency.
The key correctness property: **a door-rush double scan can never create two attendance rows** — the
`UNIQUE(event_checkin.submission_id)` constraint forces the loser to `409 ALREADY_CHECKED_IN`.

## Prerequisites
- [k6](https://k6.io/docs/get-started/installation/) installed.
- A target environment (staging — never run write-load against prod).
- Seed data: a `PUBLIC` event id, a set of valid `checkin_token`s, and an authenticated organizer
  session cookie (the scan endpoint is operator-gated).

## Run
```bash
k6 run \
  -e BASE_URL=https://staging.gatherly.example \
  -e EVENT_ID=<event-uuid> \
  -e SCAN_TOKENS=tkt_aaa,tkt_bbb,tkt_ccc \
  -e ORG_COOKIE="gatherly_at=<jwt>" \
  -e VUS=50 -e DURATION=2m \
  door-rush.js
```

## Thresholds (fail the run if breached)
| Metric | Target | Source |
|--------|--------|--------|
| `http_req_duration` p95 | < 800 ms | docs/08 §7 latency SLO |
| `http_req_failed` rate | < 1% | — |
| unexpected 5xx | 0 | correctness |

## Reading results
- `double_checkin_409` counts re-scans correctly rejected as already-checked-in — this is **expected
  and good**, not a failure. Cross-check the DB afterwards: `SELECT submission_id, count(*) FROM
  event_checkin GROUP BY submission_id HAVING count(*) > 1;` must return **zero rows**.
- Watch DB pool saturation (`hikaricp.connections.*`) and Redis latency during the run (docs/08 §3).
