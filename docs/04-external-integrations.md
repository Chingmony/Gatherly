# 04 — External Integrations

> **Status:** Draft · **Depends on:** [`01`](01-architecture-layout.md), [`02`](02-database-schema.md), [`03`](03-api-routes-security.md)
> Configuration and integration roadmap for the external boundaries: **Email/SMTP** (QR ticket + OTP delivery), **Telegram Bot API** (ops-channel forwarding), **Redis** (OTP/rate-limit), and **Rustfs** (object storage).

---

## 1. Integration boundaries at a glance

| Boundary | Direction | Purpose | Backend package |
|----------|-----------|---------|-----------------|
| Email / SMTP | outbound | **deliver each guest their personal QR ticket** (to the email they registered with); deliver password-reset OTP codes | `integration/email` |
| Telegram Bot API | outbound (channel) | forward registration & confirmed-attendance events to a dedicated **ops channel** | `integration/telegram` |
| Redis | internal cache | time-expiring OTP storage; rate-limit counters | `auth` (`OtpService`), `common` |
| Rustfs | outbound (presigned) | host avatars, org logo, banners | `storage` |

All credentials are supplied via environment variables; nothing is committed. Each integration is wrapped in a thin client class with timeouts, retries, and structured logging.

---

## 2. Guest notifications — Email (QR ticket) & Telegram (ops channel)

Two independent **outbound** channels:
1. **Email / SMTP (§2.1)** — delivers each guest their **personal QR ticket** to the email address they registered with, and delivers password-reset **OTP** codes.
2. **Telegram (§2.2)** — forwards registration and confirmed-attendance events to a dedicated **ops channel** for real-time staff visibility.

> No inbound webhook or Telegram contact-share is required — delivery is a straightforward email send, so the guest receives their QR with **no extra steps** after submitting the form.

### 2.1 Email / SMTP — QR ticket & OTP delivery

#### Configuration (env)
| Variable | Meaning |
|----------|---------|
| `MAIL_HOST` / `MAIL_PORT` | SMTP server (or provider relay) |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | SMTP credentials (or provider API key) |
| `MAIL_FROM_ADDRESS` | sender, e.g. `no-reply@gatherly.app` |
| `MAIL_FROM_NAME` | display name, e.g. `Gatherly` |
| `MAIL_TLS` | STARTTLS/SSL toggle |
| `APP_PUBLIC_BASE_URL` | base for ticket links embedded in the email |
| `EMAIL_ENABLED` | feature flag (disable / use a sink like MailHog in local/test) |

> The backend uses Spring's `JavaMailSender` (SMTP) behind an `EmailClient`; swapping to a provider HTTP API (SendGrid/SES/etc.) is an adapter change only. HTML templates render via a template engine (e.g. Thymeleaf).

#### QR ticket delivery flow (registration → email)
```
POST /public/events/{eventId}/register
   └─ RegistrationService.register(...)
        ├─ validate answers vs form schema; require email (+ phone per product req)
        ├─ persist registration_submission (checkin_token, qr_status = PENDING)
        ├─ commit DB transaction
        └─ AFTER COMMIT → EmailService.sendQrTicket(submission)
              ├─ render QR(checkin_token) → PNG  (inline CID image)
              ├─ render HTML email (event details + QR + link to APP_PUBLIC_BASE_URL/tickets/{checkin_token})
              ├─ JavaMailSender.send(...)  to submission.guest_email
              ├─ on success → qr_status = DELIVERED, qr_delivered_at = now
              └─ on failure → log + enqueue retry (see Reliability)
```
- **QR rendering:** a QR-encoding library (e.g. ZXing / Nayuki) renders the opaque `checkin_token` to a PNG, embedded **inline** (CID attachment) so it displays without external fetches. The token — not a public URL — is the scan payload; the organizer app resolves it server-side.
- **Sent after commit** (async / transaction synchronization) so a slow or failing mail server never blocks or rolls back the guest's registration.
- **Resend / fallback:** `GET /public/tickets/{checkinToken}` shows the QR on-screen and offers "resend email"; the post-registration page also renders the QR directly as an immediate fallback.

