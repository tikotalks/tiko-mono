import type { AuthContext, AuthEnv, RequireAuthOptions, RateLimitConfig } from './types'
import { AuthError } from './types'
import { extractBearerToken, routeByTokenType, validateApiKey } from './api-key'
import { validateSession } from './session'
import { checkRateLimit } from './rate-limit'

export { AuthError } from './types'
export type { AuthContext, AuthEnv, RequireAuthOptions, RateLimitConfig } from './types'

export async function requireAuth(
  request: Request,
  env: AuthEnv,
  options?: RequireAuthOptions,
): Promise<AuthContext> {
  const token = extractBearerToken(request)
  const tokenType = routeByTokenType(token)

  const auth: AuthContext =
    tokenType === 'api_key'
      ? await validateApiKey(token, env)
      : await validateSession(token, env)

  // Check scope
  if (options?.scopes?.length) {
    if (auth.scope !== 'all' && !options.scopes.includes(auth.scope)) {
      throw new AuthError(403, 'SCOPE_DENIED', `API key scope '${auth.scope}' does not permit this operation`)
    }
  }

  // Check plan
  if (options?.plans?.length && !options.plans.includes(auth.plan)) {
    throw new AuthError(403, 'PLAN_REQUIRED', `This operation requires a ${options.plans.join('/')} plan`)
  }

  return auth
}

export async function requireAuthWithRateLimit(
  request: Request,
  env: AuthEnv,
  rateLimitConfig: RateLimitConfig,
  authOptions?: RequireAuthOptions,
): Promise<AuthContext> {
  const auth = await requireAuth(request, env, authOptions)
  await checkRateLimit(auth, env, rateLimitConfig)
  return auth
}
