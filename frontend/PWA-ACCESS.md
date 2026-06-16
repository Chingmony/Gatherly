# Accessing the Gatherly PWA

How to open and test the handler PWA — on your own machine, on a phone, and in a
real deployment. The repo ships **localhost defaults**; everything
environment-specific (your LAN IP, your ngrok URL, the production domain) is set
through **environment variables you don't commit**.

> **Why env vars, not committed values?**
> An ngrok URL or LAN IP belongs to one machine/session. Hardcoding it in
> `application.yml` or `next.config.ts` makes it stale for everyone else and
> leaks a personal endpoint into shared config. Each person overrides locally;
> deployment sets the same vars per environment.

---

## Ports at a glance

| Service  | Port | URL (local)             |
|----------|------|-------------------------|
| Frontend | 3000 | http://localhost:3000   |
| Backend  | 8080 | http://localhost:8080   |

---

## How API routing works

The frontend reaches the backend in one of two ways, decided by
`NEXT_PUBLIC_API_BASE_URL`:

1. **Direct** — set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`. The browser
   calls the backend directly. Requires backend CORS to allow the frontend
   origin. Simplest for desktop dev.

2. **Through the Next.js proxy** — leave `NEXT_PUBLIC_API_BASE_URL` **empty**. API
   calls become relative (`/api/v1/...`) and hit the Next.js route at
   `app/api/v1/[...path]/route.ts`, which forwards them server-side to the
   backend. No CORS needed (same origin), and works behind a single tunnel.
   This is what makes **phone-over-ngrok** work without a second tunnel.

---

## Scenario 1 — Desktop, your own machine

```bash
# backend
cd backend && ./gradlew bootRun

# frontend (separate terminal)
cd frontend && npm run dev
```

Open http://localhost:3000. `.env.local` (gitignored) can be empty or set
`NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`. Done.

---

## Scenario 2 — Your phone, same Wi-Fi (LAN)

Use this when your phone and computer are on the same network. **HTTP only** —
some PWA install features (service worker) require HTTPS, so use Scenario 3 if
you need to test installability.

1. Find your computer's LAN IP (`ipconfig` → Wi-Fi adapter IPv4, e.g.
   `192.168.1.50`).
2. Allow your IP as a dev origin. Set it via env (preferred) so it isn't
   committed:
   - `next.config.ts` reads `allowedDevOrigins` from `DEV_ORIGINS` (comma list).
   - `DEV_ORIGINS=192.168.1.50`
3. Point the frontend at your computer's backend:
   - `.env.local`: `NEXT_PUBLIC_API_BASE_URL=http://192.168.1.50:8080`
4. Allow that origin in backend CORS:
   - `CORS_ALLOWED_ORIGIN=http://192.168.1.50:3000`
5. Make sure Windows Firewall allows ports 3000 and 8080 inbound.
6. On the phone open `http://192.168.1.50:3000`.

---

## Scenario 3 — Your phone, anywhere (ngrok, HTTPS)

Use this for real PWA install testing (HTTPS) or when not on the same network.
**One tunnel only**, thanks to the proxy.

1. Start backend + frontend locally (Scenario 1).
2. Tunnel **only the frontend**:
   ```bash
   ngrok http 3000
   ```
   Copy the HTTPS URL, e.g. `https://abc123.ngrok-free.dev`.
3. Use the **proxy** so API calls stay on the same origin — leave the base URL
   empty:
   - `.env.local`: `NEXT_PUBLIC_API_BASE_URL=` (empty)
4. Allow the ngrok host as a dev origin:
   - `DEV_ORIGINS=abc123.ngrok-free.dev`
5. CORS is **not** needed (the proxy makes calls same-origin), so no
   `CORS_ALLOWED_ORIGIN` change is required.
6. Restart `npm run dev` (env changes are read at startup).
7. On the phone open the ngrok HTTPS URL. Add to Home Screen to install.

> Each teammate runs their **own** `ngrok http 3000` and sets their own
> `DEV_ORIGINS`. ngrok URLs are per-tunnel — sharing one in the repo helps no one.

---

## Scenario 4 — Real access for everyone (deployment)

This is how end users and the whole team actually get the PWA — not ngrok.

- Frontend deployed at e.g. `https://gatherly.com`
- Backend deployed at e.g. `https://api.gatherly.com`
- Set per-environment (CI / hosting dashboard), never committed:
  - `NEXT_PUBLIC_API_BASE_URL=https://api.gatherly.com`
  - `CORS_ALLOWED_ORIGIN=https://gatherly.com`
  - `app.cookie.secure=true` (HTTPS cookies)
- The proxy route is optional here since both sides have real HTTPS domains.

---

## Environment variable reference

| Variable                   | Where        | Local default        | Example override                         |
|----------------------------|--------------|----------------------|------------------------------------------|
| `NEXT_PUBLIC_API_BASE_URL` | frontend     | `http://localhost:8080` (or empty → proxy) | `https://api.gatherly.com` |
| `BACKEND_URL`              | frontend     | `http://localhost:8080` | `https://api.gatherly.com` (proxy target) |
| `DEV_ORIGINS`              | frontend     | _(none)_             | `192.168.1.50,abc123.ngrok-free.dev`     |
| `CORS_ALLOWED_ORIGIN`      | backend      | `http://localhost:3000` | `https://gatherly.com`                |
| `app.cookie.secure`        | backend      | `false`              | `true` (in production)                   |

Frontend vars go in `frontend/.env.local` (gitignored). Backend vars are real
environment variables or your run config — **not** committed to
`application.yml` defaults.

---

## Quick decision guide

| I want to…                              | Use         |
|-----------------------------------------|-------------|
| Develop on my laptop                    | Scenario 1  |
| Test on my phone, same Wi-Fi, quick     | Scenario 2  |
| Install the PWA / test HTTPS on phone   | Scenario 3  |
| Let real users access it                | Scenario 4  |