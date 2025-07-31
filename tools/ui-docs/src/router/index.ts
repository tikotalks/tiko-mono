import { createAppRouter } from '@tiko/ui'
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
  },
  {
    path: '/pin-input',
    name: 'pin-input',
    component: () => import('../views/PinInputView.vue'),
    meta: { title: 'PIN Input' }
  },
  {
    path: '/number-pad',
    name: 'number-pad',
    component: () => import('../views/NumberPadView.vue'),
    meta: { title: 'Number Pad' }
  }
]

const router = createAppRouter({
  routes
})

export default router