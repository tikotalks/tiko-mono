# Cloudflare Auth Architecture

## Goal

Provide one central authentication system for all Tiko apps on `.tikoapps.org` with:

- email OTP first
- magic link optional later
- shared session across apps
- worker-managed auth, not app-managed auth
- D1-backed user/session data

## Recommended Host Layout

Preferred:

- `auth.tikoapps.org` for auth APIs and cookie issuance

Acceptable:

- `tiko.tikoapps.org/api/auth/*` if you want the Tiko app host to remain the canonical login origin

Reason:

- auth should be operationally independent from the SPA
- app deploys should not be able to break login infrastructure
- cookie scoping still works with `.tikoapps.org`

## Cookie Strategy

Use secure HTTP-only cookies scoped to `.tikoapps.org`.

Recommended cookie set:

- `tiko_session`
- `tiko_refresh`

Recommended attributes:

- `HttpOnly`
- `Secure`
- `SameSite=Lax`
- `Domain=.tikoapps.org`
- `Path=/`

Notes:

- use `SameSite=Lax` for standard top-level app navigation between subdomains
- if any app is embedded cross-site, revisit this and consider `SameSite=None`
- frontend code should not read the session cookie directly

## App Boot Flow

Every app should do this on boot:

1. call `GET /session` on the central auth origin with `credentials: 'include'`
2. if authenticated, hydrate the local auth store from the returned session/user payload
3. if not authenticated, remain logged out or show the login CTA

Do not:

- pass tokens through query strings
- rely on `localStorage` as the source of truth
- make the Tiko app itself the only place where session state exists

## Login Flow

### Email OTP

1. App opens login UI or redirects to central login UI.
2. Client calls `POST /email-otp/send`.
3. User receives code by email.
4. Client calls `POST /email-otp/verify`.
5. Auth worker issues shared cookies for `.tikoapps.org`.
6. Worker returns user/session summary.
7. App redirects to the requested return URL if needed.

### Magic Link

Use later if you want it. Prefer OTP first.

If added:

1. Client calls `POST /magic-link/send`.
2. Email link lands on auth origin first.
3. Auth worker validates the token and sets cookies.
4. Worker redirects back to the app return URL.

## Central Auth API Contract

### `GET /health`

Returns service health and binding readiness.

### `GET /session`

Returns:

```json
{
  "authenticated": true,
  "user": {
    "id": "user_123",
    "email": "name@example.com",
    "name": "Name",
    "role": "user"
  },
  "session": {
    "id": "session_123",
    "expiresAt": "2026-03-10T12:00:00.000Z"
  }
}
```

If signed out:

```json
{
  "authenticated": false,
  "user": null,
  "session": null
}
```

### `POST /email-otp/send`

Request:

```json
{
  "email": "name@example.com",
  "name": "Optional Name",
  "appId": "sequence",
  "returnUrl": "https://sequence.tikoapps.org/"
}
```

Response:

```json
{
  "success": true,
  "delivery": "email-otp"
}
```

### `POST /email-otp/verify`

Request:

```json
{
  "email": "name@example.com",
  "code": "123456",
  "appId": "sequence",
  "returnUrl": "https://sequence.tikoapps.org/"
}
```

Response:

```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "name@example.com",
    "name": "Name",
    "role": "user"
  },
  "session": {
    "id": "session_123",
    "expiresAt": "2026-03-10T12:00:00.000Z"
  },
  "redirectTo": "https://sequence.tikoapps.org/"
}
```

### `POST /sign-out`

Clears shared cookies for `.tikoapps.org`.

### `GET /user/role`

Optional helper for role hydration if you want to keep auth/session and user profile reads separate.

## D1 Tables Needed Around Auth

Minimum:

- `users`
- `sessions`
- `accounts`
- `verifications`
- `user_profiles`
- `user_settings`
- `legacy_user_map`

Recommended extra tables:

- `auth_audit_log`
- `login_attempts`
- `app_sessions` if you want per-app visibility

## Identity Mapping Strategy

Do not assume new Better Auth user IDs can replace old Supabase IDs on day one.

Use:

```sql
legacy_user_map (
  legacy_supabase_user_id TEXT PRIMARY KEY,
  better_auth_user_id TEXT NOT NULL,
  email TEXT,
  linked_at TEXT NOT NULL
)
```

Flow:

1. import legacy data with legacy IDs preserved where needed
2. user logs in with verified email on the new auth system
3. auth worker links the Better Auth user to the old Supabase user ID
4. data APIs resolve ownership via `legacy_user_map` until all references are migrated

## Better Auth Integration Notes

Target Better Auth responsibilities:

- email OTP flow
- optional magic link flow
- session issuance and rotation
- secure cookie management
- D1-backed auth persistence

Repo-level rule:

- Better Auth should be the session authority
- app code should never recreate auth state manually for cross-app SSO

## Migration Order

1. Stand up auth worker and health/session endpoints.
2. Add shared cookie support and CORS allowlist.
3. Replace `@tiko/core` auth bootstrap to call central `/session`.
4. Add OTP send/verify flow.
5. Add `legacy_user_map`.
6. Start migrating data APIs off Supabase.

## Non-Goals for Phase 1

- replacing every Supabase-backed data service
- migrating CMS/content immediately
- preserving old auth provider as the system of record

Phase 1 succeeds when:

- one user can sign in once
- `tiko.tikoapps.org` and another app both detect the same session
- sign-out from one app signs out all apps
