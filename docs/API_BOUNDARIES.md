# Tiko API Boundaries

Status: Accepted for the clean Cloudflare rebuild.

This document is the boundary contract between Tiko browser apps, shared packages, and Cloudflare Workers. It exists to end the split between `workers/identity-api`, the older `workers/auth-service`, and legacy `@tiko/core` auth assumptions.

## ADR: identity origin and service ownership

Decision: `https://id.tiko.mt` and `workers/identity-api` are the canonical identity origin and implementation for Tiko.

`workers/identity-api` owns device-first identity:

- silent device/user/session bootstrap;
- bearer session validation and refresh;
- session/device revocation;
- optional profile fields needed by shared app shells;
- optional email attachment for recovery or transfer;
- magic-link recovery/transfer token creation and verification;
- identity rate limiting, audit events, and anonymous-user cleanup policy.

Tiko apps must treat this as the only first-class identity API. App code should call it through `@tiko/identity` as that package becomes the public client seam. Transitional compatibility inside `@tiko/core` is allowed only when it forwards to the same `id.tiko.mt` identity contract and preserves the same device-first semantics.

## Retired boundary: auth-service

`workers/auth-service` is legacy/compatibility only. It must not be the conceptual owner of Tiko identity.

Allowed while it still exists:

- temporary compatibility for already-written app code that has not moved to `@tiko/identity` yet;
- internal redirects or adapter responses that preserve the device-first identity flow;
- documented deprecation work needed to delete it safely.

Not allowed:

- new first-class Tiko app calls to Better Auth endpoints;
- new first-class email OTP endpoints;
- new first-class OAuth flows;
- new password login, signup, or account-wall routes;
- treating Better Auth cookies as the canonical Tiko session;
- adding a legacy user bridge or old-user migration layer.

If compatibility requires `workers/auth-service` to remain deployed temporarily, its documentation and route names must clearly label it as deprecated and subordinate to `workers/identity-api`.

## Browser app identity contract

Every child-facing app starts usable. On boot, the app identity layer must:

1. restore an existing local identity bundle if one is present and valid;
2. otherwise call `POST https://id.tiko.mt/api/identity/device` silently;
3. store the returned device/user/session bundle locally for that app/device;
4. make user-scoped app calls only after a device-first session exists.

Apps must not show a login wall, registration wall, OAuth chooser, password prompt, or email-first OTP prompt before the first useful child interaction.

## Canonical identity endpoints

The canonical first-class surface is under `https://id.tiko.mt/api/identity/*`:

- `POST /api/identity/device` creates or re-identifies a device and returns a user/device/session bundle.
- `GET /api/identity/session` validates a bearer session.
- `POST /api/identity/session` refreshes a bearer session or, for controlled internal cases, creates a session for a known user/device pair.
- `DELETE /api/identity/session` revokes a bearer session.
- `POST /api/identity/email` attaches or requests recovery/transfer email for the current bearer session.
- `GET /api/identity/verify-magic-link?token=...` consumes a magic-link token and returns a new session bundle.

Email recovery/transfer is an authenticated continuation of a device session. It is not an unauthenticated OTP login surface.

## Token and SSO rules

Tiko must not implement token-in-query SSO between apps.

Forbidden patterns:

- `/some-app?access_token=...` or `/some-app?session=...`;
- one-time SSO tokens copied between apps in query strings;
- URLs that embed bearer tokens, refresh tokens, raw session tokens, or magic-link tokens except the single-use magic-link verification URL sent to the user;
- assuming `id.tiko.mt` can set a shared parent cookie for `*.tikoapps.org`.

Allowed patterns:

- bearer tokens in `Authorization` headers for identity API calls;
- app-scoped storage/cookies for each app runtime;
- explicit server-mediated handshakes when cross-app continuity is needed;
- single-use, short-lived magic-link verification URLs only for recovery/transfer.

## Package boundaries

`packages/identity` owns identity client types and helpers. It is the target public API for browser identity interactions.

`packages/core` must become backend-agnostic runtime infrastructure: app bootstrap, config, event bus, and generic HTTP primitives. Existing auth service code in `packages/core/src/services/auth.service.ts` is transitional. It must not grow new Better Auth, OTP, OAuth, password, or login-wall behavior.

`packages/data`, `packages/content`, `packages/media`, and app packages may depend on an already-established identity session, but must not own identity creation, recovery, or verification.

## Other API ownership boundaries

- App data/settings belong to the future app-data API boundary, not the identity API.
- Content/CMS belongs to `content-api` and Lezu-backed i18n flows, not identity.
- Media bytes and upload authorization belong to media APIs/R2, not identity.
- Admin/report/removal operations belong to protected admin APIs, not child-facing identity endpoints.

## Validation checklist

A change respects this boundary when:

- docs and code name `id.tiko.mt` / `workers/identity-api` as the canonical identity origin;
- no app treats `workers/auth-service`, Better Auth, OTP, OAuth, or password routes as the first-class Tiko identity flow;
- no browser app requires login before first use;
- no token-in-query SSO is introduced;
- recovery/transfer uses authenticated device-session magic links;
- legacy compatibility is clearly marked as transitional and deletable.
