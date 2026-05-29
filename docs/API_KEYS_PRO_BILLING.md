# Tiko Universe: API Key, Pro Tier, and Billing Infrastructure

**Status:** Specification (pre-implementation)
**Author:** Hermio
**Date:** 2025-05-29

---

## 1. Problem Statement

Tiko Universe has four AI-burning workers with ZERO access control:

| Worker | Cost Risk | Current Auth |
|---|---|---|
| `tts-generation` | OpenAI TTS credits — anyone can POST `/generate` | None. CORS-only. |
| `image-generation` | DALL-E 3 credits — anyone can POST `/generate` | None. CORS wildcard. |
| `sentence-engine` | AI sentence generation | None (assumed same) |
| `content-api`, `media-upload`, etc. | R2/D1 storage costs | Session-based (identity-api) |

Every unauthenticated POST to these endpoints burns real money. The TTS worker validates origin patterns but accepts any POST from `*.tikoapps.org` or `localhost` — trivially spoofable. The image-generation worker uses `Access-Control-Allow-Origin: *`.

The identity-api has proper session-based auth (bearer tokens, hashed with pepper), but generation workers are completely open.

---

## 2. Doctrine Alignment Check

Before designing anything, every proposal must pass the Tiko doctrine filters:

### 2.1 What this spec must NOT violate

- **Apps open immediately** — API key system cannot block a child's first app use.
- **No login walls** — API keys are for programmatic/admin/Pro access, not for child-facing apps.
- **Device-first identity** — API keys augment identity, they don't replace it.
- **Cloudflare-first** — all infrastructure runs on Workers, D1, KV, R2.
- **Small workers with clear ownership** — API key validation should be a shared concern, not a new mega-worker.
- **Documentation before implementation** — this is the document.

### 2.2 Tension acknowledged

The core tension: Tiko is child-first, open-by-default. API keys and billing are adult/admin concepts. The design must keep children completely insulated from these concerns while still protecting the infrastructure from abuse.

**Resolution:** API key enforcement is an API-layer concern, not an app-layer concern. Child-facing apps use device sessions (existing). API key enforcement applies to:
1. Direct API calls (non-browser)
2. Rate limiting on generation endpoints
3. Pro-tier feature gates on expensive operations

---

## 3. Architecture Design

### 3.1 Shared Auth Middleware Package

Create `@tiko/auth-middleware` as a lightweight shared package consumed by all workers.

```
packages/auth-middleware/
  src/
    index.ts          — re-exports
    api-key.ts        — API key validation
    session.ts        — session/bearer validation (extracted from identity-api pattern)
    rate-limit.ts     — rate limiting using D1 + KV
    entitlement.ts   — Pro tier resolution
    types.ts          — shared auth types
```

**Why a package, not a new worker?** Workers are small and isolated. Auth validation is a cross-cutting concern — every worker needs it. A shared package gives consistent behavior without adding a network hop or a new single point of failure.

### 3.2 API Key Model

API keys are **not** for children. They are for:

1. **Developer/API access** — third-party integrations, scripts, admin tools
2. **Pro-tier identification** — users who pay for elevated limits
3. **Rate limit keying** — meaningful rate limiting instead of IP-only

```
D1 Table: api_keys
─────────────────────────────────────────────────
id              TEXT PK (crypto.randomUUID)
name            TEXT NOT NULL          — human label e.g. "Production TTS"
key_prefix      TEXT NOT NULL          — "tiko_" + first 8 chars of key_hash, for identification
key_hash        TEXT NOT NULL UNIQUE   — SHA-256(key + pepper), never stored raw
user_id         TEXT NULL              — nullable until identity linkage; for now, standalone
scope           TEXT NOT NULL DEFAULT 'all'  — 'all' | 'tts' | 'image' | 'content'
plan            TEXT NOT NULL DEFAULT 'free'  — 'free' | 'pro'
rate_limit_rpm  INTEGER NOT NULL DEFAULT 30    — requests per minute
rate_limit_rpd  INTEGER NOT NULL DEFAULT 500   — requests per day
monthly_budget  INTEGER NULL              — max spend cents/month (Pro feature)
metadata        TEXT NULL               — JSON blob for labels/tags
state           TEXT NOT NULL DEFAULT 'active'  — 'active' | 'disabled' | 'revoked'
created_at      TEXT NOT NULL
updated_at      TEXT NOT NULL
last_used_at    TEXT NULL
```

