# Tiko Project Map

Canonical map for the Tiko clean rebuild. This document reflects the repo structure at `/opt/data/workspace/tiko-mono` on branch `master`.

The current repo is a pnpm + Nx monorepo. `pnpm-workspace.yaml` is the current workspace source of truth and includes:

- `apps/*`
- `packages/*`
- `tools/*`
- `workers/*`
- `websites/*`

Root `package.json` currently lists only `packages/*`, `apps/*`, `tools/*`, and `websites/*`; it does not list `workers/*`. That is one reason the clean rebuild needs a staged workspace/tooling plan before switching to npm workspaces.

## Rebuild Status Legend

- Keep: product remains part of Tiko.
- Rebuild: keep product purpose, replace runtime architecture.
- Remove: remove runtime dependency or legacy surface.
- Split: separate product API/domain from legacy shared package coupling.
- Ready: can move early after specs.
- Blocked: needs identity/data/platform spec first.

## Product Apps

All eight product apps stay. They must open immediately through device-first identity and must not require login before first use.

| App | Path | Current role | Current status | legacy backend dependency | Cloudflare readiness | Rebuild priority |
| --- | --- | --- | --- | --- | --- | --- |
| Cards | `apps/cards` | Card/grid communication experience | Vue/Vite/Capacitor app using `@tiko/core` and `@tiko/ui` | Direct app-level legacy backend service exists in `apps/cards/src/services/legacy-backend-cards.service.ts`; also inherits legacy backend through `@tiko/core` | Pages/Vite capable, but app data must move behind Worker APIs; direct legacy backend code blocks readiness | High: core app data domain |
| Radio | `apps/radio` | Audio/radio-style accessible media experience | Vue/Vite/Capacitor app using `@tiko/core` and `@tiko/ui` | No package-level legacy backend dependency; inherits auth/media/settings dependencies through `@tiko/core` | Pages/Vite capable; needs identity boot and media APIs | Medium |
| Sequence | `apps/sequence` | Sequencing, routines, sentence/flow support | Vue/Vite/Capacitor app using `@tiko/core`, `@tiko/ui`, `@tiko/animations` | Direct app-level legacy backend service exists in `apps/sequence/src/services/legacy-backend-sequence.service.ts`; admin report views also touch legacy backend-shaped flows; inherits core dependencies | Pages/Vite capable; blocked by items/sequences and report-domain Worker specs | High: core app data domain |
| Tiko | `apps/tiko` | Main Tiko hub/app shell | Vue/Vite/Capacitor app using `@tiko/core` and `@tiko/ui` | Direct app-level legacy backend service exists in `apps/tiko/src/services/legacy-backend-sequence.service.ts`; inherits core dependencies | Pages/Vite capable; identity platform integration is foundational | Highest: identity boot reference app |
| Timer | `apps/timer` | Accessible timer utility | Vue/Vite/Capacitor app using `@tiko/core` and `@tiko/ui` | No package-level legacy backend dependency; inherits auth/settings/i18n through `@tiko/core` | Strong candidate for first clean app boot because domain is comparatively simple | High: first app proof candidate |
| Todo | `apps/todo` | Accessible todo/task utility | Vue/Vite/Capacitor app using `@tiko/core` and `@tiko/ui` | No package-level legacy backend dependency; inherits auth/settings/item services through `@tiko/core` | Pages/Vite capable; needs user-owned data API before full rebuild | Medium-high |
| Type | `apps/type` | Typing/communication utility | Vue/Vite/Capacitor app using `@tiko/core` and `@tiko/ui` | No package-level legacy backend dependency; inherits core dependencies | Pages/Vite capable; likely simpler than Cards/Sequence | Medium |
| Yes-No | `apps/yes-no` | Accessible binary choice utility | Vue/Vite/Capacitor app using `@tiko/core` and `@tiko/ui` | No package-level legacy backend dependency; inherits core dependencies | Strong candidate for early clean boot after Timer because product domain is simple | High: first app proof candidate |

### App Rebuild Rule

Do not migrate app-by-app by preserving old data services. First create the identity/app boot contract, then cut apps over to Worker APIs by domain. Timer or Yes-No should prove the clean boot path before complex user-owned domains are rebuilt.

## Workers

The task brief expected 12 workers; the repo currently contains 13 worker directories with `package.json`. This map includes every worker present so the rebuild does not accidentally ignore `auth-service`.

