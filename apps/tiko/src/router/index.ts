import { createRouter, createWebHistory } from 'vue-router'
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
  },
  {
    path: '/auth/callback',
    name: 'authCallback',
    component: () => import('../components/AuthCallback.vue'),
    meta: {
      requiresAuth: false
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router