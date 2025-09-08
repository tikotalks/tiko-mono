import { createAppRouter } from '@tiko/ui'
import SequenceView from '../views/SequenceView.vue'
import PlayView from '../views/PlayView.vue'
import AnimationTestView from '../views/AnimationTestView.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import PublicItemsAdmin from '../views/admin/PublicItemsAdmin.vue'
import ReportsView from '../views/admin/ReportsView.vue'

const router = createAppRouter({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: SequenceView,
    },
    {
      path: '/play/:sequenceId',
      name: 'Play',
      component: PlayView,
    },
    {
      path: '/test-animations',
      name: 'AnimationTest',
      component: AnimationTestView,
    },
  ],
})

export default router
