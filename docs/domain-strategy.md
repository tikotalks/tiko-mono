# Tiko Domain Strategy

**Status:** strategic target for the clean Cloudflare rebuild.

**Principle:** Tiko should have one simple public brand domain, one app domain family, one API domain family, and one CDN/media domain family. Anything else becomes legacy, redirect-only, or parked.

---

## Domains currently present in Cloudflare

Cloudflare zones found for Tiko:

- `tiko.mt`
- `tikoapps.org`
- `tikoapi.org`
- `tikocdn.org`
- `tikotalks.com`
- `tiko.talk`

Current DNS/Page evidence:

- `tiko.mt` currently points main marketing to `tiko-marketing.pages.dev`.
- `tikotalks.com` also points marketing to `tiko-marketing.pages.dev`.
- `tikoapps.org` hosts app subdomains.
- `tikoapi.org` hosts API/Worker routes such as content and TTS.
- `tikocdn.org` hosts media/CDN/upload/generation routes.
- `tiko.talk` appears parked/trademark-style only; no active app records.

Current Cloudflare Pages projects discovered:

- `tiko-marketing` → `tiko.mt`, `tikotalks.com`, `www.tikotalks.com`
- `tiko-media` → `media.tiko.mt`, `media.tikotalks.com`
- `tiko-cards` → `cards.tikoapps.org`
- `tiko-timer` → `timer.tikoapps.org`
- `tiko-todo` → `todo.tikoapps.org`
- `tiko-type` → `type.tikoapps.org`
- `tiko-yes-no` → `yes-no.tikoapps.org`, `yesno.tikoapps.org`, `dev.yesno.tikoapps.org`
- `tiko-radio` → `radio.tikoapps.org`, `dev.radio.tikoapps.org`
- `tiko-sequence` → `sequence.tikoapps.org`, `dev.sequence.tikoapps.org`
- `tiko-dashboard` → pages.dev only currently; `dev.tiko.tikoapps.org` is served through the `tiko-dev-app-router` Worker and production `tiko.tikoapps.org` must remain a safe holding response until Sil approves production promotion.

Current DNS/Pages evidence is maintained through the Cloudflare API and should be re-checked before changing production routes.

---

## Domain roles

## 1. Primary public/product domain: `tiko.mt`

Use `tiko.mt` as the canonical public home.

Run here:

- marketing website
- product explanation
- parent/caregiver-facing docs
- download/install links
- app directory
- legal pages
- privacy/safety/accessibility pages

Recommended routes:

- `https://tiko.mt/` — canonical marketing/product home
- `https://tiko.mt/apps` — list all apps
- `https://tiko.mt/privacy`
- `https://tiko.mt/terms`
- `https://tiko.mt/accessibility`
- `https://tiko.mt/support`

Decision:

- Keep `tiko.mt` as the main brand domain.
- Do not run child apps directly under `tiko.mt/<app>` unless there is a strong reason. App subdomains under `tikoapps.org` are cleaner for cookies and isolation.

## 2. App runtime domain family: `tikoapps.org`

Use `tikoapps.org` for every installable/interactive app.

Why:

- clean subdomain isolation per app
- clean separation from the brand/root identity endpoint on `tiko.mt`
- works well for Cloudflare Pages custom domains
- separates public marketing from app runtime

Canonical app domains:

- `https://tiko.tikoapps.org` — Tiko shell/dashboard/app launcher; production route is held behind an explicit “pending approval” Worker response until Sil approves production promotion
- `https://dev.tiko.tikoapps.org` — development Tiko shell/dashboard/app launcher, proxied by `tiko-dev-app-router` to `development.tiko-dashboard.pages.dev`
- `https://cards.tikoapps.org` — Cards
- `https://sequence.tikoapps.org` — Sequence
- `https://type.tikoapps.org` — Type
- `https://yesno.tikoapps.org` — Yes/No canonical short spelling
- `https://timer.tikoapps.org` — Timer
- `https://todo.tikoapps.org` — Todo
- `https://radio.tikoapps.org` — Radio

Aliases/redirects:

- `https://yes-no.tikoapps.org` → `https://yesno.tikoapps.org`
- `https://dev.yes-no.tikoapps.org` → `https://dev.yesno.tikoapps.org`

Internal tools on this family:

- `https://admin.tikoapps.org` — internal admin
- `https://ui.tikoapps.org` or `https://ui-docs.tikoapps.org` — UI docs, preferably protected/not public-indexed

Identity:

- `https://id.tiko.mt` — canonical identity API origin

