import { createApp } from 'vue'
import { createAppRouter } from '@tiko/ui'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.scss'

// Import views
import DashboardView from './views/DashboardView.vue'
import MediaDashboardView from './views/MediaDashboardView.vue'
import UploadView from './views/UploadView.vue'
import LibraryView from './views/LibraryView.vue'
import MediaDetailView from './views/MediaDetailView.vue'
import AdminLoginView from './views/AdminLoginView.vue'
import AnalyticsView from './views/AnalyticsView.vue'
import UsersView from './views/UsersView.vue'

// Create router with custom auth callback handling
const router = createAppRouter({
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: AdminLoginView,
      meta: { requiresAuth: false }
    },
    {
      path: '/media',
      name: 'media-dashboard',
      component: MediaDashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/upload',
      name: 'upload',
      component: UploadView,
      meta: { requiresAuth: true }
    },
    {
      path: '/library',
      name: 'library',
      component: LibraryView,
      meta: { requiresAuth: true }
    },
    {
      path: '/media/:id',
      name: 'media-detail',
      component: MediaDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: AnalyticsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/users',
      name: 'users',
      component: UsersView,
      meta: { requiresAuth: true }
    }
  ]
})

// Override the auth callback redirect behavior
router.afterEach((to, from) => {
  // If we just came from auth callback and are going to root, check permissions
  if (from.name === 'AuthCallback' && to.path === '/') {
    // The App.vue navigation guard will handle the role check
  }
})

// Create pinia instance first
const pinia = createPinia()

// Create app
const app = createApp(App)

// Use pinia before anything else
app.use(pinia)
app.use(router)

// Mount app
app.mount('#app')
