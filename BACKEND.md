# PeaceCode — Backend Integration Guide

> **Audience.** You (the CTO / senior backend engineer) know Java and Spring Boot cold. You have never worked in this repo. This document tells you **exactly** what the frontend is, what it currently persists, what contracts you need to expose, and how to wire a Spring Boot service behind it without breaking the app.
>
> This is not a marketing README. It is an engineering handover.

---

## 0. TL;DR

- **Frontend**: TanStack Start v1 (React 19 + Vite 7) deployed to Cloudflare Workers. All UI code lives in `src/`.
- **Persistence today**: **100% browser `localStorage`** via 20+ typed "stores" in `src/lib/*-store.ts`. There is no database yet.
- **AI today**: A managed Lovable AI Gateway is called from **TanStack server functions** (Node-like runtime on the Worker). See `src/lib/ai-gateway.server.ts` and `src/routes/api/chat.ts`.
- **Auth today**: Fake local auth in `src/lib/auth-store.ts`. College-email validation is real, password hashing is a placeholder — must be replaced.
- **Your job**: Stand up a Spring Boot service that owns the durable data model, JWT-based auth, and (optionally) the AI gateway proxy. The frontend will talk to it via a thin **BFF** layer (TanStack server functions) — never directly from the browser except for public reads.

If you read nothing else, read **§3 (Architecture)**, **§5 (Auth)**, **§6 (Data Model)** and **§8 (Integration Contract)**.

---

## 1. Product overview

PeaceCode is a student mental-wellness app for Indian colleges. The dashboard is one route, but the app has **~210 route files** covering:

| Pillar          | Routes prefix     | What it does                                                             |
| --------------- | ----------------- | ------------------------------------------------------------------------ |
| Dashboard       | `/`               | Editorial daily overview                                                 |
| Breathe         | `/breathe/*`      | Guided breathing patterns, session logging, streaks                      |
| Journal         | `/journal/*`      | Text + voice journaling, mood tracking, AI reflections                   |
| Gratitude       | `/gratitude/*`    | Daily gratitude entries + anonymous board                                |
| Focus           | `/focus/*`        | Pomodoro sessions, focus stats                                           |
| Mind Gym        | `/mindgym/*`      | Cognitive exercises, brain-region scoring                                |
| Screening       | `/screening/*`    | PHQ-9, GAD-7 and friends. Wellness score.                                |
| Counselling     | `/counselling/*`  | Expert directory, appointments, homework, prescriptions, billing         |
| Peace Buddies   | `/buddies/*`      | Peer support matching, chat, groups                                      |
| Community       | `/community/*`    | Circles, threads, rooms                                                  |
| PeaceBot        | `/peacebot/*`     | AI companion chat                                                        |
| Emergency       | `/emergency/*`    | 24/7 crisis links (iCall, KIRAN)                                         |
| Notifications   | `/notifications/*`| Inbox + preferences                                                      |
| Profile         | `/profile/*`      | Student profile, Mind Garden                                             |
| Settings        | `/settings/*`     | Theme engine (10 presets), sessions, privacy, logout                     |
| Hub             | `/hub/*`          | Product hub / marketing surfaces                                         |

Every one of these routes is fully rendered today from `localStorage`. Your backend is what turns this from a beautiful demo into a real product.

---

## 2. Frontend stack (what you're feeding)

You do not need to write React, but you need to know how the frontend calls the outside world.

| Layer               | Choice                                             |
| ------------------- | -------------------------------------------------- |
| Framework           | TanStack Start v1 (SSR + file routing)             |
| Router              | TanStack Router (`src/routes/**`)                  |
| Runtime             | Cloudflare Workers (with `nodejs_compat`)          |
| Build               | Vite 7                                             |
| UI                  | React 19, shadcn/ui, Tailwind v4 (`src/styles.css`)|
| Data fetching       | TanStack Query, `createServerFn` server functions  |
| Types               | Strict TypeScript                                  |
| Deploy target       | Cloudflare Workers (Lovable managed)               |

### The two ways the frontend talks to a server today

