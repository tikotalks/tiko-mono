import type { SessionBundle } from './types'

/**
 * Device owner abstraction for local-first data ownership.
 *
 * Every Tiko app gets an owner ID immediately — even before the user sets up
 * an email. This allows apps to create and cache local data on first launch
 * without a login wall.
 *
 * Resolution order:
 * 1. If the session bundle has a claimed user (has primaryEmail), the owner
 *    is the stable user.id — this is the recoverable identity.
 * 2. Otherwise the owner is the device.id — stable per device/app pair as
 *    assigned by the identity API.
 *
 * After email verification, the user.id becomes the owner. The device.id
 * remains linked to the user, so local data created under device.id can be
 * migrated to the user.id ownership during the claim flow.
 */

export interface DeviceOwner {
  /** Stable owner ID for local-first data. */
  ownerId: string
  /** Which source was used: 'user' for claimed/recoverable, 'device' for device-first. */
  source: 'user' | 'device'
  /** Whether this owner has been claimed with an email (recoverable across devices). */
  isClaimed: boolean
}

const DEVICE_OWNER_STORAGE_KEY = 'tiko_device_owner'

/**
 * Resolve the device owner from a SessionBundle.
 *
 * This is a pure function — it doesn't touch storage. Use `resolveAndPersistDeviceOwner`
 * for the full lifecycle including localStorage caching for offline/reload stability.
 */
export function resolveDeviceOwner(bundle: SessionBundle | null): DeviceOwner | null {
  if (!bundle) return null

  const hasEmail = Boolean(bundle.user.primaryEmail)

  if (hasEmail) {
    return {
      ownerId: bundle.user.id,
      source: 'user',
      isClaimed: true
    }
  }

  return {
    ownerId: bundle.device.id,
    source: 'device',
    isClaimed: false
  }
}

/**
 * Persist the resolved device owner to localStorage so it survives reloads
 * even if the session bundle is temporarily unavailable.
 */
export function persistDeviceOwner(owner: DeviceOwner | null, storage?: StorageLike): void {
  const s = storage || getBrowserStorage()
  if (!s) return

  if (!owner) {
    s.removeItem(DEVICE_OWNER_STORAGE_KEY)
    return
  }

  try {
    s.setItem(DEVICE_OWNER_STORAGE_KEY, JSON.stringify(owner))
  } catch {
    // Storage full or unavailable — non-critical, the owner will be
    // re-resolved from the session bundle on next startup.
  }
}

/**
 * Read a previously persisted device owner from localStorage.
 * Returns null if nothing is stored or the data is corrupt.
 */
export function readPersistedDeviceOwner(storage?: StorageLike): DeviceOwner | null {
  const s = storage || getBrowserStorage()
  if (!s) return null

  try {
    const raw = s.getItem(DEVICE_OWNER_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as DeviceOwner

    // Validate shape
    if (typeof parsed.ownerId !== 'string' || !parsed.ownerId) return null
    if (parsed.source !== 'user' && parsed.source !== 'device') return null
    if (typeof parsed.isClaimed !== 'boolean') return null

    return parsed
  } catch {
    return null
  }
}

/**
 * Full lifecycle: resolve the owner from a session bundle, persist it,
 * and return it. Falls back to the previously persisted owner if the
 * bundle is null (e.g. session expired but app still running).
 *
 * This ensures the ownerId is stable across reloads on the same device:
 * - First launch: device session created -> device.id stored
 * - Reload: session bundle restored -> same device.id returned
 * - After email claim: user.id stored, replaces device.id
 */
export function resolveAndPersistDeviceOwner(bundle: SessionBundle | null, storage?: StorageLike): DeviceOwner | null {
  if (bundle) {
    const owner = resolveDeviceOwner(bundle)
    persistDeviceOwner(owner, storage)
    return owner
  }

  // No active session bundle — try to read from localStorage.
  // This covers the case where the session is temporarily expired
  // but the app still needs an ownerId for local operations.
  return readPersistedDeviceOwner(storage)
}

/**
 * Get the raw owner ID string from a session bundle (convenience function).
 * Returns undefined if the bundle is null.
 */
export function getOwnerId(bundle: SessionBundle | null): string | undefined {
  return resolveDeviceOwner(bundle)?.ownerId
}

// Reuse the StorageLike interface from client.ts
interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function getBrowserStorage(): StorageLike | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}
