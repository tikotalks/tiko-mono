# Tiko Scripts Directory

This directory contains utility scripts for building, testing, and maintaining the Tiko monorepo.

## 📁 Temporary Scripts
Use the `.temp/` folder for any temporary scripts that shouldn't be committed to git. This folder is excluded from version control.

## 🛠️ Active Scripts

### Build & Development
- **build-app-interactive.js** - Interactive app builder (`pnpm build`)
  - Prompts for app selection or builds all apps with `all` argument
  - Used in CI/CD pipeline
  
- **serve-app.js** - Development server for apps (`pnpm serve`)
  - Interactive app selection for local development
  - Starts Vite dev server for selected app
  
- **test-app-interactive.js** - Interactive test runner (`pnpm test`)
  - Run tests for specific apps or packages
  
- **ios-app-interactive.js** - iOS app builder (`pnpm ios`)
  - Build and deploy iOS apps via Capacitor

- **interactive-select.js** - Helper utility
  - Provides interactive selection UI for other scripts
  - Not called directly

### 📊 Code Analysis
- **analyze-icons-accurate.js** - Analyze icon usage in apps (`pnpm analyze-icons`)
  - Scans app source for icon usage
  - Helps identify unused icons
  - Can analyze all apps with `pnpm analyze-icons:all`

### 🌍 Internationalization (i18n)
- **check-i18n.mjs** - Validate translation completeness (`pnpm check:i18n`)
  - Checks for missing translation keys
  - Validates all locale files against reference keys
  - Supports JSON output with `--json` flag
  - Used in GitHub Actions CI pipeline
  
- **i18n-add.mjs** - Add new translation keys with AI translations (`pnpm i18n:add`)
  - Automatically translates new keys to all supported languages
  - Updates TypeScript types (TranslationSchema)
  - Interactive prompts for existing keys
  - See `i18n-README.md` for detailed usage

### 🚀 Netlify Build Optimization

These scripts prevent unnecessary rebuilds in our monorepo setup:

- **ignore-build-cards.sh**
- **ignore-build-radio.sh**
- **ignore-build-tiko.sh**
- **ignore-build-timer.sh**
- **ignore-build-todo.sh**
- **ignore-build-type.sh**
- **ignore-build-ui-docs.sh**
- **ignore-build-yes-no.sh**

Each script monitors changes in:
- The specific app directory (`apps/{app-name}/`)
- Shared UI package (`packages/ui/`)
- Shared core package (`packages/core/`) 
- Root dependencies (`package.json`, `pnpm-lock.yaml`)

**Exit Codes:**
- `exit 0` = Skip build (no relevant changes)
- `exit 1` = Proceed with build (changes detected)

## 📝 Documentation
- **README.md** - This file
- **i18n-README.md** - Detailed documentation for i18n scripts

## 🧹 Cleanup History

The following scripts were removed as they were deprecated or superseded:
- ~~analyze-icons-simple.js~~ → Use `analyze-icons-accurate.js`
- ~~analyze-icons.js~~ → Use `analyze-icons-accurate.js`
- ~~check-i18n-old.js~~ → Use `check-i18n.mjs`
- ~~check-i18n-simple.mjs~~ → Use `check-i18n.mjs`
- ~~serve.js~~ → Use `serve-app.js`
- ~~Translation utilities~~ → Use `i18n-add.mjs`
- ~~Migration scripts~~ → One-time use utilities

## 💡 Best Practices
1. Place temporary or experimental scripts in `scripts/.temp/`
2. Document any new permanent scripts in this README
3. Use descriptive names that indicate the script's purpose
4. Add corresponding npm scripts in root `package.json` for frequently used scripts
5. Include help text or usage examples in complex scripts