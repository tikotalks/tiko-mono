# Tiko Auth Service Worker

Central authentication worker for Tiko apps.

## Intended Role

- own device/session lifecycle
- back auth-adjacent app state with D1
- support email recovery/verification flows where needed
- expose session/user endpoints for apps

## Current State

Implemented:

- Better Auth mounted at `/api/auth/*` from earlier auth-service work
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

The first file creates Better Auth's core tables. The second adds app-owned profile, settings, and audit tables.

Convenience scripts:

- `pnpm --dir workers/auth-service db:apply:all:local`
- `pnpm --dir workers/auth-service db:apply:all:remote`

The current D1 database UUID configured in Wrangler is `dd37ed38-751c-46c4-866d-73294974e33b`.

## Remaining Work

1. Align this worker with the custom Tiko device-first identity target before production promotion.
2. Add production secrets for current provider integrations if they remain in scope.
3. Point app envs at `VITE_AUTH_BASE_URL` only after the app identity client contract is finalized.
