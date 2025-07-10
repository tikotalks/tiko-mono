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

export default router