# procrastination-station

Turn an overwhelming goal into a manageable first step. Built for the CS4800 final project.

## Development

Requires Node.js 22.12+ (22.x) and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. See [development and configuration](docs/DEVELOPMENT.md) for checks, architecture, and the proposed database setup.

Current increment: responsive planning preview, server-side email-code authentication, Supabase persistence endpoints, and a private goal dashboard. **Live database verification is pending Supabase setup.** See [setup instructions](docs/SUPABASE-SETUP.md). Public previews remain unsaved until a save succeeds; no mock persistence is used.

Original requirements and assignment notes are preserved in [docs](docs/).
