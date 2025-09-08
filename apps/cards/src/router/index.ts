import { createAppRouter } from '@tiko/ui'
import CardsView from '../views/CardsView.vue'

const router = createAppRouter({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: CardsView,
    },
    {
      path: '/:cardId',
      name: 'Card',
      component: CardsView,
    },
  ],
})

export default router
