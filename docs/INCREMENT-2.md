# Increment 2 - persistence, authentication, and dashboard

Updated October 18, 2026. Branch: feat/persistence-auth-dashboard.

**Status: real database and full local browser workflows verified. Awaiting approval for push/deployment.**

## Current implementation

The existing responsive planner, goals/tasks migration, ownership RLS, restricted grants, atomic save RPC, dashboard, task completion/progress, goal deletion, and server-side authorization are preserved. The migration was applied successfully to the development project and must not be rerun there.

For the October 19 MVP, authentication now uses Supabase email/password for existing confirmed accounts. The server-only signin endpoint replaces code/verify endpoints. Sign-out ends the current browser session. Public signup remains disabled; no signup endpoint exists. SMTP, email-code templates, public registration, and password recovery are deferred. The sign-in UI uses the existing design classes, masks passwords, clears them after attempts, and provides validation/error/busy states. Supabase tokens remain in HttpOnly, SameSite=Lax cookies, Secure in production. The app does not log or store passwords.

## Results

| Check | Result |
| --- | --- |
| Runtime | Node 22.23.3 / npm 10.9.9; system Node 24 remains outside the declared range |
| ESLint | Passed |
| Route types / TypeScript | Passed |
| Unit/component/API tests | 71 passed |
| Production Webpack build | Passed |
| Existing desktop/mobile public browser and API checks | 8 passed |
| Live Supabase integration suite | 7 passed |
| Live desktop and mobile browser workflows | 2 passed using installed Microsoft Edge |

Each live browser workflow signed in A with its existing password, created/saved a goal, confirmed five persisted tasks and refresh survival, completed one task and confirmed 20% progress after refresh, checked the dashboard, signed out and verified private API denial, signed in B and verified A's goal was hidden/404, signed back into A, deleted the goal, and confirmed deletion after refresh. Browser cookie checks confirmed HttpOnly and SameSite=Lax and no JavaScript-visible auth-token cookie. Disposable goals were cleaned up.

The separate live database suite verified real CRUD, independent-session persistence, two-user RLS isolation, anonymous denial, immutable ownership, atomic rollback, and deletion. The initial seven-test pass predates the auth change; the suite passed again afterward.

## Resolved verification failures

- Initial lint/type checks caught an unused test import and a Testing Library option mismatch; corrected.
- Windows PowerShell wrote a UTF-8 BOM to package.json; removed it and the production build passed.
- Downloaded Playwright Chromium failed to launch with spawn UNKNOWN on this PC. Installed Edge passed; PLAYWRIGHT_CHANNEL=msedge is supported as a local fallback. CI continues to use Chromium by default.
- Playwright check() expected an immediate checkbox update, but the existing UI waits for server confirmation. The live test now clicks and waits for persisted progress, with no change to application behavior.
- Non-blocking Vite future-loader and terminal color warnings remain.

No database schema or RLS changes were required. No push, deployment, or public signup was performed. Real test credentials remain in ignored local files; live browser traces/screenshots/video are disabled.

## Remaining deployment work

Approve review/commit/push and verify hosted CI; connect/configure Vercel with Node 22.x and server environment variables; choose development versus production data deliberately; configure the exact HTTPS APP_ORIGIN and Supabase Site URL; provision a confirmed reviewer account privately. Then verify the hosted workflow, production Secure cookies, and aged-session refresh. Submit the public app URL in Canvas after confirming its exact deadline.

Password recovery/public registration are outside this restricted MVP. SMTP is not a blocker for existing-account password sign-in. See [Supabase setup](SUPABASE-SETUP.md) for setup and commands.
