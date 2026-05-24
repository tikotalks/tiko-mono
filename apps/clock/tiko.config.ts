import { defineConfig } from '@tiko/core'
import { BaseColors, ColorValue } from '@tiko/ui'

export default defineConfig({
	id: 'clock',
	name: 'Clock',
	icon: {
		mediaId: 'clock',
		color: BaseColors.ORANGE,
	},
	description: 'Clock-reading tutor for children',
	theme: {
		primary: BaseColors.ORANGE,
		secondary: BaseColors.BLUE,
		tertiary: BaseColors.GREEN,
	},
	auth: {
		skipAuth: true,
	},
	splash: {
		show: true,
		appName: 'Clock',
		color: BaseColors.ORANGE,
		themeColor: ColorValue.ORANGE,
		loadingText: 'Loading Clock...',
	},
})
