# Tiko Clean Cloudflare Rebuild Plan

> **For Hermes:** Use `subagent-driven-development` to execute this plan phase-by-phase. This is a clean rebuild/cutover plan, not a compatibility project. Do not let builder agents add fallback adapters, old-user bridges, or “temporary” Supabase paths unless explicitly re-approved by Sil.

**Goal:** Turn Tiko into a clean Cloudflare-native platform with no Supabase runtime, no old-data burden, no password login screens, a Tiko-owned device/user identity system, Lezu-powered translations, a modern Tiko-specific UI library, tested working apps, and Capacitor-ready builds.

**Architecture:** Start fresh. Cloudflare Workers own all backend behavior. D1 is the source of truth for users, app data, content, media metadata, settings, and translation-related local references. R2 stores binary media/audio/assets. KV is cache only. Queues handle slow generation/translation jobs. Apps never talk directly to databases. Apps boot immediately by asking the Tiko identity platform for the current device user; if none exists, the platform creates one automatically.

**Tech Stack Target:** npm workspaces, Vue 3, Vite, TypeScript, Vitest, Playwright, Capacitor, Cloudflare Workers, D1, R2, KV, Queues, Pages, Lezu i18n, custom Tiko identity.

---

## Founder Correction: Clean Means Clean

The previous version of this plan was too conservative. It assumed old users and old data mattered. They do not.

The new doctrine:

- **No Supabase.** Not auth, not data, not storage metadata, not translation tables, not admin-only paths.
- **No old-user migration.** Existing users/data are not a constraint.
- **No compatibility layer for old data.** If something is rebuilt, it is rebuilt cleanly.
- **No Better Auth by default.** Tiko needs a custom identity model suited to child-facing apps and invisible onboarding.
- **No password login.** Ever.
- **No login wall.** Apps should open and work immediately.
- **No visible auth complexity for children.** Identity exists, but it should feel like continuity, not account management.
- **One Tiko identity platform.** All apps ask the same service who the current device user is.
- **Cloudflare-only runtime.** External services may exist only behind Workers when needed, not as app/runtime infrastructure.

This plan is therefore not “migrate users from Supabase.” It is:

> Build the clean Tiko platform, move apps onto it, then delete the old world.

---

## Product Doctrine for Identity

Tiko’s identity system should feel unlike normal software accounts.

A child/caregiver should not be greeted by:

- login forms
- password fields
- account creation flows
- OAuth provider buttons
- scary session expiry

Instead:

1. Open app.
2. Tiko quietly creates or retrieves the current device user.
3. The app works.
4. If the caregiver wants continuity across devices, they add an email and use a magic link.
5. If they know a username/profile name, they can request access to it, but proof happens through email link, not password.

The identity product should feel more like:

- “This device has a Tiko profile.”
- “Add email so you can recover or move it.”
- “Open this magic link on another device to continue there.”

Not:

- “Create an account.”
- “Choose a password.”
- “Authenticate before using the app.”

---

# Phase 0 — Freeze, Doctrine, and Project Map

**Objective:** Stop accidental complexity before code starts moving.

## Decisions

- New runtime code must not add Supabase usage.
- Old users do not need to be preserved.
- Old database schemas are references only, not constraints.
- New data schemas should be designed from the product model, not copied from Supabase.
- Apps should keep working even without a named user/email.
- Identity is device-first, then optionally recoverable.
- `@tiko/ui` remains Tiko-specific; `@sil/ui` is a standard/reference, not a dependency.
- Work happens from `development` or branches off `development`; production stays protected.

## Task 0.1: Write clean rebuild doctrine

**Files:**

- Create: `docs/DOCTRINE.md`
- Create: `docs/CLEAN_REBUILD_DOCTRINE.md`

**Must say:**

- no old-user constraints
- no Supabase runtime
- no passwords
- no login wall
- custom Tiko identity
- Cloudflare-first runtime
- D1 for relational data
- R2 for bytes
- KV for cache only
- apps use typed clients only
- UI remains Tiko-specific

## Task 0.2: Replace root README

**Files:**

- Modify: `README.md`

**Goal:** Replace the current useless `Hi` with a real project overview.

**Sections:**

