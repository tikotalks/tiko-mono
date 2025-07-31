<template>
  <div :class="bemm()">
    <THeader
      :title="page?.title || t('admin.content.page.loading')"
      :description="page?.seo_description || ''"
    >
      <template #actions>
        <TButton
          type="ghost"
          :icon="Icons.ARROW_LEFT"
          @click="$router.push('/content/pages')"
        >
          {{ t('common.back') }}
        </TButton>
        <TButton
          color="primary"
          :icon="Icons.EDIT"
          @click="handleEdit"
          :disabled="!page"
        >
          {{ t('common.edit') }}
        </TButton>
      </template>
    </THeader>

    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <div v-else-if="page" :class="bemm('content')">
      <!-- Page Info -->
      <TCard :class="bemm('section')">
        <h3 :class="bemm('section-title')">{{ t('admin.content.page.info') }}</h3>

        <TKeyValue
          :items="[
            { key: t('admin.content.page.title'), value: page.title },
            { key: t('admin.content.page.slug'), value: page.slug || '/' },
            { key: t('admin.content.page.fullPath'), value: page.full_path },
            { key: t('admin.content.page.language'), value: page.language_code },
            { key: t('admin.content.page.project'), value: getProjectName(page.project_id) },
            { key: t('admin.content.page.status'), value: page.is_published ? t('common.published') : t('common.draft') },
            { key: t('admin.content.page.isHome'), value: page.is_home ? t('common.yes') : t('common.no') },
            { key: t('admin.content.page.createdAt'), value: formatDate(page.created_at) },
            { key: t('admin.content.page.updatedAt'), value: formatDate(page.updated_at) }
          ]"
        />
      </TCard>

      <!-- SEO Info -->
      <TCard :class="bemm('section')">
        <h3 :class="bemm('section-title')">{{ t('admin.content.page.seo') }}</h3>

        <TKeyValue
          :items="[
            { key: t('admin.content.page.seoTitle'), value: page.seo_title || t('common.none') },
            { key: t('admin.content.page.seoDescription'), value: page.seo_description || t('common.none') },
            { key: t('admin.content.page.seoImage'), value: page.seo_image || t('common.none') }
          ]"
        />
      </TCard>

      <!-- Page Sections -->
      <TCard :class="bemm('section')">
        <div :class="bemm('section-header')">
          <h3 :class="bemm('section-title')">{{ t('admin.content.page.sections') }}</h3>
          <TButton
            color="primary"
            :icon="Icons.ADD"
            size="small"
            @click="openAddSectionDialog"
          >
            {{ t('admin.content.page.addSection') }}
          </TButton>
        </div>

        <div v-if="loadingSections" :class="bemm('loading')">
          <TSpinner />
        </div>


        <div v-else-if="pageSections.length > 0" :class="bemm('sections-list')">
          <TDraggableList
            :items="pageSections"
            :enabled="true"
            :on-reorder="handleSectionsReorder"
          >
            <template v-slot="{ item }">
              <div :class="bemm('section-item')">
                <TIcon :name="Icons.ARROW_HEADED_UP_DOWN" :class="bemm('drag-handle')" />
                <div :class="bemm('section-info')">
                  <span :class="bemm('section-name')">{{ item?.section?.name || item?.pageSection?.override_name || 'Unknown Section' }}</span>
                  <span :class="bemm('section-type')">{{ item?.section?.component_type || 'unknown' }}</span>
                </div>
                <div :class="bemm('section-actions')">
                  <TButton
                    type="icon-only"
                    :icon="Icons.EDIT_M"
                    size="small"
                    @click="handleEditSection(item)"
                    :tooltip="t('common.edit')"
                  />
                  <TButton
                    type="icon-only"
                    :icon="Icons.MULTIPLY_M"
                    color="error"
                    size="small"
                    @click="handleRemoveSection(item)"
                    :tooltip="t('common.delete')"
                  />
                </div>
              </div>
            </template>
          </TDraggableList>
        </div>

        <TEmptyState
          v-else
          :icon="Icons.LAYERS"
          :title="t('admin.content.page.noSections')"
          :description="t('admin.content.page.noSectionsDescription')"
          :compact="true"
        >
          <TButton
            color="primary"
            :icon="Icons.ADD"
            size="small"
            @click="openAddSectionDialog"
          >
            {{ t('admin.content.page.addSection') }}
          </TButton>
        </TEmptyState>
      </TCard>

      <!-- Page Data -->
      <TCard v-if="page.page_data && Object.keys(page.page_data).length > 0" :class="bemm('section')">
        <h3 :class="bemm('section-title')">{{ t('admin.content.page.data') }}</h3>

        <pre :class="bemm('page-data')">{{ JSON.stringify(page.page_data, null, 2) }}</pre>
      </TCard>

      <!-- Actions -->
      <TCard :class="bemm('section')">
        <h3 :class="bemm('section-title')">{{ t('admin.content.page.actions') }}</h3>

        <div :class="bemm('actions')">
          <TButton
            color="primary"
            :icon="Icons.EDIT"
            @click="handleEdit"
          >
            {{ t('common.edit') }}
          </TButton>

          <TButton
            v-if="!page.is_published"
            color="success"
            :icon="Icons.CHECK"
            @click="handlePublish"
          >
            {{ t('admin.content.page.publish') }}
          </TButton>

          <TButton
            v-else
            color="warning"
            :icon="Icons.PAUSE"
            @click="handleUnpublish"
          >
            {{ t('admin.content.page.unpublish') }}
          </TButton>

          <TButton
            color="error"
            :icon="Icons.DELETE"
            @click="handleDelete"
          >
            {{ t('common.delete') }}
          </TButton>
        </div>
      </TCard>
    </div>

    <TEmptyState
      v-else
      :icon="Icons.DOCUMENT"
      :title="t('admin.content.page.notFound')"
      :description="t('admin.content.page.notFoundDescription')"
    >
      <TButton
        color="primary"
        :icon="Icons.ARROW_LEFT"
        @click="$router.push('/content/pages')"
      >
        {{ t('admin.content.page.backToPages') }}
      </TButton>
    </TEmptyState>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import {
  THeader,
  TButton,
  TSpinner,
  TCard,
  TKeyValue,
  TEmptyState,
  TList,
  TListItem,
  TListCell,
  TDraggableList,
  TIcon,
  ConfirmDialog,
  useI18n
} from '@tiko/ui'
import { contentService } from '@tiko/core'
import type { ContentPage, ContentProject, PageSection, ContentSection, ToastService, PopupService } from '@tiko/core'
import { Icons } from 'open-icon'
import CreatePageDialog from './components/CreatePageDialog.vue'
import AddSectionDialog from './components/AddSectionDialog.vue'

