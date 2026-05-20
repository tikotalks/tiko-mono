import { addSecondsIso, createId, hashSecret, nowIso, randomToken } from './crypto'
import { hashFingerprint } from './fingerprint'
import type {
  DeviceFingerprintInput,
  EmailTokenPurpose,
  IdentityDevice,
  IdentityEnv,
  IdentitySession,
  IdentityUser,
  MagicLink,
  RegisterDeviceRequest,
  SessionBundle
} from './types'

const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 90
const DEFAULT_MAGIC_LINK_TTL_SECONDS = 60 * 15

interface UserRow {
  id: string
  primary_email: string | null
  created_at: string
  updated_at: string
  last_seen_at: string | null
}

interface DeviceRow {
  id: string
  user_id: string
  app_id: string
  device_key_hash: string | null
  fingerprint_hash: string
  display_name: string | null
  trusted: number
  created_at: string
  updated_at: string
  last_seen_at: string | null
}

interface SessionRow {
  id: string
  user_id: string
  device_id: string
  token_hash: string
  state: IdentitySession['state']
  created_at: string
  updated_at: string
  expires_at: string
  revoked_at: string | null
  last_seen_at: string | null
}

interface MagicLinkRow {
  id: string
  user_id: string
  email: string
  token_hash: string
  state: MagicLink['state']
  created_at: string
  expires_at: string
  consumed_at: string | null
  redirect_url: string | null
}

export async function registerDevice(env: IdentityEnv, request: RegisterDeviceRequest): Promise<SessionBundle> {
  const appId = assertNonEmpty(request.appId, 'appId')
  const fingerprintInput: DeviceFingerprintInput = { appId, deviceKey: request.deviceKey, ...request.fingerprint }
  const fingerprintHash = await hashFingerprint(fingerprintInput)
  const deviceKeyHash = request.deviceKey ? await hashSecret(request.deviceKey, env.IDENTITY_TOKEN_PEPPER) : null
  const now = nowIso()

  const existingDevice = await findDevice(env, appId, fingerprintHash, deviceKeyHash)
  const user = existingDevice ? await requireUser(env, existingDevice.userId) : await createAnonymousUser(env, now)
  const device = existingDevice || (await createDevice(env, user.id, appId, fingerprintHash, deviceKeyHash, request.displayName || null, now))

  await touchUserAndDevice(env, user.id, device.id, now)
  return createSession(env, user.id, device.id)
}

export async function createSession(
  env: IdentityEnv,
  userId: string,
  deviceId: string,
  ttlSeconds = DEFAULT_SESSION_TTL_SECONDS
): Promise<SessionBundle> {
  const token = randomToken(48)
  const tokenHash = await hashSecret(token, env.IDENTITY_TOKEN_PEPPER)
  const now = nowIso()
  const expiresAt = addSecondsIso(ttlSeconds)
  const id = createId('ses')

  await env.IDENTITY_DB.prepare(
    `insert into sessions (id, user_id, device_id, token_hash, state, created_at, updated_at, expires_at, revoked_at, last_seen_at)
     values (?, ?, ?, ?, 'active', ?, ?, ?, null, ?)`
  )
    .bind(id, userId, deviceId, tokenHash, now, now, expiresAt, now)
    .run()

  const session = await requireSessionById(env, id)
  const [user, device] = await Promise.all([requireUser(env, userId), requireDevice(env, deviceId)])

  await cacheSession(env, tokenHash, session)
  return { user, device, session: withoutTokenHash(session), sessionToken: token }
}

export async function validateSession(env: IdentityEnv, token: string): Promise<SessionBundle | null> {
  const tokenHash = await hashSecret(token, env.IDENTITY_TOKEN_PEPPER)
  const cached = await readCachedSession(env, tokenHash)
  const session = cached || (await findActiveSessionByHash(env, tokenHash))

  if (!session || session.state !== 'active' || new Date(session.expiresAt).getTime() <= Date.now()) {
    return null
  }

  const now = nowIso()
  await env.IDENTITY_DB.prepare(`update sessions set last_seen_at = ?, updated_at = ? where id = ?`).bind(now, now, session.id).run()
  await touchUserAndDevice(env, session.userId, session.deviceId, now)

  const [user, device] = await Promise.all([requireUser(env, session.userId), requireDevice(env, session.deviceId)])
  return { user, device, session: withoutTokenHash({ ...session, lastSeenAt: now, updatedAt: now }), sessionToken: token }
}

export async function refreshSession(env: IdentityEnv, token: string): Promise<SessionBundle | null> {
  const current = await validateSession(env, token)
  if (!current) {
    return null
  }

  await revokeSession(env, token)
  return createSession(env, current.user.id, current.device.id)
}

export async function revokeSession(env: IdentityEnv, token: string): Promise<boolean> {
  const tokenHash = await hashSecret(token, env.IDENTITY_TOKEN_PEPPER)
  const now = nowIso()
  const result = await env.IDENTITY_DB.prepare(
    `update sessions set state = 'revoked', revoked_at = ?, updated_at = ? where token_hash = ? and state = 'active'`
  )
    .bind(now, now, tokenHash)
    .run()
  await env.IDENTITY_SESSION_CACHE?.delete(cacheKey(tokenHash))
  return result.success
}

