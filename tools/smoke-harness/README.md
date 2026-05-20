# Tiko Smoke Harness

Shared smoke-test harness for the Tiko clean rebuild. It gives every app the same basic pass/fail checks while still allowing product-specific overrides.

## Default apps

The default harness covers every app currently in `apps/`:

- `cards`
- `sequence`
- `type`
- `yes-no`
- `radio`
- `tiko`
- `timer`
- `todo`

Pass positional app names to narrow a local run to one or more apps.

## Commands

From the repository root:

```bash
pnpm --dir tools/smoke-harness test
pnpm --dir tools/smoke-harness smoke:build
pnpm --dir tools/smoke-harness smoke
pnpm --dir tools/smoke-harness smoke:build sequence tiko
```

What `smoke` does:

1. Builds shared packages with filtered package builds (`@tiko/core`, `@tiko/ui`, `@tiko/animations`).
2. Builds each requested app with `pnpm --filter <app> build`.
3. Prints pass/fail results for every package/app step instead of stopping at the first failure.
4. Starts the apps through Vite on deterministic local ports when E2E is enabled.
5. Runs Playwright checks that verify the app loads, `#app` is visible, and no browser console/page errors occur.

Use `smoke:build` in constrained environments that cannot install or run Playwright browsers.

## Shared configs

- `vitest.config.ts` — shared Node-based harness tests.
- `playwright.config.ts` — shared E2E smoke config for all Tiko apps on deterministic ports.
- `templates/app-smoke.spec.ts` — copy/adapt for product-specific app checks.
- `ci/github-actions-smoke.yml` — workflow template for CI integration.

## Extending to another app

1. Add the app name and port to `playwright.config.ts`.
2. Run `pnpm --dir tools/smoke-harness smoke:build <app>`.
3. Add a product-specific spec copied from `templates/app-smoke.spec.ts` only when the generic app-load checks are not enough.
4. Keep assertions focused on boot, console health, and one basic interaction. Product behavior belongs in app-specific test suites.

## Doctrine alignment

The harness does not introduce login gates or external data dependencies. It checks that apps can boot quickly and visibly, which supports the clean rebuild doctrine that apps open immediately and remain product-specific.
