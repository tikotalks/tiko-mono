import { createAppRouter } from '@tiko/ui'

const router = createAppRouter({
  routes: [
    {
      path: '/',
      name: 'home',
      component:  () => import('../views/HomeView.vue')
    },
    {
      path: '/404',
      name: 'notFound',
      component: () => import('../views/NotFoundView.vue')
    },
    {
      path: '/:view(.*)*',
      name: 'content',
      component: () => import('../views/ContentView.vue')
    }
  ]
})

export default router
