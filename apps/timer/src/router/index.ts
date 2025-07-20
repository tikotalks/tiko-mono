import { createAppRouter } from '@tiko/ui'
import TimerView from '../views/TimerView.vue'

const router = createAppRouter({
  routes: [
    {
      path: '/',
      name: 'Timer',
      component: TimerView
    }
  ]
})

export default router