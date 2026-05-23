# Tiko Architecture

## Architecture principle

Tiko is an edge-native suite of child-facing apps backed by Tiko-owned APIs. The browser app is not the backend. Supabase is not the backend. Cloudflare Workers own backend behavior.

## High-level model

```text
Children / caregivers
        |
        v
Cloudflare Pages apps (*.tikoapps.org, tiko.mt)
        |
        v
Typed Tiko clients (@tiko/identity, @tiko/data, @tiko/content, @tiko/media, @tiko/i18n)
        |
        v
Cloudflare Workers
  - identity-api       -> D1 users/devices/sessions/magic links
  - app-api            -> D1 app data/settings/cards/sequences/todo
  - content-api        -> D1 content + KV cache
  - media-api          -> D1 metadata + R2 bytes
  - generation-api     -> TTS/images/sentence helpers + Queues/R2/D1
  - admin-api          -> protected admin/report/removal operations
        |
        v
Cloudflare data plane: D1, R2, KV cache, Queues
```

## Domain boundaries

- `tiko.mt` — public product/marketing home.
- `id.tiko.mt` — canonical identity origin owned by `workers/identity-api`.
- `*.tikoapps.org` — child-facing app runtimes.
- `api.tikoapi.org/*` — app/content/media/generation/admin APIs where consolidation is practical.
- `*.tikocdn.org` — raw/generated/cacheable bytes.

See `docs/domain-strategy.md` and `docs/API_BOUNDARIES.md`.

## Target packages

- `packages/core` — bootstrap/config/event/http primitives only; no direct backend coupling.
- `packages/identity` — device-first identity client and Vue helpers.
- `packages/data` — typed app data DTOs/clients for cards, sequences, settings, todo, etc.
- `packages/content` — CMS/content contracts and rendering clients.
- `packages/i18n` — Tiko wrapper around Lezu/local fallbacks/namespaces.
- `packages/media` — media/assets/user-media types and clients.
- `packages/ui` — Tiko-specific component library.
- `packages/testing` — shared Vitest/Playwright/smoke helpers.

Current packages are transitional. New code should move toward these boundaries.

## Data ownership

- D1 owns relational data.
- R2 owns bytes.
- KV caches Worker responses or derived read models only.
- Queues handle async jobs.
- Apps never construct storage keys or query databases directly.

## Identity API responsibilities

`workers/identity-api` is the canonical Tiko identity service. Its public origin is `https://id.tiko.mt`, and app code should reach it through the `@tiko/identity` client seam as that package becomes the stable interface.

`workers/identity-api` owns:

- silent device/user/session creation;
- current bearer session lookup and refresh;
- profile display name/handle fields needed by app shells;
- optional email attach/verify for recovery or device transfer;
- magic-link recovery/transfer;
- session/device revocation;
- rate limiting, audit events, and anonymous-user cleanup policy.

It must not become enterprise account management, a password system, a login wall, or an OAuth-first account service.

`workers/auth-service` is retired as a target architecture component. While it remains in the repository, it is only a compatibility shim for already-written code and must not receive new first-class Tiko identity flows. New app work must not call Better Auth, OTP, OAuth, or password endpoints as the canonical Tiko flow.

`packages/core` auth assumptions are transitional. Core may adapt to the identity API for compatibility, but long-term identity types and calls belong in `packages/identity`; core should settle back to bootstrap/config/event/http primitives.

See `docs/API_BOUNDARIES.md` for the accepted boundary decision and token/SSO rules. In particular, Tiko forbids token-in-query SSO between apps; bearer/session tokens must not be embedded in normal app URLs.

## App API responsibilities

`workers/app-api` owns user/app data:

- cards/boards/items;
- sequences;
- todo/routines;
- app settings and visibility;
- parent-mode-controlled preferences;
- child-safe data access rules.

## Content/i18n responsibilities

- Lezu owns translation management.
- Tiko consumes generated/localized assets through `@tiko/i18n` and Worker fallbacks.
- Content/CMS APIs serve public/caregiver/admin content, not child session identity.

## Security posture

- No secrets in browser bundles.
- No direct browser-to-database path.
- Session tokens stored as hashes server-side.
- Magic links are single-use, short-lived, and rate-limited.
- Public recovery responses must not reveal whether an email/handle exists.
- Admin APIs are isolated and protected from child app flows.

## Deployment posture

- Development work integrates on `development` and dev preview domains.
- Production branches/domains are promoted only with explicit approval.
- Dev app convention: `dev.<app>.tikoapps.org`.
- Production app convention: `<app>.tikoapps.org`.
