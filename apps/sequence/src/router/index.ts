import { createAppRouter } from '@tiko/ui'
import SequenceView from '../views/SequenceView.vue'
import PublicItemsAdmin from '../views/admin/PublicItemsAdmin.vue'

const router = createAppRouter({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: SequenceView
    },
    {
      path: '/admin/public-items',
      name: 'PublicItemsAdmin',
      component: PublicItemsAdmin,
      meta: { requiresAdmin: true }
    },
    {
      path: '/:cardId',
      name: 'Card',
      component: SequenceView
    }
  ]
})

export default router
