import { createAppRouter } from '@tiko/ui'
import AdminLayout from '../layouts/AdminLayout.vue';
import ContentSectionsView from '../views/content/SectionsView.vue'


// Lazy load all route components
const AdminDashboard = () => import('../views/Dashboard.vue')
// const NotAuthorizedView = () => import('../views/NotAuthorizedView.vue')
const AssetsView = () => import('../views/AssetsView.vue')
const LibraryView = () => import('../views/LibraryView.vue')
const MediaDashboardView = () => import('../views/MediaDashboardView.vue')
const MediaDetailView = () => import('../views/MediaDetailView.vue')
const UploadView = () => import('../views/UploadView.vue')
const UsersView = () => import('../views/UsersView.vue')
const I18nTranslationAdminView = () => import('../views/i18n/AdminView.vue')
const I18nDatabaseView = () => import('../views/i18n/DatabaseView.vue')
const I18nImportView = () => import('../views/i18n/ImportView.vue')
const I18nKeysView = () => import('../views/i18n/KeysView.vue')
const I18nLanguagesView = () => import('../views/i18n/LanguagesView.vue')
const I18nLanguageDetailView = () => import('../views/i18n/DetailView.vue')
const I18nStatus = () => import('../views/i18n/I18nStatus.vue')
const ContentProjectsView = () => import('../views/content/ProjectsView.vue')
// const ContentSectionsView = () => import('../views/content/SectionsView.vue')
const SectionTemplateDetailView = () => import('../views/content/SectionTemplateDetailView.vue')
const SectionInstanceDetailView = () => import('../views/content/SectionInstanceDetailView.vue')
const ContentPagesView = () => import('../views/content/PagesView.vue')
const ContentPageDetailView = () => import('../views/content/PageDetailView.vue')
const ItemTemplateDetailView = () => import('../views/content/ItemTemplateDetailView.vue')
const ItemsView = () => import('../views/content/ItemsView.vue')
const ItemDetailView = () => import('../views/content/ItemDetailView.vue')
const DeploymentDashboard = () => import('../views/deployment/DeploymentDashboard.vue')
const BackupsView = () => import('../views/deployment/BackupsView.vue')
const GenerateView = () => import('../views/GenerateView.vue')
const PersonalLibraryView = () => import('../views/PersonalLibraryView.vue')
const CollectionsView = () => import('../views/CollectionsView.vue')
const TestMarkdownView = () => import('../views/TestMarkdownView.vue')
const TestRichEditorView = () => import('../views/TestRichEditorView.vue')

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
          path: 'generate',
          name: 'Generate',
          component: GenerateView
        },
        {
          path: 'personal-library',
          name: 'PersonalLibrary',
          component: PersonalLibraryView
        },
        {
          path: 'collections',
          name: 'Collections',
          component: CollectionsView
        },
        {
          path: 'collections/:id',
          name: 'CollectionDetail',
          component: () => import('../views/CollectionDetailView.vue')
        },
        {
          path: 'media/:id',
          name: 'MediaDetail',
          component: MediaDetailView
        },
        {
          path: 'assets',
          name: 'Assets',
          component: AssetsView
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
          path: 'content/section-templates/:id',
          name: 'SectionTemplateDetail',
          component: SectionTemplateDetailView
        },
        {
          path: 'content/sections/create',
          name: 'SectionInstanceCreate',
          component: SectionInstanceDetailView
        },
        {
          path: 'content/sections/:id',
          name: 'SectionInstanceDetail',
          component: SectionInstanceDetailView
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
          path: 'content/item-templates/:id',
          name: 'admin-content-item-template-detail',
          component: ItemTemplateDetailView
        },
        {
          path: 'content/items',
          name: 'admin-content-items',
          component: ItemsView
        },
        {
          path: 'content/items/create',
          name: 'admin-content-items-create',
          component: ItemDetailView
        },
        {
          path: 'content/items/:id',
          name: 'admin-content-item-detail',
          component: ItemDetailView
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
        },
        {
          path: 'items/public',
          name: 'PublicItems',
          component: () => import('../views/PublicItemsView.vue')
        },
        {
          path: 'test-markdown',
          name: 'TestMarkdown',
          component: TestMarkdownView
        },
        {
          path: 'test-dragdrop',
          name: 'TestDragDrop',
          component: () => import('../views/TestDragDropView.vue')
        },
        {
          path: 'test-rich-editor',
          name: 'TestRichEditor',
          component: TestRichEditorView
        },
        {
          path: 'test-rich-direct',
          name: 'TestRichDirect',
          component: () => import('../views/TestRichTextDirectView.vue')
        }
      ]
    }
  ]
})

export default router