Do not use `auth.tikoapps.org` as the long-term name if the system is not login/auth-centric. The product concept is identity/device continuity, not auth screens. Existing `auth.tikoapps.org` and `identity.tikoapps.org` can temporarily redirect or alias to `id.tiko.mt` during transition.

Cookie policy:

- Primary session cookie domain: app-scoped on each `*.tikoapps.org` app, issued by/validated against `id.tiko.mt`
- Cross-app continuity should use an explicit identity handshake/token exchange, not a hidden assumption that one cookie parent can cover both `tiko.mt` and `tikoapps.org`
- HttpOnly + Secure
- SameSite=Lax
- No password session semantics exposed to UI

Dev/preview convention:

Preferred:

- `https://dev.timer.tikoapps.org`
- `https://dev.cards.tikoapps.org`
- `https://dev.id.tiko.mt`

Avoid the current `develop.timer.tikoapps.org` pattern long term. It reads like branch plumbing and does not match Sil’s `dev.<domain>` preference. For subdomain apps, `dev.<app>.tikoapps.org` is the clearest equivalent.

## 3. API domain family: `tikoapi.org`

Use `tikoapi.org` for server APIs that are not directly app hosts and are not raw CDN assets.

Target APIs:

- `https://identity.tikoapi.org` — optional API alias for identity; product-preferred origin remains `id.tiko.mt`
- `https://app.tikoapi.org` — app data API
- `https://content.tikoapi.org` — content/CMS API
- `https://media.tikoapi.org` — media metadata/upload API, if not using `api.tikocdn.org`
- `https://generation.tikoapi.org` — generation API umbrella
- `https://tts.tikoapi.org` — TTS generation endpoint, if kept separate
- `https://sentence.tikoapi.org` — sentence engine, if kept separate
- `https://admin.tikoapi.org` — admin-only backend API

Recommended simplification:

- Prefer fewer APIs with path namespaces over many tiny hostnames.
- Target:
  - `id.tiko.mt` for identity/session
  - `api.tikoapi.org/app/*`
  - `api.tikoapi.org/content/*`
  - `api.tikoapi.org/media/*`
  - `api.tikoapi.org/generation/*`
  - `api.tikoapi.org/admin/*`

But do not collapse everything until the clean domain packages/workers are defined. Domain strategy should follow architecture boundaries, not hide them.

## 4. CDN/media domain family: `tikocdn.org`

Use `tikocdn.org` for raw or transformed files, public media, generated images/audio, and cacheable assets.

Target domains:

- `https://media.tikocdn.org` — public shared media files
- `https://user-media.tikocdn.org` — user-owned media delivery, only if URLs can be safely scoped/signed where needed
- `https://assets.tikocdn.org` — app/static asset bucket
- `https://images.tikocdn.org` — transformed/generated images
- `https://tts.tikocdn.org` — generated TTS audio files
- `https://api.tikocdn.org` — upload/analyze endpoint only if kept; otherwise move upload APIs to `api.tikoapi.org/media/*`

Rule:

- `tikocdn.org` serves bytes.
- `tikoapi.org` decides permissions and creates upload/download intent.
- Apps should not construct R2 keys ad hoc.

## 5. Legacy/secondary domains

## `tikotalks.com`

Current role:

- points to marketing and media.

Recommended role:

- redirect-only to `tiko.mt`.
- Keep for brand/search continuity if needed.
- Do not introduce new app/API surface here.

Redirects:

- `https://tikotalks.com/*` → `https://tiko.mt/*`
- `https://www.tikotalks.com/*` → `https://tiko.mt/*`
- `https://media.tikotalks.com/*` → `https://media.tiko.mt/*` or `https://tiko.mt/media/*`, depending on final media site decision.

## `tiko.talk`

Current role:

- appears parked/trademark/reserved.

Recommended role:

- keep parked/protected.
- no production runtime.
- optional redirect to `tiko.mt` if desired, but not necessary.

## `tiko.mt` old app subdomains

Current records show old `app.tiko.mt` and `apps.tiko.mt` A records pointing away from Cloudflare Pages.

Recommended role:

- retire or redirect to `tiko.tikoapps.org` / `tiko.mt/apps`.
- Do not run app runtime under `app.tiko.mt` long term.

---

# Final domain map

## Public / marketing

- `tiko.mt` → marketing site
- `www.tiko.mt` → redirect to `tiko.mt` if possible
- `tikotalks.com` → redirect to `tiko.mt`
- `www.tikotalks.com` → redirect to `tiko.mt`

## Apps