### 3.3 API Key Format

```
tiko_live_XXXXXX...XXXXXX
tiko_test_XXXXXX...XXXXXX
```

- `tiko_live_` prefix for production keys
- `tiko_test_` prefix for development/test keys
- 48 random characters (base62: a-zA-Z0-9)
- Total: 58 characters
- Sent in `Authorization: Bearer tiko_live_...` header (same as session tokens)

**Key validation flow:**

1. Extract bearer token from `Authorization` header
2. If token starts with `tiko_live_` or `tiko_test_`, route to API key validation
3. If token does NOT start with `tiko_` prefix, route to session validation (existing)
4. This means API keys and session tokens share the same `Authorization` header — the prefix disambiguates

### 3.4 D1 Database Strategy

**New table: `api_keys`** in the existing `IDENTITY_DB` (the identity D1 database).

Rationale: API keys are an identity-adjacent concept. They belong with the user/device/session data. Creating a separate D1 database for one table adds operational overhead with no benefit. When API keys gain `user_id` linkage (Phase 2), they'll naturally join the identity schema.

### 3.5 Rate Limiting

Two-tier rate limiting, using D1 for counters + KV for fast-path checks:

**Tier 1: Per-key rate limit (for API key holders)**
- Tracked in D1 `rate_limit_counters` table, compacted by scheduled worker
- RPM (requests per minute) and RPD (requests per day)
- Configured per API key record

**Tier 2: Per-device/session rate limit (for app users)**
- Tracked in KV with short TTL (60s window for RPM, 24h for RPD)
- Keyed on session ID, not IP (IP is behind NATs, unreliable)
- Free-tier limits: 10 RPM, 100 RPD for generation endpoints
- No rate limiting on read-only endpoints (content-api, app-api GETs)

**Rate limit enforcement happens in the middleware package**, not in each worker individually. Workers call `requireAuth(request, env)` which returns the authenticated context + rate limit status.

### 3.6 Pro Tier Definition

```
Feature matrix:
──────────────────────────────────────────────
                     Free          Pro
──────────────────────────────────────────────
TTS generations/day   50           unlimited
Image gen/day         5            50
Sentence gen/day      100          unlimited
TTS model access      tts-1        tts-1 + tts-1-hd
Image sizes           1024x1024    all sizes
Audio quality         standard     HD
API key access        no           yes
Custom rate limits    no           yes
──────────────────────────────────────────────
```

**Pro status is stored on the API key, not on the user.** This is intentional for Phase 1 — there's no user-level billing yet. Pro API keys have elevated limits. When user-level billing arrives (Phase 3), Pro can propagate from user → devices → sessions.

### 3.7 Billing Integration Plan

**Phase 1 (this spec): Infrastructure only**
- API key CRUD (create, list, revoke, rotate)
- Rate limiting enforcement on generation workers
- Pro tier as a flag on API keys
- No payment flow yet

**Phase 2: Stripe integration**
- Stripe Checkout for Pro subscription
- Webhook worker (`workers/billing-webhook`) handles `checkout.session.completed`, `customer.subscription.updated`, `invoice.payment_failed`
- New D1 table: `subscriptions` (user_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end)
- Pro status propagates: subscription → user → API keys (auto-upgrade)
- Grace period handling (3 days after failed payment before downgrade)

**Phase 3: Usage-based metering**
- Per-generation cost tracking in D1
- Monthly usage dashboards
- Overage handling (hard cap at budget, or soft cap with warnings)
- Admin dashboard for Sil to monitor costs

**Billing should NOT be built now.** The infrastructure (API keys, rate limits, Pro flag) is the prerequisite. Billing can be added later without architectural changes because the Pro tier is already modeled.

---

## 4. Worker Changes Required

### 4.1 `tts-generation` — CRITICAL

**Current state:** Zero auth. CORS-only. Open to abuse.

**Changes:**
1. Import and use `@tiko/auth-middleware`
2. On `/generate` (POST): require API key OR valid session
3. Apply rate limits: free=50/day, pro=unlimited
4. On `/audio` (GET): no auth required (cached content, no cost)
5. On `/metadata` (GET): no auth required (read-only)

