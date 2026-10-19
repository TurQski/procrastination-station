# procrastination-station

Turn an overwhelming goal into a manageable first step. Built for the CS4800 final project.

## Development

Requires Node.js 22.12+ (22.x) and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. See [development and configuration](docs/DEVELOPMENT.md) for checks, architecture, and database and restricted-account setup.

Current increment: responsive planning preview, server-side email/password authentication, Supabase persistence endpoints, and a private goal dashboard. **Seven live database integration tests passed; see docs/INCREMENT-2.md for current browser verification.** See [setup instructions](docs/SUPABASE-SETUP.md). Public previews remain unsaved until a save succeeds; no mock persistence is used.

Original requirements and assignment notes are preserved in [docs](docs/).

The MVP signs in existing confirmed accounts with passwords; public signup is closed. SMTP and email templates are not needed. No password-reset UI is provided yet. See docs/SUPABASE-SETUP.md for setup and opt-in live browser testing.
