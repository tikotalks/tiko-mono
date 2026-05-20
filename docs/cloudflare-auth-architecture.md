# Tiko Identity Architecture

## Status

Supersedes the older auth migration direction. Tiko is not adopting Better Auth as the default and is not preserving old Supabase users/data as a product constraint.

## Goal

Provide one central device-first identity system for all Tiko apps with:

- canonical origin `id.tiko.mt`;
- automatic device/user creation before any login UI;
- optional email recovery/transfer via magic link;
- app-scoped sessions for `*.tikoapps.org` apps;
- Worker-managed identity;
- D1-backed user/device/session data;
- no passwords;
- no login wall;
- no Supabase runtime.

## Host layout

- `id.tiko.mt` — identity API, device bootstrap, email attachment, magic-link recovery/transfer.
- `auth.tikoapps.org` / `identity.tikoapps.org` — temporary aliases or redirects only if needed, then retire.

Reason: identity in Tiko means continuity, not login-centric auth. `id.tiko.mt` is short, brand-rooted, and operationally independent from the app Pages deployments.

## Cookie/session strategy

Use secure HTTP-only session cookies for app sessions, backed by explicit identity handshakes with `id.tiko.mt`.

Recommended cookie attributes:

- `HttpOnly`
- `Secure`
- `SameSite=Lax`
- host-only or app-host scoped where possible
- `Path=/`

Because `id.tiko.mt` and `*.tikoapps.org` do not share a parent domain, cross-app continuity must not depend on one shared cookie. Use explicit session/handoff exchanges.

## App boot flow

1. App loads.
2. App calls the identity/session client.
3. If a session/device exists, return current user/device.
4. If none exists, create a device user/session silently.
5. App continues.

Never block a child behind login, password, email entry, or OAuth.

## Identity states

1. **Device user** — auto-created, no email, no password.
2. **Recoverable user** — same user after caregiver adds/verifies email.
3. **Claimed user on another device** — linked through magic-link confirmation.

## Required API shape

- `GET /health`
- `GET /session` — get or create current device user/session.
- `POST /session/refresh`
- `POST /profile` — update display name/handle.
- `POST /email/start` — start email attach/verification.
- `POST /magic-link/request` — request recovery/transfer link using handle/email with generic response.
- `GET /magic-link/consume?token=...` — consume token, link/create session, redirect/handoff.
- `POST /sign-out-device` — optional current-device session removal.

## Minimum D1 tables

- `users`
- `devices`
- `sessions`
- `magic_links`
- `user_profile_events`

Do not add `legacy_user_map`. Do not model this as a Supabase migration bridge.

## Security rules

- Store token hashes, not raw tokens.
- Rate-limit magic-link requests.
- Public recovery responses must not reveal whether an email/handle exists.
- Browser code must not read privileged cookies or secrets.
- Admin roles and caregiver controls are separate from child app boot.

## Phase 1 success

- A fresh visitor opens one app and receives a device user with no visible auth UI.
- A returning visitor keeps the same device user.
- A caregiver can attach email by magic link.
- A second device can claim/link the profile by magic link.
