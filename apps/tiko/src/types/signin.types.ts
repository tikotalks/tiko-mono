export interface SignInRequest {
  returnTo: string
  appName?: string
  appId?: string
}

export interface AuthCallbackData {
  accessToken: string
  refreshToken: string
  expiresIn: number
  returnUrl: string
}

export interface TikoApp {
  id: string
  name: string
  icon: string
  webUrl: string
  mobileScheme?: string
}