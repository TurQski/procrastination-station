# Supabase setup - restricted MVP

The October 19 MVP uses email/password sign-in for existing confirmed Supabase Auth users. Email templates and custom SMTP are not required for sign-in. Public signup stays disabled. Password reset and self-service registration are deferred; the project owner manages restricted account access through Supabase.

## Project and local settings

1. Open the existing development project at https://supabase.com/dashboard. Keep the Data API enabled and public schema exposed. Do not create a replacement database or overwrite existing tables.
2. In Connect or Project Settings > API Keys / Data API, locate the project URL and publishable key (sb_publishable_). Never use a secret/service-role key.
3. Copy .env.example to .env.local only if the destination does not exist. Keep actual values in the ignored local file:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
APP_ORIGIN=http://127.0.0.1:3000
AUTH_ALLOW_SIGNUP=false
```

The application uses only server-side Supabase clients. AUTH_ALLOW_SIGNUP is retained as a configuration reminder; there is no signup endpoint and setting it true does not enable registration. Disable new-user signup in Supabase as well.

## Existing schema

The migration supabase/migrations/202610180001_goals_tasks.sql creates goals/tasks, restricted column grants, ownership RLS, and the atomic create_goal_plan function. It has already been applied successfully to the development project. Do not run it again there.

For a fresh project, inspect Table Editor and database functions before applying it once in SQL Editor. If goals, tasks, or its functions already exist, stop and compare the existing schema. Never drop tables or disable RLS to resolve an error. The migration is transactional; investigate any failure before retrying.

## Configure password authentication

1. Open Authentication > Sign In / Providers. Enable Email, retain email confirmation, and disable Allow new users to sign up.
2. Under Authentication > Users, verify the two test users are confirmed and have passwords. To create a restricted account, use Add user > Create new user with a privately stored password and auto-confirm enabled. Do not send an invitation or change the existing users' passwords unnecessarily.
3. Under Authentication > URL Configuration, set Site URL to http://127.0.0.1:3000 locally. No callback or email-template change is required for password sign-in.
4. Open the application at exactly http://127.0.0.1:3000, matching APP_ORIGIN. Sign in using the existing email and password. Saving a preview requests sign-in if needed and resumes saving after authentication.
5. The password input is masked and cleared after each attempt. Credentials travel in the sign-in request to the same-origin server and then Supabase; production must use HTTPS. They are not persisted in browser storage, returned in responses, or logged. Supabase session tokens remain in HttpOnly, SameSite=Lax cookies, Secure in production.
6. Sign out using the dashboard or goal detail page. This ends the current browser session. The API validates the user on every private request and applies RLS using that user's session.

## Verification commands

Use Node 22.x, at least 22.12, and npm. Install dependencies with npm ci, then:

```sh
npm run check
npx playwright install --no-shell chromium
npm run test:e2e
npm run test:integration
npm run test:e2e:live
```

The last two commands require a dedicated development project and two distinct confirmed accounts configured locally:

```dotenv
SUPABASE_TEST_USER_A_EMAIL=YOUR_FIRST_TEST_EMAIL
SUPABASE_TEST_USER_A_PASSWORD=YOUR_FIRST_TEST_PASSWORD
SUPABASE_TEST_USER_B_EMAIL=YOUR_SECOND_TEST_EMAIL
SUPABASE_TEST_USER_B_PASSWORD=YOUR_SECOND_TEST_PASSWORD
```

Keep these in ignored .env.local or .env.test.local; do not copy test credentials into Vercel. Both live suites create disposable uniquely named records and clean up their own records. Use the development project, never a populated production project. Regular unit/browser tests are credential-free and do not prove database persistence.

The live browser suite uses the production server with real Supabase, signs in A, saves a goal, refreshes, completes a task, refreshes again, verifies dashboard progress, signs out, signs in B, verifies A's goal is hidden and returns 404, signs back into A, deletes the goal and confirms deletion after refresh. It verifies HttpOnly cookies and signed-out API denial. It runs desktop and mobile with traces, screenshots and video disabled to prevent credentials/session data entering artifacts. It never prints environment values. Do not enable tracing for tests using real accounts.

For manual verification, repeat the same steps in the browser. Check that one goal and five tasks appear under A in Table Editor; after one checked task, progress is 20%. B must not see the goal in the dashboard or at its direct URL.

## Vercel preparation (approval required)

Use Next.js, repository root, Node 22.x, and npm run build. Configure SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, APP_ORIGIN (exact HTTPS deployment origin, no trailing slash), and AUTH_ALLOW_SIGNUP=false. Keep public signup disabled in Supabase. Set its Site URL to the production HTTPS URL. No email callback, template, or SMTP is required for existing-account password sign-in. Separate development/production data deliberately.

A reviewer needs a separately provisioned confirmed account shared privately, never a password in the repository. Public signup and password recovery require separate implementation and email-delivery setup later. Hosted CI and the deployed workflow must be verified after approval to push/deploy.

Reference: https://supabase.com/docs/guides/auth/passwords

Windows browser fallback: if downloaded Chromium fails to launch, set PLAYWRIGHT_CHANNEL=msedge in the PowerShell environment before running either browser suite. This PC passed with installed Edge; CI keeps its Chromium default.
