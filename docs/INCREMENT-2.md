# Increment 2 — Persistence, authentication, and dashboard

Branch: `feat/persistence-auth-dashboard` (based on approved increment 1).

**Status: implementation and local checks complete; paused for external Supabase setup. No migration, live database check, email authentication test, push, or deployment has been performed.**

## Implemented locally

- Version-controlled PostgreSQL migration for all requested goal/task fields, data constraints, ownership-based RLS, restricted column privileges, indexes, and timestamp handling.
- Security-invoker RPC that creates a goal and its five generated tasks in one transaction.
- Server-only Supabase client with verified-user checks and HttpOnly session cookies; email-code request, verification, session, and sign-out endpoints. Public signup defaults off; built-in email supports the restricted testing plan.
- Server validation, bounded JSON bodies, same-origin mutation checks, private/no-store responses, and non-revealing inaccessible-record responses.
- Save flow that preserves the preview during sign-in and only reports success after the server's save response.
- Dashboard and individual goal pages with task checkboxes, progress percentages, deletion confirmation, loading/empty/error states, and reauthentication after session expiry.
- Root `.env.example` with placeholders; actual local/test environment files stay ignored.
- A separate opt-in live Supabase suite for CRUD, independent-session persistence, ownership boundaries, anonymous access denial, and atomic rollback.

## Verified locally

| Check | Result |
| --- | --- |
| ESLint | Passed |
| Route types and TypeScript | Passed |
| Unit/component/API-contract tests | 67 passed, including all original tests |
| Production build | Passed with Webpack |
| Desktop/mobile browser and real local API boundary checks | 8 passed |
| Unconfigured account services | Explicit error shown; no fake saved records or false save success |
| Cross-site mutation and invalid input | Rejected by actual local route handlers |
| Browser build inspection | No Supabase environment names or publishable key placeholders in static client bundles |
| Candidate-file credential scan | No privileged credential patterns; only the placeholder environment template included |
| Original requirements/source/setup and increment-1 snapshots | Preserved |

Local handler/UI tests use controlled dependencies to verify contracts and state transitions; they are not evidence of RLS behavior or successful database writes. The browser/API tests ran without Supabase credentials.

## Still unverified / not performed

- Migration application against a real Supabase PostgreSQL project.
- Actual email delivery, OTP verification, refreshed session cookies, and expired-session behavior against Supabase.
- Saving, retrieving, editing, deleting, and maintaining progress after a browser refresh against real storage.
- Two-user RLS enforcement and transactional rollback against the real database.
- Hosted GitHub Actions execution and Vercel deployment.

Follow [Supabase setup](SUPABASE-SETUP.md), then run the live suite and the manual browser/email checks. Do not mark the persistence milestone complete until those succeed. Custom SMTP is deferred until public signup; no privileged database key is needed in the app.