**QR ticket email (example):**
```
Subject: Your QR ticket — {{eventTitle}}

Hi {{guestName}},
You're registered for {{eventTitle}} ({{eventDate}}, {{venue}}).
Show this QR at the entrance — an organizer will scan it to confirm your attendance.

[ inline QR image ]

Can't see the image? View your ticket: {{APP_PUBLIC_BASE_URL}}/tickets/{{checkinToken}}
```

#### OTP delivery
The same `EmailService` delivers OTP codes (see §3.5). One email integration serves QR tickets, password-reset OTPs, **and account-activation invite codes** — invite and reset share the single OTP → set-password mechanism.

#### Account-activation (invite) email
When an Admin invites a user (docs/02 §5c, docs/03 §4.2), an `@EventListener` for `UserCreatedEvent` (after commit) mints a **one-time invite code** (the same Redis-backed OTP as password reset, but with the longer `OTP_INVITE_TTL_SECONDS` lifetime) and emails it:
```
Subject: You've been added to Gatherly — your sign-in code
Hi {{fullName}},
An administrator created an account for you ({{email}}).
Sign in with your email and this one-time code, then choose your password:
{{inviteCode}}
This code expires in {{OTP_INVITE_TTL hours}}.
```
The invitee enters their **email + code on the login page**. The backend detects that the account is `PENDING_ACTIVATION`, verifies the code as an OTP, and (on a match) returns `{setupRequired, email, resetGrant}` with **no session** — the client routes to the set-password screen, where the grant is exchanged for a real password and the account flips to `ACTIVE`. Every failure is the uniform `INVALID_CREDENTIALS` (no account/status enumeration). The code is high-entropy-per-attempt-capped, single-use, time-expiring, and resolved server-side only. Sent **after commit** so a slow mail server never blocks user creation. *(This replaces the earlier opaque set-password link.)*

### 2.2 Telegram Bot API — ops-channel forwarding

#### Configuration (env)
| Variable | Meaning |
|----------|---------|
| `TELEGRAM_BOT_TOKEN` | bot token from BotFather |
| `TELEGRAM_OPS_CHAT_ID` | target **ops channel/group** chat id (registration/attendance feed) |
| `TELEGRAM_API_BASE` | default `https://api.telegram.org` |
| `TELEGRAM_ENABLED` | feature flag (disable in local/test) |

> **Outbound only** — no webhook, no `setWebhook`, no secret token, no contact-share (those were only needed for the previous Telegram-QR-DM flow, now retired). The bot just posts messages to one channel.

#### Forwarding flow (after commit)
```
registration committed      → notifyOps("registered", submission)
attendance scan committed   → notifyOps("checked_in", event_checkin)   // from /attendance/scan (03 §4.10)
   └─ AFTER COMMIT → TelegramNotifier
        ├─ POST {API}/bot{TOKEN}/sendMessage { chat_id: TELEGRAM_OPS_CHAT_ID, text, parse_mode: HTML }
        ├─ on 2xx → set telegram_notified = true
        └─ on failure → log + retry (see Reliability)
```
Fired **after commit** (async) so a slow/failing Telegram never blocks or rolls back the guest action.

**Ops message (attendance):**
```
✅ <b>Checked in</b> — {{eventTitle}}
👤 {{guestName}}   📞 {{guestPhone}}
🕒 {{checkedInAt}}   🙋 by {{scannedBy}}
```

### 2.3 Reliability & privacy
- **QR email retry:** submissions stuck in `PENDING` (transient mail failure) are retried by a scheduled sweep until `DELIVERED`.
- **Ops forwarding retry:** rows with `telegram_notified = false` are the retry source; a sweep re-attempts and flips the flag on success.
- **Timeouts:** short connect/read timeouts on both clients; failures logged, never surfaced to the guest mid-registration.
- **Privacy:** the personal QR is emailed only to the registered address; PII (phone) in the ops channel means channel membership must be operationally restricted. Treat `checkin_token` as a bearer secret (anyone with the QR/link can present the ticket — confirmation still requires an authenticated organizer scan).

---

## 3. Redis — OTP lifecycle & TTL rules

### 3.1 Purpose
Redis stores **only** ephemeral, time-expiring data: password-reset OTP codes and rate-limit counters. OTPs are **never** persisted to PostgreSQL.

