import { createAppRouter } from '@tiko/ui'
import DashboardView from '../views/DashboardView.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import PublicItemsAdmin from '../views/admin/PublicItemsAdmin.vue'
import ReportsView from '../views/admin/ReportsView.vue'
import ResetPincodeView from '../views/ResetPincodeView.vue'

const router = createAppRouter({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: DashboardView,
    },
    {
      path: '/admin',
      name: 'AdminDashboard',
      component: AdminDashboard,
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/public-items',
      name: 'PublicItemsAdmin',
      component: PublicItemsAdmin,
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/reports',
      name: 'ReportsView',
      component: ReportsView,
      meta: { requiresAdmin: true },
    },
    {
      path: '/reset-pincode',
      name: 'ResetPincode',
      component: ResetPincodeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/sso',
      name: 'SSO',
      component: DashboardView,
      meta: { ssoCallback: true },
    },
  ],
})

export default router
