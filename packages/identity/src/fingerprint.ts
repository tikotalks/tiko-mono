import { sha256Hex } from './crypto'
import type { DeviceFingerprintInput } from './types'

export function fingerprintFromRequest(request: Request, appId: string, body?: Partial<DeviceFingerprintInput>): DeviceFingerprintInput {
  return {
    appId,
    userAgent: request.headers.get('user-agent') || body?.userAgent,
    language: request.headers.get('accept-language') || body?.language,
    timezone: body?.timezone,
    screen: body?.screen,
    platform: body?.platform,
    deviceKey: body?.deviceKey,
    extra: body?.extra
  }
}

export function normalizeFingerprint(input: DeviceFingerprintInput): string {
  const extra = input.extra || {}
  const extraPairs = Object.keys(extra)
    .sort()
    .map((key) => `${key}:${String(extra[key] ?? '')}`)

  return [
    `app:${input.appId}`,
    `ua:${normalize(input.userAgent)}`,
    `lang:${normalizeLanguage(input.language)}`,
    `tz:${normalize(input.timezone)}`,
    `screen:${normalize(input.screen)}`,
    `platform:${normalize(input.platform)}`,
    `device:${normalize(input.deviceKey)}`,
    ...extraPairs
  ].join('|')
}

export async function hashFingerprint(input: DeviceFingerprintInput): Promise<string> {
  return sha256Hex(normalizeFingerprint(input))
}

function normalize(value?: string | null): string {
  return (value || '').trim().toLowerCase()
}

function normalizeLanguage(value?: string | null): string {
  return normalize(value).split(',')[0] || ''
}
