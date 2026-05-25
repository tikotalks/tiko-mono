# Tiko Clock Implementation Mini-Spec

**Date:** 2026-05-25
**Status:** Implementation-ready handoff for `apps/clock`
**Owner:** Hermio / Founder architecture
**Next implementer:** Herma
**App slug:** `clock`
**Runtime domains:** `dev.clock.tikoapps.org` first; `clock.tikoapps.org` only after explicit production approval
**Grounding docs:**

- `docs/plans/2026-05-24-tiko-clock-app.md`
- `docs/adrs/2026-05-24-clock-app-domain.md`
- `docs/research/2026-05-24-clock-learning-research.md`
- `AGENTS.md`

## 1. Founder boundary

Clock v1 is a clock-reading learning app for Sil's son. It is not a passive clock clone, not Timer v2, not an alarm app, not a schedule app, and not a parent-first setup flow.

The implementation should make analog time understandable through manipulation, staged lessons, tolerant practice, and explanatory feedback. If the app only displays the current time beautifully, it has failed.

## 2. App pattern to copy

Copy the shell pattern from `apps/yes-no`, not `apps/timer`.

Why `yes-no`:

- It is a small child-facing app with `skipAuth: true` in `tiko.config.ts`.
- It uses a single root route through `createAppRouter`.
- It wraps normal routes in `TFramework` without forcing a login wall.
- It has local app/store patterns without inheriting Timer's countdown concepts.
- It already includes `bemm` and `open-icon`, matching the style expectations for a new child app.

Borrow from `timer` only where useful for existing app package/project/vite script shape. Do not copy Timer domain logic, countdown state, timer settings, play/pause controls, alarms, or time-duration language.

Minimum scaffold to mirror:

- `apps/yes-no/package.json` with name changed to `clock` and description changed to `Tiko Clock - Clock-reading learning app`.
- `apps/yes-no/project.json` with Nx project name `clock`, source root `apps/clock/src`, and dev port `3012` unless another port is assigned before implementation.
- `apps/yes-no/vite.config.ts` with `appName: 'clock'`, `appId: 'clock'`, PWA metadata for Clock, and `i18nConfig` preserving existing excludes.
- `apps/yes-no/vitest.config.ts` / `vitest.setup.ts` pattern.
- `apps/yes-no/src/main.ts` bootstrap pattern with Pinia, router, device-first auth storage initialization only if required by current app shell conventions, and no login wall.
- `apps/yes-no/src/router/index.ts` `createAppRouter` pattern.
- `apps/yes-no/tiko.config.ts` pattern with `auth.skipAuth: true` and `i18n.categories: ['common', 'clock']`.

## 3. V1 route map

Keep routing intentionally small. The mode menu is part of the child flow, not a separate dashboard.

Routes:

1. `/`
   - Name: `ClockHome`
   - Component: `ClockLearningView.vue`
   - Purpose: default child surface with stage selector, mode menu, active practice/lesson/explore panel, and settings access through the framework settings slot.

2. `/auth/callback`
   - Only include if the copied app shell requires it for framework compatibility.
   - It must not create a login wall and must not be part of the default child flow.

Do not add routes for alarms, reminders, calendar, schedules, reports, account setup, or parent onboarding in v1.

## 4. Proposed file map

Create only `apps/clock` files plus the minimal shared metadata needed after the app builds.

### App shell

- `apps/clock/package.json`
- `apps/clock/project.json`
- `apps/clock/index.html`
- `apps/clock/vite.config.ts`
- `apps/clock/vitest.config.ts`
- `apps/clock/vitest.setup.ts`
- `apps/clock/tiko.config.ts`
- `apps/clock/src/main.ts`
- `apps/clock/src/App.vue`
- `apps/clock/src/router/index.ts`
- `apps/clock/src/vite-env.d.ts`

### Views

- `apps/clock/src/views/ClockLearningView.vue`
  - Owns the child-facing page state: selected stage, selected mode, current prompt, feedback, and celebration event.
  - Uses components below; keep it orchestration-only.

