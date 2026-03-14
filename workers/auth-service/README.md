# Tiko Auth Service Worker

Central authentication worker for all apps on `.tikoapps.org`.

## Intended Role

- own login and session lifecycle
- issue shared cookies for `.tikoapps.org`
- back auth state with D1
- support email OTP first
- support magic link later if needed

## Current State

Implemented:

- Better Auth mounted at `/api/auth/*`
- shared cookie sessions on `.tikoapps.org`
- Google OAuth provider support via `/oauth/google`
- `GET /health`
- `GET /session`
- `GET /user`
- `PATCH /user/metadata`
- `POST /email-otp/send`
- `POST /email-otp/verify`
- `POST /sign-out`
- CORS allowlist and credentials support for approved app origins

## Database Setup

Apply both SQL files to the D1 database:

- `schema/better-auth-core.sql`
- `schema/app-auth-support.sql`

The first file creates Better Auth's core tables. The second adds app-owned
profile, settings, audit, and legacy mapping tables.

Convenience scripts:

- `pnpm --dir workers/auth-service db:apply:all:local`
- `pnpm --dir workers/auth-service db:apply:all:remote`

The current D1 database UUID configured in Wrangler is `dd37ed38-751c-46c4-866d-73294974e33b`.

## Remaining Work

1. Add production secrets for `BETTER_AUTH_SECRET`, `AUTH_GOOGLE_CLIENT_ID`, `AUTH_GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL`.
2. In Google Cloud Console, add the OAuth redirect URI `https://auth.tikoapps.org/api/auth/callback/google`.
3. Start Google sign-in by redirecting users to `https://auth.tikoapps.org/oauth/google?callbackURL=<app-callback-url>`.
4. Point app envs at `VITE_AUTH_BASE_URL`.
5. Migrate user-linked domain data off Supabase so app services stop expecting Supabase bearer tokens.
6. Add `legacy_user_map` linking during the production data migration.
