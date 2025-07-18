import { createRouter, createWebHistory } from 'vue-router'
import YesNoView from '../views/YesNoView.vue'
import AuthCallback from '../components/AuthCallback.vue'

const routes = [
  {
    path: '/',
    name: 'YesNo',
    component: YesNoView
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: AuthCallback
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Debug routing
router.beforeEach((to, from, next) => {
  console.log('[Router] Navigating to:', to.path, to.name)
  next()
})

export default router