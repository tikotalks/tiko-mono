import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requireAuth, requireAuthWithRateLimit, AuthError } from './entitlement'
import { extractBearerToken, routeByTokenType, validateApiKey } from './api-key'
import { validateSession } from './session'
import { checkRateLimit } from './rate-limit'
import { sha256Hex, hashSecret, stripBearer, isApiKeyToken } from './crypto'
import type { AuthEnv, AuthContext } from './types'

// ---------------------------------------------------------------------------
// Helpers: fake D1 / KV
// ---------------------------------------------------------------------------

class FakeKV {
  private store = new Map<string, string>()

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null
  }
  async put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void> {
    this.store.set(key, value)
    if (opts?.expirationTtl) {
      // In real KV this would auto-expire; in tests we just store it.
      void opts.expirationTtl
    }
  }
  async delete(_key: string): Promise<void> {}
  _clear() { this.store.clear() }
}

interface D1Row {
  [col: string]: unknown
}

class FakeD1 {
  private rows: D1Row[] = []
  private oneRows: D1Row[] = []
  private lastSql = ''
  private lastBinds: unknown[] = []
  runs: number = 0

  seed(rows: D1Row[]) { this.rows = rows }
  seedOne(row: D1Row | null) { this.oneRows = row ? [row] : [] }

  prepare(sql: string) {
    this.lastSql = sql
    return {
      bind: (...args: unknown[]) => {
        this.lastBinds = args
        return {
          all: async () => ({ results: [...this.rows] }),
          first: async <T>() => this.oneRows[0] as T | null,
          run: async () => { this.runs++ },
        }
      },
    }
  }

  _lastSql() { return this.lastSql }
  _lastBinds() { return this.lastBinds }
}

function makeEnv(overrides?: Partial<AuthEnv>): AuthEnv {
  const kv = new FakeKV() as unknown as KVNamespace
  const db = new FakeD1() as unknown as D1Database
  return {
    IDENTITY_DB: db,
    IDENTITY_SESSION_CACHE: kv,
    IDENTITY_TOKEN_PEPPER: 'test-pepper',
    ...overrides,
  } as AuthEnv
}

