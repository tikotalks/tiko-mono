# Unified Commands Documentation

This document describes the new unified command system for the Tiko monorepo, which replaces app-specific scripts with flexible commands that work with or without arguments.

## 🎯 Overview

All commands now support two modes:
1. **Interactive Mode** - Run command without arguments to select from a list using **arrow keys**
2. **Direct Mode** - Pass app name as argument to run immediately

### ✨ Interactive Features
- **Arrow key navigation** (↑/↓) - No more typing numbers!
- **Visual selection indicator** (❯) - Clear highlight of current selection
- **Descriptions** - See app descriptions and versions
- **"All" option** - Build/test everything with first option
- **Ctrl+C to exit** - Clean cancellation at any time

## 📋 Available Commands

### `pnpm serve [app-name]`

Starts the development server for an app.

```bash
# Interactive mode - shows list of apps to choose from
pnpm serve

# Example output:
# 🚀 Select an app to serve:
# 
# ❯ cards v1.0.0 - Tiko Cards - AAC communication cards
#   radio v1.0.0 - Tiko Radio - Radio streaming app
#   timer v1.0.0 - Visual timer application
#   todo v1.0.0 - Tiko Todo - Visual todo lists
#   type v1.0.0 - Type to speak application
#   
# Use arrow keys to navigate, Enter to select, Ctrl+C to exit

# Direct mode - starts specific app
pnpm serve timer
pnpm serve radio
pnpm serve cards
```

**Features:**
- Arrow key navigation in interactive mode
- Sets terminal tab name to "Tiko - [app-name]"
- Handles various name formats (timer, Timer, yes-no, yes_no)
- Shows app versions and descriptions

### `pnpm build [app-name|all]`

Builds app(s) for production.

```bash
# Interactive mode - select what to build
pnpm build

# Example output:
# 🔨 Select what to build:
# 
# ❯ All Apps - Build all applications
#   cards v1.0.0 - Tiko Cards - AAC communication cards
#   radio v1.0.0 - Tiko Radio - Radio streaming app
#   timer v1.0.0 - Visual timer application
#   
# Use arrow keys to navigate, Enter to select, Ctrl+C to exit

# Direct mode
pnpm build all      # Build everything
pnpm build timer    # Build specific app
pnpm build radio
```

**Note:** Interactive mode shows "All Apps" as the first option, making it easy to build everything.

### `pnpm test [project-name|all]`

Runs tests for app(s) or package(s).

```bash
# Test all projects
pnpm test
pnpm test all

# Test specific project
pnpm test timer
pnpm test core
pnpm test ui
```

### `pnpm ios <build|open> [app-name]`

Manages iOS builds and development.

```bash
# Build all apps for iOS
pnpm ios build
pnpm ios build all

# Build specific app for iOS
pnpm ios build timer
pnpm ios build radio

# Open app in Xcode (interactive)
pnpm ios open

# Open specific app in Xcode
pnpm ios open timer
```

### `pnpm analyze-icons [app-path]`

Analyzes icon usage for tree-shaking optimization.

```bash
# Analyze specific app
pnpm analyze-icons apps/radio

# Analyze all apps
pnpm analyze-icons:all
```

## 🗑️ Removed Commands

The following app-specific commands have been removed in favor of the unified system:

### Old serve commands:
- `serve:timer` → Use `pnpm serve timer`
- `serve:radio` → Use `pnpm serve radio`
- `serve:cards` → Use `pnpm serve cards`
- `serve:yes-no` → Use `pnpm serve yes-no`
- `serve:todo` → Use `pnpm serve todo`
- `serve:type` → Use `pnpm serve type`
- `serve:tiko` → Use `pnpm serve tiko`
- `serve:ui` → Use `pnpm serve ui-docs`

### Old iOS commands:
- `ios:build:timer` → Use `pnpm ios build timer`
- `ios:build:radio` → Use `pnpm ios build radio`
- `ios:build:cards` → Use `pnpm ios build cards`
- `ios:open:timer` → Use `pnpm ios open timer`
- `ios:open:radio` → Use `pnpm ios open radio`
- etc.

## 🔧 Script Implementation

All unified scripts are located in the `scripts/` directory:

- `scripts/serve-simple.js` - Development server management
- `scripts/build-app.js` - Build management
- `scripts/test-app.js` - Test runner
- `scripts/ios-app.js` - iOS build and development
- `scripts/analyze-icons-accurate.js` - Icon usage analysis

## 💡 Benefits

1. **Cleaner package.json** - Reduced from 50+ scripts to ~15
2. **Consistent interface** - All commands work the same way
3. **Flexible usage** - Interactive or direct mode
4. **Better discovery** - Interactive mode shows available options
5. **Easy to extend** - Add new apps without updating package.json

## 🚀 Examples

### Development Workflow

```bash
# Start development (interactive)
pnpm serve
# Select: 5) radio

# Or start directly
pnpm serve radio

# Build for production
pnpm build radio

# Test the app
pnpm test radio
```

### iOS Development

```bash
# Build for iOS
pnpm ios build radio

# Open in Xcode
pnpm ios open radio
```

### Full Build Process

```bash
# Build all apps
pnpm build all

# Build all for iOS
pnpm ios build all

# Run all tests
pnpm test all
```

## 🔍 App Name Resolution

The scripts intelligently handle various name formats:

- `timer` → timer
- `Timer` → timer
- `yes-no` → yes-no
- `yes_no` → yes-no
- `yesno` → yes-no (if unambiguous)

## 🛠️ Maintenance

To add a new app, simply create it in the `apps/` directory with proper `package.json` scripts. The unified commands will automatically detect it - no need to update the root package.json!

## 📝 Migration Guide

For CI/CD scripts, update as follows:

```yaml
# Old
- run: pnpm serve:timer

# New
- run: pnpm serve timer

# Old
- run: pnpm ios:build:timer

# New  
- run: pnpm ios build timer
```

The new system is fully backward compatible with automation tools while providing a much better developer experience! 🎉