# Tiko Doctrine

This is the governing document for the Tiko clean rebuild. Every audit, specification, implementation task, review, and deployment decision must comply with this doctrine before it is allowed to move forward.

Tiko is not being migrated. Tiko is being rebuilt around the truth that the product must open instantly, work without ceremony, and keep identity as infrastructure rather than as a login screen.

## 1. Product Belief

Tiko is a family of accessibility-first tools for children, caregivers, teachers, and support contexts where friction is not a small inconvenience. Friction is exclusion.

The product therefore believes:

- Opening an app should never begin with a wall.
- Identity should exist so the product can protect continuity, not so the product can demand commitment.
- A child, parent, teacher, or therapist should be able to use the app before they understand the account model.
- Recovery and transfer are important, but they are secondary to immediate use.
- The system should preserve calm, speed, and trust before it preserves legacy compatibility.

## 2. Identity Doctrine

Tiko uses device-first identity.

The first app open must create or recover enough identity state for the app to function. No password, username, registration form, account chooser, or login wall may be required before the first useful interaction.

### Required behavior

1. App boots.
2. App calls the Tiko identity API with device/app context.
3. Identity API returns or creates:
   - user
   - device
   - session
   - app membership/context if needed
4. App hydrates local state and opens immediately.
5. Optional email can later attach to the user for recovery, transfer, and parent/admin flows.

### Identity primitives

The identity platform is the single source of truth for:

- users
- devices
- sessions
- recovery emails
- magic-link challenges
- cross-app session validity
- parent/admin roles where needed
- app-level identity context

Apps may cache identity state for offline and fast boot, but app-local caches are never authoritative.

### Forbidden identity patterns

- No passwords.
- No mandatory login before first use.
- No legacy backend Auth dependency.
- No direct app-managed auth provider.
- No query-string token handoff as an SSO primitive.
- No localStorage-as-authority session model.
- No per-app user model that competes with the central Tiko identity platform.

## 3. Recovery and Transfer Doctrine

Email is optional identity reinforcement, not the primary entry point.

Email is used for:

- magic-link recovery
- device transfer
- caregiver/parent workflows
- account verification when needed for sensitive operations

Email must not become:

- a required sign-up gate
- a password substitute that still blocks first use
- a reason for an app to delay opening

Magic links must be issued by the identity platform, validated server-side, and bound to clear session/device outcomes.

## 4. legacy backend Removal Doctrine

legacy backend must be completely removed from the Tiko runtime.

This is not a provider swap. This is a removal of the legacy backend-shaped architecture: auth coupling, RLS assumptions, PostgREST client calls, storage assumptions, and compatibility shims.

### Required removal rules

- Remove `` from runtime app/package/worker dependencies.
- Remove legacy backend Auth from app boot and session flows.
- Remove PostgREST-style direct data access from client code.
- Remove RLS-dependent authorization assumptions and replace them with explicit Worker-side authorization.
- Remove legacy backend storage assumptions; keep or expand R2 for binary objects.
- Remove legacy backend compatibility layers rather than preserving them.
- Remove migration-era names once their replacement is stable; do not normalize `legacy-backend-*` naming in the rebuild.

### No compatibility layer

A compatibility layer would keep the old mental model alive. That is not allowed.

Adapters may exist only as temporary audit aids or one-time import tooling. They must not be part of production runtime, public package APIs, app stores, or Worker contracts.

### No user migration

The clean rebuild does not migrate existing legacy backend users into the new identity system.

If legacy data is ever imported for analysis, demos, or later selective recovery, it must remain outside the critical path and must not force the new user model to inherit old IDs, old account semantics, old RLS rules, or old auth flows.

The default product assumption is: new Tiko, new identity, new device-first continuity.

## 5. Cloudflare-First Runtime Doctrine

Tiko is Cloudflare-first.

The target runtime is:

- Cloudflare Workers for APIs and server-side product logic
- Cloudflare D1 for relational identity and application metadata
- Cloudflare R2 for media, assets, generated audio, and binary storage
- Cloudflare KV for caches, not source-of-truth records
- Cloudflare Queues for asynchronous work and retries
- Cloudflare Pages for static app and website deployments where appropriate

### Storage rules

- D1 stores relational data and metadata.
- R2 stores bytes.
- KV stores derived, cacheable, disposable values.
- Queues move work; they do not own product state.
- Client apps never talk directly to databases.

### API rules

- Workers own authorization.
- Workers expose explicit product APIs.
- Workers validate app/device/session context on every protected mutation.
- Workers must be designed around small, understandable contracts rather than leaking database shape.

## 6. Tiko Identity Platform Doctrine

The identity platform is not one app's auth helper. It is the foundation shared by all Tiko apps, websites, tools, and Workers.

It must provide:

- device registration
- user auto-creation
- session creation and renewal
- optional email attachment
- magic-link challenge creation and verification
- cross-app session checks
- parent/admin role lookup where required
- audit records for sensitive identity actions

The identity API is the only authority for who a user is. App code may ask. App code may not invent.

## 7. App Doctrine

The eight product apps remain distinct products:

- Cards
- Radio
- Sequence
- Tiko
- Timer
- Todo
- Type
- Yes-No

They share infrastructure, identity, UI primitives, and platform services, but they should not collapse into one generic dashboard.

### App rules

- Each app must open immediately.
- Each app must tolerate anonymous/device-first use.
- Each app must use the identity platform instead of owning auth.
- Each app must use Worker APIs instead of direct database clients.
- Each app must keep its product-specific simplicity.
- Each app must avoid central-dashboard gravity unless the use case truly requires it.

## 8. Tiko UI Doctrine

Tiko UI stays product-specific.

The rebuild may modernize `@tiko/ui`, remove legacy cruft, improve accessibility, simplify APIs, and rationalize component boundaries. It must not replace Tiko UI with `@sil/ui`.

Reason: Tiko has a distinct product context. It is an accessibility-centered product family, not a Sil studio marketing surface. It needs its own interaction language, larger affordances, calmer flows, and app-specific components.

### UI rules

- Keep `@tiko/ui` as the shared UI foundation.
- Modernize it from inside the Tiko product language.
- Do not import `@sil/ui` as a replacement design system.
- Accessibility and clarity outrank novelty.
- Components must serve app use, not component-library vanity.

## 9. Translation Doctrine

Lezu is the translation management direction.

The existing i18n system may inform the data model and migration inventory, but translation management should converge on Lezu rather than growing a second custom translation platform inside Tiko.

### Translation rules

- Product code should consume generated or API-served translations through stable Tiko abstractions.
- Translation authoring and management should move toward Lezu.
- Runtime app boot must not depend on live translation database calls.
- Build-time generation and cacheable Worker responses are preferred.
- Translation keys must be app-aware but not app-chaotic.

## 10. Workspace and Tooling Doctrine

The current repo is a pnpm + Nx monorepo. The target is npm workspaces with staged removal of pnpm and Nx.

This must be staged, not impulsive.

### Current truth

- `pnpm-workspace.yaml` is currently the authoritative workspace map.
- Nx project files currently define app/tool/website build targets.
- Workers are operationally separate and use Wrangler scripts.
- Root `package.json` workspaces currently omit `workers/*`, so it is not the authoritative map.

### Target truth

- npm workspaces become the package manager foundation.
- Root `package.json` becomes the authoritative workspace map.
- Nx is removed only after equivalent deterministic scripts exist.
- Workers are included intentionally in workspace orchestration or intentionally kept separate with documented reasons.

### Forbidden tooling moves

- No big-bang package-manager switch before audits/specs are complete.
- No broken lockfile churn disguised as architecture.
- No replacing Nx with vague scripts that lose project-level determinism.
- No implementation work whose first step is tooling chaos.

## 11. Engineering Doctrine

Tiko engineering must be boring where users need trust and sharp where the platform needs leverage.

### Principles

- API-first, not database-client-first.
- Edge-native, not server nostalgia.
- Explicit authorization, not hidden RLS magic.
- Simple boot paths, not orchestration theatrics.
- Small Workers with clear ownership.
- Shared packages only where sharing reduces complexity.
- Product apps stay understandable by reading their local code.
- Every rebuild step must reduce legacy surface area.

### Anti-patterns

- Keeping old legacy backend services with new names.
- Wrapping legacy code so implementation can pretend to progress.
- Creating a mega-platform before the first app works.
- Moving every feature into shared packages prematurely.
- Adding dashboards where a direct app flow is better.
- Building admin abstractions before product flows are proven.
- Treating Cloudflare KV as a database.

## 12. Sequencing Doctrine

Docs, audits, and specs come before implementation.

Required order:

1. Doctrine and project map.
2. legacy backend/runtime dependency audit.
3. Identity API specification.
4. App boot specification.
5. Data-domain migration/rebuild specifications.
6. Worker contracts.
7. Package/workspace tooling plan.
8. Implementation waves.
9. Review against doctrine before merge.

Any implementation PR that changes runtime architecture before the doctrine/spec layer exists should be rejected.

## 13. Review Doctrine

Reviewers have veto power when work violates this doctrine.

A change is not acceptable merely because it builds. It must also answer:

- Does the app still open immediately?
- Did we remove legacy surface area instead of hiding it?
- Is identity still centralized and device-first?
- Is legacy backend absent from runtime?
- Is Cloudflare used according to the storage/API rules?
- Is Tiko UI preserved as Tiko UI?
- Did we avoid unnecessary platform complexity?

If the answer is no, the change waits.