export async function createMagicLink(
  env: IdentityEnv,
  userId: string,
  email: string,
  purpose: EmailTokenPurpose = 'recovery',
  redirectUrl: string | null = null,
  ttlSeconds = DEFAULT_MAGIC_LINK_TTL_SECONDS
): Promise<{ magicLink: MagicLink; token: string; url: string }> {
  const normalizedEmail = normalizeEmail(email)
  const token = randomToken(40)
  const tokenHash = await hashSecret(token, env.IDENTITY_TOKEN_PEPPER)
  const now = nowIso()
  const expiresAt = addSecondsIso(ttlSeconds)
  const emailTokenId = createId('emt')
  const magicLinkId = createId('ml')

  await env.IDENTITY_DB.prepare(
    `insert into email_tokens (id, user_id, email, token_hash, purpose, created_at, expires_at, consumed_at)
     values (?, ?, ?, ?, ?, ?, ?, null)`
  )
    .bind(emailTokenId, userId, normalizedEmail, tokenHash, purpose, now, expiresAt)
    .run()

  await env.IDENTITY_DB.prepare(
    `insert into magic_links (id, user_id, email, token_hash, state, created_at, expires_at, consumed_at, redirect_url)
     values (?, ?, ?, ?, 'pending', ?, ?, null, ?)`
  )
    .bind(magicLinkId, userId, normalizedEmail, tokenHash, now, expiresAt, redirectUrl)
    .run()

  const magicLink = await requireMagicLink(env, magicLinkId)
  const url = buildMagicLinkUrl(env, token, redirectUrl)
  await env.MAGIC_LINK_QUEUE?.send({ magicLinkId, userId, email: normalizedEmail, url, expiresAt })
  return { magicLink, token, url }
}

export async function verifyMagicLink(env: IdentityEnv, token: string): Promise<SessionBundle | null> {
  const tokenHash = await hashSecret(token, env.IDENTITY_TOKEN_PEPPER)
  const row = await env.IDENTITY_DB.prepare(
    `select * from magic_links where token_hash = ? and state = 'pending' and consumed_at is null limit 1`
  )
    .bind(tokenHash)
    .first<MagicLinkRow>()

  if (!row || new Date(row.expires_at).getTime() <= Date.now()) {
    if (row) {
      await env.IDENTITY_DB.prepare(`update magic_links set state = 'expired' where id = ?`).bind(row.id).run()
    }
    return null
  }

  const now = nowIso()
  await env.IDENTITY_DB.prepare(`update magic_links set state = 'consumed', consumed_at = ? where id = ?`).bind(now, row.id).run()
  await env.IDENTITY_DB.prepare(`update email_tokens set consumed_at = ? where token_hash = ?`).bind(now, tokenHash).run()
  await env.IDENTITY_DB.prepare(`update users set primary_email = coalesce(primary_email, ?), updated_at = ? where id = ?`)
    .bind(row.email, now, row.user_id)
    .run()

  const device = await env.IDENTITY_DB.prepare(`select * from devices where user_id = ? order by last_seen_at desc, created_at desc limit 1`)
    .bind(row.user_id)
    .first<DeviceRow>()

  if (!device) {
    return null
  }

  return createSession(env, row.user_id, device.id)
}

async function createAnonymousUser(env: IdentityEnv, createdAt: string): Promise<IdentityUser> {
  const id = createId('usr')
  await env.IDENTITY_DB.prepare(
    `insert into users (id, primary_email, created_at, updated_at, last_seen_at) values (?, null, ?, ?, ?)`
  )
    .bind(id, createdAt, createdAt, createdAt)
    .run()
  return requireUser(env, id)
}

