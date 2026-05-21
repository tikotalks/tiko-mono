# Tiko Roadmap

## Roadmap doctrine

Do not rebuild everything at once. Tiko becomes inevitable by making the simple child communication loop work first, then hardening the platform underneath it.

## Phase 0 — Doctrine and map

Status: documentation foundation.

Deliverables:

- `docs/DOCTRINE.md`
- `docs/TECHNICAL_SPECIFICATION.md`
- `docs/ARCHITECTURE.md`
- `docs/PROJECT_MAP.md`
- clean README
- domain strategy
- clean rebuild plan

Exit criteria:

- builders have one source of truth;
- no new plan mentions Better Auth, password login, legacy user maps, or legacy backend preservation as targets.

## Phase 1 — Audits before deletion

Deliverables:

- legacy backend usage audit script and report.
- App health matrix.
- External runtime inventory.
- Domain/deployment inventory.

Exit criteria:

- every legacy backend/runtime dependency is categorized as delete, replace with Worker API, replace with D1, replace with R2 metadata, replace with Lezu, or inspect manually.

## Phase 2 — Identity foundation

Deliverables:

- `workers/identity-api`.
- D1 schema for users/devices/sessions/magic links/profile events.
- `@tiko/identity` client.
- app boot proof in one app.
- tests for silent device user creation and magic-link transfer.

Exit criteria:

- a new visitor can open an app and receive a device user without seeing auth UI;
- a caregiver can add email and link another device by magic link.

## Phase 3 — Smoke harness and app health

Deliverables:

- deterministic per-app smoke harness;
- build/typecheck/test status per app/package/worker;
- first broken-app repair wave.

Exit criteria:

- every app can be built or has a documented blocker;
- every app can be opened in a browser or has a documented blocker.

## Phase 4 — App data API

Deliverables:

- `workers/app-api` for cards/items/sequences/settings/todo data.
- `@tiko/data` typed client.
- one app moved from legacy backend-shaped services to Worker API.

Exit criteria:

- child-facing app data no longer requires direct legacy backend calls;
- access checks live in Worker code.

## Phase 5 — Media and content

Deliverables:

- `workers/media-api` with R2 upload intent and D1 metadata.
- `@tiko/media` client.
- D1-backed content API plan/implementation slices.
- Lezu-backed i18n wrapper and generated fallback flow.

Exit criteria:

- bytes are in R2;
- metadata is in D1;
- app/client code never talks directly to storage/databases;
- Tiko does not rebuild translation management inside itself.

## Phase 6 — Tooling migration

Deliverables:

- npm workspace feasibility report.
- staged removal/reduction of pnpm/Nx if feasible.
- standard root scripts matching Sil ecosystem expectations.

Exit criteria:

- deterministic install/build/test commands exist and are documented;
- CI uses the same commands agents use.

## Phase 7 — iOS and public testing

Deliverables:

- Capacitor checks per app.
- offline behavior validation.
- small testing cohort workflow.
- accessibility review with caregivers/therapists.

Exit criteria:

- core communication workflows are usable on tablet/phone;
- public testing can start without pretending the platform is finished.

## Long-term features, gated by stability

- custom board sharing;
- therapist-created exercises;
- predictive communication;
- multilingual/bilingual modes;
- open community content library;
- paid commercial API/support contracts that fund the free platform without weakening it.
