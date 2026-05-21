import { describe, expect, it, vi } from 'vitest'
import { createMagicLink, createSession, registerDevice, verifyMagicLink } from './repository'
import type { D1Database, D1PreparedStatement, D1Result } from './d1'
import type { IdentityEnv } from './types'

type Row = Record<string, unknown>

class MemoryStatement implements D1PreparedStatement {
  private values: unknown[] = []

  constructor(
    private readonly query: string,
    private readonly db: MemoryIdentityDb
  ) {}

  bind(...values: unknown[]): D1PreparedStatement {
    this.values = values
    return this
  }

  async first<T = unknown>(): Promise<T | null> {
    return this.db.first(this.query, this.values) as T | null
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    return { success: true, results: [] }
  }

  async run(): Promise<D1Result> {
    return this.db.run(this.query, this.values)
  }
}

class MemoryIdentityDb implements D1Database {
  users = new Map<string, Row>()
  devices = new Map<string, Row>()
  sessions = new Map<string, Row>()
  magicLinks = new Map<string, Row>()
  emailTokens = new Map<string, Row>()

  prepare(query: string): D1PreparedStatement {
    return new MemoryStatement(query, this)
  }

  async run(query: string, values: unknown[]): Promise<D1Result> {
    if (query.includes('insert into users')) {
      const [id, createdAt, updatedAt, lastSeenAt] = values
      this.users.set(String(id), { id, primary_email: null, display_name: null, created_at: createdAt, updated_at: updatedAt, last_seen_at: lastSeenAt })
      return { success: true, meta: { changes: 1 } }
    }

    if (query.includes('insert into devices')) {
      const [id, userId, appId, deviceKeyHash, fingerprintHash, displayName, createdAt, updatedAt, lastSeenAt] = values
      this.devices.set(String(id), {
        id,
        user_id: userId,
        app_id: appId,
        device_key_hash: deviceKeyHash,
        fingerprint_hash: fingerprintHash,
        display_name: displayName,
        trusted: 0,
        created_at: createdAt,
        updated_at: updatedAt,
        last_seen_at: lastSeenAt
      })
      return { success: true, meta: { changes: 1 } }
    }

    if (query.includes('insert into sessions')) {
      const [id, userId, deviceId, tokenHash, createdAt, updatedAt, expiresAt, lastSeenAt] = values
      this.sessions.set(String(id), {
        id,
        user_id: userId,
        device_id: deviceId,
        token_hash: tokenHash,
        state: 'active',
        created_at: createdAt,
        updated_at: updatedAt,
        expires_at: expiresAt,
        revoked_at: null,
        last_seen_at: lastSeenAt
      })
      return { success: true, meta: { changes: 1 } }
    }

    if (query.includes('insert into email_tokens')) {
      const [id, userId, email, tokenHash, purpose, createdAt, expiresAt] = values
      this.emailTokens.set(String(id), { id, user_id: userId, email, token_hash: tokenHash, purpose, created_at: createdAt, expires_at: expiresAt, consumed_at: null })
      return { success: true, meta: { changes: 1 } }
    }

    if (query.includes('insert into magic_links')) {
      const [id, userId, email, tokenHash, createdAt, expiresAt, redirectUrl, displayName] = values
      this.magicLinks.set(String(id), {
        id,
        user_id: userId,
        email,
        token_hash: tokenHash,
        state: 'pending',
        created_at: createdAt,
        expires_at: expiresAt,
        consumed_at: null,
        redirect_url: redirectUrl,
        display_name: displayName
      })
      return { success: true, meta: { changes: 1 } }
    }

    if (query.includes('update users set last_seen_at')) {
      const [lastSeenAt, updatedAt, id] = values
      Object.assign(this.users.get(String(id)) ?? {}, { last_seen_at: lastSeenAt, updated_at: updatedAt })
      return { success: true, meta: { changes: 1 } }
    }

    if (query.includes('update devices set last_seen_at')) {
      const [lastSeenAt, updatedAt, id] = values
      Object.assign(this.devices.get(String(id)) ?? {}, { last_seen_at: lastSeenAt, updated_at: updatedAt })
      return { success: true, meta: { changes: 1 } }
    }

    if (query.includes('update magic_links set state')) {
      const [consumedAt, id] = values
      Object.assign(this.magicLinks.get(String(id)) ?? {}, { state: 'consumed', consumed_at: consumedAt })
      return { success: true, meta: { changes: 1 } }
    }

    if (query.includes('update email_tokens set consumed_at')) {
      const [consumedAt, tokenHash] = values
      for (const row of Array.from(this.emailTokens.values())) {
        if (row.token_hash === tokenHash) row.consumed_at = consumedAt
      }
      return { success: true, meta: { changes: 1 } }
    }

    if (query.includes('update users set primary_email')) {
      const [email, displayName, updatedAt, id] = values
      const row = this.users.get(String(id))
      if (row) Object.assign(row, { primary_email: row.primary_email ?? email, display_name: row.display_name ?? displayName, updated_at: updatedAt })
      return { success: true, meta: { changes: 1 } }
    }

    return { success: true, meta: { changes: 0 } }
  }

  async first(query: string, values: unknown[]): Promise<Row | null> {
    if (query.includes('from devices where app_id')) {
      return null
    }

    if (query.includes('from users where id')) {
      return this.users.get(String(values[0])) ?? null
    }

    if (query.includes('from devices where id')) {
      return this.devices.get(String(values[0])) ?? null
    }

    if (query.includes('from sessions where id')) {
      return this.sessions.get(String(values[0])) ?? null
    }

    if (query.includes('from magic_links where id')) {
      return this.magicLinks.get(String(values[0])) ?? null
    }

    if (query.includes('from magic_links where token_hash')) {
      return Array.from(this.magicLinks.values()).find((row) => row.token_hash === values[0] && row.state === 'pending' && row.consumed_at === null) ?? null
    }

    if (query.includes('from devices where user_id')) {
      return Array.from(this.devices.values()).find((row) => row.user_id === values[0]) ?? null
    }

    if (query.includes('from sessions where token_hash')) {
      return Array.from(this.sessions.values()).find((row) => row.token_hash === values[0] && row.state === 'active') ?? null
    }

    return null
  }
}

function testEnv(db = new MemoryIdentityDb()): IdentityEnv {
  return {
    IDENTITY_DB: db,
    IDENTITY_TOKEN_PEPPER: 'test-pepper',
    MAGIC_LINK_BASE_URL: 'https://id.tiko.mt/api/identity/verify-magic-link',
    MAGIC_LINK_QUEUE: { send: vi.fn() }
  }
}

describe('magic link account conversion', () => {
  it('converts an anonymous device user by adding email and display name when a magic link is verified', async () => {
    const db = new MemoryIdentityDb()
    const env = testEnv(db)
    const anonymous = await registerDevice(env, { appId: 'yes-no', displayName: 'Kitchen iPad', fingerprint: { deviceKey: 'device-one' } })

    const { token, magicLink } = await createMagicLink(env, anonymous.user.id, ' Child@Example.COM ', 'recovery', null, ' Child Name ')

    expect(magicLink.email).toBe('child@example.com')
    expect(magicLink.displayName).toBe('Child Name')

    const converted = await verifyMagicLink(env, token)

    expect(converted?.user.id).toBe(anonymous.user.id)
    expect(converted?.user.primaryEmail).toBe('child@example.com')
    expect(converted?.user.displayName).toBe('Child Name')
    expect(converted?.device.id).toBe(anonymous.device.id)
  })
})
