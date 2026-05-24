import { beforeEach, describe, expect, it } from 'vitest'
import {
  resolveDeviceOwner,
  resolveAndPersistDeviceOwner,
  persistDeviceOwner,
  readPersistedDeviceOwner,
  getOwnerId
} from './device-owner'
import type { SessionBundle } from './types'

const stored: Record<string, string> = {}
const mockStorage = {
  getItem: (key: string) => stored[key] ?? null,
  setItem: (key: string, value: string) => { stored[key] = value },
  removeItem: (key: string) => { delete stored[key] }
}

function makeBundle(overrides: {
  primaryEmail: string | null
  userId?: string
  deviceId?: string
}): SessionBundle {
  const userId = overrides.userId ?? 'user-abc'
  return {
    user: {
      id: userId,
      primaryEmail: overrides.primaryEmail,
      displayName: null,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
      lastSeenAt: null
    },
    device: {
      id: overrides.deviceId ?? 'device-xyz',
      userId,
      appId: 'yes-no',
      deviceKeyHash: null,
      fingerprintHash: 'fp-hash',
      displayName: 'Kitchen iPad',
      trusted: true,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
      lastSeenAt: null
    },
    session: {
      id: 'session-123',
      userId,
      deviceId: overrides.deviceId ?? 'device-xyz',
      state: 'active',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
      expiresAt: '2030-01-01T00:00:00.000Z',
      revokedAt: null,
      lastSeenAt: null
    },
    sessionToken: 'test-token'
  }
}

describe('resolveDeviceOwner', () => {
  it('returns device.id as ownerId for device-first users without email', () => {
    const bundle = makeBundle({ primaryEmail: null })
    const owner = resolveDeviceOwner(bundle)!

    expect(owner.ownerId).toBe('device-xyz')
    expect(owner.source).toBe('device')
    expect(owner.isClaimed).toBe(false)
  })

  it('returns user.id as ownerId for claimed users with email', () => {
    const bundle = makeBundle({ primaryEmail: 'caregiver@example.com', userId: 'user-123' })
    const owner = resolveDeviceOwner(bundle)!

    expect(owner.ownerId).toBe('user-123')
    expect(owner.source).toBe('user')
    expect(owner.isClaimed).toBe(true)
  })

  it('returns null when bundle is null', () => {
    expect(resolveDeviceOwner(null)).toBeNull()
  })

  it('returns the same device.id on repeated calls with the same device session', () => {
    const bundle = makeBundle({ primaryEmail: null, deviceId: 'stable-device-001' })

    const owner1 = resolveDeviceOwner(bundle)
    const owner2 = resolveDeviceOwner(bundle)

    expect(owner1!.ownerId).toBe('stable-device-001')
    expect(owner2!.ownerId).toBe('stable-device-001')
    expect(owner1!.ownerId).toBe(owner2!.ownerId)
  })
})

describe('persistDeviceOwner / readPersistedDeviceOwner', () => {
  beforeEach(() => {
    for (const key of Object.keys(stored)) delete stored[key]
  })

  it('persists and reads back a device owner', () => {
    const owner = { ownerId: 'device-xyz', source: 'device' as const, isClaimed: false }
    persistDeviceOwner(owner, mockStorage)

    const read = readPersistedDeviceOwner(mockStorage)
    expect(read).toEqual(owner)
  })

  it('removes storage when persisting null', () => {
    stored['tiko_device_owner'] = '{"ownerId":"old"}'
    persistDeviceOwner(null, mockStorage)

    expect(stored['tiko_device_owner']).toBeUndefined()
    expect(readPersistedDeviceOwner(mockStorage)).toBeNull()
  })

  it('returns null for corrupt stored data', () => {
    stored['tiko_device_owner'] = 'not-json'
    expect(readPersistedDeviceOwner(mockStorage)).toBeNull()
  })

  it('returns null for invalid shape (missing ownerId)', () => {
    stored['tiko_device_owner'] = JSON.stringify({ source: 'device', isClaimed: false })
    expect(readPersistedDeviceOwner(mockStorage)).toBeNull()
  })

  it('returns null for invalid source value', () => {
    stored['tiko_device_owner'] = JSON.stringify({ ownerId: 'x', source: 'invalid', isClaimed: false })
    expect(readPersistedDeviceOwner(mockStorage)).toBeNull()
  })
})