1. **Server functions** — `createServerFn(...)` in `*.functions.ts`. These are typed RPC endpoints callable from React components via `useServerFn`. They run **on the Cloudflare Worker**, not in the browser. Files:
   - `src/lib/peacebot-ai.functions.ts`
   - `src/lib/journal-ai.functions.ts`
   - `src/lib/gratitude-ai.functions.ts`
   - `src/lib/screening-ai.functions.ts`
   - `src/lib/mindgym-ai.functions.ts`
   - `src/lib/resources-translate.functions.ts`
   - `src/lib/journal-voice.functions.ts`

2. **Server routes** — file-based HTTP endpoints under `src/routes/api/`. Only one exists today:
   - `src/routes/api/chat.ts` — streams PeaceBot replies from Lovable AI Gateway.

**These are your integration seams.** The recommended approach is to keep this layer as a **BFF (Backend-For-Frontend)** and have it call your Spring Boot service. Do **not** rip these out — extend them.

### Runtime constraints (very important)

The frontend runtime is Cloudflare Workers, **not Node.js on a VM**. That means:

- No `child_process`, no `sharp`, no filesystem writes outside `/tmp`.
- Every npm dep must be bundled (no runtime `require`).
- **Do not** expect to run JVM code inside the Worker. Spring Boot lives on your own infra.
- CORS: routes under `/api/public/*` bypass Lovable's edge auth on the published site. Everything else lives on the same origin as the app.

---

## 3. Architecture (target)

```text
┌──────────────────────────────────────────────────────────────┐
│  Browser (React 19)                                          │
│  - reads/writes stores via localStorage (transitional)       │
│  - calls TanStack server functions (typed RPC)               │
│  - calls /api/* routes (fetch)                               │
└──────────────────────────┬───────────────────────────────────┘
                           │ same-origin HTTPS
┌──────────────────────────▼───────────────────────────────────┐
│  BFF — Cloudflare Worker (TanStack Start SSR)                │
│  - server functions in src/lib/*.functions.ts                │
│  - server routes in src/routes/api/**                        │
│  - attaches auth headers, does small transforms              │
│  - NO database access from here                              │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTPS, service-to-service JWT
┌──────────────────────────▼───────────────────────────────────┐
│  Spring Boot service(s)  ← YOU OWN THIS                      │
│  - REST + WebSocket API                                      │
│  - PostgreSQL (via Flyway migrations)                        │
│  - Redis (rate limit, presence, cache)                       │
│  - Object storage (S3-compatible) for voice notes & docs     │
│  - Kafka/NATS (optional) for domain events                   │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ├─► Lovable AI Gateway (or your provider)
                           ├─► SMS / iCall integration
                           ├─► Payment (Razorpay / Stripe India)
                           └─► Email (Resend / Amazon SES)
```

**Why a BFF and not direct browser → Spring Boot?**

- CORS surface stays tiny (same-origin).
- Secrets never touch the browser.
- SSR loaders can prefetch data without a second network hop.
- You can migrate endpoints one at a time — the frontend does not care whether the BFF answered from local mock or from Spring.

---

## 4. Repository map (what to open first)

