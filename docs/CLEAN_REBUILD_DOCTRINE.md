# Tiko Clean Rebuild Doctrine

This document defines what "clean rebuild" means for Tiko. It exists to prevent the rebuild from quietly becoming a migration, a compatibility project, or a cosmetic refactor of the old architecture.

## The Hard Line

Tiko is not doing a legacy migration.

The rebuild is allowed to study the existing system. It is allowed to audit current behavior, preserve product lessons, and reuse code only when the code already fits the new doctrine. But the rebuild must not preserve old architecture out of fear.

The goal is not: make the old Tiko run on Cloudflare.

The goal is: rebuild Tiko around device-first identity, Cloudflare-native APIs, product-specific UI, and simple app boot flows.

## Non-Negotiables

### 1. Not a legacy migration

The clean rebuild is not required to keep old users, old sessions, old legacy backend IDs, old RLS assumptions, old PostgREST contracts, or old auth behavior alive.

Legacy code is evidence. It is not law.

### 2. No user migration

Existing legacy backend users are not migrated into the new identity platform.

The new system creates new Tiko users through the identity API. These users begin as device-first records and may later attach email for recovery or transfer.

Any future legacy-data import must be explicitly scoped as a separate data import project, not a premise of the rebuild. It must not block app boot, identity API design, or the clean removal of legacy backend.

### 3. No compatibility layer

No production runtime compatibility layer may be created to imitate legacy backend behavior.

Forbidden examples:

- a fake legacy backend client over D1
- PostgREST-shaped Worker endpoints because old services expect them
- Better Auth or custom identity wrapped to look like legacy backend Auth
- RLS-like policy assumptions hidden in client code
- old `legacy-backend-*` service names retained as normal architecture

Temporary scripts may exist for audits, exports, or one-time data analysis. They must be clearly marked as non-runtime tooling and kept out of app/package public APIs.

### 4. Apps open immediately

Every product app must open on first launch without requiring login.

Required boot contract:

1. App initializes shell and local defaults.
2. App calls identity API with app/device context.
3. Identity API returns an existing or newly created device-first user/session.
4. App hydrates state.
5. User can use the app.

If the identity API is temporarily unavailable, apps should degrade gracefully where possible with a local pending identity state. They must not replace this with a login wall.

### 5. Optional email via magic links

Email is optional and exists for:

- recovery
- transfer to another device
- parent/caregiver access
- sensitive account operations

Email must be attached through magic-link flows. Passwords are not part of the rebuild.

Magic-link flows must be owned by the identity platform and must resolve to device/session state. They are not a reason to block normal first use.

### 6. Documentation before implementation

Implementation starts only after the governing documents and specs exist.

The required sequence is:

1. `docs/DOCTRINE.md`
2. `docs/CLEAN_REBUILD_DOCTRINE.md`
3. `docs/PROJECT_MAP.md`
4. legacy backend dependency audit
5. Identity API spec
6. App boot spec
7. Worker/data-domain specs
8. Workspace/tooling transition spec
9. Implementation tasks

Any implementation work that begins before the relevant audit/spec exists should be treated as premature.

## What Can Be Reused

Reuse is allowed only when it strengthens the clean rebuild.

Allowed:

- product interaction lessons
- accessibility patterns that still fit
- visual direction where it serves Tiko users
- pure utilities with no legacy backend/runtime coupling
- UI components that can be modernized cleanly
- Worker code that already fits Cloudflare-first ownership
- R2 storage patterns that are already correct
- generated translation consumption patterns that keep runtime light

Not allowed:

- auth/session code that depends on legacy backend
- client data services that directly model database tables
- services that preserve RLS or PostgREST assumptions
- compatibility adapters that become permanent
- migration code in app boot
- old user/account assumptions inside new product flows

## Identity Rebuild Shape

The rebuild identity platform should be specified around these nouns:

- User: a Tiko identity record, auto-created when needed.
- Device: the first-class continuity anchor for immediate use.
- Session: server-issued proof that a device/user context is valid.
- Recovery email: optional, verified by magic link.
- App context: the app currently opening or requesting identity state.
- Role: parent/admin/support capabilities where explicitly required.

Minimum identity API responsibilities:

- `POST /identity/bootstrap` or equivalent: return/create user + device + session.
- `GET /identity/session`: validate current session.
- `POST /identity/recovery/send`: send recovery/transfer magic link.
- `POST /identity/recovery/verify`: verify link and bind/recover device/session.
- `POST /identity/sign-out` or device unlink where needed.

Exact endpoint names belong in the identity API spec, not this doctrine. The behavior above is the constraint.

## Data Rebuild Shape

Data domains must be rebuilt as Worker-owned APIs over D1/R2/KV/Queues.

The client should not know whether a record lives in D1, R2 metadata, generated files, or cached Worker responses. The client should know product APIs.

Domain specs must define:

- data owner Worker
- D1 tables if relational data is needed
- R2 buckets if binary data is needed
- KV caches if cache is useful
- queue producers/consumers if async work is needed
- authorization rules in Worker terms
- app/package consumers
- old legacy backend touchpoints to delete

## Translation Rebuild Shape

Lezu is the translation management direction.

The clean rebuild should not deepen the existing custom Tiko translation admin surface unless the work is explicitly transitional. Runtime apps should consume stable generated/API translation outputs, while authoring and management converge toward Lezu.

## Tooling Rebuild Shape

The repo currently uses pnpm and Nx. The target is npm workspaces with staged pnpm/Nx removal.

The tooling rebuild must be boring, reversible, and specified before it lands.

Required before switching:

- authoritative workspace map
- equivalent app/package/worker scripts
- CI update plan
- lockfile strategy
- local developer commands
- deployment impact analysis
- rollback plan

No product implementation task should become blocked by opportunistic package-manager churn.

## Definition of Clean

A rebuild step is clean when it satisfies all of these:

- It removes or avoids legacy backend runtime dependency.
- It does not require old users to exist.
- It does not preserve old auth semantics.
- It is Cloudflare-native by design.
- It keeps apps immediately usable.
- It keeps Tiko UI product-specific.
- It has a clear API or package boundary.
- It is documented before dependent implementation begins.
- It can be reviewed against `docs/DOCTRINE.md`.

## Definition of Dirty

A rebuild step is dirty when it does any of these:

- ports a legacy backend service without changing the model
- hides direct database assumptions behind a thin Worker
- blocks first use behind sign-in
- makes email mandatory
- preserves old user IDs as a requirement
- introduces a compatibility layer into production runtime
- makes KV authoritative for relational state
- replaces `@tiko/ui` with a generic external design system
- starts implementation before the relevant spec exists

Dirty work should be stopped, not polished.
