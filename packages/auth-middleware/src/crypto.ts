export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function hashSecret(secret: string, pepper = ''): Promise<string> {
  return sha256Hex(`${pepper}:${secret}`)
}

export function stripBearer(header: string | null): string | null {
  if (!header) return null
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

export function isApiKeyToken(token: string): boolean {
  return token.startsWith('tiko_live_') || token.startsWith('tiko_test_')
}
