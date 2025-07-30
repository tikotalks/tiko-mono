# Cloudflare Pages Build Commands

This document lists the correct build commands for each app in Cloudflare Pages.

## Build Commands

Each app should use this format:
```bash
node scripts/cloudflare-build.js <app-name> && npx nx build <nx-project-name>
```

### App-specific commands:

| App | Build Command |
|-----|--------------|
| admin | `node scripts/cloudflare-build.js admin && npx nx build admin` |
| timer | `node scripts/cloudflare-build.js timer && npx nx build timer` |
| cards | `node scripts/cloudflare-build.js cards && npx nx build cards` |
| radio | `node scripts/cloudflare-build.js radio && npx nx build radio` |
| yes-no | `node scripts/cloudflare-build.js yesno && npx nx build yes-no` |
| type | `node scripts/cloudflare-build.js type && npx nx build type` |
| todo | `node scripts/cloudflare-build.js todo && npx nx build todo` |
| tiko | `node scripts/cloudflare-build.js tiko && npx nx build tiko` |
| ui-docs | `node scripts/cloudflare-build.js ui-docs && npx nx build ui-docs` |

## Important Notes

1. **yes-no app**: The build detection uses `yesno` but Nx project name is `yes-no`
2. **admin app**: Output directory is `tools/admin/dist`
3. **Other apps**: Output directory is `dist/apps/<app-name>`

## How it works

1. The `cloudflare-build.js` script checks if the app needs to be built
2. If yes (exit 0), Cloudflare proceeds with the nx build command
3. If no (exit 1), Cloudflare skips the build

## Debugging

To test locally:
```bash
# Test build detection
node scripts/cloudflare-build.js <app-name>

# Test full build
node scripts/cloudflare-build.js <app-name> && npx nx build <nx-project-name>
```