### 3.2 Configuration (env)
| Variable | Meaning |
|----------|---------|
| `REDIS_HOST` / `REDIS_PORT` | connection |
| `REDIS_PASSWORD` | auth (if enabled) |
| `OTP_TTL_SECONDS` | default **300** (5 min) |
| `OTP_MAX_ATTEMPTS` | default **5** |
| `OTP_RESEND_COOLDOWN_SECONDS` | default **60** |
| `OTP_LENGTH` | default **6** digits |
| `OTP_GRANT_TTL_SECONDS` | default **300** (5 min) — validity of the post-verify set-password grant |
| `OTP_INVITE_TTL_SECONDS` | default **86400** (24h) — validity of the one-time invite code redeemed on login |

### 3.3 Key schema & TTL
| Key | Value | TTL | Notes |
|-----|-------|-----|-------|
| `otp:pwd:{userId}` | `hash(otp)` | `OTP_TTL_SECONDS` (reset) / `OTP_INVITE_TTL_SECONDS` (invite) | the active code (hashed, never raw); same key serves reset and invite |
| `otp:attempts:{userId}` | integer | matches the code's TTL | verification attempts |
| `otp:cooldown:{userId}` | `1` | `OTP_RESEND_COOLDOWN_SECONDS` | blocks rapid resend |
| `pwdreset:grant:{userId}` | random grant id | `OTP_GRANT_TTL_SECONDS` | issued after a successful OTP verify (or invite-code login); consumed by set-password |
| `rl:login:{ip}` / `rl:otp:{ip}` / `rl:register:{ip}` | counter | sliding window | brute-force / spam protection |

### 3.4 Lifecycle (expands on [`03` §2.3](03-api-routes-security.md) — this section is authoritative for key schema and TTL detail)
```
forgot-password → requestOtp
   ├─ if otp:cooldown:{userId} exists → 429
   ├─ generate N-digit OTP
   ├─ SET otp:pwd:{userId}=hash(otp) EX OTP_TTL_SECONDS
   ├─ SET otp:attempts:{userId}=0    EX OTP_TTL_SECONDS
   ├─ SET otp:cooldown:{userId}=1    EX OTP_RESEND_COOLDOWN_SECONDS
   └─ deliver OTP via EmailService (§2.1)

verify-otp → verifyOtp
   ├─ GET otp:pwd:{userId}; missing → "expired/invalid"
   ├─ INCR otp:attempts; if > OTP_MAX_ATTEMPTS → DEL otp:* → "locked, request again"
   ├─ constant-time compare hash(input)
   ├─ success → SET pwdreset:grant:{userId}, DEL otp:pwd + otp:attempts
   └─ failure → return remaining attempts

reset-password → consume pwdreset:grant:{userId}, set new BCrypt hash,
                  revoke all refresh_token rows for the user, DEL grant
```

### 3.5 OTP delivery channel
- OTP is delivered by the **Email service (§2.1)** to the user's email-on-file (transactional). The Redis lifecycle is channel-agnostic; the delivery adapter is pluggable (SMS later if desired).
- **Security:** store only the hash; single-use; capped attempts; per-IP and per-user rate limits.
- **Account discovery (invite-only product):** Gatherly is a single-organization, invite-only tool with no public self-signup, so forgot-password does **not** use the public-web anti-enumeration `202`-for-everything pattern. A known resettable account → `202 Accepted` (code sent); an unknown/non-resettable email → `404 ACCOUNT_NOT_FOUND` so the UI can tell the person this is for internal organizers and to contact an admin. Per-IP rate limiting on the endpoint bounds the residual enumeration surface.

---

## 4. Rustfs — object storage

### 4.1 Purpose
Host binary assets — **user avatars, organization logo, background banner**. Binaries never stream through the Spring API; access is brokered via short-lived **presigned URLs** (S3-compatible).

### 4.2 Configuration (env)
| Variable | Meaning |
|----------|---------|
| `RUSTFS_ENDPOINT` | cluster endpoint URL |
| `RUSTFS_REGION` | region (if applicable) |
| `RUSTFS_ACCESS_KEY` / `RUSTFS_SECRET_KEY` | credentials |
| `RUSTFS_BUCKET` | bucket name |
| `RUSTFS_PUBLIC_BASE_URL` | CDN/base URL for public-read assets |
| `RUSTFS_PRESIGN_TTL_SECONDS` | default **300** |

