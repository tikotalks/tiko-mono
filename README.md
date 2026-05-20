# Tiko

Tiko is a free, open-source suite of AAC (Augmentative and Alternative Communication) and learning apps for children.

It exists because communication is a right, not a paid tier. A child should be able to open an app and express a need, a feeling, a choice, or a sentence immediately — without waiting for grants, subscriptions, logins, specialist hardware, or adult account setup.

## Product family

- **Tiko** — main child/caregiver shell: app launcher, settings, parent mode, profile/device continuity.
- **Cards** — visual communication cards and boards.
- **Timer** — visual countdown timer.
- **Yes/No** — binary choice communicator.
- **Radio** — curated audio content.
- **Todo** — visual task management.
- **Type** — typing with text-to-speech.
- **Sequence** — step-by-step visual guides.

## Doctrine

Tiko is a clean Cloudflare-native rebuild, not a legacy migration.

- Free for individual users.
- Open source.
- No ads.
- No user-data monetization.
- No feature paywalls.
- No password login.
- No login wall.
- No Supabase runtime.
- No old-user/data migration constraint.
- Apps must work immediately, offline where practical.
- Identity is device-first and invisible by default, with optional email magic-link recovery/transfer.

Read the full doctrine in [`docs/DOCTRINE.md`](docs/DOCTRINE.md).

## Repository map

- `apps/` — child-facing Tiko apps.
- `packages/` — shared runtime, UI, animation, language, and future domain packages.
- `workers/` — Cloudflare Workers for identity, app APIs, content, media, generation, and admin operations.
- `tools/` — internal/admin tooling.
- `websites/` — public marketing and media surfaces.
- `docs/` — product doctrine, architecture, roadmap, domain strategy, and migration/audit notes.

See [`docs/PROJECT_MAP.md`](docs/PROJECT_MAP.md) for the maintained map.

## Current technical direction

Target platform:

- Vue 3 + TypeScript + Vite.
- Tiko-specific `@tiko/ui` component system.
- Cloudflare Pages for apps/websites.
- Cloudflare Workers for backend APIs.
- D1 for relational source-of-truth data.
- R2 for media/audio/assets.
- KV for cache only.
- Queues for slow generation/translation jobs where needed.
- Lezu for translation management.
- Capacitor for iOS distribution.

The current repo still contains older pnpm/Nx/Supabase-era code. The target is documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and the phased rebuild plan in [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Development branch discipline

Agent integration happens on `development` or branches off `development`. Production branches (`main`/`master`) are not promoted without explicit approval.

## Local development

This legacy checkout currently uses pnpm + Nx. Until the workspace migration is completed:

```bash
pnpm install
pnpm build:packages
pnpm typecheck
pnpm test:ci
pnpm build:ci
```

For deterministic project-level work, prefer direct Nx or package-filter commands over interactive scripts.