### 4.2 `image-generation` — CRITICAL

**Current state:** Zero auth. `Access-Control-Allow-Origin: *`. Open to abuse.

**Changes:**
1. Import and use `@tiko/auth-middleware`
2. On `/generate` (POST): require API key OR valid session
3. Apply rate limits: free=5/day, pro=50/day
4. On `/progress/:userId` (GET): require API key OR valid session
5. Remove `Access-Control-Allow-Origin: *` — restrict to Tiko origins

### 4.3 `sentence-engine` — HIGH

**Changes:** Same pattern as tts-generation. Rate limit on generation endpoint.

### 4.4 `identity-api` — LOW

**Changes:**
1. Add API key management endpoints under `/api/identity/api-keys/*`:
   - `POST /api/identity/api-keys` — create key (requires existing session + admin flag, or just requires session for now)
   - `GET /api/identity/api-keys` — list keys for current session
   - `DELETE /api/identity/api-keys/:id` — revoke key
   - `POST /api/identity/api-keys/:id/rotate` — rotate key (invalidate old, issue new)
2. New D1 table: `api_keys` (managed in identity-api's scheduled migrations)

### 4.5 All other workers — NO CHANGE

Content-api, media-upload, assets-upload, etc. either have session auth already or are read-only. Don't touch them.

---

## 5. API Key Management Endpoints

### 5.1 Create API Key

```
POST /api/identity/api-keys
Authorization: Bearer <session_token>

Body:
{
  "name": "Production TTS",
  "scope": "tts",          // optional, default "all"
  "plan": "pro"            // optional, default "free" (Phase 1: manual flag)
}

Response 201:
{
  "ok": true,
  "data": {
    "id": "...",
    "name": "Production TTS",
    "key": "tiko_live_abc123...",  // ONLY returned on creation
    "key_prefix": "tiko_abc12345",
    "scope": "tts",
    "plan": "pro",
    "rate_limit_rpm": 60,
    "rate_limit_rpd": 10000,
    "created_at": "..."
  }
}
```

### 5.2 List API Keys

```
GET /api/identity/api-keys
Authorization: Bearer <session_token>

Response 200:
{
  "ok": true,
  "data": [
    {
      "id": "...",
      "name": "Production TTS",
      "key_prefix": "tiko_abc12345",
      "scope": "tts",
      "plan": "pro",
      "state": "active",
      "rate_limit_rpm": 60,
      "rate_limit_rpd": 10000,
      "last_used_at": "...",
      "created_at": "..."
    }
  ]
}
```

Note: `key` (raw) is NEVER returned on list — only `key_prefix`.

### 5.3 Revoke API Key

```
DELETE /api/identity/api-keys/:id
Authorization: Bearer <session_token>

Response 200:
{
  "ok": true,
  "data": { "id": "...", "state": "revoked" }
}
```

### 5.4 Rotate API Key

```
POST /api/identity/api-keys/:id/rotate
Authorization: Bearer <session_token>

Response 200:
{
  "ok": true,
  "data": {
    "id": "...",
    "key": "tiko_live_xyz789...",  // new key
    "old_key_state": "revoked"
  }
}
```

---

## 6. Auth Middleware Package API

```typescript
// packages/auth-middleware/src/types.ts

interface AuthContext {
  type: 'session' | 'api_key'
  userId: string
  sessionId?: string          // for session auth
  apiKeyId?: string           // for API key auth
  apiKeyPrefix?: string        // for logging, never the raw key
  plan: 'free' | 'pro'
  scope: string
  rateLimitRpm: number
  rateLimitRpd: number
}

// packages/auth-middleware/src/index.ts

async function requireAuth(
  request: Request,
  env: { IDENTITY_DB: D1Database; IDENTITY_SESSION_CACHE?: KVNamespace; IDENTITY_TOKEN_PEPPER?: string },
  options?: { scopes?: string[]; plans?: ('free' | 'pro')[] }
): Promise<AuthContext>

// Returns authenticated context or throws HttpError(401/403/429)
```

Workers import this and call it at the top of protected handlers. The middleware:
1. Extracts bearer token
2. Checks prefix to determine session vs API key
3. Validates against D1 (hash comparison)
4. Checks rate limits (KV fast-path, D1 fallback)
5. Returns AuthContext with plan, scope, limits

---

## 7. D1 Schema Migration

```sql
-- Add to IDENTITY_DB

CREATE TABLE IF NOT EXISTS api_keys (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  key_prefix      TEXT NOT NULL,
  key_hash        TEXT NOT NULL UNIQUE,
  user_id         TEXT,
  scope           TEXT NOT NULL DEFAULT 'all',
  plan            TEXT NOT NULL DEFAULT 'free',
  rate_limit_rpm  INTEGER NOT NULL DEFAULT 30,
  rate_limit_rpd  INTEGER NOT NULL DEFAULT 500,
  monthly_budget  INTEGER,
  metadata        TEXT,
  state           TEXT NOT NULL DEFAULT 'active',
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  last_used_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_state ON api_keys(state);

-- Rate limit counters (separate table for efficient pruning)
CREATE TABLE IF NOT EXISTS rate_limit_counters (
  key             TEXT PRIMARY KEY,  -- api_key_id:window or session_id:window
  count           INTEGER NOT NULL DEFAULT 0,
  window_start    TEXT NOT NULL,
  window_type     TEXT NOT NULL      -- 'minute' | 'day'
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_counters_window ON rate_limit_counters(window_start, window_type);
```

---

## 8. Implementation Priority

### Sprint 1 (Critical — blocks abuse):
1. Create `packages/auth-middleware` with API key validation
2. Add D1 `api_keys` table to identity-api migration
3. Add API key CRUD endpoints to identity-api
4. Add auth middleware to `tts-generation` `/generate`
5. Add auth middleware to `image-generation` `/generate`
6. Add rate limiting to both generation workers

### Sprint 2 (Important — operational control):
1. Add auth to `sentence-engine`
2. Build a simple admin page or CLI for API key management
3. Add monitoring/alerting for rate limit hits (Cloudflare Analytics or Workers Analytics)
4. Audit and fix CORS on image-generation worker

### Sprint 3 (Future — monetization):
1. Stripe integration (checkout webhook worker)
2. Subscription management
3. Pro tier propagation (subscription → user → API keys)
4. Usage metering and cost dashboards
5. Grace period and overage handling

---

## 9. Security Considerations

1. **Key hashing:** API keys are never stored in plaintext. SHA-256 with a pepper (same pattern as session tokens in identity-api).
2. **Key prefix:** The first 8 chars of the hash are exposed as `key_prefix` for identification in logs and UI. Not enough to reconstruct the key.
3. **Key rotation:** Old keys are revoked, not deleted. Audit trail preserved.
4. **Test keys:** `tiko_test_*` keys can be rate-limited more aggressively in non-production environments.
5. **No key in URL:** API keys travel in `Authorization` header only, never in query params or URL fragments. This aligns with the API_BOUNDARIES.md token rules.
6. **CORS restriction:** Generation workers should restrict CORS to Tiko origins (like tts-generation already does) rather than wildcard (like image-generation currently does).

---

## 10. What This Spec Explicitly Does NOT Include

- **User-facing billing UI** — children and caregivers never see API keys
- **Password auth** — forbidden by doctrine
- **Login walls** — forbidden by doctrine
- **OAuth/OAuth2 for third parties** — premature for Phase 1
- **API key marketplace or sharing** — not the product
- **Complex role-based access control** — over-engineered for current needs
- **Migration from auth-service** — that's a separate cleanup task

---

## 11. Open Questions for Sil

1. Should the initial Pro tier be invite-only or freely self-service? (Recommendation: invite-only at launch to control costs)
2. Should there be a separate `admin-api` endpoint for key management, or live under `identity-api`? (This spec proposes identity-api — it already owns auth context)
3. Budget for TTS/image generation per month before rate limiting needs to be aggressive?
4. Should sentence-engine share the same auth middleware, or does it have different requirements?

---

## 12. References

- Tiko Doctrine: `docs/DOCTRINE.md`
- Clean Rebuild Doctrine: `docs/CLEAN_REBUILD_DOCTRINE.md`
- Architecture: `docs/ARCHITECTURE.md`
- API Boundaries: `docs/API_BOUNDARIES.md`
- Identity types: `packages/identity/src/types.ts`
- Mikki gateway entitlement pattern: `mikki/products/mikki-api-gateway/src/index.ts` (reference only — Tiko has different constraints)