- What Tiko is
- Apps
- Packages
- Workers
- Websites/tools
- Local development
- Cloudflare platform direction
- Current rebuild status

## Task 0.3: Create project map

**Files:**

- Create: `docs/PROJECT_MAP.md`

**Must include:**

- apps and purpose
- packages and purpose
- workers and purpose
- tools/websites
- current known health
- target owner package/API

---

# Phase 1 — Inventory Without Preserving Old Baggage

**Objective:** Know what exists so we can replace it cleanly, not preserve it.

## Task 1.1: Supabase removal inventory

**Files:**

- Create: `scripts/audit-supabase-usage.mjs`
- Create: `docs/audits/supabase-removal-inventory.md`

**Scan for:**

- `supabase`
- `SUPABASE_`
- `auth.uid`
- `rest/v1`
- `rpc(`
- `createClient`
- PostgREST query syntax
- RLS assumptions

**Output categories:**

- delete outright
- replace with new Tiko Worker API
- replace with D1 schema
- replace with R2 metadata path
- replace with Lezu
- unknown / inspect manually

**Important:** This is not a migration map. It is a deletion/replacement map.

## Task 1.2: App health inventory

**Files:**

- Create: `docs/app-health/MATRIX.md`
- Create: `scripts/audit-app-health.mjs`

**For each app/tool/site:**

- installs
- typechecks
- builds
- unit tests
- opens in browser
- console errors
- core interaction works
- data storage behavior
- i18n behavior
- mobile viewport behavior
- Capacitor status

## Task 1.3: External runtime inventory

**Files:**

- Create: `docs/audits/external-runtime-inventory.md`

**List and decide:**

- Supabase: remove
- Netlify references: remove/replace with Cloudflare Pages
- OpenAI/direct AI provider calls: allowed only behind Workers
- Azure/other TTS providers: allowed only behind Workers if needed
- any browser-side direct external service: remove unless explicitly justified

---

# Phase 2 — Target Architecture

**Objective:** Define the clean platform before replacing implementation.

## Target packages

- `packages/core`
  - app bootstrap helpers
  - config helpers
  - event bus
  - HTTP client primitives
  - no direct data backend
  - no Supabase

- `packages/identity`
  - device identity client
  - user/profile types
  - magic-link request/claim client
  - session/device state helpers

- `packages/data`
  - typed app data client
  - cards/items/sequences/settings/todo domain DTOs

- `packages/content`
  - CMS/content types
  - content client
  - render contracts
  - schema helpers

- `packages/i18n`
  - Tiko wrapper around Lezu
  - local fallback loader
  - app namespace conventions

- `packages/media`
  - media/asset/user-media types and clients

- `packages/ui`
  - Tiko-specific component library
  - modernized to Sil standards, not replaced by `@sil/ui`

- `packages/testing`
  - shared Playwright/Vitest helpers
  - app smoke helpers
  - identity test fixtures

## Target workers

- `workers/identity-api`
  - device user creation
  - profile naming
  - email attachment
  - magic links
  - device transfer/claim flows
  - shared session/device cookies

- `workers/app-api`
  - app data: cards, sequence, todo, timer settings, yes/no settings, type settings, radio settings

- `workers/content-api`
  - D1-backed content/CMS
  - cache through KV

- `workers/media-api`
  - media/assets/user media metadata
  - upload authorization
  - R2 object ownership

- `workers/generation-api`
  - TTS/image/sentence generation if consolidation is useful
  - Queues for long-running tasks

- `workers/admin-api`
  - admin-only operations
  - issue reports
  - dangerous actions

## Task 2.1: Write architecture docs

**Files:**

- Create: `docs/ARCHITECTURE.md`
- Create: `docs/API_BOUNDARIES.md`
- Create: `docs/adr/0001-cloudflare-only-runtime.md`
- Create: `docs/adr/0002-custom-device-first-identity.md`
- Create: `docs/adr/0003-lezu-for-i18n.md`
- Create: `docs/adr/0004-tiko-ui-is-product-specific.md`
- Create: `docs/adr/0005-npm-workspaces-target.md`

---

# Phase 3 — Custom Tiko Identity Platform

**Objective:** Build the central identity system that lets every app work instantly without login screens.

