import { createAppRouter } from '@tiko/ui'
import SequenceView from '../views/SequenceView.vue'

const router = createAppRouter({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: SequenceView
    },
    {
      path: '/:cardId',
      name: 'Card',
      component: SequenceView
    }
  ]
})

export default router
