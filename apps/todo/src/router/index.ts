import { createAppRouter } from '@tiko/ui'
import TodoGroupsView from '../views/TodoGroupsView.vue'
import TodoItemsView from '../views/TodoItemsView.vue'

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
  }
]

const router = createAppRouter({
  routes,
  beforeEach: async (to, from, next) => {
    if (to.name === 'group' && to.params.id) {
      // We'll need to get the group title here
      // For now, just set a placeholder
      to.meta = { ...to.meta, title: 'Loading...' }
    }
    next()
  }
})

export default router