# Procrastination Station — AI agent handoff

Last updated: October 18, 2026. Target: a functional, publicly deployed CS4800 MVP by October 19, 2026.

## Start here

Increment 1 was approved. Increment 2 is implemented locally and paused for Supabase configuration and real persistence verification. **Do not restart scaffolding or claim database functionality is verified.**

Read these before continuing:

1. [Development guide](docs/DEVELOPMENT.md) — current architecture and commands.
2. [Supabase setup](docs/SUPABASE-SETUP.md) — exact external configuration and manual verification instructions.
3. [Increment 2 verification record](docs/INCREMENT-2.md) — passed checks and remaining verification.
4. [Project requirements](docs/CS4800%20Final%20Project%20-%20Requirements.md) — course scope.

## Repository checkpoint

- Origin: `https://github.com/TurQski/procrastination-station.git`
- Current branch: `feat/persistence-auth-dashboard`
- Current implementation commit: `113f043` — Supabase auth, persistence endpoints, and private dashboard.
- Foundation commit: `e9e5fe3`, on `feat/phase-1-foundation`.
- Last recorded `main` / `origin/main`: `c0c082d`, initial documentation.
- Working tree was clean before this handoff document was created.
- Feature work has not been pushed; no deployment has been performed.

Recheck branch, working tree, remotes, and history on resuming. Preserve all existing files, documentation, user changes, and Git history. This file is a checkpoint, not proof that repository or external configuration has remained unchanged.

## What exists

- Next.js App Router, TypeScript, Tailwind, responsive branded landing page, and deterministic goal planner.
- Public plan previews that are explicitly unsaved; saving requires authentication.
- Supabase email-code authentication with server-managed HttpOnly cookies and verified-user checks.
- Goal/task schema, ownership-based RLS, and an atomic goal-plus-tasks creation function in [the SQL migration](supabase/migrations/202610180001_goals_tasks.sql).
- Validated server endpoints for authentication, goal creation/list/detail/edit/delete, and task completion updates.
- Dashboard, individual goal view, checklists, progress, deletion, and loading/empty/error/session-expiry UI.
- Server-only environment configuration; no privileged database key is required.
- GitHub Actions checks and an opt-in live Supabase integration suite.

Keep the current design and planner. The planner is rule-based, not AI-generated or researched. Goal editing has an API but no editing form; focus on persistence and deployment readiness before adding features.

## Evidence so far

Previously passed locally: lint, TypeScript, 67 unit/component/API-contract tests, production build, and 8 desktop/mobile browser/API checks. Existing tests were preserved. Browser checks ran without Supabase configuration.

**Not yet verified:** migration application, real email delivery/sign-in, session refresh against Supabase, real CRUD, progress after browser refresh, two-user database isolation, hosted CI, or deployment. Mocked contract tests are not evidence of working RLS or database persistence.

The previous production dependency audit found no vulnerabilities. Development-only lint dependencies had outstanding advisories; consult DEVELOPMENT.md and reassess when needed. Do not force dependency upgrades or downgrade Next.js just to silence an audit.

## Immediate next step: configure Supabase

Ask the user whether they have completed [SUPABASE-SETUP.md](docs/SUPABASE-SETUP.md). If not, walk them through that guide. Do not ask them to paste passwords, tokens, or environment-file contents into chat.

1. Create a dedicated Supabase development project with the Data API enabled.
2. Copy `.env.example` to `.env.local` only if the destination does not already exist. Configure locally:

   ```dotenv
   SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
   APP_ORIGIN=http://127.0.0.1:3000
   AUTH_ALLOW_SIGNUP=false
   ```

3. Use the new publishable key, not a service-role/secret key or legacy JWT key. Keep these settings server-only; do not add `NEXT_PUBLIC_` prefixes.
4. Apply the version-controlled migration once through the SQL Editor. Check existing migration/schema state first; do not drop data or blindly rerun an applied migration.
5. Enable email authentication, keep public signup disabled, and configure the local Site URL and Magic Link template to display `{{ .Token }}` as instructed in the guide.
6. Create existing confirmed test accounts. Built-in email delivery is restricted to authorized organization-team addresses and has low sending limits; creating an Auth user alone does not authorize its email address for that sender. Custom SMTP is deferred until public signup.
7. Prepare two distinct confirmed test users for ownership checks. Store their test credentials only in ignored local environment files, using the variable names in `.env.example`.

No configured local environment or real database connection was available at the implementation checkpoint. Inspect environment presence without displaying secrets.

## Resume verification in this order

1. Inspect Git state and the documentation above; stay on this feature branch or a clearly named follow-up feature branch.
2. Confirm Node 22.x (at least 22.12), install dependencies if needed, and confirm the external configuration is ready.
3. Run `npm run test:integration` against the dedicated development project. It requires `SUPABASE_TEST_USER_A_EMAIL`, `SUPABASE_TEST_USER_A_PASSWORD`, `SUPABASE_TEST_USER_B_EMAIL`, and `SUPABASE_TEST_USER_B_PASSWORD`, plus the project settings. It tests real CRUD, independent-session persistence, ownership boundaries, anonymous denial, and transactional rollback.
4. Run `npm run dev` and open exactly `http://127.0.0.1:3000`. Follow the guide's manual email-code and browser checks: preview, sign in, save, open goal, complete/uncomplete tasks, refresh, sign out, and inspect isolation with a second user. The password-based integration suite does not verify email delivery or browser cookie refresh.
5. Fix any failures in small increments. Do not replace database operations with mock persistence or disable RLS to make tests pass.
6. Run lint, type checking, unit tests, production build, and browser tests after changes. Record actual results and remaining limitations in DEVELOPMENT.md and INCREMENT-2.md.
7. Present the verified change set and remaining deployment configuration. **Wait for explicit user approval before pushing or deploying.**

Useful commands from the repository root:

```sh
git status --short --branch
git remote -v
git log -5 --oneline
node --version
npm ci
npm run check
npx playwright install --no-shell chromium
npm run test:e2e
npm run test:integration
```

The live integration command needs real configuration and creates disposable test records. Do not run it against a populated production project. Its passing result must be reported separately from credential-free tests.

The earlier session used a temporary Node installation at `/tmp/ps-node-runtime/node-v22.23.3-darwin-arm64/bin` and Playwright browsers at `/tmp/ps-playwright-browsers`; these may no longer exist. Prefer a working Node 22 installation. If reusing that browser cache, set `PLAYWRIGHT_BROWSERS_PATH` accordingly. Existing dev/build scripts intentionally use Webpack because this environment blocked Turbopack's internal port binding.

## Approval and completion boundaries

- Do not push to any branch or deploy until the user approves the next step. Never force-push or rewrite history.
- Do not commit actual `.env` files or credentials; only `.env.example` is intended for version control.
- All saved user data must persist in Supabase and be protected by ownership-based RLS.
- Do not mark the persistence milestone complete until real database and browser persistence checks succeed.
- Before public signup, configure custom SMTP and appropriate abuse controls. Before Vercel deployment, explain the required account, exact production origin, Supabase Auth settings, and environment variables. Keep production/preview configuration deliberate.
- Prioritize the October 19 MVP over advanced AI or optional features.

## Resume prompt

> Read AI_AGENTS_NEXT_STEPS.md and the linked development/setup records. Resume Increment 2 at Supabase configuration and live persistence verification. Inspect the current Git and environment state without exposing secrets, preserve existing work, and tell me which external setup steps remain. Do not push or deploy without my approval.