describe('resolveAndPersistDeviceOwner', () => {
  beforeEach(() => {
    for (const key of Object.keys(stored)) delete stored[key]
  })

  it('resolves from bundle and persists', () => {
    const bundle = makeBundle({ primaryEmail: null })
    const owner = resolveAndPersistDeviceOwner(bundle, mockStorage)!

    expect(owner.ownerId).toBe('device-xyz')
    expect(owner.source).toBe('device')
    expect(readPersistedDeviceOwner(mockStorage)).toEqual(owner)
  })

  it('falls back to persisted owner when bundle is null', () => {
    // First call: persist a device owner
    const bundle = makeBundle({ primaryEmail: null, deviceId: 'persisted-device-001' })
    resolveAndPersistDeviceOwner(bundle, mockStorage)

    // Second call: null bundle — should return the persisted owner
    const owner = resolveAndPersistDeviceOwner(null, mockStorage)!
    expect(owner.ownerId).toBe('persisted-device-001')
    expect(owner.source).toBe('device')
  })

  it('returns null when both bundle and persisted data are unavailable', () => {
    expect(resolveAndPersistDeviceOwner(null, mockStorage)).toBeNull()
  })

  it('simulates reload stability: ownerId stays the same across multiple resolve+persist cycles', () => {
    // Simulate first app launch: device creates a session
    const bundle1 = makeBundle({ primaryEmail: null, deviceId: 'same-device-999' })
    const owner1 = resolveAndPersistDeviceOwner(bundle1, mockStorage)!

    // Simulate reload: app resolves from the same device session
    const bundle2 = makeBundle({ primaryEmail: null, deviceId: 'same-device-999' })
    const owner2 = resolveAndPersistDeviceOwner(bundle2, mockStorage)!

    expect(owner1.ownerId).toBe(owner2.ownerId)
    expect(owner1.ownerId).toBe('same-device-999')

    // Even if the session bundle is temporarily null (e.g. expired mid-refresh),
    // the persisted owner keeps the same ID
    const owner3 = resolveAndPersistDeviceOwner(null, mockStorage)!
    expect(owner3.ownerId).toBe('same-device-999')
  })

  it('simulates email claim: ownerId transitions from device.id to user.id', () => {
    // Phase 1: device-first, no email
    const deviceBundle = makeBundle({
      primaryEmail: null,
      userId: 'user-abc',
      deviceId: 'device-xyz'
    })
    const owner1 = resolveAndPersistDeviceOwner(deviceBundle, mockStorage)!
    expect(owner1.ownerId).toBe('device-xyz')
    expect(owner1.source).toBe('device')
    expect(owner1.isClaimed).toBe(false)

    // Phase 2: after email verification, same user now has email
    const claimedBundle = makeBundle({
      primaryEmail: 'caregiver@example.com',
      userId: 'user-abc',
      deviceId: 'device-xyz'
    })
    const owner2 = resolveAndPersistDeviceOwner(claimedBundle, mockStorage)!
    expect(owner2.ownerId).toBe('user-abc')
    expect(owner2.source).toBe('user')
    expect(owner2.isClaimed).toBe(true)

    // The persisted owner is now the user.id
    const persisted = readPersistedDeviceOwner(mockStorage)!
    expect(persisted.ownerId).toBe('user-abc')
    expect(persisted.isClaimed).toBe(true)
  })
})

describe('getOwnerId', () => {
  it('returns the owner ID string from a bundle', () => {
    const bundle = makeBundle({ primaryEmail: null })
    expect(getOwnerId(bundle)).toBe('device-xyz')
  })

  it('returns undefined when bundle is null', () => {
    expect(getOwnerId(null)).toBeUndefined()
  })
})
