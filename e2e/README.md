# Sensa Playwright E2E

End-to-end tests run against a **dedicated E2E Supabase project** via `.env.e2e.local`.

## Prerequisites

1. Copy `.env.e2e.example` to `.env.e2e.local` and fill in credentials.
2. Apply all migrations to the E2E Supabase project.
3. In the E2E project: disable email confirmation, disable CAPTCHA, set Site URL to `http://127.0.0.1:3001` (and add redirect URLs for `http://127.0.0.1:3001/**`).

## Commands

```bash
npm run test:e2e          # Run all E2E tests (builds app, serves on :3001 with E2E env)
npm run test:e2e:ui       # Playwright UI mode
npm run test:e2e:purge    # Delete stale e2e-test-* users (default: older than 3h)
E2E_WEB_SERVER=dev npm run test:e2e   # Use next dev on :3001 instead (stop other dev servers first)
```

Tests run against `http://127.0.0.1:3001` so they do not conflict with a normal dev server on `:3000`.

## Test users

- Pattern: `e2e-test-{timestamp}-{random}@sensa-test.local`
- Created via real UI signup
- Session reused from `e2e/.auth/user.json` (gitignored)
- Deleted automatically in global teardown
- Stale users purged as a safety net

## Specs

| File | What it covers |
|---|---|
| `connect-journey.spec.ts` | Signup → onboarding → Connect page |
| `authenticated-nav.spec.ts` | Dashboard, Reports, Heatmap, Session Recordings, Settings |
| `settings.spec.ts` | Product name, theme toggle, delete dialog open/close |
