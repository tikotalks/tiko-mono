# Tiko Clock App Plan

**Date:** 2026-05-24  
**Status:** Founder-approved product direction, pending implementation decomposition  
**App slug:** `clock`  
**Canonical runtime domain:** `https://clock.tikoapps.org`  
**Development runtime domain:** `https://dev.clock.tikoapps.org`  
**Repo target:** `apps/clock`

## Founder thesis

Tiko Clock should not be a decorative wall clock clone. It should be a child-facing **time orientation surface**: a calm, glanceable way to understand *what time it is*, *what part of the day it is*, and *what happens next* without turning time into anxiety.

Timer answers: "How long until this ends?"  
Sequence answers: "What steps do I follow?"  
Clock answers: "Where am I in the day?"

That distinction matters. If Clock is just an analog/digital clock, it is not worth building. The app earns its place only if it makes abstract time emotionally legible.

## Problem statement

Many children, especially children who benefit from visual communication support, struggle with clock time because it is abstract, adult-centered, and often punitive: hurry up, wait, bedtime, school, appointment. Existing clock apps mostly optimize for adult precision or decoration. Tiko needs a clock that treats time as orientation, reassurance, and routine context.

## Target audience

- Primary: children using Tiko apps who need visual support around time, routines, waiting, and transitions.
- Secondary: caregivers/teachers who want a simple always-on time display for the child.
- Tertiary: Tiko itself as the dashboard/shell, where Clock can become a calm home-screen mode.

## Product philosophy

Clock believes:

- Time should be felt before it is calculated.
- A child should be able to understand now without reading text.
- The app should reduce time anxiety, not increase precision pressure.
- The default state should be beautiful enough to leave open.
- Adult configuration must not leak into the child surface.

Clock refuses to become:

- A calendar app.
- A scheduling system.
- A productivity dashboard.
- A notifications/reminders engine in v1.
- A second Timer.
- A complex routine builder competing with Sequence.

## Category

Accessible child-facing time orientation utility.

## MVP scope

### Child surface

- Full-screen clock mode with large, calm display.
- Toggleable clock faces:
  - **Visual day arc:** morning / afternoon / evening / night bands.
  - **Digital time:** large readable time.
  - **Analog clock:** simple hands for learning clock reading.
- Optional spoken current time via existing Tiko TTS patterns, but only on explicit tap.
- Theme/color choices using Tiko UI tokens and app-local settings.
- Works immediately with device-first identity; no login wall.
- Offline-friendly after load; time display must not depend on an API.

### Caregiver/settings surface

- 12h/24h preference.
- Show/hide seconds.
- Default face selection.
- Day-part boundaries configurable in simple terms, not cron-like settings.
- Optional "current routine label" placeholder only if sourced from local static settings; no cloud routine engine in v1.

### Integration

- Add `clock` as a Tiko app metadata entry after implementation is deployable.
- Add i18n namespace `clock.*` through Lezu/Tiko fallback pattern.
- Use `clock.tikoapps.org` and `dev.clock.tikoapps.org` under existing app runtime family.
- App should be installable/PWA-capable like other Tiko apps.

## Non-goals

- No alarms in v1.
- No reminders/notifications in v1.
- No shared calendar integration.
- No parent account requirement.
- No cloud schedule storage in v1.
- No routine editing beyond simple local display settings.
- No gamification streaks, rewards, leaderboards, or urgency mechanics.

## Critical review

### Why this could fail

- If it is only a pretty clock, it duplicates native OS clocks and browser widgets.
- If it adds alarms/reminders too early, it becomes another adult productivity tool and expands permission/device complexity.
- If it overlaps Sequence, it weakens both apps.
- If settings are too configurable, caregivers will spend time designing instead of children using it.
- If it requires backend state, it violates the point of a clock: it should work instantly and locally.

### Why this is still worth doing

- Tiko already has Timer; Clock is the missing companion for orientation rather than countdown.
- It can become an ambient home-screen mode for tablets and classrooms.
- It is technically simple enough to prove the new app bootstrap path without touching heavy data APIs.
- It gives Tiko a strong, child-friendly "now" primitive that future Sequence/Timer integrations can reference.

## Architecture direction

### App shape

- New workspace app: `apps/clock`.
- Based structurally on `apps/timer`, but not copied blindly.
- Vue 3 + Vite + TypeScript.
- Dependencies: `@tiko/ui`, `@tiko/core`, Vue Router, Pinia only if local settings require it.
- No direct Supabase runtime.
- No new Worker for v1.
- No D1 schema for v1.
- Settings should be local-first. If shared settings later exist behind `app-api`, that should be a v2 integration.

### Suggested files

- `apps/clock/package.json`
- `apps/clock/project.json`
- `apps/clock/index.html`
- `apps/clock/vite.config.ts`
- `apps/clock/src/App.vue`
- `apps/clock/src/main.ts`
- `apps/clock/src/views/ClockView.vue`
- `apps/clock/src/components/ClockFaceDigital.vue`
- `apps/clock/src/components/ClockFaceAnalog.vue`
- `apps/clock/src/components/DayArc.vue`
- `apps/clock/src/components/ClockSettings.vue`
- `apps/clock/src/composables/useCurrentTime.ts`
- `apps/clock/src/composables/useClockSettings.ts`
- `apps/clock/src/models/clock.model.ts`
- tests for time formatting, day-part calculation, and the child surface rendering.

### Scaling assumptions

- Client-only clock logic; effectively zero marginal backend cost.
- i18n and TTS are the only service dependencies.
- If future routine integration is added, it must consume Sequence/app-api contracts rather than invent its own schedule database.

### Security/privacy

- No personal data required for v1.
- No location/timezone API calls unless user explicitly opts into timezone features; default uses device timezone.
- No notification permissions in v1.
- No audio autoplay.

## UX doctrine

- One screen must be useful before any settings are opened.
- The child should never see account/auth language.
- Time should be calm: avoid red warning states, blinking urgency, and countdown panic.
- Large touch targets; works from across the room.
- Text is optional where pictorial time can do the job.
- Motion should be slow and respectful of reduced-motion settings.
- The app should degrade to digital time if advanced visuals fail.

## Implementation sequence

1. Create `apps/clock` from the simplest Timer/Yes-No app shell pattern.
2. Add deterministic local clock composables with unit tests.
3. Build the three clock faces: day arc, digital, analog.
4. Add local settings and persistence.
5. Wire i18n namespace/fallbacks.
6. Validate app build/typecheck/test.
7. Add app metadata to the Tiko dashboard only after `clock` is buildable.
8. Add Cloudflare Pages/dev-domain deployment config and ADR.
9. Live smoke `dev.clock.tikoapps.org` before considering production domain binding.

## Acceptance criteria

- `pnpm --filter clock typecheck` passes.
- `pnpm --filter clock test` passes.
- `pnpm --filter clock build` passes.
- App opens without login or parent setup.
- Current time updates accurately without visible drift during normal use.
- 12h/24h formatting is covered by tests.
- Day-part calculation is covered by tests.
- No `supabase` imports in `apps/clock`.
- No network call is required to render the default clock.
- `clock.*` translation keys are present in the fallback path.
- Dev deployment smoke verifies visible day arc/digital/analog mode and no fatal console errors.

## Founder veto points

Do not proceed if the implementation turns Clock into:

- alarms/reminders first,
- a calendar,
- a routine database,
- a parent-first configuration surface,
- or a clone of the existing Timer app.

The app should feel like a quiet object in the room, not another management tool.
