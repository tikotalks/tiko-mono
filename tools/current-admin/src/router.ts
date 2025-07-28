import { createAppRouter } from '@tiko/ui'

// Create router with lazy-loaded routes
const router = createAppRouter({
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('./views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('./views/AdminLoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/media',
      name: 'media-dashboard',
      component: () => import('./views/MediaDashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/upload',
      name: 'upload',
      component: () => import('./views/UploadView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/library',
      name: 'library',
      component: () => import('./views/LibraryView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/media/:id',
      name: 'media-detail',
      component: () => import('./views/MediaDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: () => import('./views/AnalyticsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('./views/UsersView.vue'),
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

export default router
