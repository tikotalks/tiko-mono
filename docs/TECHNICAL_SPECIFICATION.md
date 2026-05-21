# Tiko Technical Specification

## Status

This document consolidates the original Tiko product/spec documents, the current repo shape, and the clean rebuild doctrine.

The user-provided legacy spec correctly describes the app family and early stack, but the target architecture supersedes the legacy backend/pnpm/Nx assumptions: Tiko is moving toward a clean Cloudflare-native runtime with custom device-first identity.

## Product definition

Tiko is a free, open-source suite of AAC and child learning apps.

Primary users:

- children with speech/language challenges;
- caregivers and parents;
- speech therapists and educators;
- contributors: translators, designers, developers, and domain experts.

Core promise:

> Open the app. Tap. Communicate.

## Apps

- **Tiko:** dashboard, app launcher, caregiver settings, parent mode, profile/device continuity.
- **Cards:** PECS-style visual cards and boards, eventually custom boards.
- **Timer:** visual countdown timer for transitions and routines.
- **Yes/No:** binary communicator for fast answers and choice-making.
- **Radio:** curated audio content.
- **Todo:** visual task/routine management.
- **Type:** typing with text-to-speech.
- **Sequence:** step-by-step visual guides.

## Core capabilities

### Required baseline

- Yes/no and binary responses.
- Needs-based icons: food, drink, toilet, tired, play, help, etc.
- Emotion/feeling boards.
- Sentence building from structured choices.
- Spoken output for selected words/sentences.
- Offline-capable use for core interactions.
- Large touch targets and readable text.
- Parent mode for settings/content/app visibility.
- Multi-language app strings and content.

### Later capabilities

- Custom boards for routines, activities, places, and personal vocabulary.
- Therapist-guided exercises and learning tools.
- Predictive communication based on local/consented patterns.
- Shared open content libraries.
- Deeper personalization: themes, avatars, layout preferences, vocabulary progression.

## Parent mode

Parent mode is for caregiver configuration, not child blocking.

Responsibilities:

- language selection;
- audio/TTS preferences;
- content/board management;
- app visibility controls;
- profile/device recovery setup;
- optional PIN protection for settings only.

## Identity model

Tiko uses a custom device-first identity model.

States:

1. **Device user**
   - auto-created;
   - no email;
   - no password;
   - enough for immediate app use.
2. **Recoverable user**
   - same user with verified email;
   - can receive magic links;
   - can recover/transfer.
3. **Claimed user on another device**
   - linked after magic-link confirmation.

Identity origin: `id.tiko.mt`.

App family: `*.tikoapps.org`.

Because these do not share a parent cookie domain, cross-app continuity must use explicit identity handshakes rather than accidental shared-cookie assumptions.

## Target stack

- Vue 3.
- TypeScript.
- Vite.
- Pinia where useful.
- SCSS + BEMM conventions.
- Tiko-specific `@tiko/ui`.
- Cloudflare Pages.
- Cloudflare Workers.
- D1.
- R2.
- KV for cache.
- Queues for slow/background work.
- Lezu i18n.
- Vitest and Playwright target.
- Capacitor for iOS.

## Explicitly deprecated from the legacy spec

- legacy backend auth/database/storage metadata as runtime infrastructure.
- Login-required flows.
- Passwords.
- Old-user/data migration requirements.
- Treating pnpm + Nx as permanent architecture. They may remain during transition, but npm workspaces/plain scripts are the target if feasible.

## Non-functional requirements

- Core apps must boot without network after initial install/cache where practical.
- Child-facing apps must tolerate missing account/email/state.
- Dangerous/admin operations must be isolated from child-facing app runtimes.
- Browser-side code must not hold privileged secrets.
- Workers must own access control and data validation.
- Every domain API must have a typed client and tests before broad replacement work.