// ---------------------------------------------------------------------------
// crypto.ts
// ---------------------------------------------------------------------------
describe('crypto', () => {
  it('sha256Hex produces a 64-char hex string', async () => {
    const hex = await sha256Hex('hello')
    expect(hex).toHaveLength(64)
    expect(hex).toMatch(/^[0-9a-f]+$/)
  })

  it('hashSecret prepends pepper', async () => {
    const a = await hashSecret('secret', 'pepper')
    const b = await sha256Hex('pepper:secret')
    expect(a).toBe(b)
  })

  it('hashSecret without pepper still works', async () => {
    const a = await hashSecret('secret')
    expect(a).toHaveLength(64)
  })

  it('stripBearer extracts token', () => {
    expect(stripBearer('Bearer abc123')).toBe('abc123')
    expect(stripBearer('bearer  token  ')).toBe('token')
    expect(stripBearer(null)).toBeNull()
    expect(stripBearer('Basic abc')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// isApiKeyToken / routeByTokenType
// ---------------------------------------------------------------------------
describe('isApiKeyToken', () => {
  it('detects live keys', () => {
    expect(isApiKeyToken('tiko_live_abc123')).toBe(true)
  })
  it('detects test keys', () => {
    expect(isApiKeyToken('tiko_test_abc123')).toBe(true)
  })
  it('rejects session tokens', () => {
    expect(isApiKeyToken('some-session-token')).toBe(false)
  })
  it('rejects empty strings', () => {
    expect(isApiKeyToken('')).toBe(false)
  })
})

describe('routeByTokenType', () => {
  it('routes tiko_live_ to api_key', () => {
    expect(routeByTokenType('tiko_live_abc')).toBe('api_key')
  })
  it('routes tiko_test_ to api_key', () => {
    expect(routeByTokenType('tiko_test_abc')).toBe('api_key')
  })
  it('routes everything else to session', () => {
    expect(routeByTokenType('session-token-123')).toBe('session')
  })
})

// ---------------------------------------------------------------------------
// extractBearerToken
// ---------------------------------------------------------------------------
describe('extractBearerToken', () => {
  it('extracts bearer token from request', () => {
    const req = new Request('https://test.example.com', {
      headers: { Authorization: 'Bearer tok123' },
    })
    expect(extractBearerToken(req)).toBe('tok123')
  })

  it('trims whitespace', () => {
    const req = new Request('https://test.example.com', {
      headers: { Authorization: 'Bearer   tok  ' },
    })
    expect(extractBearerToken(req)).toBe('tok')
  })

  it('throws on missing header', () => {
    const req = new Request('https://test.example.com')
    expect(() => extractBearerToken(req)).toThrow(AuthError)
  })

  it('throws on non-bearer format', () => {
    const req = new Request('https://test.example.com', {
      headers: { Authorization: 'Basic abc' },
    })
    expect(() => extractBearerToken(req)).toThrow(AuthError)
  })
})

// ---------------------------------------------------------------------------
// validateApiKey
// ---------------------------------------------------------------------------
describe('validateApiKey', () => {
  it('validates a live API key against D1', async () => {
    const token = 'tiko_live_abcdefghijklmnopqrstuvwx'
    const hash = await hashSecret(token, 'test-pepper')
    const env = makeEnv()
    const db = env.IDENTITY_DB as unknown as FakeD1
    db.seedOne({
      id: 'key-1',
      key_prefix: 'tiko_' + hash.slice(0, 8),
      scope: 'tts',
      plan: 'pro',
      rate_limit_rpm: 60,
      rate_limit_rpd: 10000,
      state: 'active',
      user_id: 'user-1',
    })

    const ctx = await validateApiKey(token, env)
    expect(ctx.type).toBe('api_key')
    expect(ctx.plan).toBe('pro')
    expect(ctx.scope).toBe('tts')
    expect(ctx.apiKeyId).toBe('key-1')
    expect(ctx.apiKeyPrefix).toContain('tiko_')
  })

  it('throws on invalid key', async () => {
    const token = 'tiko_live_nonexistent'
    const env = makeEnv()
    const db = env.IDENTITY_DB as unknown as FakeD1
    db.seedOne(null)

    await expect(validateApiKey(token, env)).rejects.toThrow(AuthError)
  })

  it('touches last_used_at on successful validation', async () => {
    const token = 'tiko_live_validkey123'
    const hash = await hashSecret(token, 'test-pepper')
    const env = makeEnv()
    const db = env.IDENTITY_DB as unknown as FakeD1
    db.seedOne({
      id: 'key-2',
      key_prefix: 'tiko_' + hash.slice(0, 8),
      scope: 'all',
      plan: 'free',
      rate_limit_rpm: 30,
      rate_limit_rpd: 500,
      state: 'active',
      user_id: null,
    })

    await validateApiKey(token, env)
    // The fire-and-forget UPDATE should have been called
    expect(db.runs).toBeGreaterThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// validateSession
// ---------------------------------------------------------------------------
describe('validateSession', () => {
  it('validates a session token', async () => {
    const token = 'session-token-abc'
    const hash = await hashSecret(token, 'test-pepper')
    const env = makeEnv()
    const db = env.IDENTITY_DB as unknown as FakeD1
    db.seedOne({
      id: 'sess-1',
      user_id: 'user-1',
      device_id: 'device-1',
      token_hash: hash,
      state: 'active',
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    })

    const ctx = await validateSession(token, env)
    expect(ctx.type).toBe('session')
    expect(ctx.userId).toBe('user-1')
    expect(ctx.sessionId).toBe('sess-1')
    expect(ctx.plan).toBe('free')
  })

  it('throws on invalid session', async () => {
    const token = 'invalid-session'
    const env = makeEnv()
    const db = env.IDENTITY_DB as unknown as FakeD1
    db.seedOne(null)

    await expect(validateSession(token, env)).rejects.toThrow(AuthError)
  })

  it('throws on expired session', async () => {
    const token = 'expired-session'
    const hash = await hashSecret(token, 'test-pepper')
    const env = makeEnv()
    const db = env.IDENTITY_DB as unknown as FakeD1
    db.seedOne({
      id: 'sess-expired',
      user_id: 'user-1',
      device_id: 'device-1',
      token_hash: hash,
      state: 'active',
      expires_at: new Date(Date.now() - 1000).toISOString(),
    })

    await expect(validateSession(token, env)).rejects.toThrow(AuthError)
  })

  it('uses KV cache and falls back to D1', async () => {
    const token = 'cached-session'
    const hash = await hashSecret(token, 'test-pepper')
    const env = makeEnv()
    const kv = env.IDENTITY_SESSION_CACHE as unknown as FakeKV
    const db = env.IDENTITY_DB as unknown as FakeD1

    const sessionRow = {
      id: 'sess-cached',
      user_id: 'user-cached',
      device_id: 'device-1',
      token_hash: hash,
      state: 'active',
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    }
    // Pre-populate KV
    await kv.put(`session:${hash}`, JSON.stringify(sessionRow))

    // D1 should not be queried for the session lookup if KV has it
    const ctx = await validateSession(token, env)
    expect(ctx.sessionId).toBe('sess-cached')
  })
})

// ---------------------------------------------------------------------------
// requireAuth
// ---------------------------------------------------------------------------
describe('requireAuth', () => {
  it('authenticates via API key', async () => {
    const token = 'tiko_live_requireauth'
    const hash = await hashSecret(token, 'test-pepper')
    const env = makeEnv()
    const db = env.IDENTITY_DB as unknown as FakeD1
    db.seedOne({
      id: 'key-req',
      key_prefix: 'tiko_' + hash.slice(0, 8),
      scope: 'all',
      plan: 'free',
      rate_limit_rpm: 30,
      rate_limit_rpd: 500,
      state: 'active',
      user_id: 'user-1',
    })

    const req = new Request('https://test.example.com', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const ctx = await requireAuth(req, env)
    expect(ctx.type).toBe('api_key')
    expect(ctx.apiKeyId).toBe('key-req')
  })

  it('authenticates via session token', async () => {
    const token = 'sess-requireauth'
    const hash = await hashSecret(token, 'test-pepper')
    const env = makeEnv()
    const db = env.IDENTITY_DB as unknown as FakeD1
    db.seedOne({
      id: 'sess-req',
      user_id: 'user-req',
      device_id: 'device-1',
      token_hash: hash,
      state: 'active',
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    })

    const req = new Request('https://test.example.com', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const ctx = await requireAuth(req, env)
    expect(ctx.type).toBe('session')
    expect(ctx.userId).toBe('user-req')
  })

  it('rejects wrong scope', async () => {
    const token = 'tiko_live_scoped'
    const hash = await hashSecret(token, 'test-pepper')
    const env = makeEnv()
    const db = env.IDENTITY_DB as unknown as FakeD1
    db.seedOne({
      id: 'key-scope',
      key_prefix: 'tiko_' + hash.slice(0, 8),
      scope: 'tts',
      plan: 'free',
      rate_limit_rpm: 30,
      rate_limit_rpd: 500,
      state: 'active',
      user_id: 'user-1',
    })

    const req = new Request('https://test.example.com', {
      headers: { Authorization: `Bearer ${token}` },
    })
    await expect(requireAuth(req, env, { scopes: ['image'] }))
      .rejects.toThrow(AuthError)
  })

  it('allows "all" scope to pass any scope check', async () => {
    const token = 'tiko_live_all_scope'
    const hash = await hashSecret(token, 'test-pepper')
    const env = makeEnv()
    const db = env.IDENTITY_DB as unknown as FakeD1
    db.seedOne({
      id: 'key-all',
      key_prefix: 'tiko_' + hash.slice(0, 8),
      scope: 'all',
      plan: 'free',
      rate_limit_rpm: 30,
      rate_limit_rpd: 500,
      state: 'active',
      user_id: 'user-1',
    })

    const req = new Request('https://test.example.com', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const ctx = await requireAuth(req, env, { scopes: ['tts', 'image'] })
    expect(ctx.apiKeyId).toBe('key-all')
  })

  it('rejects wrong plan', async () => {
    const token = 'tiko_live_freeplan'
    const hash = await hashSecret(token, 'test-pepper')
    const env = makeEnv()
    const db = env.IDENTITY_DB as unknown as FakeD1
    db.seedOne({
      id: 'key-free',
      key_prefix: 'tiko_' + hash.slice(0, 8),
      scope: 'all',
      plan: 'free',
      rate_limit_rpm: 30,
      rate_limit_rpd: 500,
      state: 'active',
      user_id: 'user-1',
    })

    const req = new Request('https://test.example.com', {
      headers: { Authorization: `Bearer ${token}` },
    })
    await expect(requireAuth(req, env, { plans: ['pro'] }))
      .rejects.toThrow(AuthError)
  })
})

// ---------------------------------------------------------------------------
// checkRateLimit
// ---------------------------------------------------------------------------
describe('checkRateLimit', () => {
  it('allows requests under the limit', async () => {
    const env = makeEnv()
    const auth: AuthContext = {
      type: 'api_key',
      userId: 'user-1',
      apiKeyId: 'key-1',
      plan: 'free',
      scope: 'all',
      rateLimitRpm: 30,
      rateLimitRpd: 500,
    }

    await expect(
      checkRateLimit(auth, env, {
        free: { rpm: 30, rpd: 500 },
        pro: { rpm: 100, rpd: 10000 },
      }),
    ).resolves.toBeUndefined()
  })

  it('throws 429 when RPM exceeded', async () => {
    const env = makeEnv()
    const kv = env.IDENTITY_SESSION_CACHE as unknown as FakeKV

    // Pre-populate KV with a high minute counter
    const auth: AuthContext = {
      type: 'api_key',
      userId: 'user-1',
      apiKeyId: 'key-over-rpm',
      plan: 'free',
      scope: 'all',
      rateLimitRpm: 30,
      rateLimitRpd: 500,
    }

    // Set the minute counter to already be at the limit
    const minuteKey = `apikey:key-over-rpm:${currentMinuteWindow()}`
    await kv.put(`rl:${minuteKey}`, '30')

    await expect(
      checkRateLimit(auth, env, {
        free: { rpm: 30, rpd: 500 },
        pro: { rpm: 100, rpd: 10000 },
      }),
    ).rejects.toThrow(AuthError)
  })

  it('throws 429 when RPD exceeded', async () => {
    const env = makeEnv()
    const db = env.IDENTITY_DB as unknown as FakeD1

    const auth: AuthContext = {
      type: 'session',
      userId: 'user-1',
      sessionId: 'sess-1',
      plan: 'free',
      scope: 'all',
      rateLimitRpm: 10,
      rateLimitRpd: 100,
    }

    // Seed D1 with a maxed-out day counter
    db.seedOne({ count: 100 })

    await expect(
      checkRateLimit(auth, env, {
        free: { rpm: 10, rpd: 100 },
        pro: { rpm: 60, rpd: 10000 },
      }),
    ).rejects.toThrow(AuthError)
  })

  it('pro unlimited skips all rate limit checks', async () => {
    const env = makeEnv()
    const kv = env.IDENTITY_SESSION_CACHE as unknown as FakeKV

    const auth: AuthContext = {
      type: 'api_key',
      userId: 'user-1',
      apiKeyId: 'key-pro',
      plan: 'pro',
      scope: 'all',
      rateLimitRpm: 100,
      rateLimitRpd: 10000,
    }

    // Even with counters maxed, pro unlimited should pass
    const minuteKey = `apikey:key-pro:${currentMinuteWindow()}`
    await kv.put(`rl:${minuteKey}`, '999999')

    const db = env.IDENTITY_DB as unknown as FakeD1
    db.seedOne({ count: 999999 })

    await expect(
      checkRateLimit(auth, env, {
        free: { rpm: 10, rpd: 100 },
        pro: { rpm: 100, rpd: 10000 },
        proUnlimited: true,
      }),
    ).resolves.toBeUndefined()
  })

  it('pro without unlimited flag still checks limits', async () => {
    const env = makeEnv()
    const kv = env.IDENTITY_SESSION_CACHE as unknown as FakeKV

    const auth: AuthContext = {
      type: 'api_key',
      userId: 'user-1',
      apiKeyId: 'key-pro-limited',
      plan: 'pro',
      scope: 'all',
      rateLimitRpm: 100,
      rateLimitRpd: 10000,
    }

    // Max out the minute counter past pro limits
    const minuteKey = `apikey:key-pro-limited:${currentMinuteWindow()}`
    await kv.put(`rl:${minuteKey}`, '100')

    await expect(
      checkRateLimit(auth, env, {
        free: { rpm: 10, rpd: 100 },
        pro: { rpm: 100, rpd: 10000 },
      }),
    ).rejects.toThrow(AuthError)
  })
})

// ---------------------------------------------------------------------------
// requireAuthWithRateLimit (integration)
// ---------------------------------------------------------------------------
describe('requireAuthWithRateLimit', () => {
  it('authenticates and checks rate limit in one call', async () => {
    const token = 'tiko_live_integ'
    const hash = await hashSecret(token, 'test-pepper')
    const env = makeEnv()
    const db = env.IDENTITY_DB as unknown as FakeD1
    db.seedOne({
      id: 'key-integ',
      key_prefix: 'tiko_' + hash.slice(0, 8),
      scope: 'all',
      plan: 'free',
      rate_limit_rpm: 30,
      rate_limit_rpd: 500,
      state: 'active',
      user_id: 'user-1',
    })

    const req = new Request('https://test.example.com', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const ctx = await requireAuthWithRateLimit(req, env, {
      free: { rpm: 30, rpd: 500 },
      pro: { rpm: 100, rpd: 10000 },
    })
    expect(ctx.type).toBe('api_key')
    expect(ctx.apiKeyId).toBe('key-integ')
  })
})

// ---------------------------------------------------------------------------
// AuthError
// ---------------------------------------------------------------------------
describe('AuthError', () => {
  it('has status and code', () => {
    const err = new AuthError(401, 'TEST', 'test message')
    expect(err.status).toBe(401)
    expect(err.code).toBe('TEST')
    expect(err.message).toBe('test message')
    expect(err.name).toBe('AuthError')
  })
})

// ---------------------------------------------------------------------------
// Utility: shared minute window helper (mirrors rate-limit.ts logic)
// ---------------------------------------------------------------------------
function currentMinuteWindow(): string {
  const now = new Date()
  now.setSeconds(0, 0)
  return now.toISOString()
}
