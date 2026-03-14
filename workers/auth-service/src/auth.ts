import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { betterAuth } from 'better-auth'
import { emailOTP } from 'better-auth/plugins/email-otp'
import { drizzle } from 'drizzle-orm/d1'
import type { Env, OtpEmailPayload } from './types'

const AUTH_BASE_PATH = '/api/auth'
const DEFAULT_AUTH_BASE_URL = 'https://auth.tikoapps.org'

export function createAuth(env: Env, ctx: ExecutionContext) {
  const db = drizzle(env.AUTH_DB)

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET || 'development-secret-change-me',
    baseURL: env.BETTER_AUTH_URL || DEFAULT_AUTH_BASE_URL,
    basePath: AUTH_BASE_PATH,
    trustedOrigins: parseAllowedOrigins(env.ALLOWED_APP_ORIGINS),
    emailAndPassword: {
      enabled: false
    },
    socialProviders: buildSocialProviders(env),
    database: drizzleAdapter(db, {
      provider: 'sqlite'
    }),
    advanced: {
      cookiePrefix: 'tiko',
      useSecureCookies: shouldUseSecureCookies(env.BETTER_AUTH_URL || DEFAULT_AUTH_BASE_URL),
      crossSubDomainCookies: env.COOKIE_DOMAIN
        ? {
            enabled: true,
            domain: env.COOKIE_DOMAIN
          }
        : {
            enabled: false
          }
    },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 10 * 60,
        allowedAttempts: 5,
        sendVerificationOTP: async payload => {
          await sendVerificationEmail(payload, env, ctx)
        }
      })
    ]
  })
}

export function isAuthRoute(pathname: string): boolean {
  return pathname === AUTH_BASE_PATH || pathname.startsWith(`${AUTH_BASE_PATH}/`)
}

export function getAuthBasePath(): string {
  return AUTH_BASE_PATH
}

function parseAllowedOrigins(value: string): string[] {
  return value
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
}

function shouldUseSecureCookies(baseUrl: string): boolean {
  return baseUrl.startsWith('https://')
}

function buildSocialProviders(env: Env) {
  if (!env.AUTH_GOOGLE_CLIENT_ID || !env.AUTH_GOOGLE_CLIENT_SECRET) {
    return undefined
  }

  return {
    google: {
      clientId: env.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: env.AUTH_GOOGLE_CLIENT_SECRET,
    },
  }
}

async function sendVerificationEmail(
  payload: OtpEmailPayload,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    throw new Error('OTP email delivery is not configured')
  }

  const emailRequest = fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: payload.email,
      subject: 'Your Tiko verification code',
      text: [
        'Use this code to sign in to Tiko:',
        '',
        payload.otp,
        '',
        'The code expires in 10 minutes.'
      ].join('\n')
    })
  })

  ctx.waitUntil(emailRequest)

  const response = await emailRequest

  if (!response.ok) {
    const errorText = await response.text()

    throw new Error(`Failed to send OTP email: ${response.status} ${errorText}`)
  }
}