## Identity model

A user can exist in three states:

1. **Device user**
   - created automatically
   - no email required
   - no password
   - tied to browser/device install
   - enough to use apps immediately

2. **Recoverable user**
   - device user with email attached
   - can receive magic links
   - can move/claim profile on another device

3. **Claimed user on new device**
   - same user identity attached to another device/session after magic-link confirmation

## UX model

Default app boot:

1. App loads.
2. App calls identity API/session endpoint with credentials.
3. If device cookie/session exists, return user.
4. If not, create a user and device record automatically.
5. App proceeds.

No screen. No modal. No interruption.

Recovery/transfer flow:

1. Caregiver opens profile/settings.
2. Adds email if not already added.
3. On another device, enters username/profile name or email.
4. Tiko sends magic link to verified/attached email.
5. Opening link claims or links the device.
6. New device now sees same user/profile data.

## Suggested D1 schema

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  handle TEXT UNIQUE,
  email TEXT,
  email_verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_label TEXT,
  device_public_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE magic_links (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL CHECK (purpose IN ('verify_email', 'claim_user', 'link_device')),
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profile_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Session/cookie model

- HttpOnly secure cookie for session token.
- SameSite=Lax by default.
- Domain: `.tikoapps.org` in production.
- Dev supports localhost app ports.
- Session rotates periodically.
- Device id is server-side associated with session.

## Task 3.1: Create `workers/identity-api`

**Files:**

- Create: `workers/identity-api/package.json`
- Create: `workers/identity-api/wrangler.toml`
- Create: `workers/identity-api/src/index.ts`
- Create: `workers/identity-api/src/db.ts`
- Create: `workers/identity-api/src/routes/session.ts`
- Create: `workers/identity-api/src/routes/profile.ts`
- Create: `workers/identity-api/src/routes/magic-link.ts`
- Create: `workers/identity-api/migrations/0001_identity.sql`

## Task 3.2: Required identity endpoints

**Public/session endpoints:**

- `GET /health`
- `GET /session`
  - returns current user/device
  - creates one if none exists
- `POST /session/refresh`
- `POST /profile`
  - update display name/handle
- `POST /email/start`
  - attach/verify email by magic link
- `POST /magic-link/request`
  - request claim/link email for known handle/email
- `GET /magic-link/consume?token=...`
  - consumes token, creates session/device link, redirects to app
- `POST /sign-out-device`
  - optional; removes current device session only

## Task 3.3: Create `@tiko/identity`

**Files:**

- Create: `packages/identity/package.json`
- Create: `packages/identity/src/index.ts`
- Create: `packages/identity/src/client.ts`
- Create: `packages/identity/src/types.ts`
- Create: `packages/identity/src/vue.ts`

**Client API:**

```ts
const identity = createTikoIdentityClient({ baseUrl })
const session = await identity.getOrCreateSession()
await identity.updateProfile({ displayName, handle })
await identity.startEmailVerification(email)
await identity.requestMagicLink({ handleOrEmail })
```

## Task 3.4: Replace app boot auth behavior

**Files:**

- Modify: `apps/*/src/main.ts`
- Modify: `apps/*/src/App.vue`
- Modify: `packages/core/src/stores/auth.ts`
- Modify/delete old auth/sso services

**Target:**

- app always boots
- identity initializes silently
- profile/settings can show current user
- no login screen blocks app usage

## Task 3.5: Identity tests

**Files:**

- Create: `workers/identity-api/src/**/*.test.ts`
- Create: `tests/e2e/identity/device-session.spec.ts`
- Create: `tests/e2e/identity/magic-link.spec.ts`

**Test cases:**

- new visitor gets user automatically
- returning visitor keeps same user
- display name can be changed
- handle can be changed if available
- email verification link attaches email
- magic link opens same user on second browser context
- expired/used magic link fails safely

---

# Phase 4 — npm Workspaces Without Nx/pnpm

**Objective:** Align the repo with the rest of Sil’s projects by using npm workspaces and plain scripts.

## Founder warning

Tooling migration must be isolated. Do not combine this with identity/data rewrites.

## Target

- root `package-lock.json`
- root npm workspaces includes apps, packages, tools, workers, websites
- remove `pnpm-lock.yaml`
- remove `pnpm-workspace.yaml`
- remove Nx after equivalent scripts pass
- deterministic package/app scripts

## Task 4.1: Add complete npm workspace map

**Files:**

- Modify: `package.json`

**Workspaces:**

```json
{
  "workspaces": [
    "packages/*",
    "apps/*",
    "tools/*",
    "workers/*",
    "websites/*"
  ]
}
```

## Task 4.2: Generate npm lock

**Command:**

```bash
npm install --package-lock-only
```

## Task 4.3: Replace root scripts

**Files:**

- Modify: `package.json`
- Create: `scripts/workspaces.mjs` if ordering needs custom control

**Required scripts:**

- `build`
- `build:packages`
- `build:apps`
- `build:tools`
- `build:websites`
- `build:workers`
- `typecheck`
- `lint`
- `test`
- `test:e2e`
- `audit:supabase`
- `capacitor:check`

## Task 4.4: Remove Nx after parity

**Files to eventually remove:**

- `nx.json`
- `project.json` files
- `@nx/*` dependencies

**Only remove after:**

```bash
npm run build
npm run typecheck
npm run test
```

pass or failures are documented in `docs/app-health/MATRIX.md`.

---

# Phase 5 — Lezu Translation Integration

**Objective:** Stop maintaining a Tiko translation platform. Use Lezu.

## Target

- `packages/i18n` wraps `lezu-i18n`.
- Each app namespace is clear.
- English/source fallbacks live in code.
- Lezu stores/releases translations.
- Runtime loads remote Lezu bundles.
- Old Tiko translation admin/workers are deleted after replacement.

## Recommendation

Use **one Lezu project for Tiko** with namespaced keys:

- `core.*`
- `ui.*`
- `cards.*`
- `timer.*`
- `todo.*`
- `type.*`
- `sequence.*`
- `yesNo.*`
- `radio.*`
- `admin.*`
- `marketing.*`
- `media.*`

## Task 5.1: Create `@tiko/i18n`

**Files:**

- Create: `packages/i18n/package.json`
- Create: `packages/i18n/src/index.ts`
- Create: `packages/i18n/src/createTikoI18n.ts`
- Create: `packages/i18n/src/locales.ts`
- Create: `packages/i18n/src/namespaces.ts`

## Task 5.2: Export current source keys

**Files:**

- Create: `scripts/i18n/export-source-keys.mjs`
- Create: `docs/i18n/SOURCE_KEY_INVENTORY.md`

**Output:**

- `tmp/i18n/tiko.en.json`
- namespace collision report
- unused key report where detectable

## Task 5.3: Sync source keys to Lezu

**Files:**

- Create: `scripts/i18n/sync-to-lezu.mjs`
- Create: `lezu.config.json`

**Command:**

```bash
LEZU_PROJECT_ID=project_xxx LEZU_API_KEY=lez_user_xxx npm run i18n:sync
```

**Important:** Lezu import body uses `locale`, not `localeCode`.

## Task 5.4: Replace app i18n initialization

**Files:**

- Modify: `apps/*/src/main.ts`
- Modify: `apps/*/src/App.vue`
- Modify: `packages/core/src/composables/useI18n.ts`
- Modify/delete: `packages/core/src/services/translation-init.service.ts`

**Target:**

- app renders with local fallback immediately
- Lezu remote bundle overlays when available
- locale switching is reactive
- no old Tiko translation Worker required at runtime

## Task 5.5: Delete old translation system

**Candidates after replacement:**

- `workers/i18n-data`
- `workers/i18n-translator`
- old admin translation views
- old translation SQL scripts
- old translation services under `packages/core`

---

# Phase 6 — Content/CMS as Its Own Package

**Objective:** Extract content into a clean package and D1-backed API.

## Target

- `@tiko/content` owns content domain types and client.
- `workers/content-api` owns D1 queries and caching.
- Admin uses content client.
- Websites use content client.
- No direct Supabase CMS access.
- No copy-paste of old schema unless current product needs it.

## Task 6.1: Create `@tiko/content`

**Files:**

- Create: `packages/content/package.json`
- Create: `packages/content/src/index.ts`
- Create: `packages/content/src/types.ts`
- Create: `packages/content/src/client.ts`
- Create: `packages/content/src/schema.ts`
- Create: `packages/content/src/rendering.ts`

## Task 6.2: Design clean content schema

**Files:**

- Create: `docs/content/CONTENT_MODEL.md`
- Create: `workers/content-api/migrations/0001_content.sql`

**Design from current needs:**

- pages
- sections
- fields
- items
- navigation
- localized text references if needed
- media references

**Do not port every historical table blindly.**

## Task 6.3: Content API endpoints

**Required:**

- `GET /projects/:projectId`
- `GET /projects/:projectId/pages`
- `GET /projects/:projectId/pages/:slug`
- `GET /projects/:projectId/navigation/:key`
- `GET /projects/:projectId/items`
- admin create/update/delete endpoints
- cache purge endpoint

## Task 6.4: Move admin/content UI to client

**Files:**

- Modify: `tools/admin/src/views/content/*`
- Modify/create: `tools/admin/src/services/content-api.service.ts`

## Task 6.5: Move websites to content client

**Files:**

- Modify: `websites/marketing/src/*`
- Modify: `websites/media/src/*`

---

# Phase 7 — Fresh App Data on D1

**Objective:** Replace all Supabase app data with clean D1-backed APIs.

## Target domains

- user settings
- parent/caregiver settings
- cards
- sequences
- todo items
- timer settings
- type settings
- yes/no settings
- radio settings/items
- collections
- app preferences

## Task 7.1: Create `workers/app-api`

**Files:**

- Create: `workers/app-api/package.json`
- Create: `workers/app-api/wrangler.toml`
- Create: `workers/app-api/src/index.ts`
- Create: `workers/app-api/src/runtime/*`
- Create: `workers/app-api/migrations/0001_app_data.sql`

## Task 7.2: Create `@tiko/data`

**Files:**

- Create: `packages/data/package.json`
- Create: `packages/data/src/index.ts`
- Create: `packages/data/src/client.ts`
- Create: `packages/data/src/types.ts`
- Create: `packages/data/src/cards.ts`
- Create: `packages/data/src/sequences.ts`
- Create: `packages/data/src/settings.ts`

## Task 7.3: Replace app services one app at a time

**Order:**

1. `timer` — simplest settings/state
2. `yes-no` — simple interaction/settings
3. `todo` — list persistence
4. `type` — settings + TTS bridge
5. `cards` — user content
6. `sequence` — more complex content
7. `radio` — currently likely unhealthy
8. `tiko` — dashboard/app shell

**Rule:**

- Do not maintain old and new paths.
- Replace the app path cleanly.
- If old data disappears, that is accepted.

## Task 7.4: App data tests

For each app replacement:

- service unit tests
- Worker route tests
- Playwright smoke test
- app build

---

# Phase 8 — Media, Assets, TTS, and Generation

**Objective:** Keep files in R2 and metadata in D1. All provider calls happen behind Workers.

## Target

- R2 stores media, user media, assets, generated images, TTS audio.
- D1 stores metadata/ownership/status.
- Apps upload/request through Workers.
- Apps never call external providers directly.

## Task 8.1: Create `@tiko/media`

**Files:**

- Create: `packages/media/package.json`
- Create: `packages/media/src/index.ts`
- Create: `packages/media/src/types.ts`
- Create: `packages/media/src/client.ts`

## Task 8.2: Consolidate media APIs

**Candidate workers to replace/consolidate:**

- `workers/media-upload`
- `workers/user-media-upload`
- `workers/assets-upload`
- `workers/media-cache`
- `workers/image-generation`

**Preferred target:**

- `workers/media-api` for upload/metadata/cache
- `workers/generation-api` for expensive AI/TTS/sentence tasks if separation helps

## Task 8.3: TTS and sentence services

**Files:**

- Modify/create: `workers/generation-api/*`
- Modify: `packages/core/src/services/tts/*`
- Modify/create: `packages/data/src/sentence.ts`

**Target:**

- TTS audio in R2
- TTS metadata in D1
- sentence suggestions from Worker/D1/provider cache

---

# Phase 9 — Tiko UI Library Modernization

**Objective:** Bring `@tiko/ui` up to Sil-quality standards while keeping it purpose-built for Tiko.

## Position

Do not use `@sil/ui` as the implementation. Tiko’s UI is too specific and too central to the product. Use Sil UI as a quality bar:

- token discipline
- accessible components
- composable APIs
- predictable styling
- good docs
- good tests

## Task 9.1: UI component audit

**Files:**

- Create: `docs/audits/ui-component-audit.md`

For each component:

- path
- purpose
- apps using it
- props/events
- docs exist?
- tests exist?
- accessibility status
- duplicate/obsolete?
- keep/rework/delete

## Task 9.2: Token redesign

**Files:**

- Create/modify: `packages/ui/src/styles/tokens/*`
- Create: `docs/ui/TOKENS.md`

**Token groups:**

- color
- typography
- spacing
- radius
- motion
- elevation
- focus
- touch targets
- child-facing affordances

## Task 9.3: Component quality gates

Every promoted component needs:

- test
- docs
- accessible role/name check
- keyboard behavior where interactive
- visual demo in `tools/ui-docs`

## Task 9.4: Clean duplicate form/input exports

`packages/ui/src/index.ts` currently suggests mixed generations of form components. Clean this carefully.

Target:

- one canonical `TForm`
- one text input
- one textarea
- one select
- one checkbox/switch/toggle pattern
- documented aliases only if needed

---

# Phase 10 — Testing and App Health Matrix

**Objective:** Make every app work and prove it keeps working.

## Required matrix

Create:

- `docs/app-health/MATRIX.md`

Rows:

- `cards`
- `radio`
- `sequence`
- `tiko`
- `timer`
- `todo`
- `type`
- `yes-no`
- `admin`
- `ui-docs`
- `marketing`
- `media`

Columns:

- install
- typecheck
- unit tests
- build
- web smoke
- identity smoke
- data persistence smoke
- i18n smoke
- offline smoke
- mobile viewport smoke
- Capacitor build
- known blockers

## Task 10.1: Shared Playwright harness

**Files:**

- Create: `packages/testing/package.json`
- Create: `packages/testing/src/playwright/appSmoke.ts`
- Create: `playwright.config.ts`
- Create: `tests/e2e/apps/*.spec.ts`

**Generic test:**

- app opens
- no fatal console errors
- root UI appears
- identity session exists
- settings/profile can open if app has it
- locale switch works if app has it

## Task 10.2: App-specific smoke tests

- `timer`: set, start, pause, reset
- `yes-no`: yes/no buttons respond
- `todo`: create/check item
- `type`: type text, trigger speak mock
- `cards`: create/open/select card fixture
- `sequence`: create/play sequence fixture
- `radio`: open player/search/add UI
- `tiko`: dashboard lists apps and profile exists

## Task 10.3: CI checks

**Files:**

- Create/modify: `.github/workflows/ci.yml`

**Required jobs:**

- install
- typecheck
- lint
- unit tests
- build packages
- build apps/sites/tools
- worker typecheck
- D1 local migrations
- Playwright smoke tests

---

# Phase 11 — Capacitor Readiness

**Objective:** Ensure all relevant apps can be wrapped and run.

## Target apps

- cards
- radio
- sequence
- timer
- todo
- type
- yes-no
- tiko if useful as shell/dashboard

## Task 11.1: Capacitor matrix

**Files:**

- Create: `docs/capacitor/CAPACITOR_MATRIX.md`

For each app:

- app id
- app name
- webDir
- icons/splash
- permissions
- offline behavior
- identity/session behavior
- TTS/audio behavior
- storage behavior
- build status
- runtime status

## Task 11.2: Shared Capacitor config helper

**Files:**

- Create: `scripts/capacitor/create-config.mjs`
- Modify app `capacitor.config.ts` files

## Task 11.3: Capacitor check script

**Files:**

- Create: `scripts/capacitor/check-all.mjs`

**Command:**

```bash
npm run capacitor:check
```

Should build each app and run Capacitor sync/config validation where possible.

---

# Phase 12 — Domain Strategy and Cloudflare Deployment Unification

**Objective:** Everything runtime lives on Cloudflare and every surface has a deliberate domain.

**Authoritative domain plan:** `docs/domain-strategy.md`

## Target

- `tiko.mt` is the canonical public/product domain.
- `*.tikoapps.org` is the app runtime family.
- `id.tiko.mt` is the custom device-first identity origin. App sessions are scoped to each `*.tikoapps.org` app and validated through an explicit identity handshake/token exchange; do not assume a shared parent cookie can span `tiko.mt` and `tikoapps.org`.
- `*.tikoapi.org` is the API family, preferably consolidated under `api.tikoapi.org/*` where practical.
- `*.tikocdn.org` is the CDN/media/asset/audio byte-delivery family.
- `tikotalks.com`, `tiko.talk`, and old app-style `*.tiko.mt` records become redirect-only or parked.
- Pages for apps/tools/websites
- Workers for APIs
- D1 migrations in CI
- R2 buckets documented
- KV namespaces documented
- Queues documented
- no Netlify references
- no Supabase secrets

## Task 12.1: Cloudflare resource inventory

**Files:**

- Create: `docs/cloudflare/RESOURCE_INVENTORY.md`

Include:

- Pages projects
- Workers
- routes/custom domains
- D1 databases
- R2 buckets
- KV namespaces
- Queues
- secrets per Worker
- account owner

## Task 12.2: Rewrite deploy workflows

**Files:**

- Modify: `.github/workflows/deploy-apps.yml`
- Modify: `.github/workflows/deploy-tools.yml`
- Modify: `.github/workflows/deploy-websites.yml`
- Modify: `.github/workflows/deploy-workers.yml`

**Must fix:**

- every active Worker is deployed or explicitly excluded
- `development` deploys dev/preview environments
- production deploys only after checks
- production remains protected

## Task 12.3: D1 policy

**Files:**

- Create: `docs/cloudflare/D1_POLICY.md`

Rules:

- D1 migrations are source controlled
- each Worker with D1 has local migration tests
- D1 query bind limits are respected
- KV is not source of truth
- schema changes require tests

---

# Phase 13 — Supabase Deletion

**Objective:** Delete old runtime code once clean replacements exist.

## Exit criteria

- audit script finds zero runtime Supabase usage
- no Supabase env vars required
- no Supabase packages required
- every app uses identity API
- app data comes from D1-backed APIs
- media metadata comes from D1-backed APIs
- content comes from D1-backed content API
- i18n comes from Lezu through `@tiko/i18n`
- all apps build and smoke test

## Task 13.1: Remove Supabase dependencies

**Files:**

- package manifests
- service exports
- env examples
- docs

## Task 13.2: Delete Supabase service files

Candidates:

- `packages/core/src/lib/*supabase*`
- `packages/core/src/services/*supabase*`
- app-level `supabase-*` services
- worker Supabase database wrappers
- old SQL scripts that only exist for Supabase

## Task 13.3: Remove Supabase secrets/docs

**Files:**

- `.env.example`
- `.env.shared`
- worker READMEs
- GitHub workflow docs

---

# Phase 14 — Final Documentation and Agent Rules

**Objective:** Make the clean codebase understandable.

Required docs:

- `README.md`
- `AGENTS.md`
- `docs/DOCTRINE.md`
- `docs/CLEAN_REBUILD_DOCTRINE.md`
- `docs/ARCHITECTURE.md`
- `docs/API_BOUNDARIES.md`
- `docs/PROJECT_MAP.md`
- `docs/domain-strategy.md`
- `docs/app-health/MATRIX.md`
- `docs/cloudflare/RESOURCE_INVENTORY.md`
- `docs/cloudflare/DOMAIN_INVENTORY.md`
- `docs/cloudflare/D1_POLICY.md`
- `docs/ui/TOKENS.md`
- `docs/i18n/LEZU_MIGRATION.md`
- `docs/content/CONTENT_MODEL.md`
- `docs/capacitor/CAPACITOR_MATRIX.md`

`AGENTS.md` must explicitly say:

- no Supabase
- no old-user work
- no password login
- use identity API
- use npm workspaces
- use Cloudflare runtime
- keep UI Tiko-specific
- preserve local conventions only where they survive the clean architecture

---

# Execution Order

## Milestone 1 — Decide and document clean direction

- Phase 0
- Phase 1
- Phase 2

Deliverable:

- no ambiguity about clean rebuild
- replacement inventory exists
- architecture is approved

## Milestone 2 — Identity platform

- Phase 3

Deliverable:

- apps can open with automatic user creation
- magic-link transfer works
- no login screen needed

## Milestone 3 — Tooling and tests

- Phase 4
- Phase 10 baseline

Deliverable:

- npm workspaces path established
- app health matrix exists
- CI knows what works/fails

## Milestone 4 — Lezu and content

- Phase 5
- Phase 6

Deliverable:

- Lezu powers translations
- content is its own package/API

## Milestone 5 — App data and media

- Phase 7
- Phase 8

Deliverable:

- app data lives in D1
- files live in R2
- metadata lives in D1

## Milestone 6 — UI and app polish

- Phase 9
- Phase 10 full matrix
- Phase 11

Deliverable:

- apps work
- UI is coherent
- Capacitor readiness known/proven

## Milestone 7 — Cloudflare-only cutover

- Phase 12
- Phase 13
- Phase 14

Deliverable:

- no Supabase runtime
- Cloudflare-only deploys
- clean documentation

---

# Non-Negotiable Verification Commands

These commands should exist and pass before the rebuild is considered complete:

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
npm run audit:supabase
npm run audit:cloudflare
npm run i18n:check
npm run capacitor:check
```

Per app:

```bash
npm run build --workspace=<app-name>
npm run test --workspace=<app-name> --if-present
npm run typecheck --workspace=<app-name> --if-present
```

Per Worker:

```bash
npm run typecheck --workspace=<worker-name>
npx wrangler d1 migrations apply <db-name> --local
```

---

# Risk Register

## Risk: Invisible identity becomes impossible to recover

Impact: users lose profiles when moving devices.

Mitigation:

- prompt caregivers gently to add email in settings/profile
- make recovery optional but obvious
- magic-link claim flow
- profile handle/display name visible in parent settings

## Risk: Auto-created users create junk data

Impact: many unused users/devices.

Mitigation:

- track last_seen_at
- cleanup unclaimed inactive device users after a long window if they have no meaningful data
- do not block use because of this

## Risk: Handle-based recovery leaks identity

Impact: someone can enumerate handles or infer emails.

Mitigation:

- generic responses
- rate limits
- no email exposure
- magic link only to attached email

## Risk: Removing old data makes testing easier but product assumptions fail

Impact: apps assume pre-existing data.

Mitigation:

- seed default data per app
- first-run fixtures
- empty-state design

## Risk: Tooling migration hides app bugs

Impact: hard to distinguish npm/Nx problems from real app problems.

Mitigation:

- app health matrix before and after
- isolate tooling PR

## Risk: UI modernization becomes an endless redesign

Impact: backend rebuild stalls.

Mitigation:

- audit first
- token system first
- component quality gates
- no app redesign unless needed for function/accessibility

## Risk: Cloudflare Worker sprawl remains confusing

Impact: some APIs deploy, some rot.

Mitigation:

- resource inventory
- workflow deploys all active Workers
- smoke checks per Worker

---

# Definition of Done

Tiko is clean only when:

- Supabase is gone from runtime dependencies and environment requirements.
- Existing old users/data are not part of the platform contract.
- Every app boots without a login screen.
- A user/device is created automatically when needed.
- Email magic links can verify/recover/link a user across devices.
- All apps use the central identity API.
- App data is served by D1-backed Workers.
- Media/assets/audio bytes live in R2 with D1 metadata.
- Translations are managed through Lezu and consumed by `@tiko/i18n`.
- Content/CMS lives in `@tiko/content` and D1-backed `content-api`.
- Domain strategy is implemented: `tiko.mt` public, `*.tikoapps.org` apps/identity, `*.tikoapi.org` APIs, `*.tikocdn.org` bytes, legacy domains redirect/park only.
- The repo uses npm workspaces or has a documented temporary blocker.
- Every app has build/typecheck/smoke status.
- Capacitor readiness is proven or explicitly blocked per app.
- Deployment is Cloudflare-only.
- README/docs/AGENTS describe the real system.
