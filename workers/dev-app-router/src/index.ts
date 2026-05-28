const APP_TARGETS: Record<string, string> = {
	'dev.tiko.tikoapps.org': 'development.tiko-dashboard.pages.dev',
	'dev.yesno.tikoapps.org': 'development.tiko-yes-no.pages.dev',
	'dev.type.tikoapps.org': 'development.tiko-type.pages.dev',
	'dev.todo.tikoapps.org': 'development.tiko-todo.pages.dev',
	'dev.cards.tikoapps.org': 'development.tiko-cards.pages.dev',
	'dev.clock.tikoapps.org': 'tiko-clock.pages.dev',
	'dev.timer.tikoapps.org': 'development.tiko-timer.pages.dev',
	'dev.radio.tikoapps.org': 'development.tiko-radio.pages.dev',
	'dev.sequence.tikoapps.org': 'development.tiko-sequence.pages.dev',
}

const REDIRECT_HOSTS: Record<string, string> = {
	'yes-no.tikoapps.org': 'yesno.tikoapps.org',
	'dev.yes-no.tikoapps.org': 'dev.yesno.tikoapps.org',
}

const PRODUCTION_HOLDING_HOSTS = new Set(['tiko.tikoapps.org'])

function withDevHeaders(response: Response, targetHost: string): Response {
	const headers = new Headers(response.headers)
	headers.set('x-tiko-dev-router', targetHost)
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	})
}

function redirectToCanonicalHost(request: Request, canonicalHost: string): Response {
	const url = new URL(request.url)
	url.hostname = canonicalHost
	return Response.redirect(url.toString(), 308)
}

function productionLauncherHoldingResponse(): Response {
	return new Response(
		`<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>Tiko launcher pending production approval</title>
	</head>
	<body>
		<main>
			<h1>Tiko launcher pending production approval</h1>
			<p>The production app launcher is intentionally not promoted yet. Use the development launcher for validation.</p>
			<p><a href="https://dev.tiko.tikoapps.org/">Open the development launcher</a></p>
		</main>
	</body>
</html>`,
		{
			status: 503,
			headers: {
				'content-type': 'text/html; charset=utf-8',
				'cache-control': 'no-store',
				'x-tiko-production-launcher': 'pending-approval',
			},
		},
	)
}

async function proxyDevApp(request: Request, targetHost: string): Promise<Response> {
	const targetUrl = new URL(request.url)
	targetUrl.protocol = 'https:'
	targetUrl.hostname = targetHost

	const headers = new Headers(request.headers)
	headers.set('host', targetHost)

	const proxied = new Request(targetUrl, {
		method: request.method,
		headers,
		body: request.body,
		redirect: 'manual',
	})

	const response = await fetch(proxied)
	return withDevHeaders(response, targetHost)
}

export async function handleRequest(request: Request): Promise<Response> {
	const url = new URL(request.url)
	const canonicalHost = REDIRECT_HOSTS[url.hostname]

	if (canonicalHost) {
		return redirectToCanonicalHost(request, canonicalHost)
	}

	if (PRODUCTION_HOLDING_HOSTS.has(url.hostname)) {
		return productionLauncherHoldingResponse()
	}

	const targetHost = APP_TARGETS[url.hostname]

	if (!targetHost) {
		return Response.json({ ok: false, error: 'unknown_dev_app_host' }, { status: 404 })
	}

	return proxyDevApp(request, targetHost)
}

export default {
	fetch: handleRequest,
}