- `tiko.tikoapps.org` → main Tiko shell/app launcher; Worker holding response until production promotion is approved
- `dev.tiko.tikoapps.org` → development Tiko shell/app launcher
- `cards.tikoapps.org` → Cards app
- `sequence.tikoapps.org` → Sequence app
- `type.tikoapps.org` → Type app
- `yesno.tikoapps.org` → Yes/No app
- `yes-no.tikoapps.org` → redirect to `yesno.tikoapps.org`
- `timer.tikoapps.org` → Timer app
- `todo.tikoapps.org` → Todo app
- `radio.tikoapps.org` → Radio app

## Tools

- `admin.tikoapps.org` → admin tool, protected
- `ui.tikoapps.org` or `ui-docs.tikoapps.org` → UI docs, protected/noindex

## Identity

- `id.tiko.mt` → custom device-first identity API
- `auth.tikoapps.org` / `identity.tikoapps.org` → temporary alias/redirect only, then retire

## APIs

Preferred consolidated target:

- `api.tikoapi.org/app/*`
- `api.tikoapi.org/content/*`
- `api.tikoapi.org/media/*`
- `api.tikoapi.org/generation/*`
- `api.tikoapi.org/admin/*`

Acceptable transitional dedicated hosts:

- `content.tikoapi.org`
- `tts.tikoapi.org`
- `sentence.tikoapi.org`
- `media.tikoapi.org`

## CDN

- `media.tikocdn.org`
- `user-media.tikocdn.org`
- `assets.tikocdn.org`
- `images.tikocdn.org`
- `tts.tikocdn.org`

---

# Immediate cleanup tasks

## Task D1: Create authoritative domain inventory

Create/maintain:

- `docs/cloudflare/DOMAIN_INVENTORY.md`

Include:

- zone
- record name
- type
- target
- proxied
- current purpose
- target purpose
- keep/redirect/remove

## Task D2: Fix app domain gaps

Observed issues now closed for dev routing:

- `dev.tiko.tikoapps.org` is served through `workers/dev-app-router` and targets `development.tiko-dashboard.pages.dev`.
- `yes-no.tikoapps.org` and `dev.yes-no.tikoapps.org` are redirect aliases to the canonical `yesno` hosts.
- `tiko.tikoapps.org` is intentionally a Worker holding response until production promotion is explicitly approved.

Remaining production decision:

- Bind/promote the production launcher only after Sil approves which production branch/deployment should serve `tiko.tikoapps.org`.

## Task D3: Decide `yesno` vs `yes-no`

Recommendation:

- canonical: `yesno.tikoapps.org`
- redirect: `yes-no.tikoapps.org`

Reason: shorter, child/product friendly, easier to say.

## Task D4: Identity host naming

Decision:

- canonical: `id.tiko.mt`
- temporary aliases: `auth.tikoapps.org` and `identity.tikoapps.org`, then retire

Reason: short, brand-rooted, and still avoids the login-centric smell of “auth”. Tiko wants continuity, device identity, and recovery. Because `id.tiko.mt` cannot share a parent cookie with `*.tikoapps.org`, app sessions should be app-scoped and identity continuity should happen through an explicit identity handshake/token exchange.

## Task D5: Retire old public domains from runtime

- `tikotalks.com` → redirect to `tiko.mt`
- `media.tikotalks.com` → redirect to the final media URL
- `app.tiko.mt` and `apps.tiko.mt` → redirect to `tiko.tikoapps.org` or `tiko.mt/apps`
- `tiko.talk` → parked or redirect only

## Task D6: Update deploy workflows

Current workflow uses `develop.` prefix for dev URLs. Change target strategy to:

- production: `<app>.tikoapps.org`
- development: `dev.<app>.tikoapps.org`

Cloudflare Pages project naming can remain:

- `tiko-cards`
- `tiko-cards-development` or `tiko-cards-dev`

But domain naming should be human, not branch jargon.

## Task D7: Add domain strategy to the rebuild plan and Hermina handoff

Every Cloudflare/deployment task must refer to this file and must not invent new domains.

---

# Doctrine

- Marketing is `tiko.mt`.
- Apps are `*.tikoapps.org`.
- Shared identity is `id.tiko.mt`; app cookies are app-scoped under `*.tikoapps.org`, with explicit identity handshakes for cross-app continuity.
- APIs are `*.tikoapi.org` or consolidated under `api.tikoapi.org/*`.
- Bytes are `*.tikocdn.org`.
- `tikotalks.com`, `tiko.talk`, and old `*.tiko.mt` app records are not runtime surfaces.
- New domains require an ADR.
