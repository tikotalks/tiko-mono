# Supabase to Cloudflare Migration Inventory

## Goal

Replace the current Supabase-heavy stack with:

- Better Auth on Cloudflare Workers for authentication
- D1 for relational application data and auth/session metadata
- R2 for binary storage
- KV only where caching is the right fit

This document is the migration inventory for the current repo. It focuses on:

- what still depends on Supabase
- which data domains need to move
- which parts can move first
- which parts should not move until auth and identity mapping are solved

## Executive Summary

Supabase is not only the auth provider in this repo. It is currently used for:

- authentication and session sync
- user profiles and user settings
- app items and sequences
- media metadata and user media
- collections
- CMS/content tables
- i18n tables
- sentence-engine tables
- TTS metadata
- issue reports
- user-removal admin flows

Cloudflare storage is already partly in use:

- R2 is already used for media uploads, assets, and TTS audio
- KV is already used for content/media caches and some worker-side caches

That means storage migration risk is lower than database migration risk. The hardest parts are:

- central auth and shared session across apps
- replacing RLS-dependent assumptions
- preserving ownership links on existing data
- moving the CMS/content system without breaking the websites and admin tooling

## Current Cloudflare Footprint

Already present in the repo:

- `workers/media-upload` writes files to the `media` R2 bucket
- `workers/user-media-upload` uses the `user-media` bucket
- `workers/assets-upload` uses the `tiko-assets` bucket
- `workers/tts-generation` uses the `tiko-tts-audio` bucket
- `workers/content-api` uses KV for caching
- `workers/media-cache` uses KV
- `workers/i18n-translator` uses KV caching

Implication:

- do not design a new binary storage plan around D1
- keep or expand R2 usage
- treat D1 as metadata + relational data only

## Current Auth and Session Coupling

### Primary auth runtime

Current auth/session code lives mainly in:

- [packages/core/src/services/auth.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/services/auth.service.ts)
- [packages/core/src/stores/auth.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/stores/auth.ts)
- [packages/core/src/lib/supabase-lazy.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/lib/supabase-lazy.ts) — still used by non-auth Supabase data/media services

Key coupling points:

- session state is stored locally for Tiko identity, no longer mirrored into Supabase from the auth store or auth service
- the former `auth-sync.service` Supabase session bridge has been removed
- `auth.service.ts` no longer writes or clears the legacy `supabase.auth.token` localStorage key
- `translation-versioned.service.ts` reads only the Tiko identity session and no longer falls back to `supabase.auth.token`
- multiple non-auth services still expect a Supabase-style bearer token

### Existing SSO/Tiko app coupling

Current cross-app auth attempts live in:

- [packages/core/src/composables/useTikoSSO.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/composables/useTikoSSO.ts)
- [packages/core/src/composables/useSSO.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/composables/useSSO.ts)

Current behavior is token/query/localStorage based, not cookie-session based.

Migration implication:

- this flow should be replaced, not ported
- the central auth origin should expose session endpoints and set shared cookies for `.tikoapps.org`
- apps should use `credentials: 'include'` and ask the auth origin for session state on boot

## Data Domains

## 1. Identity, profiles, and settings

### Current tables

- `auth.users` via Supabase auth
- `user_profiles`
- `user_settings`

### Current code surfaces

- [packages/core/src/services/user-supabase.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/services/user-supabase.service.ts)
- [packages/core/src/services/user-settings-supabase.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/services/user-settings-supabase.service.ts)
- [packages/core/src/services/parent-mode-supabase.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/services/parent-mode-supabase.service.ts)
- [packages/core/src/stores/auth.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/stores/auth.ts)

### Notes

- `user_profiles` and `user_settings` are tied to `user_id`
- parent mode and app settings rely on stable per-user ownership
- admin role checks still depend on Supabase user metadata or profile tables

### Target

- Better Auth user/session tables in D1
- D1 `user_profiles`
- D1 `user_settings`
- D1 role model instead of JWT/RLS-based Supabase role checks

### Risk

High. This is the foundation for all user-owned data.

## 2. App items and sequences

### Current tables

- `items`
- related RPC: `verify_user_has_children_flags`

### Current code surfaces

- [packages/core/src/services/item.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/services/item.service.ts)
- [packages/core/src/services/item-supabase.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/services/item-supabase.service.ts)
- [apps/sequence/src/services/supabase-sequence.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/apps/sequence/src/services/supabase-sequence.service.ts)
- [apps/tiko/src/services/supabase-sequence.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/apps/tiko/src/services/supabase-sequence.service.ts)
- [apps/cards/src/services/supabase-cards.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/apps/cards/src/services/supabase-cards.service.ts)

