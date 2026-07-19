# Counselling module — backend contract

The counselling ecosystem currently runs as a **local-first prototype**: every
entity is persisted in `localStorage` via `src/lib/counselling-store.ts`.
Every user action listed here already works client-side. To ship, replace the
store's read/write helpers with server-fn / REST calls to the endpoints below.
Field names below mirror the TypeScript types in `counselling-store.ts` so no
UI change is needed.

Auth: every endpoint requires an authenticated Supabase user unless flagged
`(public)`. Server-side handlers use `requireSupabaseAuth`, and rows are
scoped to `user_id = auth.uid()`.

---

## 1. Experts / directory  `EXPERTS`, `SPECIALIZATIONS`, `THERAPY_TYPES`, `LANGS`

Read-only catalogue today. Backend should host:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/counselling/experts` (public) | list experts with filters `q, specialization[], therapy[], lang[], gender[], mode[], collegePartner, emergency, maxFee, sort` |
| GET | `/api/counselling/experts/:id` (public) | expert detail (bio, reviews, next slots, policies) |
| GET | `/api/counselling/experts/:id/slots?from=&to=` (public) | available slots (respecting timezone + working hours) |

Used by: `counselling.experts.tsx`, `counselling.expert.$id.tsx`, `counselling.book.$id.tsx`,
`counselling.my.tsx`, `counselling.messages.tsx`.

## 2. Favorites  `favorites`, `toggleFavorite`

| POST | `/api/counselling/favorites/:expertId/toggle` |
| GET | `/api/counselling/favorites` |

## 3. Appointments  `Appointment` type

Client already builds appointments with: `expertId, scheduledFor, duration,
mode, language, fee, reason, notes, questionnaire (Questionnaire),
consent flags, paid, status`.

| POST | `/api/counselling/appointments` | create (status starts as `draft`) |
| PATCH | `/api/counselling/appointments/:id` | partial update (status, notes, moodBefore/After, paid) |
| POST | `/api/counselling/appointments/:id/cancel` | respects expert `cancellationPolicy` for refund logic |
| GET | `/api/counselling/appointments?scope=upcoming|history|all` | scoped list |
| GET | `/api/counselling/appointments/:id` | detail |

Server-side must also:
* enforce slot availability at create-time,
* create/update a matching `invoices` row when `paid` transitions to `true`,
* trigger reminders (24h + 10min before `scheduledFor`) via email/SMS/push,
* auto-flip `status` to `completed` if `scheduledFor + duration < now()` and status was `confirmed|in-progress`.

Used by: `counselling.book.$id.tsx`, `counselling.upcoming.tsx`,
`counselling.history.tsx`, `counselling.appt.$aid.tsx`,
`counselling.session.$aid.tsx`, `counselling.summary.$aid.tsx`, `counselling.index.tsx`.

## 4. Live session

Runs in `counselling.session.$aid.tsx`. Today it's fully local (timer, chat
against `messages`, mocked signal). Backend must provide:

| POST | `/api/counselling/sessions/:aid/token` | issue a short-lived room token for the WebRTC provider (Daily.co / LiveKit / Agora) |
| POST | `/api/counselling/sessions/:aid/heartbeat` | keep-alive so no-show detection works |
| POST | `/api/counselling/sessions/:aid/end` | close room, write duration, flip appointment status |
| POST | `/api/counselling/sessions/:aid/notes` | body: `{ text }` — private student notes |

In-session controls that are now purely UI state and need server support once
real video is wired: **screen share, whiteboard, speaker device selection,
captions (STT), background blur**. The client already toggles these; only the
WebRTC transport layer is missing.

## 5. Messages / async chat  `MessageT`, `addMessage`, `patchMessage`

| GET | `/api/counselling/threads` | list threads with unread counts |
| GET | `/api/counselling/threads/:expertId/messages?before=&limit=` |
| POST | `/api/counselling/threads/:expertId/messages` | `{ text, attachmentIds? }` |
| PATCH | `/api/counselling/messages/:id` | `{ pinned?, bookmarked?, archived?, read? }` |

Auto-replies today are client-side mocks. Backend should emit real events;
counsellors reply from a partner dashboard (out of scope here).

Attachments now use the file picker in `counselling.messages.tsx` — it calls
`addDoc` and posts a "📎 Shared …" message. Wire that upload to the documents
endpoint below and post the document id back with the message.

Used by: `counselling.messages.tsx`, `counselling.session.$aid.tsx` (chat panel).

## 6. Documents  `DocT`, `addDoc`, `listDocs`

| POST | `/api/counselling/documents` (multipart) | fields: `file, kind, sharedWith[]` — returns `{ id, name, kind, size, sharedWith, createdAt }` |
| GET | `/api/counselling/documents` | list mine |
| POST | `/api/counselling/documents/:id/share` | body: `{ expertIds[] }` |
| DELETE | `/api/counselling/documents/:id` |

Storage: private Supabase bucket `counselling-docs`, RLS by owner. Signed URLs
for expert reads.

Used by: `counselling.appt.$aid.tsx` (Upload document), `counselling.documents.tsx`,
`counselling.messages.tsx` (paperclip).

## 7. Homework  `Homework`, `addHomework`, `toggleHomework`

| GET/POST/PATCH | `/api/counselling/homework[/:id]` |

Fields: `apptId?, expertId, title, kind, detail, due?, done, createdAt`.
Client mutates via `counselling.homework.tsx` and `counselling.summary.$aid.tsx`.

## 8. Wellness goals  `Goal`, `addGoal`, `bumpGoal`, `removeGoal`

| GET/POST/PATCH/DELETE | `/api/counselling/goals[/:id]` |

Fields: `title, cadence ("daily"|"weekly"), progress (0-100), createdAt`.
The wellness page's "This week" summary is now derived from the top three
incomplete goals — no separate `/summary` endpoint is needed.

## 9. Medication tracker  `Medication`, `addMedication`

| GET/POST/PATCH/DELETE | `/api/counselling/medications[/:id]` |

Fields: `name, dose, schedule, since, notes, active`.

## 10. Billing  `Invoice`, `payAppointment`, `listInvoices`

| GET | `/api/counselling/invoices` | list, filterable |
| POST | `/api/counselling/invoices/:aptId/pay` | idempotent — creates invoice + marks appointment paid |
| GET | `/api/counselling/invoices.csv` | (or client-side CSV, already implemented) |

Payment provider is out of scope; the client already generates a CSV export
from whatever list is returned.

Used by: `counselling.billing.tsx`, `counselling.book.$id.tsx` (pay step).

## 11. Reports / analytics

`counselling.reports.tsx` now derives its trend chart from the user's real
appointment history (mood + questionnaire.stress + questionnaire.sleep,
chronologically, last 8 sessions). Attendance and homework completion are
already computed client-side from the store.

Backend can optionally provide a canonical aggregate:

| GET | `/api/counselling/reports/summary` | returns `{ total, completed, attendance, hwRate, series[] }` |

The `series[]` items are `{ ts, mood, stress, sleep, note? }`. Prefer server-side
if you want to include telemetry the client doesn't have (counsellor SOAP notes,
PHQ-9 retake scores) — see §12.

PDF export is now `window.print()` with print styles; no endpoint required.

## 12. Assessments

`counselling.assessments.tsx` now reads real state from
`src/lib/screening-store.ts` (`loadSessions()`, `TESTS`). Every PHQ-9 / GAD-7 /
WHO-5 / DASS-21 status chip reflects the student's actual last completion.

Backend contract shared with the Screening module:

| GET | `/api/screening/sessions` | list student's completed + in-progress sessions |
| POST | `/api/screening/sessions` | create/update, body: `{ testId, answers, currentIndex, status }` |
| GET | `/api/screening/sessions/:id` |

Send the resulting scores into the counsellor pre-session dashboard so
"assigned by counsellor" can become a real state instead of local `not_started`.

## 13. Resources

Curated in `RESOURCES`. `counselling.resources.tsx` now shows an in-app
preview modal linked into `/resources/library`. The full resource library
already has its own store (`resources-store.ts`) — the counselling picks are
just a shortlist. Backend should:

| GET | `/api/counselling/resources` (public) | shortlist filtered by topic |
| POST | `/api/counselling/resources/:id/assign` | counsellor → student assignment |

## 14. Emergency

`counselling.emergency.tsx` is a static directory of Indian helplines. Wire
"Call now" click-throughs into analytics + trigger a background wellness
check-in the following day.

---

## Cross-cutting

* **Timezone**: store timestamps as UTC millis; render with Intl in `Asia/Kolkata`.
* **Realtime**: message inbox, appointment status, and session presence should
  use Supabase Realtime channels keyed by `user_id`.
* **RLS**: every table above needs owner-scoped SELECT/INSERT/UPDATE/DELETE
  policies plus counsellor-scoped read where relevant (`counsellor_id`).
* **Rate-limits**: booking creation, homework toggles, and message posting
  are the abuse-prone endpoints.
* **Backfill**: none needed — the client falls back to `seedIfEmpty()` for
  brand-new users.
