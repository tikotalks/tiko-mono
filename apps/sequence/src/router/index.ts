import { createAppRouter } from '@tiko/ui'
// import SequenceHomeView from '../views/SequenceHomeView.vue'
import HomeView from '../views/HomeView.vue'

const router = createAppRouter({
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    // {
    //   path: '/',
    //   name: 'home',
    //   component: SequenceHomeView
    // },
    // {
    //   path: '/play/:id',
    //   name: 'play',
    //   component: () => import('../views/SequencePlayView.vue')
    // },
    // {
    //   path: '/edit/:id?',
    //   name: 'edit',
    //   component: () => import('../views/SequenceEditView.vue')
    // }
  ]
})

export default router
