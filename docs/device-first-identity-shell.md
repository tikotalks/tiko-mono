# Device-First Identity Shell

Tiko apps should not show a login wall. Every app should open immediately, create or reuse a persistent device identity, and expose account management from the shared user/profile shell.

The full implementation plan is tracked in `.hermes/plans/2026-05-20_162624-device-first-identity-shell.md`. This document records the product/architecture decision in project docs so it remains visible outside Hermes planning files.

## Product model

- App entry is immediate.
- When entering an app without an existing account user, the app is always in Parent Mode.
- A child profile/user context is only created after the caregiver explicitly sets a password and configures an email address to create the account.
- A device user/session is created silently on first launch through `id.tiko.mt` so the shell can persist state without a login wall.
- Returning launches reuse the locally stored identity session token and validate it with the identity API.
- The user avatar/menu is the account entry point.
- Profile/account lets caregivers set display name, avatar, email, password/parent controls, and settings.
- Switching accounts is email magic-link based:
  1. user enters the email address for the account they want,
  2. Tiko sends a magic link,
  3. opening the link verifies the token and stores the returned session bundle locally.
- Passwords, login walls, and “skip login” are not part of the child-facing shell.
- Parent mode is the default state on app entry when there is no existing account user:
  - the shell should treat the initial device session as a caregiver/parent setup context,
  - child mode becomes available only after the caregiver sets a password and configures an email address to create the account,
  - after account setup, parent/child mode is controlled from the user context menu, not from app entry:
    - user menu contains “Turn on parent mode” when parent mode is inactive,
    - the shell clearly labels the active parent-mode state,
    - parent mode may reveal additional user-menu options and header actions,
    - the same user context menu contains “Turn off parent mode” while active.

## Identity API contract

Identity origin: `https://id.tiko.mt`

Required endpoints:

- `POST /api/identity/device`
  - Creates or finds the device identity for the app/device fingerprint.
  - Returns `{ ok: true, data: { user, device, session, sessionToken } }`.
- `GET /api/identity/session`
  - Requires `Authorization: Bearer <sessionToken>`.
  - Validates the current local session.
- `POST /api/identity/session`
  - Refreshes a bearer session, or creates a session for explicit `{ userId, deviceId }` if needed.
- `DELETE /api/identity/session`
  - Revokes the current bearer session.
- `POST /api/identity/email`
  - Requires bearer session.
  - Sends/queues a magic link for adding or switching account email.
- `GET /api/identity/verify-magic-link?token=...`
  - Consumes a magic-link token and returns a new session bundle.

## Shared frontend responsibilities

`@tiko/core`:

- `auth.service.ts` owns API calls, local `tiko_auth_session` storage, and compatibility mapping from identity `SessionBundle` to the existing `AuthSession`/`AuthUser` shape.
- `stores/auth.ts` owns app-wide session state and should always call `ensureSession()` during startup.

`@tiko/ui`:

- `TAuthWrapper` should bootstrap identity and render app content, not a login form.
- `TFramework` should remove skip-auth/login fallback UI.
- `TUserMenu` should expose Profile, Switch User, and parent-mode controls from the avatar/menu.
- `TUserMenu` should reveal extra parent-mode actions when parent mode is active and provide the matching “Turn off parent mode” action.
- `TFramework` should default fresh device sessions without an existing account user into parent/setup mode, show a clear parent-mode label/state, and can expose parent-only header buttons while active.
- `TProfile` should provide editable display name/avatar/email controls plus the password/email account-creation path required before entering child mode.

Apps:

- Apps should use the shared shell and avoid app-local login gates.
- Magic-link callback route should be standardized as `/auth/callback?token=...`.

## Implementation checklist

- [ ] Core auth service defaults to `https://id.tiko.mt`.
- [ ] Core auth service can create/validate device sessions.
- [ ] Auth store startup silently creates or reuses a session.
- [ ] `TAuthWrapper` no longer shows normal login/skip-login UI.
- [ ] User menu exposes Profile + Switch User.
- [ ] Shell defaults fresh/no-account app entry to Parent Mode.
- [ ] Profile supports password + email account creation before child mode can be entered.
- [ ] User menu exposes Turn on/off parent mode after account setup.
- [ ] Shell shows a clear parent-mode label/state and supports parent-only header actions.
- [ ] Profile supports display name, avatar, and email/magic-link account flow.
- [ ] Identity API persists profile fields if current metadata storage is insufficient.
- [ ] Magic-link email queue/provider is verified end-to-end.
- [ ] Yes-No, Type, Todo, Cards, Timer, Radio, Sequence all smoke-test with fresh storage and no login wall.

## Known open questions

- Whether profile display name/avatar should live on `users`, `devices`, or a new `user_profiles` table.
- Whether logout should exist at all in child-facing apps; if it remains, label it as “Reset this device”.