async function createDevice(
  env: IdentityEnv,
  userId: string,
  appId: string,
  fingerprintHash: string,
  deviceKeyHash: string | null,
  displayName: string | null,
  createdAt: string
): Promise<IdentityDevice> {
  const id = createId('dev')
  await env.IDENTITY_DB.prepare(
    `insert into devices (id, user_id, app_id, device_key_hash, fingerprint_hash, display_name, trusted, created_at, updated_at, last_seen_at)
     values (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
  )
    .bind(id, userId, appId, deviceKeyHash, fingerprintHash, displayName, createdAt, createdAt, createdAt)
    .run()
  return requireDevice(env, id)
}

async function findDevice(env: IdentityEnv, appId: string, fingerprintHash: string, deviceKeyHash: string | null): Promise<IdentityDevice | null> {
  const row = deviceKeyHash
    ? await env.IDENTITY_DB.prepare(`select * from devices where app_id = ? and device_key_hash = ? limit 1`)
        .bind(appId, deviceKeyHash)
        .first<DeviceRow>()
    : await env.IDENTITY_DB.prepare(`select * from devices where app_id = ? and fingerprint_hash = ? limit 1`)
        .bind(appId, fingerprintHash)
        .first<DeviceRow>()
  return row ? mapDevice(row) : null
}

async function requireUser(env: IdentityEnv, id: string): Promise<IdentityUser> {
  const row = await env.IDENTITY_DB.prepare(`select * from users where id = ?`).bind(id).first<UserRow>()
  if (!row) throw new Error(`User not found: ${id}`)
  return mapUser(row)
}

async function requireDevice(env: IdentityEnv, id: string): Promise<IdentityDevice> {
  const row = await env.IDENTITY_DB.prepare(`select * from devices where id = ?`).bind(id).first<DeviceRow>()
  if (!row) throw new Error(`Device not found: ${id}`)
  return mapDevice(row)
}

async function requireSessionById(env: IdentityEnv, id: string): Promise<IdentitySession> {
  const row = await env.IDENTITY_DB.prepare(`select * from sessions where id = ?`).bind(id).first<SessionRow>()
  if (!row) throw new Error(`Session not found: ${id}`)
  return mapSession(row)
}

async function requireMagicLink(env: IdentityEnv, id: string): Promise<MagicLink> {
  const row = await env.IDENTITY_DB.prepare(`select * from magic_links where id = ?`).bind(id).first<MagicLinkRow>()
  if (!row) throw new Error(`Magic link not found: ${id}`)
  return mapMagicLink(row)
}

async function findActiveSessionByHash(env: IdentityEnv, tokenHash: string): Promise<IdentitySession | null> {
  const row = await env.IDENTITY_DB.prepare(`select * from sessions where token_hash = ? and state = 'active' limit 1`)
    .bind(tokenHash)
    .first<SessionRow>()
  return row ? mapSession(row) : null
}

async function touchUserAndDevice(env: IdentityEnv, userId: string, deviceId: string, timestamp: string): Promise<void> {
  await env.IDENTITY_DB.prepare(`update users set last_seen_at = ?, updated_at = ? where id = ?`).bind(timestamp, timestamp, userId).run()
  await env.IDENTITY_DB.prepare(`update devices set last_seen_at = ?, updated_at = ? where id = ?`).bind(timestamp, timestamp, deviceId).run()
}

async function cacheSession(env: IdentityEnv, tokenHash: string, session: IdentitySession): Promise<void> {
  if (!env.IDENTITY_SESSION_CACHE) return
  const ttl = Math.max(1, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000))
  await env.IDENTITY_SESSION_CACHE.put(cacheKey(tokenHash), JSON.stringify(session), { expirationTtl: ttl })
}

async function readCachedSession(env: IdentityEnv, tokenHash: string): Promise<IdentitySession | null> {
  const raw = await env.IDENTITY_SESSION_CACHE?.get(cacheKey(tokenHash))
  if (!raw) return null
  try {
    return JSON.parse(raw) as IdentitySession
  } catch {
    await env.IDENTITY_SESSION_CACHE?.delete(cacheKey(tokenHash))
    return null
  }
}

function buildMagicLinkUrl(env: IdentityEnv, token: string, redirectUrl: string | null): string {
  const base = env.MAGIC_LINK_BASE_URL || 'https://identity.tikoapps.org/api/identity/verify-magic-link'
  const url = new URL(base)
  url.searchParams.set('token', token)
  if (redirectUrl) url.searchParams.set('redirectUrl', redirectUrl)
  return url.toString()
}

function cacheKey(tokenHash: string): string {
  return `identity:session:${tokenHash}`
}

function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('Invalid email')
  }
  return normalized
}

function assertNonEmpty(value: string | undefined, field: string): string {
  const trimmed = value?.trim()
  if (!trimmed) throw new Error(`${field} is required`)
  return trimmed
}

function withoutTokenHash(session: IdentitySession): Omit<IdentitySession, 'tokenHash'> {
  const { tokenHash: _tokenHash, ...safeSession } = session
  return safeSession
}

function mapUser(row: UserRow): IdentityUser {
  return { id: row.id, primaryEmail: row.primary_email, createdAt: row.created_at, updatedAt: row.updated_at, lastSeenAt: row.last_seen_at }
}

function mapDevice(row: DeviceRow): IdentityDevice {
  return {
    id: row.id,
    userId: row.user_id,
    appId: row.app_id,
    deviceKeyHash: row.device_key_hash,
    fingerprintHash: row.fingerprint_hash,
    displayName: row.display_name,
    trusted: row.trusted === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSeenAt: row.last_seen_at
  }
}

function mapSession(row: SessionRow): IdentitySession {
  return {
    id: row.id,
    userId: row.user_id,
    deviceId: row.device_id,
    tokenHash: row.token_hash,
    state: row.state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    lastSeenAt: row.last_seen_at
  }
}

function mapMagicLink(row: MagicLinkRow): MagicLink {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    tokenHash: row.token_hash,
    state: row.state,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    consumedAt: row.consumed_at,
    redirectUrl: row.redirect_url
  }
}
