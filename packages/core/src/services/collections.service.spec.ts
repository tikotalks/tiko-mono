import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LocalStorageCollectionsService } from './collections.service'

const storage: Record<string, string> = {}

beforeEach(() => {
  for (const key of Object.keys(storage)) delete storage[key]
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => storage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key]
    }),
    clear: vi.fn(() => {
      for (const key of Object.keys(storage)) delete storage[key]
    }),
  })
  storage.tiko_auth_session = JSON.stringify({ user: { id: 'user-1', role: 'user' } })
})

describe('LocalStorageCollectionsService', () => {
  it('persists collections without legacy backend runtime dependencies', async () => {
    const service = new LocalStorageCollectionsService()

    const collection = await service.createCollection({ name: 'Favorites', is_public: true })
    const item = await service.addItemToCollection(collection.id, {
      item_id: 'media-1',
      item_type: 'media',
    })

    expect(collection.user_id).toBe('user-1')
    expect(item.collection_id).toBe(collection.id)
    expect(await service.getUserCollections()).toHaveLength(1)
    expect(await service.getPublicCollections()).toHaveLength(1)
    expect(await service.getCollectionsForMedia('media-1', 'media')).toHaveLength(1)
    expect(storage.tiko_collections).toContain('Favorites')
  })

  it('tracks likes locally per identity user', async () => {
    const service = new LocalStorageCollectionsService()
    const collection = await service.createCollection({ name: 'Liked' })

    await expect(service.toggleCollectionLike(collection.id)).resolves.toBe(true)
    await expect(service.toggleCollectionLike(collection.id)).resolves.toBe(false)

    const [stored] = await service.getUserCollections()
    expect(stored.like_count).toBe(0)
  })
})
