import { defineConfig } from '@tiko/core'
import { BaseColors, ColorValue } from '@tiko/ui'

export default defineConfig({
	id: 'clock',
	name: 'Clock',
	icon: {
		mediaId: 'clock',
		color: BaseColors.BLUE,
	},
	description: 'Clock-reading learning app',
	theme: {
		primary: BaseColors.BLUE,
		secondary: BaseColors.YELLOW,
		tertiary: BaseColors.GREEN,
	},
	auth: {
		show: false,
		required: false,
		skipAuth: true,
	},
	splash: {
		show: true,
		appName: 'Clock',
		color: ColorValue.BLUE,
		themeColor: ColorValue.BLUE,
		loadingText: 'Loading Clock...',
	},
	i18n: {
		categories: ['common', 'clock'],
	},
})