```
src/
├── routes/                    # File-based routes. Do NOT rename __root.tsx.
│   ├── __root.tsx             # html/head/body shell + error/notfound
│   ├── index.tsx              # dashboard
│   └── api/
│       └── chat.ts            # PeaceBot streaming route (server route)
│
├── components/
│   ├── AppShell.tsx           # sidebar + mobile nav (reads session name)
│   ├── auth/AuthShell.tsx     # sign-in / sign-up UI
│   └── ui/                    # shadcn primitives — do not modify
│
├── lib/                       # ★ ALL YOUR CONTRACTS LIVE HERE ★
│   ├── ai-gateway.server.ts   # Lovable AI Gateway HTTP wrapper
│   ├── auth-store.ts          # ← replace w/ real auth
│   ├── journal-store.ts       # ← domain: journal
│   ├── gratitude-store.ts     # ← domain: gratitude
│   ├── breathe-store.ts       # ← domain: breathing
│   ├── focus-store.ts         # ← domain: focus/pomodoro
│   ├── mindgym-store.ts       # ← domain: cognitive exercises
│   ├── screening-store.ts     # ← domain: PHQ-9 / GAD-7 / etc.
│   ├── counselling-store.ts   # ← domain: appointments, homework, meds
│   ├── buddies-store.ts       # ← domain: peer buddies
│   ├── community-store.ts     # ← domain: circles / threads / rooms
│   ├── peacebot-store.ts      # ← domain: AI chat history
│   ├── events-store.ts        # ← domain: campus events
│   ├── notifications-store.ts # ← domain: inbox
│   ├── profile-store.ts       # ← domain: user profile
│   ├── settings-store.ts      # ← domain: theme, preferences, sessions
│   ├── emergency-store.ts     # ← domain: crisis contacts
│   ├── product-hub-store.ts   # ← domain: hub content
│   ├── resources-store.ts     # ← domain: static resources
│   ├── search-index.ts        # ← global search over all domains
│   ├── search-store.ts        # ← recent searches
│   ├── client-error-monitor.ts# runtime error reporting hook
│   └── error-capture.ts       # server-side error capture
│
└── styles.css                 # tailwind + tokens (leave alone)

tests/e2e/smoke.py             # Playwright suite you can run in CI
```

**The stores are your specification.** Every `type` and every function name in `src/lib/*-store.ts` maps 1:1 to a REST resource you will expose. Do not invent a new model — mirror these.

---

## 5. Authentication

### Current state

`src/lib/auth-store.ts` implements a **local-only** mock:

- Users in `localStorage` key `pc.auth.users.v1`.
- Session in `pc.auth.session.v1`.
- Signup draft in `pc.auth.signup-draft.v1`.
- Password "hash" is a naive string hash. **Not production**.
- **College-email validation IS real** — a hardcoded blocklist of personal domains (`gmail.com`, `outlook.com`, …). Enforce the same server-side.

`StudentUser` shape you must accept:

```ts
type StudentUser = {
  email: string;              // college email (lowercased)
  passwordHash: string;       // bcrypt on the server, not this hash
  fullName: string;
  studentId: string;          // e.g. "22BCS1234"
  college: string;
  course: string;
  year: string;               // "1" .. "5" / "PG-1" / etc.
  concern?: string;           // primary reason for joining
  createdAt: number;          // epoch ms
};
```

### Target auth flow

Use **JWT access tokens (15 min)** + **refresh tokens (30 d, httpOnly cookie)**. Spring Security + `spring-boot-starter-oauth2-resource-server` is fine. Do **not** put JWTs in `localStorage` — the frontend already has a session store, but tokens belong in an httpOnly, `SameSite=Lax`, `Secure` cookie.

Endpoints:

| Method | Path                      | Body / Query                                | Notes                                                          |
| ------ | ------------------------- | ------------------------------------------- | -------------------------------------------------------------- |
| POST   | `/api/auth/check-student` | `{ studentId }`                             | Returns `{ exists: boolean, email?: string }`                  |
| POST   | `/api/auth/signup`        | `StudentUser` minus `passwordHash` + `password` | Validates college email, bcrypt hash, sends verification email |
| POST   | `/api/auth/verify-email`  | `{ token }`                                 | Marks user verified                                            |
| POST   | `/api/auth/login`         | `{ email, password }`                       | Sets `pc_access` + `pc_refresh` httpOnly cookies               |
| POST   | `/api/auth/refresh`       | –                                           | Rotates refresh, mints new access                              |
| POST   | `/api/auth/logout`        | –                                           | Revokes current refresh                                        |
| POST   | `/api/auth/logout-all`    | –                                           | Revokes all refresh tokens for user                            |
| GET    | `/api/auth/me`            | –                                           | Returns current `StudentUser` minus secrets                    |
| POST   | `/api/auth/password/forgot` | `{ email }`                               | Send reset link                                                |
| POST   | `/api/auth/password/reset`  | `{ token, password }`                     | Complete reset                                                 |

Frontend integration point: `src/lib/auth-store.ts` will be rewritten so that `currentDisplayName()`, `endSession()` etc. call `/api/auth/*` through server functions. Keep the same **function names** — the rest of the codebase imports them.

### Guest mode