### Components

- `apps/clock/src/components/ClockModeMenu.vue`
  - Child chooses Learn, Set the clock, Read the clock, Match, or Explore.
  - Also exposes the current learning stage selector, with Full hours prominent first.

- `apps/clock/src/components/LearningClock.vue`
  - Composes analog face, digital mirror, prompt, feedback, and action controls.

- `apps/clock/src/components/AnalogClockFace.vue`
  - Renders the clock face, numbers, hands, optional minute labels, optional quarter overlays, and hand labels.
  - Handles pointer/touch/keyboard-step interaction by emitting normalized time/angle changes.
  - Must implement geared behavior through composable state, not visual hacks.

- `apps/clock/src/components/DigitalTimeMirror.vue`
  - Shows 12h/24h digital mirror when scaffold setting is enabled.
  - Color/shape treatment should connect hour value to hour hand and minute value to minute hand.

- `apps/clock/src/components/ClockLessonCard.vue`
  - Shows tiny demonstrations and explanations for Learn mode.
  - One concept at a time.

- `apps/clock/src/components/ClockPracticePrompt.vue`
  - Shows target time, answer choices where relevant, check/continue controls, and feedback.
  - No punitive red failure state.

- `apps/clock/src/components/ClockMatchBoard.vue`
  - Supports Match mode with small card pairs: analog clock, digital time, spoken phrase.
  - Keep v1 limited to the active stage's time set.

- `apps/clock/src/components/ClockScaffoldControls.vue`
  - Toggles digital mirror, minute labels, quarter slices, hand labels, narration, reduced celebration.
  - These are local-only settings.

- `apps/clock/src/components/ClockCelebration.vue`
  - Fireworks/confetti-like celebration shown only on accepted answers.
  - Must respect `prefers-reduced-motion` and a local reduced celebration setting.

### Composables

- `apps/clock/src/composables/useClockHands.ts`
  - Source of truth for selected time as minutes since 12:00.
  - Converts between hand angles and time.
  - Enforces geared hand behavior: moving the minute hand updates the hour hand proportionally.

- `apps/clock/src/composables/useClockLessons.ts`
  - Defines stages, lesson copy keys, prompts, allowed target times, and scaffold defaults.

- `apps/clock/src/composables/useClockPractice.ts`
  - Generates prompts for Set the clock, Read the clock, and Match.
  - Validates answers using stage/mode tolerances.
  - Emits feedback categories and celebration triggers.

- `apps/clock/src/composables/useClockProgress.ts`
  - Stores local-only progress and settings in browser storage.
  - No cloud sync in v1.

- `apps/clock/src/composables/useReducedCelebration.ts`
  - Combines local reduced celebration preference with `prefers-reduced-motion`.

### Models/utilities

- `apps/clock/src/models/clock.model.ts`
  - Types for `ClockStage`, `ClockMode`, `ClockPrompt`, `ClockTime`, `ClockSettings`, `ValidationResult`, `MisconceptionKind`.

- `apps/clock/src/utils/clock-time.ts`
  - Pure time math: normalize minutes, add minutes, format 12h/24h, phrase keys.

- `apps/clock/src/utils/clock-geometry.ts`
  - Pure geometry: time to angles, angles to nearest staged time, pointer position to angle.

- `apps/clock/src/utils/clock-validation.ts`
  - Pure validation and misconception classification.

- `apps/clock/src/utils/clock-prompts.ts`
  - Pure prompt generation by stage and mode.

## 5. V1 learning stages

The child chooses a mode, but the chosen stage constrains the time set and scaffolds. V1 must include Full hours first and at least o'clock plus half-past stages. Quarters and five-minute intervals may be present if the implementation stays small, but they must not delay a complete o'clock/half-past flow.

### Stage A — Anatomy

Purpose: learn the parts before answering.

