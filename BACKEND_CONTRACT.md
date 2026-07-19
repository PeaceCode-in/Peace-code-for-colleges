# BACKEND_CONTRACT.md

Spec for the Spring Boot service that will replace `SupabaseDataClient` on
migration day. The frontend already speaks this contract via
`src/lib/data/HttpDataClient.ts` — flip `VITE_USE_HTTP_API=true` and every
page keeps working.

## Global rules

- **Auth**: every request carries `Authorization: Bearer <jwt>`. Reject with `401` if missing or invalid, `403` if the caller isn't an institution admin.
- **Institution scoping**: every response is implicitly scoped to the caller's institution — resolve from the JWT `institution_id` claim. Never accept an `institutionId` query parameter.
- **k-anonymity**: every row, cell, and bucket enforces `k >= 10`. Rows below threshold are DROPPED from the response OR replaced with `{ "suppressed": true, "reason": "k<N", "k": <count> }`. Never leak sub-threshold counts.
- **No PII**: no emails, names, student IDs, free-text fields. Aggregate columns only.
- **Response shape**: JSON matching the Zod schemas in `src/lib/data/contracts.ts`. The client validates on receive — mismatches raise runtime errors.
- **Base URL**: configurable via `VITE_API_BASE_URL`. All paths below are relative to it.
- **Times**: ISO-8601 UTC (`"2026-07-19T14:22:00Z"`).

## Endpoints

### `GET /api/v1/metrics/wellness-pulse`

Query: `from=<ISO date>&to=<ISO date>`
Response: `WellnessPulseSchema`

```json
{
  "wellbeingIndex": 72.4,
  "activeStudents": 4231,
  "crisisSignals": 12,
  "avgMood": 3.7,
  "sessionsCompleted": 348,
  "trend": [{ "date": "2026-07-01", "value": 71.2 }],
  "asOfISO": "2026-07-19T14:22:00Z"
}
```

### `GET /api/v1/departments`

Query: `filters=<url-encoded JSON of CohortFilters>`
Response: `DepartmentRow[]`. Rows with `cohortSize < 10` are omitted.

### `POST /api/v1/cohorts/slice`

Body: `SliceDims` (years, genders, residency, firstGen, aid — all arrays).
Response: `CohortSliceSchema`. If the intersected slice has `n < 10`, respond with a `Suppressed` object at HTTP 200, not 404.

### `GET /api/v1/signals/wellbeing`

Query: `from&to`. Response: `WellbeingSignalsSchema`.
PHQ-9/GAD-7 band counts per official clinical cutoffs. Any band with `n < 10` reports as `0` and increments a per-response `suppressed_bands` header for observability.

### `GET /api/v1/care/risk-queue`

Query: `window=<7d|28d|term>`. Response: `EarlyWarningQueueSchema`.
Tier counts must use the RISK_RULES codified in `src/lib/clinical-scales.ts`.

### `POST /api/v1/reports/generate`

Body: `{ template, range, filters }`. Response: `ReportPacketSchema`.
Every row in every `section.rows` is aggregate. `methodology.kThreshold` must be exactly `10`. Include `institutionId` from JWT claim.

### `GET /api/v1/admin/members`

Response: `MemberRow[]`. `maskedEmail` is server-masked (`ab•••@iitb.ac.in`). Never return raw emails on the list endpoint.

### `GET /api/v1/admin/audit`

Query: `cursor?`. Response: `AuditPageSchema`.
Pagination is opaque cursor-based (return `nextCursor: null` when done). Actor emails are masked. Never include student data or PII in audit rows.

## Error shape

Non-2xx responses return:

```json
{ "error": "human_readable_code", "message": "…", "requestId": "…" }
```

The client currently throws on non-2xx. When you want structured errors surfaced in the UI, add an `ApiErrorSchema` to `contracts.ts` and wire it through `HttpDataClient` in one place.

## Migration day checklist

1. Deploy Spring Boot at `https://api.peacecode.college`.
2. Set env:
   - `VITE_USE_HTTP_API=true`
   - `VITE_API_BASE_URL=https://api.peacecode.college`
3. Rotate JWT signing to match the token accessor in `HttpDataClient.token()` (currently reads `localStorage['pc.jwt']` — replace with the real auth store).
4. Delete: `src/lib/data/SupabaseDataClient.ts`, `supabase/` folder, all Supabase migrations, `@/integrations/supabase/*`.
5. Grep `from "@/integrations/supabase"` — must be zero hits.
6. Ship.
