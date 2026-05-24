# Tiko Clock Learning Research

**Date:** 2026-05-24
**Purpose:** Correct the Tiko Clock direction from general time orientation to a primary clock-reading learning app.

## Research correction

Sil clarified the core job: **his son needs to learn clock reading**. The product should primarily teach analog clock reading, with ambient time orientation as a supporting mode only.

The earlier orientation-first framing is too broad. A calm day-orientation surface may still be useful, but it is not the main reason this app exists.

## Curriculum grounding

Clock reading is normally introduced progressively, not all at once.

Observed standards/progression:

- US Common Core Grade 1: tell/write time to hour and half-hour using analog and digital clocks.
  - Reference: `https://www.thecorestandards.org/Math/Content/1/MD/B/3/`
- US Common Core Grade 2: tell/write time to nearest five minutes and use a.m./p.m.
  - Reference: `https://www.thecorestandards.org/Math/Content/2/MD/C/7/`
- US Common Core Grade 3: tell/write time to nearest minute and solve elapsed-time word problems.
  - Reference: `https://www.thecorestandards.org/Math/Content/3/MD/A/1/`
- UK national curriculum has a similar shape: Year 1 hour/half-hour, Year 2 quarter-hour/five-minute intervals, Year 3 nearest minute and 12/24-hour clocks.
  - Verified reachable: `https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study`

Practical implication: v1 should not start with full minute precision. It should scaffold through o'clock and half-past first, then quarter and five-minute work.

## Learning progression for Tiko Clock

### Stage 0 — Time in the day

Goal: understand that time belongs to routine.

- Morning / afternoon / evening / night.
- Match routine icons to broad parts of day.
- Not the main app, but useful context for motivation.

### Stage 1 — Clock anatomy

Goal: recognize clock face, numbers, short hour hand, long minute hand.

- Name the parts.
- Tap each part to hear it named.
- Color and shape encode the hands; color must not be the only cue.

### Stage 2 — O'clock

Goal: read and set whole-hour times.

- Minute hand fixed/snaps to 12.
- Hour hand points exactly at the hour.
- Prompt forms:
  - “Set 3 o'clock.”
  - “What time is this?”
  - “Match 3:00 to the clock.”

### Stage 3 — Half past

Goal: understand `:30` and the hour hand between numbers.

- Minute hand at 6.
- Hour hand halfway between current and next hour.
- This is a major misconception zone: at 3:30, the short hand is between 3 and 4, but the hour is still 3.

### Stage 4 — Quarter past / quarter to

Goal: understand 15 and 45 minutes using visual quarters.

- Use shaded quarter slices.
- Introduce “quarter past” before “quarter to”.
- Also show digital equivalents, because phrase language is hard.

### Stage 5 — Five-minute intervals

Goal: count minutes around the clock by fives.

- Add outer minute labels: 5, 10, 15, 20...
- Tap a number to hear “20 minutes”, not “4 minutes”.
- Teach that big clock numbers mean different things for the two hands.

### Stage 6 — One-minute precision

Goal: nearest minute.

- Add minute ticks only after the five-minute structure is understood.
- Use zoom/magnification or simplified tick groups to avoid clutter.

### Stage 7 — Elapsed time

Goal: reason about time passing.

- Use visual timelines and clock animation first.
- Avoid abstract subtraction as the primary mechanic.
- This is not v1 unless prior stages are solid.

## Common misconceptions to design against

- Confusing the hour and minute hands.
- Reading the number the minute hand points at literally: hand on 4 = “4 minutes” instead of “20 minutes”.
- Thinking the hour is the number the short hand is approaching rather than the number it has passed.
- Leaving the hour hand exactly on 3 for 3:30; this teaches the wrong model.
- Treating “quarter to” as a simple position rather than a reference to the upcoming hour.
- Relying on speed or memory instead of conceptual understanding.

## Competitor/product scan

### Interactive web manipulatives

- Topmarks Teaching Clock — `https://www.topmarks.co.uk/time/teaching-clock`
  - Verified reachable.
  - Strong classroom manipulative; less child-product and less progression-driven.
- Toy Theater Clock — `https://toytheater.com/clock/`
  - Verified reachable.
  - Immediate and lightweight; limited structured teaching.
- Math Learning Center Math Clock — `https://www.mathlearningcenter.org/apps/math-clock`
  - Verified reachable.
  - Good virtual manipulative reference; more teacher/tool than Tiko-style child app.
- Visnos Interactive Teaching Clock — `https://www.visnos.com/demos/clock`
  - Verified reachable.
  - Strong analog/digital visual relation.

### Learning games/apps

- ABCya Telling Time — `https://www.abcya.com/games/telling_time`
  - Verified reachable.
  - Familiar classroom game style; likely more quiz-oriented and web-cluttered.
- SplashLearn time games — `https://www.splashlearn.com/math-skills/second-grade/time`
  - Redirected during verification to broader games route.
  - Structured curriculum-style learning, but account/subscription-oriented.
- Todo Math / Todo Telling Time lineage — `https://apps.apple.com/us/app/todo-math/id666465255`
  - Verified reachable as Todo Math App Store listing.
  - Strong accessibility-minded benchmark, but broad math product rather than tiny Tiko app.

### Physical learning clocks

- EasyRead Time Teacher — `https://www.easyreadtimeteacher.com/`
  - Verified reachable.
  - Excellent scaffold: labels and colors make “minutes past/to” explicit.
- Geared classroom clocks / Judy Clock / Learning Resources style products
  - Pattern: hands move together, making the hour-hand relationship physically visible.
  - Product lesson: Tiko should model geared hand motion digitally.
- Montessori clock materials
  - Pattern: tactile, sequential abstraction, adult-guided lessons.
  - Product lesson: Tiko should feel manipulative-first, not worksheet-first.

## Accessibility and special-needs considerations

Relevant sources:

- National Autistic Society visual supports guidance redirected during verification to autism/communication page: `https://www.autism.org.uk/advice-and-guidance/about-autism/autism-and-communication`
- CAST UDL Guidelines verified reachable: `https://udlguidelines.cast.org/`
- WCAG 2.2 verified reachable: `https://www.w3.org/TR/WCAG22/`

Design implications:

- Predictable lesson structure.
- Visual routine context.
- Large touch targets.
- No forced speed pressure.
- Audio narration with replay, but no autoplay surprises.
- Color plus shape/labels, never color alone.
- Reduced-motion support.
- No precision-only dragging; provide tap and stepper alternatives.
- Immediate explanatory hints rather than binary wrong states.

## Tiko opportunity

Most products are either:

- teacher manipulatives,
- quiz games,
- subscription learning platforms,
- or physical toys needing adult guidance.

Tiko can win by being:

- immediate,
- local-first,
- no account/no ads,
- conceptually scaffolded,
- manipulative-first,
- accessible,
- gentle,
- and small enough to be focused on one child's actual learning need.

## Product direction

Tiko Clock should be a **clock-reading tutor built around a large interactive analog clock**.

Core loop:

1. Watch a tiny demonstration.
2. Try one task.
3. Get specific visual/audio feedback.
4. Repeat a few times.
5. Earn gentle progress.

Primary modes:

- Learn: short concept introduction.
- Play: practice challenges.
- Explore: free clock manipulative.
- Progress: optional caregiver view.

The app should still have a beautiful live clock/explore mode, but that is supporting material, not the product center.