### Notes

- this is a core app domain
- item ownership is driven by `user_id`
- public/curated visibility is mixed into the same model
- parent/child hierarchy uses `parent_id`
- the current implementation depends heavily on PostgREST filter syntax

### Target

- D1 `items`
- API layer on Worker instead of direct `rest/v1` calls
- explicit access checks in Worker code instead of Supabase RLS

### Risk

High. This affects the main product apps directly.

## 3. Media metadata and user media

### Current tables

- `media`
- `user_media`
- `assets`

### Current code surfaces

- [packages/core/src/services/media-supabase.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/services/media-supabase.service.ts)
- [packages/core/src/services/media.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/services/media.service.ts)
- [packages/core/src/services/assets.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/services/assets.service.ts)
- [packages/core/src/services/user-media.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/services/user-media.service.ts)
- [workers/media-upload/src/index.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/workers/media-upload/src/index.ts)
- [workers/user-media-upload/src/index.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/workers/user-media-upload/src/index.ts)
- [workers/assets-upload/src/index.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/workers/assets-upload/src/index.ts)
- [workers/media-cache/src/index.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/workers/media-cache/src/index.ts)
- [workers/image-generation/src/index.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/workers/image-generation/src/index.ts)

### Notes

- file bytes already live in R2 for several flows
- Supabase is still used as the metadata database
- media ownership and publication state depend on `user_id`, `generated_by`, and status fields

### Target

- keep R2 for file bytes
- move metadata tables to D1
- update media workers to read/write D1 instead of Supabase

### Risk

Medium-high. Binary storage is already on Cloudflare in several paths, which helps.

## 4. Collections

### Current tables

- `media_collections`
- `collection_items`
- `collection_likes`
- possibly `collections` in older code paths

### Current code surfaces

- [packages/core/src/services/collections-supabase.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/services/collections-supabase.service.ts)
- [packages/core/src/stores/collections.store.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/stores/collections.store.ts)
- media website views/components under [websites/media/src](/Users/silvandiepen/Repositories/_tiko/tiko-mono/websites/media/src)

### Notes

- collections are user-owned
- likes and public/curated visibility are mixed into the same experience
- the public media website depends on these tables

### Target

- D1 collections tables
- Worker-backed endpoints for list/detail/mutate flows

### Risk

Medium.

## 5. CMS / content system

### Current tables

- `content_projects`
- `content_section_templates`
- `content_fields`
- `content_page_templates`
- `content_pages`
- `content_page_sections`
- `content_field_values`
- `content_sections`
- `content_section_data`
- `content_articles`
- `content_item_templates`
- `content_items`
- `content_item_data`
- `content_navigation_menus`
- `content_navigation_items`
- `content_section_linked_items`
- derived/read models like `content_articles_details`

### Current code surfaces

- [packages/core/src/services/content.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/services/content.service.ts)
- [packages/core/src/services/unified-content.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/services/unified-content.service.ts)
- [workers/content-api/src/content-service-wrapper.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/workers/content-api/src/content-service-wrapper.ts)
- [tools/admin/src/views/content](/Users/silvandiepen/Repositories/_tiko/tiko-mono/tools/admin/src/views/content)
- SQL definitions in [tools/admin/src/database](/Users/silvandiepen/Repositories/_tiko/tiko-mono/tools/admin/src/database)

### Notes

- this is the biggest schema surface
- many relations and helper SQL functions exist
- marketing and media/content rendering depend on it
- admin tooling writes directly into this model

### Target

- D1 content schema
- Worker-first content API
- admin app moved off direct Supabase assumptions

### Risk

Very high. This should not be the first cutover domain.

## 6. i18n

### Current tables and views

- `i18n_languages`
- `i18n_keys`
- `i18n_translations`
- `i18n_locale_details`
- possibly `i18n_locales`
- versioning/notification variants appear in admin SQL drafts

### Current code surfaces

- [packages/core/src/services/translation-versioned.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/services/translation-versioned.service.ts)
- [packages/core/src/services/translation.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/services/translation.service.ts)
- [workers/i18n-data/src/database.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/workers/i18n-data/src/database.ts)
- [workers/i18n-translator/src/database.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/workers/i18n-translator/src/database.ts)
- admin SQL under [tools/admin/src/database](/Users/silvandiepen/Repositories/_tiko/tiko-mono/tools/admin/src/database)

### Notes

- read-heavy
- already partially cached in workers/KV
- translation authoring and approval logic exists in SQL drafts, but not all of it is necessarily live

### Target

- D1 i18n schema
- worker APIs remain the main read surface
- KV remains a cache only

### Risk

Medium.

## 7. Sentence engine

