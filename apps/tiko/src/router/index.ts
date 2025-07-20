import { createAppRouter } from '@tiko/ui'
import DashboardView from '../views/DashboardView.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: {
      title: 'Dashboard'
    }
  },
  {
    path: '/signin',
    name: 'signin',
    component: () => import('../views/SignInView.vue'),
    meta: {
      title: 'Sign In',
      requiresAuth: false
    }
  }
]

const router = createAppRouter({
  routes
})

export default router