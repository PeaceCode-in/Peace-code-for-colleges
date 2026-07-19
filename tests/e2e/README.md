# End-to-end smoke tests

Playwright suite that exercises the critical navigation paths on the running dev server.

## Run

```bash
# dev server on :8080 must be running
python3 tests/e2e/smoke.py
```

## Coverage

- Dashboard load (guest path via `/auth` → Skip)
- Logo → home navigation
- Section switching: `/breathe`, `/journal`, `/community`, `/counselling`, `/focus`, `/profile`, `/settings`
- Sidebar link click (`/` → `/breathe`)
- Runtime `pageerror` monitoring — fails the suite on any uncaught exception

Screenshots land under `/tmp/browser/e2e/screenshots/`.