| Worker | Path | Current purpose | Current Cloudflare assets | legacy backend dependency | Rebuild priority | Doctrine decision |
| --- | --- | --- | --- | --- | --- | --- |
| Auth Service | `workers/auth-service` | Existing Cloudflare auth-service foundation | Worker + D1 binding/migrations | No direct legacy backend package dependency | Highest | Re-spec around device-first identity. Existing email/Better Auth-oriented docs are superseded where they conflict with device-first/no-login-wall doctrine. |
| Assets Upload | `workers/assets-upload` | Upload/manage shared assets | Worker + R2 bucket | Direct `` dependency | High | Keep R2 pattern; replace legacy backend metadata with D1/API-owned metadata. |
| Content API | `workers/content-api` | CMS/content API for apps/websites/admin | Worker + R2 + KV | Direct `` dependency and heavy legacy backend-shaped content service | High, but after identity and content spec | Rebuild API contract. Do not preserve PostgREST/legacy backend-shaped content model without a spec. |
| i18n Data | `workers/i18n-data` | Serves translation data for build/runtime generation | Worker | Source code still references legacy backend data access | Medium | Transitional only. Translation management direction is Lezu; runtime should consume stable generated/API outputs. |
| i18n Translator | `workers/i18n-translator` | Translation generation/management worker | Worker | Source code references legacy backend/KV cache patterns | Medium | Align with Lezu. Keep only if it serves the Lezu/Tiko translation pipeline. |
| Image Generation | `workers/image-generation` | Generate images/media assets | Worker + R2 route on `generate.tikocdn.org` | Direct `` dependency | Medium | Keep R2 output; move metadata/ownership to identity-aware D1 APIs. |
| Media Cache | `workers/media-cache` | Cache and serve media | Worker/KV-style cache | Direct `` dependency | Medium | KV may cache; it must not own source-of-truth metadata. Replace legacy backend metadata reads. |
| Media Upload | `workers/media-upload` | Upload public/shared media and thumbnails | Worker | No package-level legacy backend dependency in manifest, but media domain remains legacy backend-coupled through core/current architecture | High | Keep as R2-facing upload path if contract is clean; add identity/session and D1 metadata spec. |
| Report Issue | `workers/report-issue` | Issue/bug report intake | Worker | Source references legacy backend schema/client even though manifest has no legacy backend package | Low-high quick win | Good early D1 migration candidate because domain is small and self-contained. |
| Sentence Engine | `workers/sentence-engine` | Predict/serve sentence patterns | Worker | Source references database access currently inventoried as legacy backend-shaped | Medium | Good focused Worker rebuild after identity; D1 domain is bounded. |
| TTS Generation | `workers/tts-generation` | Generate/cache text-to-speech audio | Worker + R2 audio bucket | No manifest legacy backend dependency, but inventory shows metadata table dependency | Medium | Keep R2 audio; move `tts_audio` metadata/dedup to D1. |
| User Media Upload | `workers/user-media-upload` | Upload user-owned media | Worker + R2 bucket | Source has legacy backend references; manifest has no legacy backend package | High | Requires identity/session contract before rebuild. R2 stays; ownership metadata moves to D1. |
| User Removal | `workers/user-removal` | User data deletion/removal flow | Worker route on `tikoapi.org/user-removal/*` | Direct `` dependency | Later | Rebuild only after new identity/data domains exist; do not preserve old legacy backend user deletion semantics as new architecture. |

### Worker Rebuild Order

1. `auth-service`: device-first identity API spec and implementation foundation.
2. Small D1 proof domains: `report-issue`, `tts-generation` metadata, possibly `sentence-engine`.
3. Media ownership domains: `media-upload`, `user-media-upload`, `assets-upload`, `media-cache`, `image-generation`.
4. Product data domains: items/sequences/cards/todo APIs.
5. Content/CMS: `content-api` after a dedicated content doctrine/spec.
6. Translation: converge with Lezu rather than expanding Tiko-specific translation management.
7. Destructive/admin flows: `user-removal` after the new data model is real.

## Shared Packages

The task brief mentions 4 packages. The repo currently has 5 package directories. Four are runtime/product packages; one is a build-support package. All are listed here.

