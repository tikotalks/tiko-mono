import type { D1Database, KVNamespace, Queue } from './d1'

export interface IdentityEnv {
  IDENTITY_DB: D1Database
  IDENTITY_SESSION_CACHE?: KVNamespace
  MAGIC_LINK_QUEUE?: Queue<MagicLinkEmailJob>
  IDENTITY_TOKEN_PEPPER?: string
  IDENTITY_ALLOWED_ORIGINS?: string
  MAGIC_LINK_BASE_URL?: string
  ANONYMOUS_USER_RETENTION_DAYS?: string
}

export type SessionState = 'active' | 'revoked' | 'expired'
export type EmailTokenPurpose = 'recovery' | 'transfer' | 'verify_email'
export type MagicLinkState = 'pending' | 'consumed' | 'expired'

export interface DeviceFingerprintInput {
  appId: string
  userAgent?: string
  language?: string
  timezone?: string
  screen?: string
  platform?: string
  deviceKey?: string
  extra?: Record<string, string | number | boolean | null | undefined>
}

export interface RegisterDeviceRequest {
  appId: string
  deviceKey?: string
  fingerprint?: Partial<DeviceFingerprintInput>
  displayName?: string
}

export interface IdentityUser {
  id: string
  primaryEmail: string | null
  displayName: string | null
  createdAt: string
  updatedAt: string
  lastSeenAt: string | null
}

export interface IdentityDevice {
  id: string
  userId: string
  appId: string
  deviceKeyHash: string | null
  fingerprintHash: string
  displayName: string | null
  trusted: boolean
  createdAt: string
  updatedAt: string
  lastSeenAt: string | null
}

export interface IdentitySession {
  id: string
  userId: string
  deviceId: string
  tokenHash: string
  state: SessionState
  createdAt: string
  updatedAt: string
  expiresAt: string
  revokedAt: string | null
  lastSeenAt: string | null
}

export interface EmailToken {
  id: string
  userId: string
  email: string
  tokenHash: string
  purpose: EmailTokenPurpose
  createdAt: string
  expiresAt: string
  consumedAt: string | null
}

export interface MagicLink {
  id: string
  userId: string
  email: string
  tokenHash: string
  state: MagicLinkState
  createdAt: string
  expiresAt: string
  consumedAt: string | null
  redirectUrl: string | null
  displayName: string | null
}

export interface MagicLinkEmailJob {
  magicLinkId: string
  userId: string
  email: string
  url: string
  expiresAt: string
}

export interface SessionBundle {
  user: IdentityUser
  device: IdentityDevice
  session: Omit<IdentitySession, 'tokenHash'>
  sessionToken: string
}

export interface ApiErrorBody {
  ok: false
  error: {
    code: string
    message: string
  }
}

export interface ApiSuccessBody<T> {
  ok: true
  data: T
}

export type ApiBody<T> = ApiSuccessBody<T> | ApiErrorBody
