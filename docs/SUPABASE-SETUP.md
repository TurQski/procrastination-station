# Supabase setup — Increment 2

**Status: implementation is local; live Supabase connectivity, email delivery, RLS enforcement, and persistence have not been verified.** No database changes are applied by installing or building the app. Follow these steps, then ask the agent to run the live checks. Custom SMTP is not needed for this restricted testing increment.

## 1. Create a development project

1. Sign in at https://supabase.com/dashboard and select your organization.
2. Choose **New project**, name it `procrastination-station-dev`, select a nearby region, and generate/store a strong database password privately. The app does not need this administrator password.
3. Wait for provisioning. Keep the Data API enabled and `public` in its exposed schemas (the usual defaults).
4. Open **Connect** or **Project Settings → API / API Keys**. Copy the **Project URL** and the **publishable key**, beginning `sb_publishable_`. Do not use a secret/service-role key. The server intentionally rejects non-publishable keys.

## 2. Configure local environment

At the repository root, copy `.env.example` to `.env.local` **only if `.env.local` does not already exist**; otherwise edit the existing file without replacing unrelated settings. Fill in:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_REAL_PUBLISHABLE_KEY
APP_ORIGIN=http://127.0.0.1:3000
AUTH_ALLOW_SIGNUP=false
```

Use your own values for the first two variables. Keep the file local; it is ignored by Git. Do not paste passwords, tokens, or secret keys into chat. These variables are server-only; there are no `NEXT_PUBLIC_` database variables. `.env.example` contains placeholders only and is the sole explicitly tracked environment template.

## 3. Apply the schema once

1. In the new project's **SQL Editor**, open a new query.
2. Paste the complete contents of `supabase/migrations/202610180001_goals_tasks.sql` and run it once.
3. Confirm success. The migration creates `goals`, `tasks`, indexes, constraints, RLS policies, restricted grants, an update timestamp trigger, and the transactional `create_goal_plan` function.
4. Do not disable RLS or make tables publicly readable to fix an error. If any statement fails, the transaction rolls back; copy the error text (without credentials) for investigation. Do not rerun a successful migration or drop existing data.

## 4. Set up restricted email-code authentication

1. Under **Authentication → Sign In / Providers**, enable Email authentication. Keep email confirmation enabled.
2. Keep **Allow new users to sign up** disabled for this testing period. The app also defaults `AUTH_ALLOW_SIGNUP=false` and only requests codes for existing accounts.
3. Under **Authentication → URL Configuration**, set the Site URL to `http://127.0.0.1:3000`. This app uses code entry, not magic-link callbacks, so no callback URL or redirect wildcard is needed.
4. Under **Authentication → Email Templates → Magic Link**, use a code-based template such as:

```html
<h2>Sign in to Procrastination Station</h2>
<p>Your sign-in code is: {{ .Token }}</p>
<p>If you did not request this, ignore this email.</p>
```

5. Select an email address belonging to an existing member of your Supabase organization team. The built-in sender only delivers to authorized organization-team addresses. **Adding an address in Authentication → Users alone does not authorize the sender to email it.** See [Supabase's built-in email restrictions](https://supabase.com/docs/guides/auth/auth-smtp).
6. Under **Authentication → Users → Add user → Create new user**, create that test user, choose a strong temporary test password, and confirm the account using the dashboard's auto-confirm option if offered. Use **Create**, not an email invitation. The app still signs in using email codes; the password is only for the optional live integration harness.
7. For the two-user isolation checks, repeat with a second distinct test user. Use a second existing authorized organization-team address for testing email delivery. Do not grant unrelated people project administration just to receive a test email.
8. The built-in sender has a very low project-wide email quota (documented as two messages per hour); request one code and use it instead of repeatedly resending. Rate-limit errors are shown in the app. SMTP remains optional for these authorized-address tests.

## 5. Start the app and verify the real flow

With Node.js 22.12+ (22.x) installed:

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:3000** (matching `APP_ORIGIN`; do not interchange it with `localhost`). Restart the dev server after changing environment variables.

1. Preview a goal while signed out. The preview should work without an account.
2. Choose **Save to my goals**. Enter the existing authorized email, request a code, and enter the latest code from the email. The preview stays on screen during sign-in.
3. Successful verification resumes saving. Only a successful database response produces **Saved** and a link to the goal.
4. Open the saved goal, complete a task, then refresh. The task should remain complete. Toggle it back and refresh again.
5. Open **My goals** and verify the goal and progress percentage. Check the `goals` and `tasks` tables in Supabase: one goal and five tasks should exist for the authenticated user's ID.
6. Sign out and open the goal URL: sign-in should be required. Use a different browser/private window for user B. User B's dashboard must not list user A's goal, and visiting A's goal URL as B must show not found.
7. Test goal deletion only on a disposable goal. Refresh and confirm it is absent.

Record actual results; do not infer successful persistence from the presence of UI or a passing build. If the network drops during saving, check the dashboard before retrying to avoid creating a duplicate.

## 6. Run the separate live database tests

In `.env.local` or ignored `.env.test.local`, add the two confirmed development test accounts:

```dotenv
SUPABASE_TEST_USER_A_EMAIL=YOUR_FIRST_TEST_EMAIL
SUPABASE_TEST_USER_A_PASSWORD=YOUR_FIRST_TEST_PASSWORD
SUPABASE_TEST_USER_B_EMAIL=YOUR_SECOND_TEST_EMAIL
SUPABASE_TEST_USER_B_PASSWORD=YOUR_SECOND_TEST_PASSWORD
```

Then run:

```sh
npm run test:integration
```

This suite talks directly to the real Supabase Auth and Data APIs using the publishable key and real user sessions. It creates disposable uniquely named goals, tests CRUD, independent-session persistence, cross-user reads/writes/deletes, anonymous access denial, immutable ownership, and transaction rollback; it cleans up its own test goals. It never uses a service-role key or in-memory database. Run against the development project, not a populated production project. Missing configuration fails the suite rather than silently skipping live verification.

These password-authenticated tests verify database/session isolation, **not email delivery or browser cookie refresh**. Complete the manual email-code and browser refresh checks above as well. The regular `npm test` suite uses controlled dependencies for handler/UI tests and is not evidence of live RLS behavior.

## Before public signup or deployment

After local verification and explicit approval to deploy: configure custom SMTP, a verified sender, suitable email rate limits/abuse protection, and the production Site URL. If opening registration, enable signups in Supabase, set `AUTH_ALLOW_SIGNUP=true`, and put `{{ .Token }}` in the confirmation template for new users as well. Review the testing-only auth-panel copy before opening registration.

On Vercel, import this repository as Next.js, use the repository root and Node.js 22.x, and retain `npm run build`. Add `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `APP_ORIGIN` (the exact HTTPS deployment origin), and `AUTH_ALLOW_SIGNUP` in the appropriate environments. Separate preview/development and production data where possible. No deployment or push has been authorized for this increment yet.

References: [email-code authentication](https://supabase.com/docs/guides/auth/auth-email-passwordless), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [database functions and invoker privileges](https://supabase.com/docs/guides/database/functions).
