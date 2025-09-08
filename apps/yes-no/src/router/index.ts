import { createAppRouter } from '@tiko/ui'
import YesNoView from '../views/YesNoView.vue'

const router = createAppRouter({
  routes: [
    {
      path: '/',
      name: 'YesNo',
      component: YesNoView,
    },
  ],
})

export default router
