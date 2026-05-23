import { beforeEach, describe, expect, it, vi } from 'vitest'
import worker from './index'
import type { Env } from './types'

interface BoundInsert {
  values: unknown[]
}

function createEnv(): Env & { inserts: BoundInsert[]; puts: Array<{ key: string }> } {
  const inserts: BoundInsert[] = []
  const puts: Array<{ key: string }> = []

  return {
    IDENTITY_BASE_URL: 'https://identity.test',
    ALLOWED_ORIGINS: 'https://yesno.tikoapps.org',
    USER_MEDIA_BUCKET: {
      put: vi.fn(async (key: string) => {
        puts.push({ key })
        return null
      }),
      get: vi.fn()
    } as unknown as R2Bucket,
    USER_MEDIA_DB: {
      prepare: vi.fn(() => ({
        bind: (...values: unknown[]) => ({
          run: vi.fn(async () => {
            inserts.push({ values })
            return { success: true }
          })
        })
      }))
    } as unknown as D1Database,
    inserts,
    puts
  }
}

function createUploadRequest({ token, userId = 'attacker-user', origin = 'https://yesno.tikoapps.org' }: { token?: string; userId?: string; origin?: string } = {}): Request {
  const form = new FormData()
  form.append('file', new File(['image-bytes'], 'avatar.png', { type: 'image/png' }))
  form.append('data', JSON.stringify({
    userId,
    usageType: 'profile_picture',
    metadata: { source: 'test' }
  }))

  const headers = new Headers({ Origin: origin })
  if (token) headers.set('Authorization', `Bearer ${token}`)

  return new Request('https://user-media.tikocdn.org/upload', {
    method: 'POST',
    headers,
    body: form
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('user-media-upload worker', () => {
  it('rejects upload requests without verified identity even when form data includes a userId', async () => {
    const env = createEnv()
    const response = await worker.fetch(createUploadRequest(), env, {} as ExecutionContext)
    const body = await response.json() as { success: boolean; error: string }

    expect(response.status).toBe(401)
    expect(body).toEqual({ success: false, error: 'Not authenticated' })
    expect(env.puts).toEqual([])
    expect(env.inserts).toEqual([])
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://yesno.tikoapps.org')
    expect(response.headers.get('Access-Control-Allow-Origin')).not.toBe('*')
  })

  it('uses the verified identity user id instead of the caller-controlled multipart userId', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      ok: true,
      data: { user: { id: 'verified-user' } }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    const env = createEnv()
    const response = await worker.fetch(createUploadRequest({ token: 'session-token' }), env, {} as ExecutionContext)
    const body = await response.json() as { success: boolean; url: string }

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.url).toContain('https://user-media.tikocdn.org/verified-user/')
    expect(env.puts[0]?.key).toMatch(/^verified-user\//)
    expect(env.inserts[0]?.values[1]).toBe('verified-user')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://yesno.tikoapps.org')
    expect(response.headers.get('Access-Control-Allow-Origin')).not.toBe('*')
  })

  it('does not emit wildcard CORS for protected upload preflight', async () => {
    const env = createEnv()
    const response = await worker.fetch(new Request('https://user-media.tikocdn.org/upload', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://evil.example',
        'Access-Control-Request-Method': 'POST'
      }
    }), env, {} as ExecutionContext)

    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
    expect(response.headers.get('Access-Control-Allow-Origin')).not.toBe('*')
  })
})
