// Door-rush load test (docs/11 §8): simulate many organizers scanning QRs at the same time plus a
// burst of public registrations, to validate that attendance check-in stays correct and fast under
// concurrency — and that the UNIQUE(submission_id) constraint makes double check-in impossible.
//
// Run:  k6 run -e BASE_URL=https://staging.gatherly.example door-rush.js
// Vars: BASE_URL (required), VUS (default 50), DURATION (default 1m), EVENT_ID, SCAN_TOKENS (csv),
//       ORG_COOKIE (an authenticated organizer session cookie for the scan endpoint).
//
// What to watch (thresholds below): p95 latency < 800ms (docs/08 §7), HTTP error rate < 1%, and
// ZERO unexpected 5xx. A re-scan of an already-used token returning 409 ALREADY_CHECKED_IN is the
// CORRECT idempotent outcome, not an error.
import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

const BASE = __ENV.BASE_URL;
const EVENT_ID = __ENV.EVENT_ID || "00000000-0000-0000-0000-000000000000";
const TOKENS = (__ENV.SCAN_TOKENS || "").split(",").filter(Boolean);
const ORG_COOKIE = __ENV.ORG_COOKIE || "";

const doubleCheckins = new Counter("double_checkin_409"); // expected idempotent rejects (good)

export const options = {
  vus: Number(__ENV.VUS || 50),
  duration: __ENV.DURATION || "1m",
  thresholds: {
    http_req_duration: ["p(95)<800"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  // ── Door rush: organizers scanning QR tokens (some tokens scanned by multiple VUs on purpose). ──
  if (TOKENS.length > 0 && ORG_COOKIE) {
    const token = TOKENS[Math.floor(Math.random() * TOKENS.length)];
    const res = http.post(
      `${BASE}/api/v1/events/${EVENT_ID}/attendance/scan`,
      JSON.stringify({ checkinToken: token }),
      { headers: { "Content-Type": "application/json", Cookie: ORG_COOKIE } },
    );
    check(res, {
      "scan accepted or idempotent-409": (r) => r.status === 201 || r.status === 409,
      "no server error": (r) => r.status < 500,
    });
    if (res.status === 409) doubleCheckins.add(1);
  }

  // ── Registration burst on the public surface. ──
  const reg = http.post(
    `${BASE}/api/v1/public/events/${EVENT_ID}/register`,
    JSON.stringify({ answers: { full_name: `LoadTest ${__VU}-${__ITER}`, email: `lt${__VU}_${__ITER}@example.com`, phone: "+10000000000" } }),
    { headers: { "Content-Type": "application/json" } },
  );
  check(reg, { "register handled (2xx/4xx, not 5xx)": (r) => r.status < 500 });

  sleep(0.2);
}
