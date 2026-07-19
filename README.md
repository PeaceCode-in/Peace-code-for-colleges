# PeaceCode

India's student mental-wellness ecosystem. Editorial, calm, AI-assisted.

- **Frontend**: TanStack Start v1 (React 19, Vite 7) on Cloudflare Workers.
- **Backend**: to be built in Java / Spring Boot. See **[BACKEND.md](./BACKEND.md)** — full integration guide, data model, auth flow, and migration plan for your backend team.

## Quick start

```bash
bun install
bun run dev            # http://localhost:8080
bun run typecheck
bun run build
python3 tests/e2e/smoke.py    # Playwright smoke suite (dev server must be running)
```

## Where things live

- `src/routes/**` — file-based routes (~210 pages)
- `src/lib/*-store.ts` — domain stores; **these are the source of truth for the API contract**
- `src/routes/api/**` — server routes (BFF endpoints)
- `src/components/AppShell.tsx` — sidebar + mobile nav
- `tests/e2e/` — Playwright smoke suite

For anything backend-shaped, read **[BACKEND.md](./BACKEND.md)** first.
