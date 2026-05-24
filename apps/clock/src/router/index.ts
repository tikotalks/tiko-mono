import { createAppRouter } from '@tiko/ui'
import ClockView from '../views/ClockView.vue'

const router = createAppRouter({
	routes: [
		{
			path: '/',
			name: 'Clock',
			component: ClockView,
		},
	],
})

export default router
