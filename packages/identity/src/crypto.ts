const TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'

export function nowIso(): string {
  return new Date().toISOString()
}

export function addSecondsIso(seconds: number, from = new Date()): string {
  return new Date(from.getTime() + seconds * 1000).toISOString()
}

export function createId(prefix: string, size = 16): string {
  return `${prefix}_${randomToken(size)}`
}

export function randomToken(size = 32): string {
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  let token = ''

  for (const byte of bytes) {
    token += TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length]
  }

  return token
}

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function hashSecret(secret: string, pepper = ''): Promise<string> {
  return sha256Hex(`${pepper}:${secret}`)
}

export function stripBearer(header: string | null): string | null {
  if (!header) {
    return null
  }

  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}
