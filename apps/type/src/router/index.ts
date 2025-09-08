import { createAppRouter } from '@tiko/ui'
import TypeView from '../views/TypeView.vue'

const router = createAppRouter({
  routes: [
    {
      path: '/',
      name: 'Type',
      component: TypeView,
    },
  ],
})

export default router
