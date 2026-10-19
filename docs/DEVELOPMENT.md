# Development — Increment 2

The selected stack is Next.js App Router / TypeScript / Tailwind, Supabase PostgreSQL and Auth, server-side Next.js route handlers, Vercel, and GitHub Actions.

**The seven live database integration tests passed. Current password-auth browser verification is recorded in INCREMENT-2.md.** See [the step-by-step setup guide](SUPABASE-SETUP.md) for the restricted password-auth setup. Original requirements/source snapshots and the first increment's verification record are retained.

## Run locally

Install Node.js 22.12+ (22.x), then:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. Public previews work without configuration. Account and database operations return a clear 503 when server configuration is absent; there is no fallback persistence. Copy the placeholder-only `.env.example` into `.env.local` if no local file exists and follow the setup guide.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install --no-shell chromium
npm run test:e2e
# Only after configuring the real development database and two test users:
npm run test:integration
```

Unit/handler/component tests isolate external dependencies and do not verify Supabase. Browser tests cover the public preview. The separate live suite requires actual Supabase credentials and uses real authenticated sessions. GitHub CI runs the credential-free checks; it does not run the live suite or apply migrations. Browser tests require a production build first.

## Data and access design

- `supabase/migrations/202610180001_goals_tasks.sql` creates the requested goals/tasks fields, constraints, indexes, grants, RLS, and atomic plan-creation RPC.
- Goals belong to `auth.uid()`; task access requires ownership of the parent goal. Both SELECT and mutation policies apply, and column grants prevent changing owner IDs, parent IDs, or timestamps. The application never accepts a caller-provided owner ID.
- Saving regenerates the existing deterministic plan on the server from validated inputs, then inserts the goal and five tasks in one transaction. Failed task inserts roll back the goal.
- Progress is calculated from persisted task completion, not stored separately. Checkbox UI waits for the API response and reloads persisted state. No localStorage or mock database is used.
- Goal PATCH supports title/description/deadline updates; task PATCH supports completion only. Task creation is through the plan RPC; deleting a goal cascades to its tasks. Individual task creation/deletion and goal-edit forms are outside this increment's UI scope.

## Authentication

The restricted October 19 MVP uses Supabase email/password sign-in for existing confirmed accounts. Public signup remains disabled in Supabase and there is no signup endpoint. No email template or SMTP is required. Password recovery and public registration are deferred; account help goes through the project owner. Passwords are submitted only to the same-origin sign-in endpoint and Supabase, never logged, persisted in client storage, or returned in responses. See SUPABASE-SETUP.md.

Supabase is imported only in server modules. The browser calls same-origin Next.js endpoints; it receives no session tokens or database keys in response bodies. Sessions are stored in HttpOnly, SameSite=Lax cookies, Secure in production. Every private request calls `getUser()` to validate the session; the server client refreshes eligible tokens and writes refreshed cookies from the route handler. A fully expired session returns 401 and the UI requests sign-in again, while provider/network failures remain retryable errors.

No auth is read from Server Components, so cookie refresh happens in route handlers rather than a global proxy. Dashboard pages are public shells with private data fetched from authenticated APIs. Responses are private/no-store. Focus reloads the dashboard, avoiding stale account data after returning to a tab. Mutation endpoints enforce an exact Origin check, JSON validation, and a 16 KiB streamed body limit (deletes/signout require origin but no body). Supabase enforces auth rate limits; public signup will need the SMTP/abuse configuration described in the setup guide.

## API routes

| Method and path | Behavior |
| --- | --- |
| POST `/api/auth/signin` | Sign into an existing confirmed account with email/password |
| GET `/api/auth/session` | Return verified user identity or signed-out state |
| POST `/api/auth/signout` | End this browser's session |
| GET `/api/goals` | List the caller's goals and tasks |
| POST `/api/goals` | Validate and atomically save a generated plan |
| GET `/api/goals/:id` | Retrieve an owned goal and ordered tasks |
| PATCH `/api/goals/:id` | Update allowed goal fields |
| DELETE `/api/goals/:id` | Delete owned goal and its tasks |
| PATCH `/api/tasks/:id` | Set completion on an owned task |

Unauthorized/expired sessions return 401, inaccessible IDs return 404, invalid input returns 400, unsupported content types return 415, oversized bodies return 413, and transient/configuration failures return 503. Provider details and tokens are not sent to the browser or logged.

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Server only | Development project's API URL |
| `SUPABASE_PUBLISHABLE_KEY` | Server only | Publishable key; no administrator key |
| `APP_ORIGIN` | Server only | Exact browser origin for mutation protection |
| `AUTH_ALLOW_SIGNUP` | Configuration reminder | Keep `false`; signup is unavailable in this MVP regardless of this flag |
| `SUPABASE_TEST_USER_A_EMAIL/PASSWORD`, `SUPABASE_TEST_USER_B_EMAIL/PASSWORD` | Local test environment only | Two real confirmed accounts for opt-in live integration tests |

No account variables are required for builds or public previews. Never use `NEXT_PUBLIC_` for a privileged key. See [Supabase setup](SUPABASE-SETUP.md) for the exact setup order and manual persistence checks.

## Tooling notes

Development and production builds use Next.js’s supported Webpack option. Turbopack’s CSS compiler attempted a local port bind that this execution environment denied, including on the elevated retry; Webpack avoids that compiler dependency. Vercel should use the repository’s `npm run build` script.

ESLint 9 is retained because the current Next.js React/import/accessibility plugins do not declare ESLint 10 compatibility. The previous full npm audit reported five high-severity development-tool advisory entries through Next.js’s lint plugin → fast-glob → micromatch → braces. At that checkpoint, the registry offered no patched compatible braces release; npm’s suggested downgrade to Next.js 14 lint tooling was not applied. The previous production-only audit reported zero vulnerabilities. Recheck this chain when upstream tooling is updated.

The opt-in live browser command is npm run test:e2e:live. It uses the dedicated development project and two confirmed accounts; traces, screenshots and video are disabled. Never add these accounts to hosted CI. Normal CI remains credential-free.
