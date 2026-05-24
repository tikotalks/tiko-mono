import { createViteConfig } from '../../vite.config.base'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const pwaConfig = {
	registerType: 'autoUpdate',
	includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
	manifest: {
		name: 'Clock - Tiko',
		short_name: 'Clock',
		description: 'A playful clock-reading tutor for children',
		theme_color: '#f59e0b',
		background_color: '#fff7ed',
		display: 'standalone',
		orientation: 'portrait',
		scope: '/',
		start_url: '/',
		icons: [
			{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
			{ src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
			{ src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
		],
	},
}

const i18nConfig = {
	excludeSections: ['admin', 'deployment', 'media', 'content'],
}

export default createViteConfig({
	dirname: __dirname,
	port: 3012,
	pwaConfig,
	appName: 'clock',
	appId: 'clock',
	i18nConfig,
})
