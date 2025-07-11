import { createRouter, createWebHistory } from 'vue-router'
import TodoGroupsView from '../views/TodoGroupsView.vue'
import TodoItemsView from '../views/TodoItemsView.vue'
import AuthCallback from '../components/AuthCallback.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: TodoGroupsView
  },
  {
    path: '/group/:id',
    name: 'group',
    component: TodoItemsView
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

// Navigation guard to set dynamic title for group routes
router.beforeEach(async (to, from, next) => {
  if (to.name === 'group' && to.params.id) {
    // We'll need to get the group title here
    // For now, just set a placeholder
    to.meta = { ...to.meta, title: 'Loading...' }
  }
  next()
})

export default router