# legacy backend Removal Inventory

## Status

This is a removal/replacement inventory, not a legacy migration map.

Tiko is a clean Cloudflare-native rebuild. Existing legacy backend users/data are not product constraints. Old schemas may inform what domains exist, but they must not force compatibility layers, old-user bridges, shared-cookie fantasies, or Better Auth assumptions.

## Target replacement model

- Custom Tiko device-first identity on Cloudflare Workers + D1.
- D1 for relational app/content/media metadata.
- R2 for media/audio/assets bytes.
- KV as cache only.
- Queues for slow/background generation work.
- Lezu for translation management.
- Typed Tiko clients between apps and Workers.

## Current legacy backend-heavy domains to remove/replace

- Auth/session/profile/settings.
- App items/cards/sequences.
- Media and user-media metadata.
- Collections and likes.
- CMS/content tables.
- i18n tables and translation authoring paths.
- Sentence engine tables.
- TTS metadata.
- Issue reports.
- User removal/admin flows.

## Current Cloudflare footprint to keep/expand

- R2 usage in media/assets/TTS flows.
- KV caches in content/media/i18n paths.
- Worker boundaries where they already exist.
- D1 work already started in current `development` worker/core commits.

These are useful scaffolding, but each worker must be audited for direct legacy backend calls and D1/R2 ownership.

## Replacement categories

Every legacy backend occurrence should be classified as one of:

- delete outright;
- replace with `identity-api`;
- replace with `app-api`;
- replace with `content-api`;
- replace with `media-api`;
- replace with `generation-api`;
- replace with `admin-api`;
- replace with Lezu;
- inspect manually.

## High-risk areas

- `packages/core` is/was the largest legacy backend gravity well: auth, services, stores, media, i18n, content, app data.
- Content/CMS has the largest schema surface and should not be the first cutover domain.
- App data and identity must be designed before broad deletion of core data assumptions.
- Admin tooling may contain historical SQL and partially live flows; audit before porting.

## Early candidates

Good early slices:

- identity API + `@tiko/identity` in isolation;
- issue reports to D1;
- TTS metadata to D1 while keeping R2 audio;
- sentence engine to D1;
- smoke harness to expose app breakage before broad deletes.

## Explicit anti-goals

- No `legacy_user_map`.
- No Better Auth default.
- No legacy backend RLS compatibility layer.
- No old-data preservation work unless Sil explicitly reverses this doctrine.
- No password login.
- No login wall.
- No central login UI as the first app experience.
- No assumption that `id.tiko.mt` can share a parent cookie with `*.tikoapps.org`.

## Current code-surface audit targets

### Core package

Audit and remove/replace legacy backend-shaped code under:

- `packages/core/src/lib/*legacy-backend*`
- `packages/core/src/services/*legacy-backend*`
- `packages/core/src/services/auth*.ts`
- `packages/core/src/services/content.service.ts`
- `packages/core/src/services/item*.ts`
- `packages/core/src/services/media*.ts`
- `packages/core/src/services/translation*.ts`
- `packages/core/src/stores/auth*.ts`

### Apps

Direct app-level legacy backend services have existed in:

- `apps/cards/src/services/legacy-backend-cards.service.ts`
- `apps/sequence/src/services/legacy-backend-sequence.service.ts`
- `apps/tiko/src/services/legacy-backend-sequence.service.ts`

If still present, they are replacement targets, not migration anchors.

### Workers

Workers to audit for legacy backend/D1/R2 correctness:

- `assets-upload`
- `content-api`
- `i18n-data`
- `i18n-translator`
- `image-generation`
- `media-cache`
- `report-issue`
- `sentence-engine`
- `tts-generation`
- `user-media-upload`
- `user-removal`

## Target architecture summary

### Identity

- `id.tiko.mt`.
- Custom Worker/D1 identity.
- Device-first session creation.
- Optional email magic-link recovery/transfer.
- Explicit app-scoped identity handshakes for `*.tikoapps.org`.

### Data

- D1 for relational tables.
- Worker APIs for all writes and authenticated reads.
- No direct browser-to-D1 pattern.
- No legacy backend/PostgREST-shaped client API.

### Files

- R2 for media, assets, user-media, and audio.
- D1 stores metadata and ownership only.

### Cache

- KV only for caching and derived views.
- KV is not source of truth.

## Migration matrix

- Auth/session: legacy backend auth/local session sync → custom Tiko identity + D1.
- User profiles/settings: legacy backend tables → D1 behind identity/app APIs.
- App items/cards/sequences: legacy backend tables/RPC → `app-api` + D1.
- Media metadata: legacy backend tables → `media-api` + D1, bytes in R2.
- Collections: legacy backend tables → D1 + Worker API.
- i18n: legacy backend tables/custom workers → Lezu + Tiko runtime fallbacks.
- Sentence engine: legacy backend-shaped persistence → D1.
- TTS metadata: legacy backend table → D1, audio bytes in R2.
- Issue reports: legacy backend table → D1.
- Content CMS: legacy backend tables/views/functions → D1 + content Worker after dedicated spec.
- User removal/admin: legacy backend admin API → new identity/data cleanup semantics after the new model exists.

## Sequencing

1. Freeze doctrine and project map.
2. Run exact legacy backend usage audit.
3. Specify and prove identity API.
4. Add app boot contract and smoke harness.
5. Move simple worker domains to D1.
6. Move app data domains behind Worker APIs.
7. Move media/content/i18n with dedicated specs.
8. Delete remaining legacy backend dependencies/env vars only when audits prove replacement.

## Next audit artifact

Create `scripts/audit-legacy-backend-usage.mjs` and `docs/audits/legacy-backend-removal-inventory.md` with exact file-level findings, categorized by replacement target.
