import { createAppRouter } from '@tiko/ui'
import HomeView from '../views/HomeView.vue'
import TodoView from '../views/TodoView.vue'

const router = createAppRouter({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: HomeView
    },
    {
      path: '/todo/:id',
      name: 'Todo',
      component: TodoView
    }
  ]
})

export default router
