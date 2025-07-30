# Cloudflare Pages Configuration

This document describes how to set up Cloudflare Pages for the Tiko monorepo.

## Overview

Each app in the monorepo is deployed as a separate Cloudflare Pages project. The build process uses Nx to detect which apps need to be rebuilt based on changes.

## Setting Up Each App

For each app (timer, cards, radio, etc.), create a new Cloudflare Pages project with these settings:

### Build Configuration

| Setting | Value |
|---------|-------|
| Framework preset | None |
| Build command | `node scripts/cloudflare-build.js <app-name> && pnpm nx build <app-name>` |
| Build output directory | `apps/<app-name>/dist` |
| Root directory | `/` |
| Environment variables | See below |

### Example Build Commands

- **Timer app**: `node scripts/cloudflare-build.js timer && pnpm nx build timer`
- **Cards app**: `node scripts/cloudflare-build.js cards && pnpm nx build cards`
- **Radio app**: `node scripts/cloudflare-build.js radio && pnpm nx build radio`
- **Admin tool**: `node scripts/cloudflare-build.js admin && pnpm nx build admin`

### Environment Variables

Add these environment variables to each Cloudflare Pages project:

```bash
NODE_VERSION=20
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Build Settings

- **Node version**: 20
- **NPM version**: Use pnpm (Cloudflare Pages will auto-detect from lockfile)
- **Build frequency**: On every push

## Smart Build Detection

The build script (`scripts/cloudflare-build.js`) uses Nx to determine if an app needs to be rebuilt:

1. **Direct changes**: If the app has changes, it will be built
2. **Shared dependencies**: If `packages/ui` or `packages/core` change, all apps rebuild
3. **Commit message overrides**:
   - `[build-all]` or `[force-build]` - Forces all apps to build
   - `[build-<app>]` - Forces specific app to build (e.g., `[build-timer]`)
   - `[skip-ci]` or `[skip-build]` - Skips all builds
   - `[skip-<app>]` - Skips specific app build

## Setting Up in Cloudflare Dashboard

1. Go to Cloudflare Pages
2. Create a new project
3. Connect your GitHub repository
4. Configure build settings as above
5. Deploy!

## Redirects and Headers

For SPAs, create a `_redirects` file in each app's public directory:

```
/*    /index.html   200
```

For caching, create a `_headers` file:

```
/assets/*
  Cache-Control: max-age=31536000, immutable

/*.js
  Cache-Control: max-age=31536000, immutable

/*.css
  Cache-Control: max-age=31536000, immutable
```

## Build Caching

Cloudflare Pages doesn't cache dependencies like Netlify, but the Nx cache helps speed up builds. Make sure your Cloudflare Pages project has enough build minutes for your needs.

## Monitoring Builds

The build script provides detailed logging:
- 🔍 Shows which projects are affected
- 📦 Lists affected apps and libraries
- ✅ Shows build decision and reason
- ⏭️ Indicates when builds are skipped

## Troubleshooting

If builds are not detecting changes correctly:

1. Check that Nx is properly configured
2. Verify the base branch is set correctly in `nx.json`
3. Use `[build-all]` in commit message to force a build
4. Check Cloudflare Pages build logs for detailed output