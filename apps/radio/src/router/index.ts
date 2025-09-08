import { createAppRouter } from '@tiko/ui'
import RadioView from '../views/RadioView.vue'

const router = createAppRouter({
  routes: [
    {
      path: '/',
      name: 'Radio',
      component: RadioView,
    },
  ],
})

export default router
