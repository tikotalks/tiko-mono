import { createAppRouter } from '@tiko/ui'
import AdminLayout from '../layouts/AdminLayout.vue'
import AdminDashboard from '../views/Dashboard.vue'
import LibraryView from '../views/LibraryView.vue'
import MediaDashboardView from '../views/MediaDashboardView.vue'
import MediaDetailView from '../views/MediaDetailView.vue'
import UploadView from '../views/UploadView.vue'
import UsersView from '../views/UsersView.vue'
import I18nTranslationAdminView from '../views/i18n/AdminView.vue'
import I18nDatabaseView from '../views/i18n/DatabaseView.vue'
import I18nImportView from '../views/i18n/ImportView.vue'
import I18nKeysView from '../views/i18n/KeysView.vue'
import I18nLanguagesView from '../views/i18n/LanguagesView.vue'
import I18nLanguageDetailView from '../views/i18n/DetailView.vue'
import I18nStatus from '../views/i18n/I18nStatus.vue'
import ContentProjectsView from '../views/content/ProjectsView.vue'
import ContentSectionsView from '../views/content/SectionsView.vue'
import ContentPagesView from '../views/content/PagesView.vue'
import ContentPageDetailView from '../views/content/PageDetailView.vue'
import DeploymentDashboard from '../views/deployment/DeploymentDashboard.vue'
import BackupsView from '../views/deployment/BackupsView.vue'

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
        },
        {
          path: 'users',
          name: 'Users',
          component: UsersView
        },
        {
          path: 'translations',
          name: 'Translations',
          component: I18nTranslationAdminView
        },
        {
          path: 'i18n/database',
          name: 'I18nDatabase',
          component: I18nDatabaseView
        },
        {
          path: 'i18n/import',
          name: 'I18nImport',
          component: I18nImportView
        },
        {
          path: 'i18n/keys',
          name: 'I18nKeys',
          component: I18nKeysView
        },
        {
          path: 'i18n/languages',
          name: 'I18nLanguages',
          component: I18nLanguagesView
        },
        {
          path: 'i18n/languages/:code',
          name: 'I18nLanguageDetail',
          component: I18nLanguageDetailView
        },
        {
          path: 'i18n/status',
          name: 'I18nStatus',
          component: I18nStatus
        },
        {
          path: 'content/projects',
          name: 'ContentProjects',
          component: ContentProjectsView
        },
        {
          path: 'content/sections',
          name: 'ContentSections',
          component: ContentSectionsView
        },
        {
          path: 'content/pages',
          name: 'ContentPages',
          component: ContentPagesView
        },
        {
          path: 'content/pages/:id',
          name: 'ContentPageDetail',
          component: ContentPageDetailView
        },
        {
          path: 'deployment',
          name: 'Deployment',
          component: DeploymentDashboard
        },
        {
          path: 'deployment/backups',
          name: 'DeploymentBackups',
          component: BackupsView
        }
      ]
    }
  ]
})

export default router
