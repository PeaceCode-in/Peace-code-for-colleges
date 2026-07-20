# PeaceCode for Colleges — Backend Guide (for the CTO)

> Companion to `BACKEND_CONTRACT.md`. That file is the *wire spec*.
> This file is the *playbook*: how to stand up a partner (e.g. DTU),
> how the student side wires into this admin dashboard, how to swap
> Lovable Cloud (Supabase) for Spring Boot without touching the
> frontend, and how to model many schools with many branches.

The frontend is already backend-agnostic. Every page reads through
`DataClient` (`src/lib/data/DataClient.ts`) with two adapters:

- `SupabaseDataClient` — used today.
- `HttpDataClient` — talks to any REST service that satisfies
  `BACKEND_CONTRACT.md`. Flip `VITE_USE_HTTP_API=true` and set
  `VITE_API_BASE_URL=https://api.peacecode.example.com` to switch.
  **No frontend code change is required at swap time.**

---

## 1. Big picture

```text
                 ┌────────────────────────┐
   Student app ──►  Ingestion API (write) │
   (PHQ-9 / GAD-7,  │  Spring Boot         │
    mood, sessions) │  /api/ingest/*       │
                    └──────────┬───────────┘
                               │ writes raw, PII-bearing rows
                               ▼
                    ┌──────────────────────┐
                    │  Primary DB (Postgres)│  ← per-institution schema
                    │  raw.*  +  agg.*      │
                    └──────────┬───────────┘
                               │ scheduled rollups (cron / pg_cron)
                               ▼
                    ┌──────────────────────┐
                    │  Aggregation layer    │  k≥10 enforced HERE,
                    │  (materialized views  │  not in the API layer
                    │   + nightly job)      │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
   Admin dashboard ─►  Read API             │
   (this repo)      │  Spring Boot          │
                    │  /api/v1/*  (this     │
                    │  file's contract)     │
                    └───────────────────────┘
```

Two hard rules:

1. **Writes and reads are separate services.** The student ingestion API
   sees identifiers. The admin read API never does. They can share the
   database but not the code path.
2. **k-anonymity is enforced in the aggregation layer, not the
   controller.** If a view/materialized view can produce a row with
   `n < 10`, that's a bug — fix the view, don't patch it in Java.

---

## 2. Partnering with an institution (DTU walkthrough)

Onboarding a new institution is a *config + provisioning* task. No
frontend deploy, no code change.

### Step 1 — Provision the tenant

Create a row in `institutions`:

```sql
INSERT INTO institutions (id, slug, display_name, email_domains, timezone)
VALUES (
  gen_random_uuid(),
  'dtu',
  'Delhi Technological University',
  ARRAY['dtu.ac.in', 'dce.edu'],
  'Asia/Kolkata'
);
```

`email_domains` is the whitelist used by the auth guard
(`src/lib/college-registry.ts` mirrors this on the client for the
sign-in form only — the backend is the source of truth).

### Step 2 — Seed the org tree (schools → branches → programs)

This is the piece your question about "many schools with different
branches" hits. Model it as an **arbitrary-depth org tree per
institution**, not a fixed 3-level enum:

```sql
CREATE TABLE org_units (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  uuid NOT NULL REFERENCES institutions(id),
  parent_id       uuid REFERENCES org_units(id),         -- NULL for top-level
  kind            text NOT NULL,   -- 'school' | 'department' | 'branch' | 'program'
  code            text NOT NULL,   -- 'SoE', 'CSE', 'CSE-AI'
  display_name    text NOT NULL,
  UNIQUE (institution_id, parent_id, code)
);
```

DTU example rows:

| kind        | code    | parent           |
| ----------- | ------- | ---------------- |
| school      | SoE     | (root)           |
| department  | CSE     | SoE              |
| branch      | CSE-AI  | CSE              |
| branch      | CSE-DS  | CSE              |
| department  | ECE     | SoE              |
| branch      | ECE-VLSI| ECE              |

**Adding a new school/branch later = one SQL insert.** The frontend
does not know or care — it reads `GET /api/v1/departments` and
renders whatever tree comes back. That's why the `DepartmentRow`
schema in `contracts.ts` has `school` as a string field, not a fixed
enum.

