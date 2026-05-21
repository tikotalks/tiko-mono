# Tiko Architecture

## Architecture principle

Tiko is an edge-native suite of child-facing apps backed by Tiko-owned APIs. The browser app is not the backend. legacy backend is not the backend. Cloudflare Workers own backend behavior.

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
- `id.tiko.mt` — canonical identity origin.
- `*.tikoapps.org` — child-facing app runtimes.
- `api.tikoapi.org/*` — app/content/media/generation/admin APIs where consolidation is practical.
- `*.tikocdn.org` — raw/generated/cacheable bytes.

See `docs/domain-strategy.md`.

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

`workers/identity-api` owns:

- silent device/user creation;
- current session lookup;
- profile display name/handle;
- email attach/verify;
- magic-link recovery/transfer;
- session/device revocation;
- rate limiting and audit events.

It must not become enterprise account management.

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