The current app supports a "Skip" flow that produces a **Guest Student** with no persistence. Keep this: unauthenticated requests must not 401 on public read-only endpoints (dashboard emptiness, breathing patterns library, screening test definitions, resources). Anything that writes user data requires a real JWT.

---

## 6. Data model (the whole schema)

Every store is one bounded context. This section is long on purpose — copy these into your Flyway migrations.

### 6.1 `journal`

```sql
create table journal_entry (
  id            uuid primary key,
  user_id       uuid not null references app_user(id) on delete cascade,
  kind          text not null check (kind in ('quick','guided','voice')),
  title         text,
  body          text,
  mood          text check (mood in ('radiant','calm','okay','low','heavy')),
  energy        int  check (energy between 0 and 10),
  gratitude     text[] not null default '{}',
  wins          text[] not null default '{}',
  challenges    text[] not null default '{}',
  tags          text[] not null default '{}',
  collection    text not null default 'default',
  favorite      bool not null default false,
  archived      bool not null default false,
  secret        bool not null default false,
  weather       text,
  status        text not null default 'saved' check (status in ('draft','saved')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on journal_entry(user_id, updated_at desc);

create table journal_voice_note (
  id            uuid primary key,
  entry_id      uuid not null references journal_entry(id) on delete cascade,
  s3_key        text not null,       -- do NOT store base64 in Postgres
  mime          text not null,
  duration_ms   int  not null,
  transcript    text,
  created_at    timestamptz not null default now()
);
```

The frontend today stores `dataUrl` (base64) — you will accept **multipart upload**, put the file in S3/R2, and return a signed URL. Transcription lives behind an AI function (see §7).

### 6.2 `gratitude`

`GratitudeEntry { id, text, tag, isAnonymous, createdAt }`. Anonymous entries are visible on a public board — enforce read-time redaction so `user_id` never leaves the server for anonymous rows.

### 6.3 `breathe`

`BreathSession { id, technique, minutes, planned, cycles, completedAt, moodBefore, moodAfter, fullyCompleted }` plus a small `BreathPrefs` JSON per user. Techniques (`box`, `478`, `cyclic`, `resonance`, `nostril`, `triangle`, `custom`) are enum-safe.

### 6.4 `focus`

`FocusSession { id, planned, actual, mode, tag, completedAt }`. Streaks are computed server-side (`computeStreaks` in `src/lib/focus-store.ts`).

### 6.5 `mindgym`

Cognitive exercises with per-brain-region scores (`prefrontal`, `hippocampus`, `amygdala`, `cerebellum`, …). See `mindgym-store.ts` for the full enum. Aggregate views: `brainOverall`, `weeklyStats`.

### 6.6 `screening`

Standard instruments — PHQ-9, GAD-7, PSS-10, WHO-5, WEMWBS, etc. Test definitions are **static** (ship them as SQL seed). Sessions:

```ts
ScreeningSession {
  id, testId, answers: number[], score: number,
  band: "Minimal"|"Mild"|"Moderate"|"Severe",
  completedAt: string, notes?: string
}
```

Sessions are **medically sensitive**. Encrypt at rest, log all reads, never expose over public endpoints. If `band === "Severe"` on PHQ-9 item 9 (suicidal ideation), trigger the emergency workflow (§7).

### 6.7 `counselling`

The largest domain. Full schema in `src/lib/counselling-store.ts` — 400+ lines. Entities:

- `Expert` — psychologist directory (fees, languages, specializations, RCI license).
- `Appointment` — `{ id, expertId, userId, mode: 'video'|'audio'|'chat', scheduledFor, status: 'scheduled'|'in_session'|'completed'|'cancelled'|'no_show', ... }`
- `WellnessPlan` — treatment plan authored by an expert.
- `Homework` — assigned tasks with due dates.
- `Assessment` — clinician-administered scales.
- `Message` — 1:1 messages between student and expert.
- `Document` — uploaded reports.
- `Medication` — prescriptions (dose, frequency, refill dates).
- `Billing` — invoices in INR.

This module needs **video calling** — recommend Daily.co or 100ms tokens issued from Spring Boot per appointment.

### 6.8 `buddies`

