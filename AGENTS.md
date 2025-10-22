# Repository Guidelines

## Project Structure & Module Organization
- `apps/`: Vue 3 app targets (e.g., `tiko`, `sequence`, `yes-no`).
- `packages/`: Shared libraries (`@tiko/core`, `@tiko/ui`, `@tiko/animations`).
- `workers/`: Cloudflare Workers (APIs, media, i18n). See each worker’s README.
- `websites/`: Marketing and media sites.
- `scripts/`: Build/dev/test utilities; most top-level scripts call into here.
- `cypress/`: End-to-end tests and support files.
- `assets/`, `docs/`, `types/`: Shared assets, documentation, and type defs.

## Build, Test, and Development Commands
Use `pnpm`.
- `pnpm dev`: Serve all projects in parallel via Nx.
- `pnpm serve`: Build shared packages, then run the main app server.
- `pnpm build`: Interactive app build (use `build:ci` on CI).
- `pnpm rebuild`: Clean caches then rebuild `packages/*`.
- `pnpm test`: Interactive unit test runner; `test:ci` for CI (Vitest).
- `pnpm test:e2e`: Run Cypress E2E tests (`test:e2e:open` to open runner).
- `pnpm lint` / `pnpm typecheck`: Lint and TS type checks across the monorepo.
- `pnpm affected:build|test|lint`: Scope work to changed projects.

## Coding Style & Naming Conventions
- Language: TypeScript + Vue 3 (Vite).
- Formatting: Prettier (2 spaces, single quotes, no semicolons, 100 col). Run via ESLint’s Prettier config.
- Linting: ESLint with Nx and Vue configs; module boundaries enforced.
- Aliases: `@tiko/*` map to `packages/*` per `tsconfig.base.json`.
- Files: kebab-case for filenames, `PascalCase.vue` for components.

## Testing Guidelines
- Unit/Component: Vitest + @vue/test-utils (co-locate tests or `__tests__`); suffix with `.spec.ts`.
- E2E: Cypress specs in `cypress/e2e/**/*.cy.ts`.
- Run locally: `pnpm test` (unit), `pnpm test:e2e` (E2E). Aim for meaningful coverage; include edge cases for store/composables.

## Commit & Pull Request Guidelines
- Style: Conventional Commits (`feat:`, `fix:`, `chore:`). Optional build tags like `[build:content-api]` are used in history.
- PRs: Provide clear description, link issues, list affected apps/packages, and add screenshots/recordings for UI changes.
- Checks: Ensure `pnpm lint`, `pnpm typecheck`, and relevant tests pass. Update docs/assets when behavior changes.

## Security & Configuration
- Env: Start from `.env.example` and `.env.shared`; never commit secrets.
- Workers: Use `wrangler` configs found in each `workers/*` project for deployment specifics.
