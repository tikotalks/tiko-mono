<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="t('admin.content.sections.title')"
      :description="t('admin.content.sections.description')"
    >
      <template #inputs>
        <TInputText
          v-model="searchQuery"
          :label="t('common.search')"
          :placeholder="t('common.search')"
          :icon="Icons.SEARCH_M"
        />

        <TInputSelect
          v-model="filterLanguage"
          :label="t('filter.filterByLanguage')"
          :options="languageFilterOptions"
        />
      </template>
    </AdminPageHeader>

    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <!-- SECTIONS (Instances) -->
    <div v-else :class="bemm('sections-container')">
      <div :class="bemm('section-group')">
        <div :class="bemm('section-header')">
          <h2>{{ t('admin.content.sections.instancesTitle') }}</h2>
          <p>{{ t('admin.content.sections.instancesDescription') }}</p>
          <TButton
            color="primary"
            :icon="Icons.ADD"
            @click="openCreateSectionDialog"
            :disabled="sectionTemplates.length === 0"
          >
            {{ t('admin.content.sections.createInstance') }}
          </TButton>
        </div>

        <TList
          v-if="filteredSections.length > 0"
          :columns="[
            { key: 'name', label: t('common.name'), width: '20%' },
            { key: 'template', label: t('common.template'), width: '20%' },
            { key: 'language', label: t('common.language'), width: '15%' },
            { key: 'type', label: t('common.type'), width: '15%' },
            { key: 'metadata', label: t('common.properties'), width: '15%' },
            { key: 'actions', label: t('common.actions'), width: '15%' }
          ]"
          :striped="true"
          :bordered="true"
          :hover="true"
          :style="{width: '100%'}"
        >
          <TListItem
            v-for="section in filteredSections"
            :key="section.id"
            :clickable="true"
            @click="handleSectionClick(section)"
          >
            <TListCell type="text" :content="section.name" />
            <TListCell type="badge" :content="getTemplateName(section.section_template_id)" />
            <TListCell type="badge" :content="section.language_code || t('common.global')" />
            <TListCell type="badge" :content="getSectionTypeLabel(section.component_type)" />
            <TListCell type="custom">
              <div :class="bemm('metadata')">
                <TChip
                  v-for="meta in getSectionMetadata(section)"
                  :key="meta"
                  size="small"
                  type="outline"
                >
                  {{ meta }}
                </TChip>
              </div>
            </TListCell>
            <TListCell
              type="actions"
              :actions="[
                listActions.edit((e) => { e.stopPropagation(); openEditSectionDialog(section) }),
                listActions.delete((e) => { e.stopPropagation(); handleDeleteSection(section) })
              ]"
            />
          </TListItem>
        </TList>

        <TEmptyState
          v-else
          :icon="Icons.LAYERS"
          :title="t('admin.content.sections.sectionsEmpty')"
          :description="t('admin.content.sections.sectionsEmptyDescription')"
        >
          <TButton
            color="primary"
            :icon="Icons.ADD"
            @click="openCreateSectionDialog"
            :disabled="sectionTemplates.length === 0"
          >
            {{ t('admin.content.sections.createInstance') }}
          </TButton>
        </TEmptyState>
      </div>

      <!-- SECTION TEMPLATES (Blueprints) -->
      <div :class="bemm('section-group')">
        <div :class="bemm('section-header')">
          <h2>{{ t('admin.content.sections.templatesTitle') }}</h2>
          <p>{{ t('admin.content.sections.templatesDescription') }}</p>
          <TButton
            color="secondary"
            :icon="Icons.ADD"
            @click="openCreateTemplateDialog"
          >
            {{ t('admin.content.sections.createTemplate') }}
          </TButton>
        </div>

        <TList
          v-if="filteredTemplates.length > 0"
          :columns="[
            { key: 'name', label: t('common.name'), width: '25%' },
            { key: 'slug', label: t('common.slug'), width: '20%' },
            { key: 'type', label: t('common.type'), width: '20%' },
            { key: 'metadata', label: t('common.properties'), width: '20%' },
            { key: 'actions', label: t('common.actions'), width: '15%' }
          ]"
          :striped="true"
          :bordered="true"
          :hover="true"
          :style="{width: '100%'}"
        >
          <TListItem
            v-for="template in filteredTemplates"
            :key="template.id"
            :clickable="true"
            @click="handleTemplateClick(template)"
          >
            <TListCell type="text" :content="template.name" />
            <TListCell type="text" :content="template.slug" />
            <TListCell type="text" :content="getSectionTypeLabel(template.component_type)" />
            <TListCell type="custom">
              <div :class="bemm('metadata')">
                <TChip
                  v-for="meta in getTemplateMetadata(template)"
                  :key="meta"
                  size="small"
                  type="outline"
                >
                  {{ meta }}
                </TChip>
              </div>
            </TListCell>
            <TListCell
              type="actions"
              :actions="[
                listActions.edit((e) => { e.stopPropagation(); openEditTemplateDialog(template) }),
                listActions.delete((e) => { e.stopPropagation(); handleDeleteTemplate(template) })
              ]"
            />
          </TListItem>
        </TList>

        <TEmptyState
          v-else
          :icon="Icons.FILE"
          :title="t('admin.content.sections.templatesEmpty')"
          :description="t('admin.content.sections.templatesEmptyDescription')"
        >
          <TButton
            color="secondary"
            :icon="Icons.ADD"
            @click="openCreateTemplateDialog"
          >
            {{ t('admin.content.sections.createTemplate') }}
          </TButton>
        </TEmptyState>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import {
  TButton,
  TList,
  TListItem,
  TListCell,
  TInputText,
  TInputSelect,
  TSpinner,
  TEmptyState,
  TChip,
  ConfirmDialog,
  useI18n,
  listActions,
  type ToastService,
  type PopupService
} from '@tiko/ui'
import { Icons } from 'open-icon'
import { contentService, translationService } from '@tiko/core'
import type { SectionTemplate, ContentSection, Language } from '@tiko/core'
import CreateSectionDialog from './components/CreateSectionDialog.vue'
import CreateSectionInstanceDialog from './components/CreateSectionInstanceDialog.vue'
import AdminPageHeader from '@/components/AdminPageHeader.vue'