const bemm = useBemm('page-detail-view')
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const toastService = inject<ToastService>('toastService')
const popupService = inject<PopupService>('popupService')

// State
const page = ref<ContentPage | null>(null)
const projects = ref<ContentProject[]>([])
const pageSections = ref<any[]>([]) // Changed to match marketing site structure
const availableSections = ref<ContentSection[]>([])
const loading = ref(false)
const loadingSections = ref(false)

// Methods
async function loadPage() {
  loading.value = true
  try {
    const pageId = route.params.id as string
    const [pageData, projectsData] = await Promise.all([
      contentService.getPage(pageId),
      contentService.getProjects()
    ])
    page.value = pageData
    projects.value = projectsData

    // Load sections after page is loaded
    if (pageData) {
      await loadPageSections()
    }
  } catch (error) {
    console.error('Failed to load page:', error)
    toastService?.show({
      message: t('admin.content.page.loadError'),
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

async function loadPageSections() {
  if (!page.value) return

  loadingSections.value = true
  try {
    // Load page sections
    const sections = await contentService.getPageSections(page.value.id)
    console.log('Raw page sections from API:', sections)

    // Transform to match marketing site structure
    const sectionsWithTemplates = []

    for (const pageSection of sections || []) {
      try {
        // Load the section template
        const template = await contentService.getSectionTemplate(pageSection.section_template_id)

        // Create the combined structure like marketing site
        sectionsWithTemplates.push({
          pageSection: {
            ...pageSection,
            section_id: pageSection.section_template_id // Add section_id for compatibility
          },
          section: template,
          content: {}, // Empty for now
          id: pageSection.section_template_id // For TDraggableList
        })

        console.log(`Loaded section:`, { pageSection, section: template })
      } catch (e) {
        console.error(`Failed to load template ${pageSection.section_template_id}:`, e)
        // Still add the section even if template fails to load
        sectionsWithTemplates.push({
          pageSection,
          section: null,
          content: {},
          id: pageSection.section_template_id
        })
      }
    }

    pageSections.value = sectionsWithTemplates
    console.log('Final sections structure:', pageSections.value)
  } catch (error) {
    console.error('Failed to load page sections:', error)
    // Handle gracefully if tables don't exist
    if (error?.message?.includes('does not exist') || error?.message?.includes('404')) {
      console.log('Sections tables may not exist, using empty arrays')
      pageSections.value = []
      availableSections.value = []
    } else {
      // Log the full error for debugging
      console.error('Full error details:', error)
    }
  } finally {
    loadingSections.value = false
  }
}

// Removed getSectionName and getSectionType - now accessing data directly in template

function openAddSectionDialog() {
  // Get list of already used section template IDs
  const usedSectionIds = pageSections.value.map(s => s.pageSection.section_template_id)
  
  popupService?.open({
    component: AddSectionDialog,
    title: t('admin.content.page.addSection'),
    props: {
      pageId: page.value?.id,
      existingSections: pageSections.value,
      usedSectionIds: usedSectionIds,
      onAdd: handleAddSection
    }
  })
}

async function handleAddSection(sectionData: Omit<PageSection, 'page_id'>) {
  if (!page.value) return

  try {
    // Check if this section template is already used
    const existingSection = pageSections.value.find(
      s => s.pageSection.section_template_id === sectionData.section_template_id
    )
    
    if (existingSection) {
      toastService?.show({
        message: t('admin.content.page.sectionAlreadyExists', 'This section template is already used on this page'),
        type: 'warning'
      })
      return
    }
    
    // Create the new page section
    const newPageSection: PageSection = {
      ...sectionData,
      page_id: page.value.id,
      order_index: pageSections.value.length
    }

    // Try to load the section template
    let sectionTemplate = null
    try {
      sectionTemplate = await contentService.getSectionTemplate(newPageSection.section_template_id)
    } catch (e) {
      console.error('Failed to load section template:', e)
    }

    // Add to sections with the same structure as marketing site
    const newSectionData = {
      pageSection: {
        ...newPageSection,
        section_id: newPageSection.section_template_id
      },
      section: sectionTemplate,
      content: {},
      id: newPageSection.section_template_id
    }

    pageSections.value = [...pageSections.value, newSectionData]

    // Extract just the pageSection data for backend
    const sectionsForBackend = pageSections.value.map(s => ({
      page_id: s.pageSection.page_id,
      section_template_id: s.pageSection.section_template_id,
      order_index: s.pageSection.order_index,
      override_name: s.pageSection.override_name
    }))
    await contentService.setPageSections(page.value.id, sectionsForBackend)

    toastService?.show({
      message: t('admin.content.page.sectionAddSuccess'),
      type: 'success'
    })

    // Reload sections to get fresh data
    await loadPageSections()
  } catch (error: any) {
    console.error('Failed to add section:', error)
    
    // Check for duplicate key error
    if (error?.message?.includes('duplicate key') || error?.message?.includes('23505')) {
      toastService?.show({
        message: t('admin.content.page.sectionAlreadyExists', 'This section template is already used on this page'),
        type: 'warning'
      })
      // Reload to ensure UI is in sync with database
      await loadPageSections()
    } else {
      toastService?.show({
        message: t('admin.content.page.sectionAddError'),
        type: 'error'
      })
    }
  }
}

async function handleSectionsReorder(newSections: any[]) {
  if (!page.value) return

  // Store the original sections in case we need to restore them
  const originalSections = [...pageSections.value]
  
  try {
    console.log('Reordering sections:', newSections)
    
    // Validate the new sections array
    if (!newSections || !Array.isArray(newSections) || newSections.length === 0) {
      console.error('Invalid sections array received:', newSections)
      throw new Error('Invalid sections array')
    }
    
    // Update order indices
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      pageSection: { ...section.pageSection, order_index: index }
    }))

    // Update local state optimistically
    pageSections.value = updatedSections

    // Extract just the pageSection data for backend
    const sectionsForBackend = updatedSections.map(s => {
      // Ensure we have valid data
      if (!s.pageSection) {
        console.error('Missing pageSection data:', s)
        throw new Error('Invalid section data structure')
      }
      
      return {
        page_id: s.pageSection.page_id,
        section_template_id: s.pageSection.section_template_id,
        order_index: s.pageSection.order_index,
        override_name: s.pageSection.override_name
      }
    })
    
    console.log('Saving reordered sections:', sectionsForBackend)
    await contentService.setPageSections(page.value.id, sectionsForBackend)

    toastService?.show({
      message: t('admin.content.page.sectionsReorderSuccess'),
      type: 'success'
    })
  } catch (error) {
    console.error('Failed to reorder sections:', error)
    
    // Restore original sections
    pageSections.value = originalSections
    
    toastService?.show({
      message: t('admin.content.page.sectionsReorderError'),
      type: 'error'
    })
  }
}

function handleEditSection(sectionData: any) {
  // TODO: Implement edit section functionality
  console.log('Edit section:', sectionData)
  toastService?.show({
    message: 'Edit section functionality coming soon',
    type: 'info'
  })
}

async function handleRemoveSection(sectionData: any) {
  popupService?.open({
    component: ConfirmDialog,
    props: {
      title: t('admin.content.page.removeSectionConfirm'),
      message: t('admin.content.page.removeSectionMessage', { name: sectionData.section?.name || sectionData.pageSection?.override_name || 'this section' }),
      confirmLabel: t('common.remove'),
      cancelLabel: t('common.cancel'),
      confirmColor: 'error',
      icon: Icons.ALERT_CIRCLE,
      onConfirm: async () => {
        if (!page.value) return

        try {
          // Remove the section from the list
          const updatedSections = pageSections.value
            .filter(s => s.id !== sectionData.id)
            .map((s, index) => ({
              ...s,
              pageSection: { ...s.pageSection, order_index: index }
            }))

          pageSections.value = updatedSections

          // Extract just the pageSection data for backend
          const sectionsForBackend = updatedSections.map(s => ({
            page_id: s.pageSection.page_id,
            section_template_id: s.pageSection.section_template_id,
            order_index: s.pageSection.order_index,
            override_name: s.pageSection.override_name
          }))
          await contentService.setPageSections(page.value.id, sectionsForBackend)

          toastService?.show({
            message: t('admin.content.page.sectionRemoveSuccess'),
            type: 'success'
          })
        } catch (error) {
          console.error('Failed to remove section:', error)
          toastService?.show({
            message: t('admin.content.page.sectionRemoveError'),
            type: 'error'
          })
          // Reload to restore original state
          await loadPageSections()
        }
      }
    }
  })
}

function getProjectName(projectId: string): string {
  const project = projects.value.find(p => p.id === projectId)
  return project?.name || ''
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

function handleEdit() {
  if (!page.value) return

  const popupId = popupService?.open({
    component: CreatePageDialog,
    title: t('admin.content.page.edit'),
    props: {
      page: page.value,
      mode: 'edit',
      projects: projects.value
    },
    on: {
      save: async (pageData: Partial<ContentPage>) => {
        await handleSave(pageData)
        popupService?.close({ id: popupId })
      },
      close: () => {
        popupService?.close({ id: popupId })
      }
    }
  })
}

async function handleSave(pageData: Partial<ContentPage>) {
  try {
    await contentService.updatePage(page.value!.id, pageData)
    toastService?.show({
      message: t('admin.content.page.updateSuccess'),
      type: 'success'
    })
    await loadPage() // Reload to get updated data
  } catch (error: any) {
    console.error('Failed to update page:', error)
    toastService?.show({
      message: t('admin.content.page.updateError'),
      type: 'error'
    })
  }
}

async function handlePublish() {
  if (!page.value) return

  try {
    await contentService.updatePage(page.value.id, { is_published: true })
    toastService?.show({
      message: t('admin.content.page.publishSuccess'),
      type: 'success'
    })
    await loadPage()
  } catch (error) {
    console.error('Failed to publish page:', error)
    toastService?.show({
      message: t('admin.content.page.publishError'),
      type: 'error'
    })
  }
}

async function handleUnpublish() {
  if (!page.value) return

  try {
    await contentService.updatePage(page.value.id, { is_published: false })
    toastService?.show({
      message: t('admin.content.page.unpublishSuccess'),
      type: 'success'
    })
    await loadPage()
  } catch (error) {
    console.error('Failed to unpublish page:', error)
    toastService?.show({
      message: t('admin.content.page.unpublishError'),
      type: 'error'
    })
  }
}

async function handleDelete() {
  if (!page.value) return

  // TODO: Add confirmation dialog
  if (confirm(t('admin.content.page.deleteConfirm'))) {
    try {
      await contentService.deletePage(page.value.id)
      toastService?.show({
        message: t('admin.content.page.deleteSuccess'),
        type: 'success'
      })
      router.push('/content/pages')
    } catch (error) {
      console.error('Failed to delete page:', error)
      toastService?.show({
        message: t('admin.content.page.deleteError'),
        type: 'error'
      })
    }
  }
}

// Lifecycle
onMounted(() => {
  loadPage()
})
</script>

<style lang="scss">
.page-detail-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
  padding: var(--space-l);

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--space-xl);
  }

  &__content {
    display: flex;
    flex-direction: column;
  gap: var(--space-l);
  }

  &__section {
    padding: var(--space-lg);
  }

  &__section-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0 0 var(--space) 0;
  }

  &__page-data {
    background: var(--color-background-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: var(--space);
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--color-foreground);
    overflow-x: auto;
    white-space: pre-wrap;
  }

  &__actions {
    display: flex;
    gap: var(--space);
    flex-wrap: wrap;
  }

  &__section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space);
  }

  &__sections-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__section-item {
    display: flex;
    align-items: center;
    gap: var(--space);
    background: var(--color-background-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space);
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--color-primary-10);
      background: var(--color-background);
    }
  }

  &__drag-handle {
    color: var(--color-foreground-secondary);
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }

  &__section-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
    flex: 1;
  }

  &__section-name {
    font-weight: 500;
    color: var(--color-foreground);
  }

  &__section-type {
    font-size: var(--font-size-sm);
    color: var(--color-foreground-secondary);
  }

  &__section-actions {
    display: flex;
    gap: var(--space-xs);
  }
}
</style>
