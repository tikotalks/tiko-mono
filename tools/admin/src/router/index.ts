import { createAppRouter } from '@tiko/ui'
import AdminLayout from '../layouts/AdminLayout.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import LibraryView from '../views/LibraryView.vue'
import MediaDashboardView from '../views/MediaDashboardView.vue'
import MediaDetailView from '../views/MediaDetailView.vue'
import UploadView from '../views/UploadView.vue'

const router = createAppRouter({
  routes: [
    {
      path: '/',
      component: AdminLayout,
      children: [
        {
          path: '',
          name: 'Dashboard',
          component: AdminDashboard
        },
        {
          path: 'media',
          name: 'MediaDashboard',
          component: MediaDashboardView
        },
        {
          path: 'library',
          name: 'Library',
          component: LibraryView
        },
        {
          path: 'upload',
          name: 'Upload',
          component: UploadView
        },
        {
          path: 'media/:id',
          name: 'MediaDetail',
          component: MediaDetailView
        }
      ]
    }
  ]
})

export default router