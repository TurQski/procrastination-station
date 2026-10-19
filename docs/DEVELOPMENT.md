# Development — increment 1

## Local setup

Install Node.js 22 LTS (22.12 or later) (the version family in `.nvmrc`) and npm. Then, from this repository:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No accounts or environment variables are needed for this increment.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install --no-shell chromium
npm run test:e2e
```

Browser tests start the production server, so build first. CI performs the same checks on pull requests and pushes to `main` or `feat/**`. CI has not run on GitHub until the workflow is pushed. Keep changes on feature branches; merging or pushing to main requires the owner's approval.

## Implemented scope

- Next.js App Router, TypeScript, Tailwind CSS, responsive branding and landing page.
- Goal, target date, and effort input with accessible validation and empty/error states.
- Pure deterministic five-stage plan preview with positive durations totaling the requested budget and dates spanning today through the target.
- Preview generation is synchronous and immediate; it has no fabricated loading delay or network request. Loading, retry, and save states belong to the future database/API increment.
- Previews are expressly unsaved and disappear on refresh. There is no goal-creation endpoint, database, localStorage persistence, or saved-goal dashboard yet. This increment does not meet the persistent MVP requirement by itself.

## Structure

- `src/app/`: App Router page, document layout, and global styles.
- `src/components/`: interactive form and preview.
- `src/lib/planner.ts`: storage-independent validation and deterministic planning.
- `tests/`: browser checks and unit-test setup; unit/component tests live beside source.
- `.github/workflows/ci.yml`: lint, types, tests, production build, and browser checks.
- `docs/`: original requirements snapshots, source notes, and ongoing development records.

The original requirements snapshots remain unchanged historical documents. The selected stack is now Next.js / TypeScript / Tailwind, Supabase PostgreSQL, Next.js server endpoints, Vercel, and GitHub Actions.

## Before database integration — proposed safe access model

Use Supabase Auth email one-time codes and PostgreSQL row-level security (RLS). This is the proposed next increment, not implemented or approved yet. A small sign-in step lets users recover their private goals across browsers without creating an application-managed password system. An unauthenticated shared table would expose or mix people's goals and is not suitable for public deployment.

Next.js server endpoints should use the caller's Supabase session and a publishable API key, so RLS applies to every query. Each goal has an owner ID matching `auth.uid()`; every task belongs to a goal that the caller owns. Enable RLS with ownership checks for every allowed operation, including insert/update checks. Never accept a client-supplied owner ID as proof of ownership. Create a goal and its tasks atomically in a transaction. Verify cross-user isolation and refresh persistence before exposing saved goals.

No secret/service-role key is needed for ordinary user CRUD. Do not use a service-role client to bypass RLS. Keep session cookies server-managed with appropriate secure settings, verify users on the server, validate every request, and avoid logging goal text or tokens. Public endpoints will need size limits, rate limits, and origin/CSRF protections appropriate to their session mechanism.

### Required accounts and configuration

1. **Supabase:** create or select a project with PostgreSQL and email Auth enabled. Provide the project URL and publishable API key through local/Vercel environment settings. No database password or service-role key should be pasted into chat or committed.
2. **Server-only environment variables:** `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. These will be read only in server modules; no `NEXT_PUBLIC_` database variables are planned. The publishable key is designed to be public but does not grant access without correct RLS. No variables are required or read by this first increment.
3. **Email delivery:** for public email-code sign-in, configure a supported custom SMTP provider in Supabase, a verified sender, and an email template that includes the one-time code. Supabase's built-in sender is restricted and is not a production email service. Store SMTP credentials in Supabase, not the app repository.
4. **Schema:** after the access approach is agreed, SQL migrations will create goals/tasks, ownership constraints, indexes, and RLS policies. Apply them to the chosen Supabase project; the dashboard SQL editor is sufficient. Do not expose a database administrator credential to the browser.
5. **Vercel:** an account linked to GitHub with access to this repository. Import as Next.js, repository root as project root, Node.js 22.x, npm install/build defaults, and configure the two server variables separately for Preview and Production. Use a separate Supabase development project for previews where practical.
6. **Auth URLs:** set the Supabase site URL to the eventual production URL and allow only the required local/callback URLs if the chosen flow uses redirects. Local development uses `http://localhost:3000`. An email-code entry flow does not need arbitrary preview-domain redirect wildcards.
7. **GitHub Actions:** enable Actions for the repository. This first CI workflow needs no secrets or database connection. Configure branch protection for passing checks before merging to `main` if desired.

Decisions needed before the next increment: confirm email-code sign-in, supply/configure the Supabase project, and choose the email sender. Deployment follows review and authorization; no deployment or direct push to main is part of increment 1.

## Official implementation references

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
- [Tailwind with Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
- [Supabase server-side Auth](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase email delivery](https://supabase.com/docs/guides/auth/auth-smtp)
- [Vercel Next.js deployment](https://vercel.com/docs/frameworks/full-stack/nextjs)

## Tooling notes

Development and production builds use Next.js’s supported Webpack option. Turbopack’s CSS compiler attempted a local port bind that this execution environment denied, including on the elevated retry; Webpack avoids that compiler dependency. Vercel should use the repository’s `npm run build` script.

ESLint 9 is retained because the current Next.js React/import/accessibility plugins do not declare ESLint 10 compatibility. The full npm audit reports five high-severity development-tool advisory entries through Next.js’s lint plugin → fast-glob → micromatch → braces. The registry currently offers no patched compatible braces release; npm’s suggested downgrade to Next.js 14 lint tooling was not applied. The production-only audit reports zero vulnerabilities. Recheck this chain when upstream tooling is updated.
