export function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

export function getServiceBaseUrl(envKey: string, fallback: string): string {
  const env = (import.meta as any).env || {}
  return stripTrailingSlash(env?.[envKey] || fallback)
}

export async function coreApiRequest<T>(baseUrl: string, path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {})
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    credentials: init.credentials ?? 'include'
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`Core API request failed: ${response.status}${errorText ? ` ${errorText}` : ''}`)
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  if (!text) return undefined as T

  const contentType = response.headers.get('Content-Type') || ''
  if (contentType.includes('application/json')) {
    return JSON.parse(text) as T
  }

  return text as T
}
