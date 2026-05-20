import { handleIdentityRequest } from '@tiko/identity/routes'
import type { IdentityEnv } from '@tiko/identity'

export interface Env extends IdentityEnv {}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/healthz' && request.method === 'GET') {
      return Response.json({ ok: true, service: 'tiko-identity-api', hasD1: Boolean(env.IDENTITY_DB) })
    }

    return handleIdentityRequest(request, env)
  }
}