### Current tables

- `sentence_patterns`
- `sentence_initial_cards`
- `sentence_usage`

### Current code surfaces

- [workers/sentence-engine/src/database.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/workers/sentence-engine/src/database.ts)
- SQL seed/setup in [tools/admin/src/database/create-sentence-tables.sql](/Users/silvandiepen/Repositories/_tiko/tiko-mono/tools/admin/src/database/create-sentence-tables.sql)

### Notes

- almost entirely worker-owned
- read/write behavior is straightforward compared with CMS

### Target

- D1 sentence tables
- same worker API, new DB backend

### Risk

Low-medium.

## 8. TTS metadata

### Current tables

- `tts_audio`

### Current code surfaces

- [workers/tts-generation/src/index.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/workers/tts-generation/src/index.ts)
- SQL in [supabase/migrations/20241214_create_audio_table.sql](/Users/silvandiepen/Repositories/_tiko/tiko-mono/supabase/migrations/20241214_create_audio_table.sql)

### Notes

- audio bytes already go to R2
- table is just a metadata/dedup cache

### Target

- D1 `tts_audio`
- keep R2 `AUDIO_BUCKET`

### Risk

Low.

## 9. Issue reports

### Current tables

- `issue_reports`

### Current code surfaces

- [workers/report-issue/src/index.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/workers/report-issue/src/index.ts)
- SQL in [workers/report-issue/supabase-schema.sql](/Users/silvandiepen/Repositories/_tiko/tiko-mono/workers/report-issue/supabase-schema.sql)
- admin report views in [apps/sequence/src/views/admin/ReportsView.vue](/Users/silvandiepen/Repositories/_tiko/tiko-mono/apps/sequence/src/views/admin/ReportsView.vue) and [apps/tiko/src/views/admin/ReportsView.vue](/Users/silvandiepen/Repositories/_tiko/tiko-mono/apps/tiko/src/views/admin/ReportsView.vue)

### Notes

- self-contained
- good early migration target

### Target

- D1 `issue_reports`
- same report worker, new DB backend

### Risk

Low.

## 10. Admin/deployment/support tables

### Current tables or references

- `deployment_events`
- `app_settings`
- possibly older `translations`, `languages`, `locales` tables in admin SQL

### Current code surfaces

- [packages/core/src/services/deployment.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/packages/core/src/services/deployment.service.ts)
- older SQL in [tools/admin/src/database](/Users/silvandiepen/Repositories/_tiko/tiko-mono/tools/admin/src/database)

### Notes

- some of these may be historical or partially live
- they need confirmation from production before migration order is finalized

### Target

- verify whether they are active
- migrate active ones only

### Risk

Unknown until production inventory is confirmed.

## Repo Touchpoint Inventory

### Core package

Supabase or Supabase-shaped dependencies are concentrated in:

- `packages/core/src/lib/*supabase*`
- `packages/core/src/services/*supabase*`
- `packages/core/src/services/auth*.ts`
- `packages/core/src/services/content.service.ts`
- `packages/core/src/services/item.service.ts`
- `packages/core/src/services/media*.ts`
- `packages/core/src/services/translation*.ts`
- `packages/core/src/stores/auth*.ts`

### Apps

Direct app-level Supabase code exists in:

- [apps/sequence/src/services/supabase-sequence.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/apps/sequence/src/services/supabase-sequence.service.ts)
- [apps/tiko/src/services/supabase-sequence.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/apps/tiko/src/services/supabase-sequence.service.ts)
- [apps/cards/src/services/supabase-cards.service.ts](/Users/silvandiepen/Repositories/_tiko/tiko-mono/apps/cards/src/services/supabase-cards.service.ts)
- admin report views in sequence/tiko

### Websites

- media website depends on collections/media auth state
- marketing and media content flows depend on the content system via shared services or worker APIs

### Workers

Workers with direct Supabase dependency:

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

## Identity Mapping Requirement

Even if old auth accounts are discarded, the data model still depends on stable user IDs.

Current data surfaces tied to `user_id`, `owner_id`, or `created_by`:

- `items`
- `media`
- `user_media`
- `media_collections`
- `collection_likes`
- `assets`
- `user_profiles`
- `user_settings`
- translation versioning drafts
- sentence usage

### Recommendation

Add an explicit D1 mapping table during migration:

```sql
legacy_user_map (
  legacy_supabase_user_id TEXT PRIMARY KEY,
  better_auth_user_id TEXT NOT NULL,
  email TEXT,
  linked_at TEXT NOT NULL
)
```

Rules:

- do not rewrite all foreign keys blindly during initial import
- import data with legacy IDs intact where practical
- link legacy records to new Better Auth users on first successful login, usually by verified email
- only rewrite ownership keys when you have deterministic mappings

