const APP_TARGETS: Record<string, string> = {
  'dev.yesno.tikoapps.org': 'development.tiko-yes-no.pages.dev',
  'dev.type.tikoapps.org': 'development.tiko-type.pages.dev',
  'dev.todo.tikoapps.org': 'development.tiko-todo.pages.dev',
  'dev.cards.tikoapps.org': 'development.tiko-cards.pages.dev',
  'dev.timer.tikoapps.org': 'development.tiko-timer.pages.dev',
  'dev.radio.tikoapps.org': 'development.tiko-radio.pages.dev',
  'dev.sequence.tikoapps.org': 'development.tiko-sequence.pages.dev'
}

function withDevHeaders(response: Response, targetHost: string): Response {
  const headers = new Headers(response.headers)
  headers.set('x-tiko-dev-router', targetHost)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const targetHost = APP_TARGETS[url.hostname]

    if (!targetHost) {
      return Response.json({ ok: false, error: 'unknown_dev_app_host' }, { status: 404 })
    }

    const targetUrl = new URL(request.url)
    targetUrl.protocol = 'https:'
    targetUrl.hostname = targetHost

    const headers = new Headers(request.headers)
    headers.set('host', targetHost)

    const proxied = new Request(targetUrl, {
      method: request.method,
      headers,
      body: request.body,
      redirect: 'manual'
    })

    const response = await fetch(proxied)
    return withDevHeaders(response, targetHost)
  }
}
