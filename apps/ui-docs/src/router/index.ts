import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: 'UI Documentation' }
  },
  {
    path: '/buttons',
    name: 'buttons',
    component: () => import('../views/ButtonsView.vue'),
    meta: { title: 'Buttons' }
  },
  {
    path: '/icons',
    name: 'icons',
    component: () => import('../views/IconsView.vue'),
    meta: { title: 'Icons' }
  },
  {
    path: '/inputs',
    name: 'inputs',
    component: () => import('../views/InputsView.vue'),
    meta: { title: 'Input Components' }
  },
  {
    path: '/cards',
    name: 'cards',
    component: () => import('../views/CardsView.vue'),
    meta: { title: 'Cards' }
  },
  {
    path: '/colors',
    name: 'colors',
    component: () => import('../views/ColorsView.vue'),
    meta: { title: 'Color System' }
  }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

export default router