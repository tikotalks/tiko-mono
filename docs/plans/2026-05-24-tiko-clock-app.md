# Tiko Clock App Plan

**Date:** 2026-05-24
**Status:** Founder-corrected after user clarification and research
**App slug:** `clock`
**Canonical runtime domain:** `https://clock.tikoapps.org`
**Development runtime domain:** `https://dev.clock.tikoapps.org`
**Repo target:** `apps/clock`
**Research:** `docs/research/2026-05-24-clock-learning-research.md`

## Founder correction

Sil clarified the essential job: **his son needs to learn clock reading**.

Therefore Clock is not primarily an ambient time-orientation app. That was too broad and too passive. Tiko Clock is primarily a **clock-reading learning app**: a gentle, accessible, manipulative-first tutor for learning analog clocks.

A calm live clock/explore mode still belongs in the product, but only as supporting material. The main product must teach.

## Founder thesis

Tiko Clock should teach a child to understand an analog clock by making the relationship between hands, numbers, minutes, and spoken time visible, touchable, and repeatable.

The app should feel like a patient clock teacher, not a quiz machine.

Timer answers: “How long until this ends?”
Sequence answers: “What steps do I follow?”
Clock answers: “Can I read this clock?”

If Clock does not improve actual clock-reading skill, it has failed.

## Problem statement

Analog clocks are deceptively hard. Children must understand two hands with different meanings, numbers that represent both hours and five-minute multiples, an hour hand that moves gradually between numbers, and language like “half past” or “quarter to.” Many clock apps collapse this into shallow quizzes. Many physical clocks need adult guidance. Tiko needs a focused, accessible app that teaches the concept step by step.

## Target audience

- Primary: Sil's son, as a real child who needs to learn clock reading.
- Secondary: children using Tiko apps who benefit from visual, audio, repetitive, low-pressure learning.
- Tertiary: caregivers/teachers who want a simple private practice tool without ads, accounts, or clutter.

## Product philosophy

Clock believes:

- Clock reading is a concept, not a guessing game.
- The child should touch time, not just answer questions about it.
- The hour hand must move realistically; wrong visuals teach wrong ideas.
- Feedback should explain the mistake kindly.
- Mastery should be based on understanding, not speed.
- A child should be able to repeat without shame.

Clock refuses to become:

- A decorative wall clock clone.
- A generic calendar/schedule app.
- A productivity dashboard.
- A notification/reminder system in v1.
- A speed-pressure math game.
- An ad/subscription learning platform.
- A parent-first configuration product.

## Research-backed learning progression

Use this progression unless real child testing shows a better path.

### Stage 0 — Time in the day

- Morning / afternoon / evening / night.
- Match routine icons to broad day parts.
- Use only as context and motivation, not as the main product.

### Stage 1 — Clock anatomy

- Clock face.
- Numbers 1–12.
- Short hour hand.
- Long minute hand.
- Tap each part to hear/see what it means.

### Stage 2 — O'clock

- Minute hand at 12.
- Hour hand exactly on the hour.
- Match analog, digital, and spoken phrase.

### Stage 3 — Half past

- Minute hand at 6.
- Hour hand halfway between numbers.
- Explicitly teach that 3:30 is still in the 3 hour even though the short hand moves toward 4.

### Stage 4 — Quarter past / quarter to

- Use shaded quarter overlays.
- Teach quarter past before quarter to.
- Always pair phrase with digital notation first.

### Stage 5 — Five-minute intervals

- Add outer minute labels: 5, 10, 15, 20...
- Teach skip-counting by fives around the clock.
- Explain that a big number means different things depending on which hand points to it.

### Stage 6 — One-minute precision

- Add small ticks only after five-minute intervals are understood.
- Avoid visual clutter.

### Stage 7 — Elapsed time

- Use visual timelines and clock animation.
- Not required for v1.

## MVP scope

### Child learning surface

- Large interactive analog clock.
- Kid chooses the learning mode before the round starts. Do not force a hidden curriculum path only adults control.
- Realistic/geared hand behavior: moving the minute hand moves the hour hand proportionally.
- Color/shape-coded hands:
  - hour hand and hour value visually linked,
  - minute hand and minute value visually linked.
- Digital time mirror with matching color treatment when scaffolding is enabled.
- Spoken phrase support via explicit tap/replay.
- Progression through at least:
  - clock anatomy,
  - full hours / o'clock,
  - half past.
