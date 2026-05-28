import { createAppRouter } from '@tiko/ui'
import ClockLearningView from '../views/ClockLearningView.vue'

const router = createAppRouter({
	routes: [
		{
			path: '/',
			name: 'ClockHome',
			component: ClockLearningView,
		},
	],
})

export default router