| Package | Path | Current ownership | legacy backend dependency | Migration need | Rebuild priority |
| --- | --- | --- | --- | --- | --- |
| `@tiko/core` | `packages/core` | Shared product logic: services, stores, composables, i18n, auth/data utilities | Direct `` dependency; largest legacy backend surface in repo | Split into clean API clients, identity bootstrap, app stores, and pure utilities. Remove legacy backend services entirely. | Highest |
| `@tiko/ui` | `packages/ui` | Tiko product-specific Vue component library | No direct legacy backend dependency; depends on `@tiko/core` | Keep and modernize as Tiko UI. Reduce accidental runtime coupling to core where possible. Do not replace with `@sil/ui`. | High |
| `@tiko/animations` | `packages/animations` | Shared animation/interaction package | No direct legacy backend dependency; depends on `@tiko/core` | Keep if product-useful. Remove unnecessary core dependency if it only needs pure types/utilities. | Medium |
| `@tiko/upos` | `packages/upos` | Narrow standalone utility/package with language JSON | No direct legacy backend dependency | Keep if still product-relevant; verify ownership and consumers during package audit. | Low-medium |
| `@tiko/vite-plugin-icon-treeshake` | `packages/vite-plugin-icon-treeshake` | Build-support Vite plugin | No direct legacy backend dependency | Keep only if still needed after build tooling simplification; include in npm workspace plan if retained. | Low |

### Package Rebuild Rule

`@tiko/core` must stop being a legacy gravity well. It should not continue to export legacy backend-shaped services with new names. The clean split is:

- identity client/bootstrap
- explicit Worker API clients
- pure product utilities
- app-safe stores/composables
- no direct database clients

## Websites

| Website | Path | Current role | legacy backend dependency | Cloudflare readiness | Rebuild priority |
| --- | --- | --- | --- | --- | --- |
| Marketing | `websites/marketing` | Public Tiko marketing site | No package-level legacy backend dependency; inherits `@tiko/core`; content flows may depend on content system | Pages/Vite capable; content dependency must be clarified | Medium |
| Media | `websites/media` | Public/media browsing site | No package-level legacy backend dependency; inherits `@tiko/core`; media collections/content depend on legacy backend-shaped services | Pages/Vite capable; blocked by media/content domain specs | Medium-high |

## Internal Tools

Not part of the requested product-app matrix, but operationally important:

| Tool | Path | Role | Rebuild note |
| --- | --- | --- | --- |
| Admin | `tools/admin` | Internal admin/content/deployment tooling | Must follow product domains. Do not let admin needs force old legacy backend schemas into the rebuild. |
| UI Docs | `tools/ui-docs` | Tiko UI documentation/dev surface | Useful for modernizing `@tiko/ui`; should stay product-specific. |

## Current legacy backend Hotspots

Based on package manifests and source inventory, the main legacy backend removal targets are:

- `packages/core/src/lib/*legacy-backend*`
- `packages/core/src/services/*legacy-backend*`
- `packages/core/src/services/auth*.ts`
- `packages/core/src/services/content.service.ts`
- `packages/core/src/services/item*.ts`
- `packages/core/src/services/media*.ts`
- `packages/core/src/services/translation*.ts`
- `packages/core/src/stores/auth*.ts`
- `apps/cards/src/services/legacy-backend-cards.service.ts`
- `apps/sequence/src/services/legacy-backend-sequence.service.ts`
- `apps/tiko/src/services/legacy-backend-sequence.service.ts`
- worker source files for assets/content/image/media/i18n/sentence/tts/report/user-removal domains

## Current Cloudflare Footprint

Already useful and should be preserved where clean:

- R2 for media/assets/generated audio/image outputs
- Workers for upload, content, TTS, i18n, sentence, report, auth, media cache
- D1 beginnings in `workers/auth-service`
- KV cache patterns in content/media/i18n areas
- Pages/Vite-compatible app and website builds

The rebuild should expand this Cloudflare footprint, not restart from generic server infrastructure.

## Dependency Between Documents and Implementation

No Wave 2 implementation task should begin until these documents exist and are referenced:

- `docs/DOCTRINE.md`
- `docs/CLEAN_REBUILD_DOCTRINE.md`
- `docs/PROJECT_MAP.md`

Next required specs after this map:

1. legacy backend removal audit with deletion targets.
2. Device-first identity API specification.
3. App boot contract specification.
4. Worker/domain API specs.
5. Package/workspace transition plan from pnpm/Nx to npm workspaces.
