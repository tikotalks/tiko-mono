import { createRouter, createWebHistory } from 'vue-router'
import TimerView from '../views/TimerView.vue'
import AuthCallback from '../components/AuthCallback.vue'

const routes = [
  {
    path: '/',
    name: 'Timer',
    component: TimerView
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

// Handle magic link tokens in URL hash
router.beforeEach((to, from, next) => {
  // Check if we have magic link tokens in the hash
  if (window.location.hash && window.location.hash.includes('access_token')) {
    // Preserve the hash when redirecting
    next({ 
      path: '/auth/callback',
      hash: window.location.hash
    })
  } else {
    next()
  }
})

export default router