export interface Env {
  AUTH_DB: D1Database
  COOKIE_DOMAIN: string
  ALLOWED_APP_ORIGINS: string
  BETTER_AUTH_SECRET?: string
  BETTER_AUTH_URL?: string
  AUTH_GOOGLE_CLIENT_ID?: string
  AUTH_GOOGLE_CLIENT_SECRET?: string
  RESEND_API_KEY?: string
  RESEND_FROM_EMAIL?: string
}

export interface SessionUser {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  email_verified: boolean
  phone_verified: boolean
  app_metadata: Record<string, any>
  user_metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface SessionPayload {
  authenticated: boolean
  user: SessionUser | null
  session: {
    id: string
    token: string
    expiresAt: string
  } | null
}

export interface EmailOtpSendRequest {
  email: string
  name?: string
  appId?: string
  returnUrl?: string
}

export interface EmailOtpVerifyRequest {
  email: string
  code: string
  name?: string
  appId?: string
  returnUrl?: string
}

export interface GoogleSignInRequest {
  callbackURL?: string
  errorCallbackURL?: string
  returnUrl?: string
}

export interface UserProfileRecord {
  user_id: string
  email: string
  name: string | null
  avatar_url: string | null
  role: 'user' | 'editor' | 'admin'
  metadata: string | null
  created_at: string
  updated_at: string
}

export interface OtpEmailPayload {
  email: string
  otp: string
  type: 'sign-in' | 'email-verification' | 'forget-password' | 'change-email'
}

export interface AuthSessionResponse {
  id: string
  token: string
  expiresAt: Date
}

export interface AuthUserResponse {
  id: string
  email: string
  emailVerified: boolean
  name: string
  image?: string | null
  createdAt: Date
  updatedAt: Date
}
