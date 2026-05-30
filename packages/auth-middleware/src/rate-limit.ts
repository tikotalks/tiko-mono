import type { AuthContext, AuthEnv, RateLimitConfig } from './types'
import { AuthError } from './types'

function currentMinuteWindow(): string {
  const now = new Date()
  now.setSeconds(0, 0)
  return now.toISOString()
}

function currentDayWindow(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
}

function getIdentityKey(auth: AuthContext): string {
  if (auth.type === 'api_key' && auth.apiKeyId) {
    return `apikey:${auth.apiKeyId}`
  }
  if (auth.sessionId) {
    return `session:${auth.sessionId}`
  }
  return `user:${auth.userId}`
}

interface Counters {
  rpm: number
  rpd: number
}

async function getCounters(env: AuthEnv, identityKey: string): Promise<Counters> {
  const minuteKey = `${identityKey}:${currentMinuteWindow()}`
  const dayKey = `${identityKey}:${currentDayWindow()}`

  // Check KV first for the minute counter (fast path)
  let rpm = 0
  if (env.IDENTITY_SESSION_CACHE) {
    const cached = await env.IDENTITY_SESSION_CACHE.get(`rl:${minuteKey}`)
    if (cached) {
      rpm = parseInt(cached, 10) || 0
    }
  }

  // For RPD, check D1 (the day counter is too long for KV TTL to be reliable)
  let rpd = 0
  const dayRow = await env.IDENTITY_DB.prepare(
    `SELECT count FROM rate_limit_counters WHERE key = ? AND window_type = 'day'`,
  )
    .bind(dayKey)
    .first<{ count: number }>()

  if (dayRow) {
    rpd = dayRow.count
  }

  return { rpm, rpd }
}

async function incrementCounters(env: AuthEnv, identityKey: string): Promise<void> {
  const minuteKey = `${identityKey}:${currentMinuteWindow()}`
  const dayKey = `${identityKey}:${currentDayWindow()}`
  const now = new Date().toISOString()

  // Increment minute counter in KV
  if (env.IDENTITY_SESSION_CACHE) {
    const current = await env.IDENTITY_SESSION_CACHE.get(`rl:${minuteKey}`)
    const newCount = (parseInt(current || '0', 10) || 0) + 1
    env.IDENTITY_SESSION_CACHE.put(`rl:${minuteKey}`, String(newCount), {
      expirationTtl: 120, // 2 minutes TTL (covers the current + next minute window)
    })
  }

  // Upsert day counter in D1
  await env.IDENTITY_DB.prepare(
    `INSERT INTO rate_limit_counters (key, count, window_start, window_type)
     VALUES (?, 1, ?, 'day')
     ON CONFLICT(key) DO UPDATE SET count = count + 1`,
  )
    .bind(dayKey, currentDayWindow())
    .run()
}

export async function checkRateLimit(
  auth: AuthContext,
  env: AuthEnv,
  config: RateLimitConfig,
): Promise<void> {
  const effectiveConfig = auth.plan === 'pro' ? config.pro : config.free

  // Pro unlimited: skip RPM/RPD checks entirely
  if (auth.plan === 'pro' && config.proUnlimited) {
    return
  }

  const identityKey = getIdentityKey(auth)
  const counters = await getCounters(env, identityKey)

  if (counters.rpm >= effectiveConfig.rpm) {
    throw new AuthError(429, 'RATE_LIMIT_RPM', 'Rate limit exceeded: too many requests per minute')
  }

  if (counters.rpd >= effectiveConfig.rpd) {
    throw new AuthError(429, 'RATE_LIMIT_RPD', 'Rate limit exceeded: too many requests per day')
  }

  // Increment after check passes (optimistic — a small race is acceptable)
  await incrementCounters(env, identityKey)
}