- Clock face.
- Numbers 1-12.
- Short hour hand.
- Long minute hand.
- Tap/select each part to show/hear what it means.
- No score and no right/wrong loop.

### Stage B — Full hours / o'clock

This is the first real practice stage.

- Target times: `1:00` through `12:00`.
- Minute hand: at 12.
- Hour hand: exactly on the hour.
- Required prompt examples:
  - Learn: “When the long hand points to 12, it is o'clock.”
  - Set the clock: “Set 4 o'clock.”
  - Read the clock: show `4:00`, child chooses “4 o'clock”.
  - Match: pair `4:00`, analog `4:00`, and spoken “4 o'clock”.
  - Explore: drag/step hands and see “4:00 / 4 o'clock”.

### Stage C — Half past

Required in v1.

- Target times: `1:30` through `12:30`.
- Minute hand: at 6.
- Hour hand: halfway between current hour and next hour.
- Required teaching point: `3:30` is still in the 3 hour even though the short hand is moving toward 4.
- Required prompt examples:
  - Learn: “When the long hand points to 6, that means 30 minutes.”
  - Set the clock: “Set half past 3.”
  - Read the clock: show `3:30`, child chooses “half past 3”.
  - Match: pair `3:30`, analog `3:30`, and spoken “half past 3”.
  - Explore: moving minute hand to 6 visibly moves hour hand halfway toward the next number.

### Stage D — Quarter past / quarter to

Optional stretch for v1 only after A-C are complete and tested.

- Introduce quarter past before quarter to.
- Use visual quarter overlays.
- Always show digital equivalent at first.

### Stage E — Five-minute intervals

Optional stretch for v1 only after A-C are complete and tested.

- Target times at 5-minute increments.
- Show outer minute labels.
- Explicitly teach that the big number means minutes for the long hand.

No one-minute precision or elapsed-time word problems in v1 unless explicitly re-approved after the core app works.

## 6. V1 mode definitions

### Mode menu

The default first screen inside `/` must let the child choose what they want to do. Do not hide the whole experience behind parent configuration.

Order:

1. Full hours / o'clock stage as the default selected stage.
2. Mode cards: Learn, Set the clock, Read the clock, Match, Explore.
3. Small stage switcher: Anatomy, Full hours, Half past, then optional locked/not-yet labels for Quarters and Five minutes if not built.

### Learn

- Short demonstration for the selected stage.
- No score.
- One concept per card.
- Child can replay narration explicitly; no audio autoplay.
- Includes a “try it” action that moves to Set the clock for the same stage.

### Set the clock

- App gives a target time.
- Child moves hands through drag, tap, keyboard, or step controls.
- Check accepts answers by tolerant validation.
- Correct/accepted answer triggers celebration and then a “next” prompt.
- Close answer gives a hint, not failure.

### Read the clock

- App shows an analog clock.
- Child chooses from 2-4 options depending on stage.
- Full-hour options should include nearby hour distractors.
- Half-past options should include the common misconception of choosing the next hour, so feedback can teach it.

### Match

- Child matches analog, digital, and spoken phrase cards.
- V1 can keep the board tiny: 3-4 pairs.
- Cards must be generated only from the selected stage's allowed times.

### Explore

- Free clock manipulative.
- No score.
- Shows optional digital/spoken mirror and scaffolds.
- Must use the same geared hand model as practice modes.

## 7. Time model and geared hand behavior

Represent analog learning time as integer minutes since 12:00, normalized to `0..719`.

Rules:

- Hour hand angle = `(minutesSince12 / 720) * 360`.
- Minute hand angle = `(minutesSince12 % 60 / 60) * 360`.
- At `3:00`, hour hand angle is `90deg`, minute hand angle is `0deg`.
- At `3:30`, hour hand angle is `105deg`, minute hand angle is `180deg`.
- Moving the minute hand must update `minutesSince12`, which automatically moves the hour hand proportionally.
- Moving the hour hand may snap based on current stage:
  - Full hours: nearest hour, minute = 0.
  - Half past: nearest half-hour, minute = 0 or 30 depending on interaction target.
  - Explore: allow free minute increments, but keep hour hand geared.

