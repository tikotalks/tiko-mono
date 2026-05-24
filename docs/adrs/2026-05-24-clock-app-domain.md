# ADR: Add Tiko Clock App Domain

**Date:** 2026-05-24  
**Status:** Proposed  
**Decision owner:** Founder / Hermio  
**Related plan:** `docs/plans/2026-05-24-tiko-clock-app.md`

## Context

Tiko is adding a new child-facing Clock app. Existing domain doctrine says interactive/installable apps live under the `tikoapps.org` runtime family, with development aliases using `dev.<app>.tikoapps.org`.

Clock is a product app, not a marketing page, API, or CDN asset. It should follow the same isolation and deployment pattern as Timer, Cards, Todo, Type, Radio, Sequence, and Yes/No.

## Decision

Use:

- Production app domain: `https://clock.tikoapps.org`
- Development app domain: `https://dev.clock.tikoapps.org`
- Cloudflare Pages project target name: `tiko-clock`
- Repo path: `apps/clock`
- App id: `clock`
- Translation namespace: `clock.*`

No new top-level domain, API hostname, or CDN hostname is introduced for v1.

## Rationale

- Keeps all interactive apps under the established `tikoapps.org` runtime family.
- Avoids putting app runtime under `tiko.mt`, which is reserved for public/product/marketing, identity-adjacent docs, and caregiver-facing material.
- Gives Clock app-scoped cookies and clean isolation like the other Tiko apps.
- Allows the app to be introduced in dev first without production promotion.
- Does not create unnecessary infrastructure: Clock v1 is client-local and should not need its own Worker or D1 database.

## Consequences

Implementation must add Cloudflare Pages and DNS/custom-domain configuration before declaring the app live.

Dashboard metadata should not point users to `clock.tikoapps.org` until the app is buildable and the dev deployment has been smoke-tested.

Future routine/calendar integrations must use existing or future Tiko app APIs rather than creating a separate `clock` backend by default.

## Non-decisions

This ADR does not approve:

- alarms,
- notifications,
- reminders,
- calendar integrations,
- a Clock-specific Worker,
- a Clock-specific D1 database,
- or production deployment.

Those require separate product/architecture review.