### Step 3 — Wire student identity

The student app authenticates with the same identity provider as the
admin dashboard (Supabase Auth today, any OIDC provider later). Every
student record carries:

- `institution_id` — from verified email domain (`@dtu.ac.in` → DTU)
- `org_unit_id`    — their branch/program at enrollment time
- `cohort_year`    — for year-over-year analytics

The **verified email domain trigger** (see
`knowledge://email-domain-role-assignment`) is the safe pattern. Never
grant institution membership from an unverified email.

### Step 4 — Point the student app at the ingestion API

Student writes go to `POST /api/ingest/screening`, `POST /api/ingest/mood`,
`POST /api/ingest/session-event`. Payloads are per-student rows with the
student's JWT — the ingestion service resolves `institution_id` +
`org_unit_id` from the JWT, never from the request body.

### Step 5 — Admin dashboard "just works"

The admin logs in with `admin@dtu.ac.in`. The JWT carries
`institution_id = <DTU uuid>`. Every read endpoint filters by that
claim. The dashboard you're looking at now renders DTU data. No
config on the frontend.

---

## 3. Swapping Lovable Cloud for Spring Boot (zero-downtime plan)

You do **not** delete the current backend. You run both, cut over per
endpoint, then retire.

### Phase A — Stand up Spring Boot alongside

- New service at `api.peacecode.example.com`.
- Reads from the same Postgres (or a read replica). Cheapest path:
  point Spring Boot's `DataSource` at the existing Supabase Postgres
  connection string.
- Implements `BACKEND_CONTRACT.md` endpoint-by-endpoint. Each one
  returns exactly the JSON shape the Zod schemas in
  `src/lib/data/contracts.ts` expect — the client validates on
  receive, so drift shows up immediately in dev.

### Phase B — Shadow traffic

- Deploy the frontend once with `VITE_USE_HTTP_API=false` (unchanged).
- In `HttpDataClient`, temporarily enable a "shadow read" mode: for
  every Supabase call, also fire the equivalent HTTP call and diff
  the response server-side. Log mismatches. Ship no user-visible
  change.

### Phase C — Cut over per environment

1. Staging: set `VITE_USE_HTTP_API=true`, `VITE_API_BASE_URL=…`. Run
   the QA route (`/qa`) — it's designed exactly for this. Every
   contract mismatch shows as a red row.
2. Pilot institution (one college): same env flip, monitor for a week.
3. Full production: flip the env var, redeploy. **No code change.**

### Phase D — Retire Supabase reads

Once the HTTP client is authoritative, `SupabaseDataClient` becomes
dead code. Delete it and remove the toggle. Supabase can stay as the
identity provider even after the read path is 100% Spring Boot.

---

## 4. Multi-tenant safety (non-negotiable)

Every read query must filter by `institution_id` from the JWT. Two
belt-and-braces layers:

1. **Application layer** — a Spring `HandlerInterceptor` or
   `@PreAuthorize` that extracts `institution_id` from the token and
   injects it into a `ThreadLocal` / request-scoped bean. Every
   repository method takes it as a parameter. No exceptions.
2. **Database layer** — Postgres Row-Level Security on every table
   with an `institution_id` column:

   ```sql
   ALTER TABLE agg_wellbeing_daily ENABLE ROW LEVEL SECURITY;
   CREATE POLICY tenant_isolation ON agg_wellbeing_daily
     USING (institution_id = current_setting('app.institution_id')::uuid);
   ```

   Spring Boot sets `SET LOCAL app.institution_id = '…'` at the start
   of each transaction. If the app layer forgets to filter, RLS still
   blocks the leak.

Institution admin never gets an "all institutions" view. That role
does not exist. Cross-institution analytics (if ever needed) is a
separate service with a separate audit trail.

---

## 5. k-anonymity in the aggregation layer

The contract says every response respects `k >= 10`. Implement it
once, in SQL, so the API can never leak:

```sql
CREATE MATERIALIZED VIEW agg_dept_wellbeing AS
SELECT
  institution_id,
  org_unit_id,
  date_trunc('week', taken_at) AS week,
  COUNT(*)                     AS n,
  AVG(phq9_score)              AS avg_phq9,
  AVG(gad7_score)              AS avg_gad7
FROM raw_screenings
GROUP BY 1, 2, 3
HAVING COUNT(*) >= 10;                -- ← the k=10 floor lives here
```

The controller just `SELECT * FROM agg_dept_wellbeing WHERE …`. If a
week/branch drops below 10, the row disappears — the client already
handles that as a suppressed cell (`HatchedCell.tsx`).

Refresh cadence: `REFRESH MATERIALIZED VIEW CONCURRENTLY …` every
15 min via `pg_cron`. Aggregates are eventually consistent; the
dashboard subtitle already says "as of …".

---

## 6. What the frontend guarantees (so you can rely on it)

- No hardcoded institution, department, branch, or program names.
- No frontend business logic assumes a fixed depth of org tree.
- Every route re-fetches on filter change via URL search params —
  no stale caches to invalidate on your side.
- The `HttpDataClient` validates every response with Zod. If your
  Spring Boot response is missing a field or has a wrong type, the
  page shows an error boundary, not a corrupted chart.
- The `/qa` route is a diagnostic surface. Point it at your staging
  API to verify every endpoint before cutting over.

---

## 7. Adding a new school or branch after go-live

Question: *do I need a frontend update?*

**No.** The flow is:

1. `INSERT INTO org_units (…) VALUES (…);`
2. Student enrollment records for that branch start flowing in.
3. Once `n >= 10` for that branch in a given week, it appears in
   `GET /api/v1/departments`.
4. The dashboard renders it automatically. It's a data-driven list.

The only time the frontend needs a change is if you introduce a
**new kind of metric** (say, a sleep score) that doesn't exist in
`contracts.ts` yet. That's a contract change — bump the API version,
add the schema, add a tile. Structural additions (more schools, more
branches, more programs, more institutions) are pure data.

---

## 8. Recommended stack for the Spring Boot service

- **Java 21 + Spring Boot 3.3**, Spring Web + Spring Security +
  Spring Data JPA.
- **JWT verification** via `spring-security-oauth2-resource-server`
  pointed at the Supabase JWKS URL (
  `https://<project>.supabase.co/auth/v1/keys`). No custom crypto.
- **Postgres 15+**, Flyway for migrations, HikariCP for pooling.
- **Redis** for rate limiting (per-institution-admin) and for the
  15-minute response cache on read endpoints.
- **OpenAPI** generated from the controllers; diff it against
  `BACKEND_CONTRACT.md` in CI so drift is caught pre-merge.
- **Observability**: Micrometer → Prometheus, structured JSON logs
  with `institution_id` on every line, Sentry for errors.

---

## 9. Checklist before flipping `VITE_USE_HTTP_API=true` in prod

- [ ] Every endpoint in `BACKEND_CONTRACT.md` returns 200 + valid JSON on staging.
- [ ] `/qa` route is green against staging.
- [ ] Load test: p95 < 400 ms on the dashboard's 10 tiles cold.
- [ ] JWT with wrong `institution_id` returns 403, not empty data.
- [ ] k-anonymity smoke test: seed 9 students in a branch, confirm the
      branch does not appear in `/api/v1/departments`.
- [ ] Audit log records every admin-facing read (who, when, which endpoint).
- [ ] Runbook exists for "rollback": set `VITE_USE_HTTP_API=false`,
      redeploy, done.

---

## 10. Open questions to resolve with the first partner (DTU)

- Which identity provider — DTU SSO (SAML/OIDC) or email+password
  against Supabase? The answer determines whether you plug DTU as an
  upstream OIDC provider or use domain-restricted signup.
- Where does the student roster come from — SIS export, nightly CSV,
  or live API? Roster quality gates every downstream metric.
- Data residency — must the Postgres live in India? If yes, pick the
  region up front; migrating tenants across regions later is painful.
- Retention — how long are raw screenings kept before being
  aggregated-and-purged? Default proposal: 24 months raw, forever
  aggregated.

Answer those four and the rest of this document is executable as-is.