Implementation warning: never render the short hand as fixed on the hour while minutes change. That teaches the wrong model.

## 8. Tolerant validation rules

Validation should be generous, stage-aware, and concept-aware. It should return one of:

- `accepted`: correct enough; trigger celebration.
- `close`: near the target; show a gentle hint.
- `needs-help`: not close; show explanatory feedback.

Suggested baseline tolerances:

### Full hours / o'clock

Accepted:

- minute hand within 5 minutes of `:00`, accounting for wraparound, and
- hour hand/time resolves to target hour.

Close:

- minute hand within 10 minutes of `:00`, or
- hour is adjacent but minute hand is correctly at 12.

Common hints:

- If minute hand is not near 12: “For o'clock, the long hand points to 12.”
- If hour hand is on the wrong number: “The short hand chooses the hour.”

### Half past

Accepted:

- minute hand within 5 minutes of `:30`, and
- hour value resolves to the target hour, with the short hand visually between target and next hour.

Close:

- minute hand within 10 minutes of `:30`, or
- minute hand is at 6 but hour hand appears near the next hour.

Common hints:

- If minute hand is not near 6: “Half past means the long hand points to 6.”
- If child chooses next hour for `3:30`: “At half past 3, the short hand is going toward 4, but the hour is still 3.”
- If hour hand remains exactly on the hour at `:30`: “At half past, the short hand is halfway to the next number.”

### Read the clock / Match

Accepted:

- selected answer has same stage-normalized time as target.

Close:

- selected answer matches minute concept but adjacent hour, or matches hour but wrong minute concept.

No mode should require pixel-perfect dragging.

## 9. Celebration/fireworks behavior

Correct/accepted answers should trigger a short celebration moment, described as fireworks in the plan.

Requirements:

- Trigger only on transition into `accepted` for a practice prompt, not continuously while the hand remains correct.
- Keep it short: roughly 1-2 seconds.
- Do not block the child from continuing if animation is disabled.
- Respect `prefers-reduced-motion` and local reduced celebration setting:
  - default: brief fireworks/confetti burst;
  - reduced: static sparkle/checkmark state and gentle color pulse;
  - no audio autoplay.
- Celebration should advance to the next prompt only after the child taps “next” or after a short, configurable delay. Prefer explicit “next” for accessibility if uncertain.

## 10. Local-first and no-backend boundaries

V1 must remain client-local.

Allowed:

- `@tiko/core` and `@tiko/ui` app shell utilities.
- Local browser storage for progress/settings.
- Existing translation fallback/init path.
- Static assets and PWA/service-worker behavior used by existing apps.

Forbidden in `apps/clock` v1:

- `supabase` imports or runtime clients.
- A new Cloudflare Worker.
- A new D1 database or migration.
- Network calls required for default Learn, Set the clock, Read the clock, Match, or Explore flows.
- Alarms, reminders, notifications, notification permissions, calendar integrations, or schedule storage.
- Passwords, account creation, parent setup before first use, or login wall.

Dashboard metadata must not be added until `apps/clock` builds and passes dev smoke. If metadata is added later, keep it minimal and app-scoped.

## 11. Styling and UI constraints

- Vue components use `<script setup lang="ts">`.
- Styles use unscoped `<style lang="scss">`.
- Use `useBemm`/BEM class generation for component classes.
- No emojis in UI copy or controls.
- Use `open-icon` only if icons are needed; verify actual icon names before implementation.
- Large touch targets.
- Color plus shape/label, never color alone.
- No punitive red failure state.
- No speed pressure.
- Drag must not be the only input; provide tap/step alternatives.

## 12. Test plan

Pure utilities should be tested first before UI composition.

Required tests:

- `apps/clock/src/utils/clock-geometry.spec.ts`
  - `3:00` maps to hour `90deg`, minute `0deg`.
  - `3:30` maps to hour `105deg`, minute `180deg`.
  - Minute hand movement updates hour hand proportionally through `minutesSince12`.
  - Angle-to-time conversion handles wraparound near 12.

- `apps/clock/src/utils/clock-time.spec.ts`
  - Normalize negative/overflow minutes into `0..719`.
  - Format 12h and 24h digital mirrors.
  - Phrase keys for o'clock and half-past stages.

- `apps/clock/src/utils/clock-validation.spec.ts`
  - Full-hour accepted tolerance around `:00`.
  - Full-hour close tolerance around `:00`.
  - Half-past accepted tolerance around `:30`.
  - Half-past misconception for choosing the next hour.
  - No pixel-perfect requirement.

- `apps/clock/src/utils/clock-prompts.spec.ts`
  - Full-hour target generation only creates `:00` times.
  - Half-past target generation only creates `:30` times.
  - Read mode distractors stay inside the selected stage.
  - Match mode cards pair analog/digital/spoken representations of the same time.

- `apps/clock/src/components/ClockLearningView.spec.ts`
  - Renders without auth/login wall.
  - Shows mode menu by default.
  - Full hours is selected/prominent by default.
  - Accepted Set the clock answer triggers one celebration event.
  - Reduced-motion setting suppresses motion-heavy fireworks.

## 13. Validation commands for Herma

Run from repo root.

After scaffolding but before dashboard metadata:

```bash
pnpm --filter clock typecheck
pnpm --filter clock test -- --run
pnpm --filter clock build
```

Boundary checks:

```bash
rg "supabase|createClient|D1|wrangler|alarm|reminder|notification|calendar|schedule" apps/clock
rg "skipAuth" apps/clock/tiko.config.ts apps/clock/src/App.vue
```

Expected boundary result:

- No Supabase client/import references.
- No Worker/D1/wrangler configuration for `apps/clock`.
- No alarm/reminder/notification/calendar/schedule product code.
- `skipAuth: true` present in app config.

Smoke checks after a dev deployment exists:

- Open `https://dev.clock.tikoapps.org`.
- Verify no login wall appears before the child can start.
- Verify mode menu appears.
- Verify Full hours / o'clock is the first practice path.
- Verify Set the clock accepts a near-correct `4:00` and triggers celebration.
- Verify half-past shows the short hand between numbers.
- Verify Explore works after load without network dependency.
- Verify browser console has no fatal errors.

## 14. Implementation order

1. Scaffold `apps/clock` from `apps/yes-no` shell.
2. Add `clock` Nx/project/package config without dashboard metadata.
3. Add models and pure utilities for time, geometry, prompt generation, and validation.
4. Write required utility tests and make them pass.
5. Build `AnalogClockFace` against `useClockHands` with geared hour-hand behavior.
6. Build `ClockModeMenu` and `ClockLearningView` with Full hours default.
7. Implement Set the clock for Full hours.
8. Add tolerant validation and one-shot celebration.
9. Add Learn/Read/Match/Explore for Full hours.
10. Add Half past stage across Learn, Set the clock, Read the clock, Match, Explore.
11. Add local scaffold/settings storage.
12. Add `clock.*` fallback translation keys.
13. Run validation commands.
14. Only after build/test/typecheck pass, add minimal dashboard metadata and smoke it.

## 15. Handoff acceptance criteria

Herma's implementation is not complete until:

- `apps/clock` exists and builds.
- Child can enter without login or parent setup.
- Mode menu exists.
- Full hours / o'clock is first and working.
- Half-past is implemented and teaches the between-number hour hand.
- Learn, Set the clock, Read the clock, Match, and Explore exist for required stages.
- Moving minutes moves the hour hand proportionally.
- Validation is tolerant and tested.
- Accepted answers trigger accessible celebration.
- No Supabase/new Worker/D1/alarm/reminder/calendar/schedule boundary is violated.
- Validation commands pass and results are included in handoff.