const bemm = useBemm('content-sections-view')
const { t } = useI18n()
const router = useRouter()
const toastService = inject<ToastService>('toastService')
const popupService = inject<PopupService>('popupService')

// State
const sections = ref<ContentSection[]>([])
const sectionTemplates = ref<SectionTemplate[]>([])
const languages = ref<Language[]>([])
const loading = ref(false)
const searchQuery = ref('')
const filterLanguage = ref<string>('all')

// Computed
const languageFilterOptions = computed(() => {
  const options = [
    { value: 'all', label: t('common.all') },
    { value: 'global', label: t('common.global') }
  ]

  languages.value.forEach(lang => {
    options.push({
      value: lang.code,
      label: `${lang.name} (${lang.code})`
    })
  })

  return options
})

const filteredSections = computed(() => {
  let filtered = sections.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(section =>
      section.name.toLowerCase().includes(query) ||
      section.slug.toLowerCase().includes(query) ||
      section.description?.toLowerCase().includes(query)
    )
  }

  // Filter by language
  if (filterLanguage.value && filterLanguage.value !== 'all') {
    if (filterLanguage.value === 'global') {
      filtered = filtered.filter(section => !section.language_code)
    } else {
      filtered = filtered.filter(section => section.language_code === filterLanguage.value)
    }
  }

  return filtered
})

const filteredTemplates = computed(() => {
  let filtered = sectionTemplates.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(template =>
      template.name.toLowerCase().includes(query) ||
      template.slug.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query)
    )
  }

  return filtered
})

// Methods
async function loadSections() {
  // Load actual sections (instances)
  try {
    sections.value = await contentService.getSections()
    console.log('Loaded sections:', sections.value)
  } catch (error) {
    // Handle gracefully if table doesn't exist yet
    if (error?.message?.includes('does not exist') || error?.message?.includes('42P01')) {
      console.log('content_sections table does not exist yet - using empty array')
      sections.value = []
    } else {
      console.error('Failed to load sections:', error)
      toastService?.show({
        message: t('admin.content.sections.loadError'),
        type: 'error'
      })
    }
  }
}

async function loadSectionTemplates() {
  // Load section templates (blueprints)
  try {
    sectionTemplates.value = await contentService.getSectionTemplates()
    console.log('Loaded section templates:', sectionTemplates.value)
  } catch (error) {
    console.error('Failed to load section templates:', error)
    toastService?.show({
      message: t('admin.content.sections.loadError'),
      type: 'error'
    })
  }
}