### 4.3 Object key layout
| Asset | Key pattern | Visibility |
|-------|-------------|-----------|
| Org logo | `org/logo/{uuid}.{ext}` | public-read |
| Org banner | `org/banner/{uuid}.{ext}` | public-read |
| User avatar | `user/{userId}/avatar/{uuid}.{ext}` | public-read (or presigned GET) |

> Entities store the **object key** (`organization.logo_key/banner_key`, `user.avatar_key` — see [`02`](02-database-schema.md)), not a full URL. Public URL = `RUSTFS_PUBLIC_BASE_URL + key`; restricted assets use presigned GET.

### 4.4 Upload flow (presigned PUT) — matches [`01` §5](01-architecture-layout.md)
```
1. FE → POST /api/v1/storage/presign { purpose, contentType, sizeBytes }
2. StorageService:
     ├─ @PreAuthorize purpose-based: ORG_* → hasRole('ADMIN'); USER_AVATAR → self
     ├─ validate contentType ∈ allowlist (image/png|jpeg|webp) and size ≤ max
     ├─ generate object key
     └─ return { uploadUrl (presigned PUT, TTL), objectKey, publicUrl? }
3. FE → PUT file directly to Rustfs (uploadUrl)
4. FE → PUT /organization or PUT /me { logoKey | bannerKey | avatarKey = objectKey }
5. Backend validates the object exists (HEAD) and persists the key
```

### 4.5 Client & safeguards
- `RustfsClient` wraps an S3-compatible SDK configured with `RUSTFS_ENDPOINT` + path-style access.
- **Validation:** server-side content-type allowlist + max size before presigning; reject otherwise.
- **Cleanup:** on asset replacement, delete the previous object key (best-effort, after the new key is persisted).
- **Failure isolation:** storage outages affect only image upload/display, never core flows.

---

## 5. Cross-cutting integration concerns

| Concern | Approach |
|---------|----------|
| Secrets | all tokens/keys via env; never committed; rotated per ops runbook |
| Feature flags | `EMAIL_ENABLED`, `TELEGRAM_ENABLED` (and equivalents) to disable integrations in local/CI |
| Local dev | docker-compose: Redis; Rustfs via S3-compatible (e.g. MinIO) container; Email via a sink (e.g. MailHog); Telegram disabled or pointed at a test channel |
| Observability | structured logs per integration call (latency, outcome); count email/QR-delivery failures, Telegram ops-forwarding failures, OTP verifications, presign issuance |
| Resilience | timeouts + bounded retries on Email/Telegram/Rustfs; OTP & rate-limit are Redis-TTL self-cleaning |
| PII | guest email holds the QR ticket; guest phone forwarded to the Telegram ops channel and stored — restrict channel membership; document retention |

## 6. Open questions for review

- **QR delivery = email (current design).** The guest's QR ticket is emailed to the address they register with; the post-registration page also shows the QR immediately as a fallback. *(Confirmed direction.)*
- **Email field required:** since the QR is emailed, `email` becomes a **required** registration field. *(Default: yes — enforce an `email` field on any active form, alongside the required `phone`.)*
- **Deliverability:** transactional sender reputation matters (SPF/DKIM/DMARC on the sending domain). *(Default: configure domain auth before go-live; use a reputable relay.)*
- **Telegram routing:** one global ops channel, or per-event channels/threads? *(Default: one global `TELEGRAM_OPS_CHAT_ID`; per-event topic optional later.)*
- **Keep Telegram at all?** Telegram now only mirrors registrations/check-ins to an ops channel. If that ops feed isn't needed, the whole Telegram integration can be dropped. *(Default: keep — it satisfies the original "forward to a Telegram channel" requirement.)*
- **OTP delivery:** email-on-file (recommended), or SMS later? *(Default: email — same `EmailService`.)*
- **Avatar visibility:** public-read (simplest) vs presigned GET? *(Default: public-read for logo/banner; avatars public-read in v1.)*
- **Bot commands:** Telegram is outbound-only in v1 (no webhook). Add interactive ops bot commands (e.g. `/stats`) later? *(Default: outbound forwarding only in v1; commands later if needed.)*
