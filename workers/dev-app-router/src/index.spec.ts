import { afterEach, describe, expect, it, vi } from 'vitest'

import { handleRequest } from './index'

describe('dev app router', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('proxies the dev Tiko launcher to the dashboard development branch', async () => {
		let proxiedRequest: Request | undefined
		vi.stubGlobal('fetch', vi.fn(async (request: Request) => {
			proxiedRequest = request
			return new Response('<title>Tiko</title>', { status: 200 })
		}))

		const response = await handleRequest(new Request('https://dev.tiko.tikoapps.org/apps?source=test'))

		expect(response.status).toBe(200)
		expect(response.headers.get('x-tiko-dev-router')).toBe('development.tiko-dashboard.pages.dev')
		expect(proxiedRequest).toBeDefined()
		expect(new URL(proxiedRequest!.url).toString()).toBe('https://development.tiko-dashboard.pages.dev/apps?source=test')
		expect(proxiedRequest!.headers.get('host')).toBe('development.tiko-dashboard.pages.dev')
	})

	it('redirects the Yes/No hyphen alias to the canonical yesno host', async () => {
		const response = await handleRequest(new Request('https://yes-no.tikoapps.org/questions/1?lang=en'))

		expect(response.status).toBe(308)
		expect(response.headers.get('location')).toBe('https://yesno.tikoapps.org/questions/1?lang=en')
	})

	it('redirects the dev Yes/No hyphen alias to the canonical dev host', async () => {
		const response = await handleRequest(new Request('https://dev.yes-no.tikoapps.org/?lang=en'))

		expect(response.status).toBe(308)
		expect(response.headers.get('location')).toBe('https://dev.yesno.tikoapps.org/?lang=en')
	})

	it('keeps the production launcher safe until explicit production approval', async () => {
		const response = await handleRequest(new Request('https://tiko.tikoapps.org/'))

		expect(response.status).toBe(503)
		expect(response.headers.get('x-tiko-production-launcher')).toBe('pending-approval')
		expect(await response.text()).toContain('pending production approval')
	})
})