Peer-to-peer support matching. `BuddyProfile`, `BuddyRequest`, `BuddyChat`, `BuddyGroup`. Matching is opt-in; store consent explicitly.

### 6.9 `community`

`Circle` (long-lived interest group), `Thread` (post + comments), `Room` (ephemeral live chat, backed by WebSocket). Moderation queue required.

### 6.10 `peacebot`

Chat history for the AI companion. Each conversation is `{ id, messages: {from, text, at}[], createdAt }`. Stream tokens over SSE (§7). Do **not** store raw user messages beyond 30 days by default.

### 6.11 `notifications`

Inbox with categories: `system`, `counselling`, `community`, `wellness`. Delivery channels: in-app, email, push (later). Preferences per category.

### 6.12 `profile`, `settings`, `emergency`, `events`, `product_hub`, `resources`

Straightforward CRUD. See the corresponding `*-store.ts` for the exact field list. **Copy the types verbatim** — the frontend depends on the exact JSON shape.

### 6.13 Row-level security expectations

Enforce in Spring:

- Every table has `user_id`.
- All reads/writes filtered by JWT `sub`.
- Admin/expert impersonation goes through an explicit `X-Act-As` header, logged.
- Anonymous columns (gratitude, community anonymous posts) are set to `NULL` before serialization.

---

## 7. AI Gateway

This is the one piece of "backend" that already exists. Understand it before deciding whether to keep it or replace it.

### 7.1 What's there

`src/lib/ai-gateway.server.ts` wraps Lovable AI Gateway (OpenAI-compatible). It runs on the Cloudflare Worker. Key facts:

- Reads `LOVABLE_API_KEY` from `process.env` **inside the handler**.
- Supports `google/gemini-*` and `openai/*` models.
- The gateway header `X-Lovable-AIG-Run-ID` is threaded so browser can correlate calls with Lovable analytics.

Used by:

- `src/routes/api/chat.ts` — PeaceBot streaming.
- Various `*-ai.functions.ts` files for reflections, transcription, translation.

### 7.2 Options

**Option A — Keep the frontend's AI Gateway.**
Cheapest. Your Spring Boot service does not touch AI. Frontend continues to call `/api/chat` and server functions directly.

**Option B — Proxy through Spring Boot.**
You control model choice, rate limits, PII redaction, and audit logs. The Cloudflare Worker becomes a dumb passthrough. Recommended if you have compliance requirements.

If you go with (B): expose `/api/ai/chat/stream` as an SSE endpoint, and update `src/lib/ai-gateway.server.ts` to point at your service. The signature of `callGateway()` stays identical.

### 7.3 Crisis workflow

Any user-visible AI response must go through a **safety filter**. The current PeaceBot system prompt already handles this politely (see the top of `src/routes/api/chat.ts`), but you must ensure the pipeline:

1. Detects self-harm/suicidal signals (regex + classifier).
2. Injects iCall (India) 9152987821 and KIRAN (1800-599-0019) into the reply.
3. Creates an `EmergencyEvent` row.
4. Optionally SMS-alerts the emergency contact stored on the user profile.

---

## 8. Integration contract

### 8.1 Base URL & versioning

- Base: `/api/v1/*` — always versioned.
- Media type: `application/json; charset=utf-8`. Dates: ISO-8601 UTC.
- ID format: UUID v4 (string, dashed).
- Casing: `camelCase` on the wire (frontend expects it). Jackson: `@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)`.

### 8.2 Request headers

| Header                     | Required            | Notes                                                    |
| -------------------------- | ------------------- | -------------------------------------------------------- |
| `Authorization: Bearer …`  | for writes / private reads | Access JWT                                        |
| `X-Idempotency-Key`        | on POST/PUT         | UUID — safe retries for network flaps                    |
| `X-Client-Version`         | always              | Frontend build hash, injected by Vite                    |
| `X-Request-ID`             | always              | Propagate to Spring MDC                                  |
| `Accept-Language`          | optional            | For resource translations                                |

### 8.3 Error envelope