async function loadAll() {
  loading.value = true
  try {
    await Promise.all([
      loadSections(),
      loadSectionTemplates(),
      loadLanguages()
    ])
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
}

async function loadLanguages() {
  try {
    languages.value = await translationService.getActiveLanguages()
  } catch (error) {
    console.error('Failed to load languages:', error)
  }
}

function getSectionTypeLabel(type: string): string {
  const typeKey = `admin.content.sections.types.${type}`
  const translated = t(typeKey)
  return translated !== typeKey ? translated : type
}

function getTemplateName(templateId: string): string {
  const template = sectionTemplates.value.find(t => t.id === templateId)
  return template?.name || 'Unknown Template'
}

function getSectionMetadata(section: ContentSection): string[] {
  const metadata = []

  if (section.is_reusable) {
    metadata.push(t('common.reusable'))
  }

  if (!section.is_active) {
    metadata.push(t('common.inactive'))
  }

  return metadata
}

function getTemplateMetadata(template: SectionTemplate): string[] {
  const metadata = []

  if (template.is_reusable) {
    metadata.push(t('common.reusable'))
  }

  if (!template.is_active) {
    metadata.push(t('common.inactive'))
  }

  return metadata
}

// Section Instance Methods
function openCreateSectionDialog() {
  router.push('/content/sections/create')
}

async function openEditSectionDialog(section: ContentSection) {
  router.push(`/content/sections/${section.id}`)
}

async function handleDeleteSection(section: ContentSection) {
  // First check if section is in use
  const usage = await contentService.getSectionUsage(section.id)

  let message = t('admin.content.sections.deleteInstanceMessage', { name: section.name })

  if (usage.length > 0) {
    const pageList = usage.map(u => u.page_title).join(', ')
    message = t('admin.content.sections.deleteInstanceInUseMessage',
      { name: section.name, count: usage.length, pages: pageList },
      `"${section.name}" is currently used on ${usage.length} page(s): ${pageList}. You must remove it from these pages before deleting.`)
  }

  popupService?.open({
    component: ConfirmDialog,
    props: {
      title: t('admin.content.sections.deleteInstanceConfirm'),
      message,
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      confirmColor: 'error',
      confirmDisabled: usage.length > 0,
      icon: usage.length > 0 ? Icons.ALERT_TRIANGLE : Icons.ALERT_CIRCLE,
      onConfirm: async () => {
        try {
          await contentService.deleteSection(section.id)
          toastService?.show({
            message: t('admin.content.sections.instanceDeleteSuccess'),
            type: 'success'
          })
          await loadSections()
        } catch (error: any) {
          console.error('Failed to delete section instance:', error)

          // Check if it's a foreign key constraint error
          if (error?.message?.includes('foreign key constraint') || error?.message?.includes('409')) {
            toastService?.show({
              message: t('admin.content.sections.instanceInUse',
                'This section is currently used on pages. Remove it from all pages before deleting.'),
              type: 'warning',
              duration: 5000
            })
          } else {
            toastService?.show({
              message: t('admin.content.sections.instanceDeleteError'),
              type: 'error'
            })
          }
        }
      }
    }
  })
}

function handleSectionClick(section: ContentSection) {
  router.push(`/content/sections/${section.id}`)
}

// Section Template Methods
function openCreateTemplateDialog() {
  popupService?.open({
    component: CreateSectionDialog,
    title: t('admin.content.sections.createTemplate'),
    props: {
      onSave: async (data: Partial<SectionTemplate>) => {
        try {
          await contentService.createSectionTemplate(data)
          toastService?.show({
            message: t('admin.content.sections.templateCreateSuccess'),
            type: 'success'
          })
          await loadSectionTemplates()
        } catch (error) {
          console.error('Failed to create template:', error)
          toastService?.show({
            message: t('admin.content.sections.templateCreateError'),
            type: 'error'
          })
          throw error
        }
      }
    }
  })
}

function openEditTemplateDialog(template: SectionTemplate) {
  // Navigate to section template detail view for field management
  router.push(`/content/section-templates/${template.id}`)
}

async function handleDeleteTemplate(template: SectionTemplate) {
  // Count sections using this template
  const sectionsUsingTemplate = sections.value.filter(s => s.section_template_id === template.id).length

  let warningMessage = t('admin.content.sections.deleteTemplateMessage', { name: template.name })
  if (sectionsUsingTemplate > 0) {
    warningMessage += '\n\n' + t('admin.content.sections.templateInUseWarning',
      `Warning: ${sectionsUsingTemplate} section(s) are using this template. You must delete them first.`,
      { count: sectionsUsingTemplate })
  }

  popupService?.open({
    component: ConfirmDialog,
    props: {
      title: t('admin.content.sections.deleteTemplateConfirm'),
      message: warningMessage,
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      confirmColor: 'error',
      icon: Icons.ALERT_CIRCLE,
      disabled: sectionsUsingTemplate > 0,
      onConfirm: async () => {
        try {
          await contentService.deleteSectionTemplate(template.id)
          toastService?.show({
            message: t('admin.content.sections.templateDeleteSuccess'),
            type: 'success'
          })
          await loadSectionTemplates()
        } catch (error: any) {
          console.error('Failed to delete template:', error)

          // Check if it's a foreign key constraint error
          if (error.message?.includes('foreign key constraint') || error.message?.includes('is still referenced')) {
            toastService?.show({
              message: t('admin.content.sections.templateDeleteConstraintError',
                'Cannot delete this template because it has sections using it. Delete all sections of this type first.'),
              type: 'error',
              duration: 5000
            })
          } else {
            toastService?.show({
              message: t('admin.content.sections.templateDeleteError'),
              type: 'error'
            })
          }
        }
      }
    }
  })
}

function handleTemplateClick(template: SectionTemplate) {
  // Navigate to section template detail view
  router.push(`/content/section-templates/${template.id}`)
}

// Lifecycle
onMounted(() => {
  loadAll()
})
</script>

<style lang="scss">
.content-sections-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-lg);

    h1 {
      font-size: var(--font-size-xl);
      font-weight: 600;
      color: var(--color-foreground);
    }
  }

  &__filters {
    display: flex;
    gap: var(--space);
    margin-bottom: var(--space-lg);

    > * {
      flex: 1;
      max-width: 300px;
    }
  }

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--space-xl);
  }


  &__metadata {
    display: flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }


  &__sections-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
  }

  &__section-group {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__section-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin-bottom: var(--space);

    h2 {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--color-foreground);
      margin: 0;
    }

    p {
      color: var(--color-foreground-secondary);
      font-size: var(--font-size-sm);
      margin: 0;
    }
  }
}
</style>
