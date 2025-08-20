import { createAppRouter } from '@tiko/ui'
import SequenceView from '../views/SequenceView.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import PublicItemsAdmin from '../views/admin/PublicItemsAdmin.vue'
import ReportsView from '../views/admin/ReportsView.vue'

const router = createAppRouter({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: SequenceView
    },
    {
      path: '/admin',
      name: 'AdminDashboard',
      component: AdminDashboard,
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/public-items',
      name: 'PublicItemsAdmin',
      component: PublicItemsAdmin,
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/reports',
      name: 'ReportsView',
      component: ReportsView,
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