- Primary challenge loop:
  1. Child selects a mode, for example **Full hours**.
  2. App gives a target time, for example “4 o'clock”.
  3. Child moves the clock hands to set that time.
  4. App accepts the answer with a generous tolerance appropriate to the mode.
  5. If correct: fireworks/celebration, then next prompt.
  6. If close: gentle hint, not failure.
- Multiple learning modes:
  - **Learn:** tiny demonstration of a concept.
  - **Set the clock:** child receives a target time and moves hands to match.
  - **Read the clock:** app shows a clock; child chooses/says/matches the time.
  - **Match:** pair analog clocks with digital/spoken times.
  - **Explore:** free clock manipulative with optional scaffolds.
- Immediate explanatory feedback:
  - “The long hand tells minutes.”
  - “When the long hand points to 12, it is o'clock.”
  - “When the long hand points to 6, that means 30 minutes.”
  - “At half past, the short hand is halfway to the next number.”
- No speed pressure by default.
- Works immediately with device-first identity; no login wall.
- Offline-friendly after load; default learning/explore flow must not require an API.

### Caregiver/settings surface

- Choose starting level.
- Reset local progress.
- Toggle audio narration.
- Toggle scaffolds:
  - show digital time,
  - show minute labels,
  - show quarter slices,
  - show hand labels.
- 12h/24h preference for digital mirror.
- Local progress only in v1.

### Integration

- Add i18n namespace `clock.*` through Lezu/Tiko fallback pattern.
- Add `clock` to dashboard metadata only after the app builds and dev smoke passes.
- Use `clock.tikoapps.org` and `dev.clock.tikoapps.org` under the app runtime family.
- App should be installable/PWA-capable like other Tiko apps.

## Non-goals

- No alarms in v1.
- No reminders in v1.
- No notifications in v1.
- No calendar integration in v1.
- No cloud schedule storage in v1.
- No cloud progress sync in v1.
- No parent account requirement.
- No gamified streak pressure.
- No worksheet-first quiz UI.
- No elapsed-time word-problem engine in v1 unless the basics are already implemented and tested.

## Critical review

### Why this could fail

- If it is just a pretty clock, it will not teach Sil's son anything.
- If it becomes a quiz machine, it will test without teaching.
- If it starts with full analog complexity, it will overload the learner.
- If the hour hand does not move proportionally, it will teach a false model.
- If feedback only says right/wrong, it will miss the actual misconceptions.
- If it adds alarms/reminders too early, it becomes an adult tool instead of a learning app.

### Why this is worth doing

- The need is concrete and personal.
- Tiko is already visual, child-facing, and low-friction.
- A focused clock-reading tutor fits the Tiko family better than a generic clock utility.
- The app can be local-first and technically simple while still pedagogically meaningful.
- Existing competitors leave room for a gentler, more accessible, no-account, no-ad experience.

## Competitor lessons

See the research doc for details. The strongest patterns to borrow:

- Interactive analog clock manipulatives.
- Analog + digital + spoken representation.
- Color-coded hands and labels.
- Progressive stages: o'clock → half past → quarters → five minutes → minute precision.
- Geared hand behavior.
- Scaffold toggles.

Gaps Tiko should exploit:

- Less clutter than web games.
- Less account/subscription pressure than learning platforms.
- More teaching than a static manipulative.
- More conceptual feedback than simple quizzes.
- Better accessibility than drag-only games.

## Architecture direction

### App shape

- New workspace app: `apps/clock`.
- Vue 3 + Vite + TypeScript.
- Use `@tiko/ui` and `@tiko/core`.
- No direct Supabase runtime.
- No new Worker for v1.
- No D1 schema for v1.
- Local settings/progress via browser storage or existing Tiko local primitives.
- Time math must be pure/tested utilities.

### Suggested files