Every error, always:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "human-readable",
    "details": { "field": "email" },
    "requestId": "…",
    "timestamp": "2026-07-14T09:12:44Z"
  }
}
```

Frontend renders `error.message` verbatim in some places — keep messages user-safe.

### 8.4 Pagination

Cursor-based: `?cursor=<opaque>&limit=<=100`. Response:

```json
{
  "items": [...],
  "nextCursor": "eyJ0Ijoi..." | null
}
```

No offset pagination — the app has infinite feeds (community, notifications) that will drift.

### 8.5 Streaming (SSE)

PeaceBot and any streaming AI response uses SSE. Content-Type `text/event-stream`, one JSON object per `data:` line, terminated by `data: [DONE]`. The frontend's SSE parser is in `src/lib/peacebot-ai.functions.ts`.

### 8.6 WebSocket

Community rooms and buddy chat use WS. Recommend `spring-boot-starter-websocket` + STOMP. Topics:

- `/topic/room/{roomId}` — public rooms
- `/user/queue/dm/{peerId}` — direct messages
- `/user/queue/notifications` — push notifications

Auth: pass JWT in the CONNECT frame; validate in a `ChannelInterceptor`.

### 8.7 File uploads

Multipart. Voice notes ≤ 5 MB, documents ≤ 20 MB. Server issues a **presigned S3/R2 URL** — frontend uploads directly, then POSTs the resulting key to your API. Do not stream binary through Spring.

---

## 9. Migration strategy (from localStorage → server)

The frontend has real users' data in `localStorage` right now. Don't lose it.

### 9.1 One-shot import endpoint

```
POST /api/v1/migrate/import
```

Body: the entire local state as `{ journal: [...], gratitude: [...], breathe: [...], ... }`. Server upserts by `id` and `updatedAt`. Frontend calls it exactly once after first successful login, then flags `pc.migrated.v1 = true` in localStorage.

### 9.2 Sync loop

After migration, each store gets a thin sync adapter:

- On mount: `GET /api/v1/{resource}?since=<lastSyncedAt>`.
- On mutate: optimistic update → POST/PATCH → reconcile.
- Offline: queue writes in `IndexedDB` and drain on reconnect.

You do **not** need to build CRDTs. Last-write-wins is fine for personal data; conflicts are extremely rare because each user is a single session usually.

### 9.3 Cutover order (recommended)

1. `auth` + `profile` — everything else needs a `user_id`.
2. `journal`, `gratitude`, `breathe`, `focus` — high value, low risk, no multi-user.
3. `screening` — sensitive, ship encryption first.
4. `counselling` — biggest surface. Do experts + appointments first, then messaging, then billing.
5. `community`, `buddies`, `peacebot` — real-time. Do these last.

---

## 10. Security & compliance

- **Passwords**: bcrypt cost ≥ 12. Reject anything in HIBP top-1M.
- **JWT**: HS256 with a 256-bit secret rotated quarterly OR RS256 if you have KMS. Never RSA-in-code.
- **Rate limiting**: per user + per IP. Redis-backed. Auth endpoints 5 req / 15 min.
- **CORS**: only allow the Cloudflare Worker origin. No wildcards.
- **PII**: `email`, `studentId`, `college` are PII. Log **hashed** identifiers, never raw email.
- **Screening data**: encrypt columns with `pgcrypto` or app-layer AES-GCM. Log every read to an append-only audit table.
- **Crisis events**: irrevocable audit trail. Nothing hard-deletes.
- **DPDP Act (India)**: retain minimum, honor deletion within 30 days, publish a retention policy.
- **Backups**: PITR-capable Postgres (RDS/Neon/Supabase). Test restore quarterly.

---

## 11. Observability

- **Logs**: JSON, one line per request, keys `requestId`, `userId`, `route`, `latencyMs`, `status`. Ship to Loki/Datadog.
- **Traces**: OpenTelemetry from Spring → your collector. Frontend already emits `X-Request-ID` — propagate it as the trace id.
- **Metrics**: `spring-boot-starter-actuator` + Micrometer + Prometheus. RED metrics per endpoint + custom counters for `crisis_event_total`, `appointment_no_show_total`, etc.
- **Client errors**: `src/lib/client-error-monitor.ts` installs `window.onerror` and `unhandledrejection` handlers that push to `window.__lovableEvents.captureException` and a `sessionStorage` ring buffer (`peacecode.errors.v1`). If you replace Lovable monitoring, provide a POST endpoint the monitor can drain to.

---

## 12. Environment variables

### Frontend (Cloudflare Worker)

Read via `process.env.*` **inside** server function handlers, never at module top-level (Worker injects env per-request).

| Var                        | Purpose                                     |
| -------------------------- | ------------------------------------------- |
| `LOVABLE_API_KEY`          | Managed. Do not touch. Used by AI Gateway.  |
| `PEACECODE_API_URL`        | **You add this.** Base URL of Spring Boot.  |
| `PEACECODE_API_SERVICE_JWT`| **You add this.** Shared secret / service token for BFF → Spring calls. |

Public config (browser): `import.meta.env.VITE_*`. Only add here if it is safe to inline in the client bundle.

### Backend (Spring Boot)

Standard `application-prod.yml`:

```yaml
peacecode:
  jwt:
    accessSecret: ${JWT_ACCESS_SECRET}
    refreshSecret: ${JWT_REFRESH_SECRET}
    accessTtl: 15m
    refreshTtl: 30d
  db:
    url: ${DATABASE_URL}
    username: ${DATABASE_USER}
    password: ${DATABASE_PASSWORD}
  redis:
    url: ${REDIS_URL}
  s3:
    bucket: ${S3_BUCKET}
    region: ${S3_REGION}
    accessKey: ${S3_ACCESS_KEY}
    secretKey: ${S3_SECRET_KEY}
  ai:
    provider: lovable                # or "openai" / "gemini"
    apiKey: ${AI_PROVIDER_KEY}
  email:
    from: no-reply@peacecode.in
    provider: resend
    apiKey: ${RESEND_KEY}
  emergency:
    icall: "+919152987821"
    kiran: "18005990019"
