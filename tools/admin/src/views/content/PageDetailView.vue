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
            v-model="pageSections"
            :key-field="'section_template_id'"
            @update:model-value="handleSectionsReorder"
          >
            <template #item="{ item }">
              <div :class="bemm('section-item')">
                <div :class="bemm('section-info')">
                  <span :class="bemm('section-name')">{{ getSectionName(item) }}</span>
                  <span :class="bemm('section-type')">{{ getSectionType(item) }}</span>
                </div>
                <div :class="bemm('section-actions')">
                  <TButton
                    type="icon-only"
                    :icon="Icons.DELETE"
                    color="error"
                    size="small"
                    @click="handleRemoveSection(item)"
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
const pageSections = ref<PageSection[]>([])
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
    pageSections.value = await contentService.getPageSections(page.value.id)
    console.log('Loaded page sections:', pageSections.value)

    // Load available sections for reference
    availableSections.value = await contentService.getSections()
    console.log('Available sections:', availableSections.value)
  } catch (error) {
    console.error('Failed to load page sections:', error)
    // Handle gracefully if tables don't exist
    if (error?.message?.includes('does not exist')) {
      pageSections.value = []
      availableSections.value = []
    }
  } finally {
    loadingSections.value = false
  }
}

function getSectionName(pageSection: PageSection): string {
  // First try to find by section instance ID if we're storing section IDs
  let section = availableSections.value.find(s => s.id === pageSection.section_template_id)

  // If not found, try to find by template ID
  if (!section) {
    section = availableSections.value.find(s => s.section_template_id === pageSection.section_template_id)
  }

  // If still not found and we have templates as fallback, look them up
  if (!section && availableSections.value.length > 0) {
    // The section might be using a template directly
    const firstSection = availableSections.value[0]
    if (firstSection.id === firstSection.section_template_id) {
      // We're using templates as sections
      section = availableSections.value.find(s => s.id === pageSection.section_template_id)
    }
  }

  return pageSection.override_name || section?.name || 'Unknown Section'
}

function getSectionType(pageSection: PageSection): string {
  // Same lookup logic as getSectionName
  let section = availableSections.value.find(s => s.id === pageSection.section_template_id)
  if (!section) {
    section = availableSections.value.find(s => s.section_template_id === pageSection.section_template_id)
  }
  if (!section && availableSections.value.length > 0) {
    const firstSection = availableSections.value[0]
    if (firstSection.id === firstSection.section_template_id) {
      section = availableSections.value.find(s => s.id === pageSection.section_template_id)
    }
  }

  return section?.component_type || 'unknown'
}

function openAddSectionDialog() {
  popupService?.open({
    component: AddSectionDialog,
    title: t('admin.content.page.addSection'),
    props: {
      pageId: page.value?.id,
      existingSections: pageSections.value,
      onAdd: handleAddSection
    }
  })
}

async function handleAddSection(sectionData: Omit<PageSection, 'page_id'>) {
  if (!page.value) return

  try {
    // Add the section to the page
    const newSection: PageSection = {
      ...sectionData,
      page_id: page.value.id
    }

    // Update the sections list locally
    pageSections.value = [...pageSections.value, newSection]

    // Save to backend
    await contentService.setPageSections(page.value.id, pageSections.value)

    toastService?.show({
      message: t('admin.content.page.sectionAddSuccess'),
      type: 'success'
    })

    // Reload sections to get fresh data
    await loadPageSections()
  } catch (error) {
    console.error('Failed to add section:', error)
    toastService?.show({
      message: t('admin.content.page.sectionAddError'),
      type: 'error'
    })
  }
}

async function handleSectionsReorder(newSections: PageSection[]) {
  if (!page.value) return

  try {
    // Update order indices
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      order_index: index
    }))

    pageSections.value = updatedSections

    // Save to backend
    await contentService.setPageSections(page.value.id, updatedSections)

    toastService?.show({
      message: t('admin.content.page.sectionsReorderSuccess'),
      type: 'success'
    })
  } catch (error) {
    console.error('Failed to reorder sections:', error)
    toastService?.show({
      message: t('admin.content.page.sectionsReorderError'),
      type: 'error'
    })
    // Reload to restore original order
    await loadPageSections()
  }
}

async function handleRemoveSection(section: PageSection) {
  popupService?.open({
    component: ConfirmDialog,
    props: {
      title: t('admin.content.page.removeSectionConfirm'),
      message: t('admin.content.page.removeSectionMessage', { name: getSectionName(section) }),
      confirmLabel: t('common.remove'),
      cancelLabel: t('common.cancel'),
      confirmColor: 'error',
      icon: Icons.ALERT_CIRCLE,
      onConfirm: async () => {
        if (!page.value) return

        try {
          // Remove the section from the list
          const updatedSections = pageSections.value
            .filter(s => s.section_template_id !== section.section_template_id)
            .map((s, index) => ({ ...s, order_index: index }))

          pageSections.value = updatedSections

          // Save to backend
          await contentService.setPageSections(page.value.id, updatedSections)

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
    justify-content: space-between;
    align-items: center;
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

  &__section-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
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
