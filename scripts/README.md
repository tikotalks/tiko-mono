# Netlify Build Optimization Scripts

This directory contains build ignore scripts that prevent unnecessary Netlify deployments in our monorepo setup.

## How It Works

Each app has an associated ignore script that checks if relevant files have changed since the last commit. If no relevant changes are detected, the build is skipped, saving build minutes and preventing unnecessary deployments.

## Scripts

- `ignore-build-ui-docs.sh` - UI documentation app
- `ignore-build-timer.sh` - Timer app
- `ignore-build-cards.sh` - Cards app
- `ignore-build-todo.sh` - Todo app
- `ignore-build-yes-no.sh` - Yes-No app
- `ignore-build-radio.sh` - Radio app
- `ignore-build-type.sh` - Type app

## Monitored Paths

Each script monitors changes in:
- The specific app directory (`apps/{app-name}/`)
- Shared UI package (`packages/ui/`)
- Shared core package (`packages/core/`) 
- Root dependencies (`package.json`, `pnpm-lock.yaml`)

## Exit Codes

- `exit 0` = Skip build (no relevant changes)
- `exit 1` = Proceed with build (changes detected)

## Configuration

Each app's `netlify.toml` includes:
```toml
[build]
  ignore = "bash ./scripts/ignore-build-{app-name}.sh"
```

## Benefits

- ✅ Saves Netlify build minutes
- ✅ Reduces unnecessary deployments
- ✅ Faster CI/CD pipeline
- ✅ Prevents cache invalidation when not needed
- ✅ Better developer experience

## Example

When you change only `apps/timer/`, only the timer app will rebuild. Changes to `packages/ui/` will trigger rebuilds for all apps that depend on it.