- `apps/clock/package.json`
- `apps/clock/project.json`
- `apps/clock/index.html`
- `apps/clock/vite.config.ts`
- `apps/clock/src/App.vue`
- `apps/clock/src/main.ts`
- `apps/clock/src/views/ClockLearningView.vue`
- `apps/clock/src/components/LearningClock.vue`
- `apps/clock/src/components/AnalogClockFace.vue`
- `apps/clock/src/components/DigitalTimeMirror.vue`
- `apps/clock/src/components/ClockLessonCard.vue`
- `apps/clock/src/components/ClockPracticePrompt.vue`
- `apps/clock/src/components/ClockScaffoldControls.vue`
- `apps/clock/src/components/ClockSettings.vue`
- `apps/clock/src/composables/useClockHands.ts`
- `apps/clock/src/composables/useClockLessons.ts`
- `apps/clock/src/composables/useClockProgress.ts`
- `apps/clock/src/models/clock.model.ts`
- `apps/clock/src/utils/time-format.ts`
- `apps/clock/src/utils/clock-geometry.ts`
- tests for hand geometry, time formatting, staged challenge generation, misconception hints, and child surface rendering.

### Core model requirements

Represent time internally as minutes since 12:00 for analog learning tasks.

Minimum utilities:

- convert hour/minute to hand angles,
- convert hand angles to nearest staged time,
- format digital 12h/24h,
- generate prompt by level/mode,
- validate answer by level/mode with generous tolerance,
- configure per-mode tolerance, for example full-hour mode should accept near-4-o'clock answers rather than requiring pixel-perfect hand placement,
- trigger a celebration event when a prompt is accepted,
- detect likely mistake category:
  - hand confusion,
  - minute-number literal reading,
  - hour-hand-between-numbers confusion,
  - quarter-to confusion.

### Scaling assumptions

- Client-only v1; effectively zero backend cost.
- TTS/i18n are optional service dependencies, with local fallback text.
- Future sync can use app-api, but do not design it into v1.

### Security/privacy

- No personal data required for v1.
- Progress stays local.
- No external child-facing links.
- No notification permissions.
- No audio autoplay.

## UX doctrine

- Open directly into learning, not settings.
- One concept per screen.
- Demonstrate before asking.
- Let the child manipulate the clock.
- Large touch targets.
- Drag must not be the only input; include tap/step alternatives.
- No punitive sounds, red failure states, or speed pressure.
- Every wrong answer should teach one thing.
- Scaffolds disappear gradually, not abruptly.
- Reduced-motion and low-sensory modes must be respected.

## Implementation sequence

1. Add/commit this research-backed direction before scaffolding.
2. Create `apps/clock` from the simplest current app shell pattern.
3. Implement pure clock math utilities with tests first.
4. Build the interactive analog clock with realistic hour-hand movement.
5. Add child-selected learning modes, starting with Full hours / Set the clock.
6. Add tolerant validation and fireworks celebration on accepted answers.
7. Add learning stages for anatomy, o'clock, and half past.
8. Add feedback/misconception hints.
9. Add local settings/progress and scaffold toggles.
10. Add i18n fallback keys.
11. Validate app build/typecheck/test.
12. Add app metadata to the Tiko dashboard only after `clock` is buildable.
13. Prepare Cloudflare Pages/dev-domain config and ADR follow-through.
14. Live smoke `dev.clock.tikoapps.org` before considering production domain binding.

## Acceptance criteria

- `pnpm --filter clock typecheck` passes.
- `pnpm --filter clock test` passes.
- `pnpm --filter clock build` passes.
- App opens without login or parent setup.
- Default child flow teaches clock reading, not just displays current time.
- Child can choose a learning mode, including Full hours / Set the clock.
- Full-hours mode can prompt “4 o'clock” and let the child move the clock to match.
- Validation is intentionally tolerant and not pixel-perfect.
- Correct answers trigger a fireworks/celebration moment and advance to the next prompt.
- Anatomy, o'clock, and half-past stages exist in v1.
- Hour hand moves proportionally as minutes change.
- 12h/24h formatting is covered by tests.
- Hand-angle/time conversion is covered by tests.
- Half-past hour-hand behavior is covered by tests.
- Misconception-specific feedback is covered by tests.
- No `supabase` imports in `apps/clock`.
- No network call is required for the default learning/explore flow.
- `clock.*` translation keys are present in the fallback path.
- Dev deployment smoke verifies visible learning mode, explore mode, and no fatal console errors.

## Founder veto points

Do not proceed if the implementation turns Clock into:

- a passive time-orientation display first,
- a decorative clock,
- an alarm/reminder app,
- a calendar,
- a parent-first dashboard,
- a speed quiz,
- or a clone of Timer.

The app should make clock reading learnable for a real child.
