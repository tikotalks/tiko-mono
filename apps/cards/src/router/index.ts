import { createAppRouter } from '@tiko/ui'
import CardsView from '../views/CardsView.vue'

const router = createAppRouter({
  routes: [
    {
      path: '/',
      name: 'Cards',
      component: CardsView
    }
  ]
})

export default router