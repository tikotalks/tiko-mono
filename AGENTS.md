# Repository Guidelines

## Workspace Map
- This repo is a `pnpm` + Nx monorepo. Treat `pnpm-workspace.yaml` as the workspace source of truth. It includes `packages/*`, `apps/*`, `tools/*`, `workers/*`, and `websites/*`.
- `package.json` contains the main root scripts, but its `workspaces` field does not list `workers/*`; do not use that field as the authoritative map.
- `apps/` contains product apps: `cards`, `radio`, `sequence`, `tiko`, `timer`, `todo`, `type`, `yes-no`.
- `packages/` contains shared libraries: `@tiko/core`, `@tiko/ui`, `@tiko/animations`, `@tiko/upos`, `@tiko/vite-plugin-icon-treeshake`.
- `tools/` contains internal tooling apps: `@tiko/admin`, `ui-docs`.
- `websites/` contains `marketing` and `media`.
- `workers/` contains standalone Cloudflare Workers with their own `package.json`, `tsconfig.json`, and usually `wrangler.toml`.

## Architecture Notes
- `@tiko/core` is the main shared logic layer. It holds services, stores, composables, database helpers, i18n plumbing, and utilities.
- `@tiko/ui` is the shared Vue component library and depends on `@tiko/core`.
- `@tiko/animations` and `@tiko/upos` are shared packages with narrower scopes.
- Apps, tools, and websites generally consume `@tiko/core` and `@tiko/ui` through workspace imports.
- Workers are operationally separate from Nx apps. They run via Wrangler scripts, not Nx targets.

## Build, Test, and Dev Commands
- Use `pnpm` from the repo root.
- Root wrappers such as `pnpm build`, `pnpm test`, `pnpm serve`, and `pnpm ios` are interactive Node scripts. Use them when you want the guided flow.
- For deterministic project-level work, prefer direct Nx or filtered package commands:
  - `nx run <project>:serve|build|test|lint|typecheck`
  - `pnpm --filter <package-name> dev|build|test|lint|typecheck`
- Shared packages often need to be built before downstream apps, tools, or websites. `pnpm build:packages` is the standard pre-step, and some leaf packages already run it in `predev`.
- CI-style validation lives at the root:
  - `pnpm test:ci`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm affected:build|test|lint`
- Workers use their own scripts, for example:
  - `pnpm --filter @tiko/i18n-translator-worker dev`
  - `pnpm --filter @tiko/content-api-worker deploy`
  - `pnpm --dir workers typecheck`

## Nx Project Names and Ports
- Nx project names are not always the same as package names. Use the `project.json` name when running `nx`.
- Common project names:
  - Apps: `cards`, `radio`, `sequence`, `tiko`, `timer`, `todo`, `type`, `yes-no`
  - Tools: `admin`, `ui-docs`
  - Websites: `marketing`, `media`
- Several projects share the same dev port. Do not assume multiple apps can run side by side without overrides.
- Current defaults:
  - `3000`: `admin`
  - `3001`: `timer`
  - `3002`: `todo`
  - `3003`: `sequence`
  - `3004`: `type`
  - `3005`: `radio`
  - `3006`: `yes-no`
  - `3007`: `cards`
  - `3008`: `tiko`
  - `3009`: `ui-docs`
  - `3010`: `marketing`
  - `3011`: `media`

## Code Organization and Naming
- Language baseline is TypeScript + Vue 3 + Vite.
- Prefer `<script setup lang="ts">` for new Vue components.
- In Vue components, prefer `useBemm`/BEMM class generation. This is already common across `packages`, `tools`, and `websites`.
- Preserve the local structure of the area you are editing instead of forcing one structure across the whole monorepo.
- For new shared UI components in `packages/ui`, follow the established folder pattern:
  - `ComponentName/ComponentName.vue`
  - `ComponentName/ComponentName.model.ts`
  - `ComponentName/index.ts`
  - `ComponentName/ComponentName.spec.ts`
  - optional `ComponentName.md`, mocks, or utility files when needed
- For app-level code, the current repo often uses flatter structures such as:
  - `src/components/*.vue`
  - `src/views/*.vue`
  - `src/services/*.service.ts`
  - `src/stores/*.ts`
  - `src/models/*.model.ts`
- Put component-specific types and interfaces in a nearby `.model.ts` file. Put broader domain models in a nearby `models/` folder or package `types/` area.
- Follow the naming pattern already used in the target area:
  - Shared UI components are typically PascalCase folders/files with a `T` prefix.
  - App and website view/component files are typically PascalCase `.vue`.
  - Services and model files are often kebab-case or dotted suffix names such as `sequence.service.ts` and `PublicItem.model.ts`.

## Testing Guidance
- Vitest is the unit test runner across the repo. Vue component tests use `@vue/test-utils`.
- Test naming is mixed in the current codebase: both `.spec.ts` and `.test.ts` are in active use.
- When adding tests, follow the dominant convention in the local area instead of renaming unrelated files:
  - `packages/ui` leans heavily toward `.spec.ts`
  - `packages/core` and app/store code use a mix of `.spec.ts` and `.test.ts`
- Add tests for new composables, utilities, stores, and shared components. Shared package changes should not land without relevant coverage.
- Workers do not have a strong shared unit-test pattern yet. At minimum, run the relevant `build`, `typecheck`, and `lint` commands when touching worker code.

## Working Rules for Changes
- Preserve local conventions when editing older app code. Do not refactor flat app components into the `packages/ui` folder structure unless the task actually requires it.
- Prefer small, feature-scoped changes. If a component is getting too large, split logic into composables, services, or utility files that match the area’s existing structure.
- Check nearby files before introducing new patterns. This repo has a few generations of code, so consistency with the local neighborhood matters more than applying a global ideal.
- When changing shared packages, assess downstream impact on apps, tools, and websites that import them.
- There is ongoing active work in this repo. Do not revert unrelated dirty changes.

## Commit and PR Guidelines
- Use conventional commits in the format `feat(Section): Description of what you did`.
- Commit by feature, bug, or functionality. Do not create blob commits that mix unrelated work.
- Add a commit body when context or tradeoffs are important.
- Before opening a PR, run the relevant lint, typecheck, and test commands for the touched projects.
- PR descriptions should clearly state affected apps/packages/workers and include screenshots or recordings for UI changes.

## Configuration and Secrets
- Root env files live in `.env.example` and `.env.shared`. Some projects also include their own env examples.
- Never commit secrets.
- For workers, check each worker’s `wrangler.toml` and README before changing bindings, routes, or deployment behavior.