If a user never returns, their data can remain associated with the legacy ID until a cleanup phase.

## Recommended Target Architecture

### Auth

- central Better Auth worker on `auth.tikoapps.org` or `tiko.tikoapps.org/api/auth`
- shared cookie session scoped to `.tikoapps.org`
- all apps call auth endpoints with `credentials: 'include'`
- the Tiko app remains the canonical login UI if you want, but the auth system should not live inside the SPA

### Data

- D1 for relational tables
- Worker APIs for all writes and authenticated reads
- avoid direct browser-to-D1 patterns for app data

### Files

- R2 for media, assets, user-media, and audio
- D1 stores metadata and ownership only

### Cache

- KV only for caching and derived views
- not as the source of truth for relational data

## Migration Matrix

| Domain | Current backend | Target backend | First cut? | Notes |
| --- | --- | --- | --- | --- |
| Auth/session | Supabase auth + local session sync | Better Auth + D1 | Yes | Foundational |
| User profiles/settings | Supabase tables | D1 | Yes | Needed right after auth |
| Issue reports | Supabase table | D1 | Yes | Small, isolated |
| TTS metadata | Supabase table + R2 files | D1 + R2 | Yes | Low risk |
| Sentence engine | Supabase tables | D1 | Yes | Worker-owned |
| i18n read/write | Supabase tables | D1 + KV cache | Maybe | Moderate complexity |
| Media metadata | Supabase tables + R2 files | D1 + R2 | After auth | Ownership dependent |
| Collections | Supabase tables | D1 | After auth | Ownership dependent |
| Items/sequences/cards | Supabase tables | D1 | After auth | Core app path |
| Content CMS | Supabase tables/views/functions | D1 | Late | Highest complexity |
| User removal admin flow | Supabase admin API | Better Auth admin + D1/R2 cleanup | Late | Depends on final auth/data model |

## Proposed Cutover Order

### Phase 0. Safety and discovery

- take a full Postgres dump from Supabase
- export all Supabase Storage objects if any are still in use
- inventory live production tables and row counts
- identify which admin SQL drafts are actually in production

### Phase 1. Auth foundation

- create Better Auth worker
- implement email OTP first
- add shared subdomain cookie sessions
- add session introspection endpoint
- replace `@tiko/core` auth/session bootstrap

### Phase 2. Identity domain

- migrate `user_profiles`
- migrate `user_settings`
- add `legacy_user_map`
- replace role checks and parent-mode persistence

### Phase 3. Easy worker-owned tables

- `issue_reports`
- `tts_audio`
- `sentence_patterns`
- `sentence_initial_cards`
- `sentence_usage`

### Phase 4. Media and collections

- move media metadata tables to D1
- keep R2 buckets in place
- update media/collection workers and services

### Phase 5. App items

- migrate `items`
- replace app-specific Supabase services in cards/sequence/tiko
- move all item reads/writes behind worker APIs

### Phase 6. i18n

- migrate i18n source tables
- keep or rebuild cache population workers

### Phase 7. CMS/content

- migrate content schema
- cut over `content-api`
- cut over admin content tooling
- then cut over marketing/media content consumers

### Phase 8. Cleanup

- replace `user-removal` with Better Auth + D1 + R2 cleanup flow
- remove Supabase SDK and env vars
- decommission Supabase only after a stable soak period

## What Needs Backup Before Any Migration

You should get these before the first schema change:

- full Supabase Postgres dump
- Supabase Storage export for any buckets still used there
- table row counts and size inventory
- list of active extensions, views, and functions
- export of auth users if you want email-based relinking to be easier

Even if user accounts are not preserved, the dump is still required because:

- ownership fields reference old user IDs
- CMS/content and media data are operationally critical
- some SQL logic only exists in migrations/admin SQL and may differ from production

## Open Questions Requiring Production Confirmation

- which of the content/admin SQL files reflect the live production schema
- whether `media`, `user_media`, and `assets` are all active in production, or partly transitional
- whether any files still live in Supabase Storage instead of R2
- whether there are live dependencies on Supabase realtime
- whether all production apps already use the same top-level domain strategy you want for shared cookies

## Recommended Immediate Next Tasks

1. Export production schema and row counts.
2. Build the Better Auth worker with shared-cookie session behavior.
3. Replace `@tiko/core` auth bootstrap so apps ask the central auth origin for session state.
4. Design the D1 auth-adjacent tables: `user_profiles`, `user_settings`, `legacy_user_map`.
5. Pick one low-risk domain to migrate first: `issue_reports` or `tts_audio`.