```

---

## 13. Local development

### Frontend

```bash
bun install
bun run dev            # http://localhost:8080
bun run typecheck      # strict TS
bun run build          # production build
python3 tests/e2e/smoke.py   # Playwright smoke suite (dev server must be up)
```

### Backend (your side)

Recommended layout:

```
peacecode-api/
├── build.gradle.kts
├── src/main/java/in/peacecode/api/
│   ├── auth/           # controllers, service, JWT filter
│   ├── journal/
│   ├── gratitude/
│   ├── breathe/
│   ├── focus/
│   ├── mindgym/
│   ├── screening/
│   ├── counselling/
│   ├── buddies/
│   ├── community/
│   ├── peacebot/
│   ├── notifications/
│   ├── profile/
│   ├── settings/
│   ├── emergency/
│   └── shared/         # error handler, MDC filter, JPA config
├── src/main/resources/
│   ├── db/migration/   # Flyway V1__init.sql etc.
│   └── application.yml
└── src/test/           # Testcontainers-backed integration tests
```

Suggested dependencies: `spring-boot-starter-web`, `-security`, `-data-jpa`, `-oauth2-resource-server`, `-validation`, `-actuator`, `-websocket`, `-webflux` (for SSE), `flyway-core`, `postgresql`, `lettuce-core`, `micrometer-registry-prometheus`, `awssdk:s3`, `bcrypt`, `jjwt`.

### Wiring the frontend to your API in dev

1. Run Spring Boot on `http://localhost:8081`.
2. In the repo root, create `.dev.vars` (Cloudflare Worker convention):
   ```
   PEACECODE_API_URL=http://localhost:8081
   PEACECODE_API_SERVICE_JWT=dev-only-token
   ```
3. Add a `peacecode-api.ts` helper next to `ai-gateway.server.ts`:
   ```ts
   export async function api(path: string, init?: RequestInit) {
     const base = process.env.PEACECODE_API_URL!;
     const token = process.env.PEACECODE_API_SERVICE_JWT!;
     const headers = new Headers(init?.headers);
     headers.set("Authorization", `Bearer ${token}`);
     headers.set("Content-Type", "application/json");
     return fetch(`${base}${path}`, { ...init, headers });
   }
   ```
