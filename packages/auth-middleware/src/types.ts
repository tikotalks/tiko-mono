export type Plan = 'free' | 'pro'

export interface AuthContext {
  type: 'session' | 'api_key'
  userId: string
  sessionId?: string
  apiKeyId?: string
  apiKeyPrefix?: string
  plan: Plan
  scope: string
  rateLimitRpm: number
  rateLimitRpd: number
}

export interface AuthEnv {
  IDENTITY_DB: D1Database
  IDENTITY_SESSION_CACHE?: KVNamespace
  IDENTITY_TOKEN_PEPPER?: string
}

export interface RequireAuthOptions {
  scopes?: string[]
  plans?: Plan[]
}

export interface RateLimitConfig {
  free: { rpm: number; rpd: number }
  pro: { rpm: number; rpd: number }
  proUnlimited?: boolean
}

export class AuthError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export interface ApiKeyRow {
  id: string
  name: string
  key_prefix: string
  key_hash: string
  user_id: string | null
  scope: string
  plan: string
  rate_limit_rpm: number
  rate_limit_rpd: number
  state: string
  last_used_at: string | null
}

export interface SessionRow {
  id: string
  user_id: string
  device_id: string
  token_hash: string
  state: string
  expires_at: string
}