4. Rewrite one store at a time. Start with `auth-store.ts`.

---

## 14. Contract testing

Non-negotiable. The frontend's `src/lib/*-store.ts` types are the source of truth. Two options:

- **Codegen from OpenAPI**: publish `openapi.yaml` from Spring (`springdoc-openapi`), then run `openapi-typescript` in this repo to emit `src/lib/api-types.ts`. Frontend imports the generated types — a schema drift causes a `bun run typecheck` failure.
- **Consumer-driven contract tests**: Pact. Frontend defines expectations, Spring verifies in CI.

Pick one and put it in CI on day one.

---

## 15. Deployment topology (suggested)

| Piece             | Where                                             |
| ----------------- | ------------------------------------------------- |
| Frontend + BFF    | Cloudflare Workers (Lovable-managed)              |
| Spring Boot API   | AWS ECS Fargate / Fly.io / Railway — 2 instances min |
| Postgres          | Neon / RDS Multi-AZ                               |
| Redis             | Upstash / ElastiCache                             |
| Object storage    | Cloudflare R2 (same region as Workers)            |
| Video calls       | Daily.co (managed) or 100ms                       |
| Email             | Resend                                            |
| SMS               | MSG91 (India)                                     |
| Monitoring        | Grafana Cloud / Datadog                           |
| Error tracking    | Sentry                                            |

Frontend and backend deploy independently. **Never** couple frontend releases to backend releases — that's why versioning matters (§8.1).

---

## 16. Things you must not do

1. **Do not** commit real secrets to this repo. Use Cloudflare secrets or your platform's secret manager.
2. **Do not** put JWTs in `localStorage`. httpOnly cookies only.
3. **Do not** import `child_process`, `fs.watch`, `sharp`, or any native module into `src/**` — the Worker will 500.
4. **Do not** call Spring Boot directly from the browser. Route through the BFF.
5. **Do not** rename fields on the wire without a codegen'd type update. The frontend will hydrate-mismatch.
6. **Do not** hard-delete crisis or medical records. Tombstone them.
7. **Do not** log raw email, phone, `studentId`, or screening answers.
8. **Do not** re-order enum values — the frontend uses string literals, not integers.

---

## 17. FAQ

**Q: Can we use Spring WebFlux instead of Web MVC?**
Yes. SSE and WS are easier on reactive. Just keep the URL and JSON shape identical.

**Q: Can we go GraphQL?**
Not now. The frontend is REST-shaped everywhere. Add a `/graphql` later if you must — do not replace REST.

**Q: Do we need Kafka?**
Only when you split into services. For an MVP a single Spring monolith + Postgres LISTEN/NOTIFY is enough.

**Q: Can we drop TanStack server functions and hit Spring from the browser?**
You lose SSR data prefetch, per-request run-id correlation, and same-origin cookies. Don't.

**Q: What's the "Lovable AI Gateway"?**
A managed OpenAI-compatible endpoint. Frontend has a key via `LOVABLE_API_KEY`. You can keep using it or replace it — see §7.

**Q: Where do I find the exact JSON the frontend expects?**
`src/lib/<domain>-store.ts`. Every `type` is the contract. If in doubt, `grep -rn "type <Something>" src/lib`.

---

## 18. Contact points inside the repo

If you need to change something on the frontend to unblock backend work:

- Auth logic → `src/lib/auth-store.ts` + `src/components/auth/AuthShell.tsx`.
- Session identity everywhere (name/avatar) → `currentDisplayName()` in `auth-store.ts`. Change it there, it propagates.
- Any AI call → the matching `*.functions.ts` in `src/lib/`. Keep exports named identically.
- New endpoint on the BFF → new file under `src/routes/api/*.ts` following the pattern in `src/routes/api/chat.ts`.
- Global error surface → `src/routes/__root.tsx` (ErrorComponent) + `src/lib/client-error-monitor.ts`.

---

**That's it.** If something in this document contradicts the code, the code wins — open `src/lib/<domain>-store.ts` and read the types. When you're ready to ship the first endpoint, start with `POST /api/v1/auth/login` and prove the round-trip works end-to-end. Everything else is repetition of that pattern.
