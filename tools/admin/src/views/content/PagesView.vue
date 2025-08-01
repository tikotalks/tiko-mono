<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="t('admin.content.pages.title')"
      :description="t('admin.content.pages.description')"
    >
      <template #actions>
        <TButton
          color="primary"
          :icon="Icons.ADD"
          @click="handleCreateClick"
        >
          {{ t('admin.content.pages.create') }}
        </TButton>
      </template>

      <template #inputs>
        <TInputSelect
          v-model="selectedProjectId"
          :label="t('filter.filterByProject')"
          :options="projectFilterOptions"
          :placeholder="t('admin.content.pages.allProjects')"
        />
      </template>
    </AdminPageHeader>

    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <TList
      v-else-if="filteredPages.length > 0"
      :columns="[
        { key: 'title', label: t('common.title'), width: '20%' },
        { key: 'slug', label: t('common.slug'), width: '20%' },
        { key: 'path', label: t('common.path'), width: '20%' },
        { key: 'project', label: t('common.project'), width: '15%' },
        { key: 'metadata', label: t('common.status'), width: '15%' },
        { key: 'actions', label: t('common.actions'), width: '10%' }
      ]"
      :striped="true"
      :bordered="true"
      :hover="true"
      :style="{width: '100%'}"
    >
      <TListItem
        v-for="page in filteredPages"
        :key="page.id"
        :clickable="true"
        @click="handlePageClick(page)"
      >
        <TListCell type="text" :content="page.title" />
        <TListCell type="text" :content="page.slug" />
        <TListCell type="text" :content="page.full_path" />
        <TListCell type="text" :content="getProjectName(page.project_id)" />
        <TListCell type="custom">
          <div :class="bemm('metadata')">
            <TChip
              v-for="meta in getPageMetadata(page)"
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
            listActions.edit((e) => { e.stopPropagation(); handleEdit(page) }),
            listActions.delete((e) => { e.stopPropagation(); handleDelete(page) })
          ]"
        />
      </TListItem>
    </TList>

    <TEmptyState
      v-else
      :icon="Icons.FILE_BINARY"
      :title="t('admin.content.pages.empty')"
      :description="t('admin.content.pages.emptyDescription')"
    >
      <TButton
        color="primary"
        :icon="Icons.ADD"
        @click="handleCreateClick"
      >
        {{ t('admin.content.pages.createFirst') }}
      </TButton>
    </TEmptyState>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { TList, TListItem, TListCell, TButton, TEmptyState, TChip, TSpinner, TInputSelect, useI18n,
  listActions, type ToastService, type PopupService
 } from '@tiko/ui'
import { contentService } from '@tiko/core'
import type { ContentPage, ContentProject,} from '@tiko/core'
import { Icons } from 'open-icon'
import CreatePageDialog from './components/CreatePageDialog.vue'
import AdminPageHeader from '@/components/AdminPageHeader.vue'

const bemm = useBemm('pages-view')
const { t } = useI18n()
const router = useRouter()
const toastService = inject<ToastService>('toastService')
const popupService = inject<PopupService>('popupService')

// State
const pages = ref<ContentPage[]>([])
const projects = ref<ContentProject[]>([])
const loading = ref(false)
const selectedProjectId = ref<string>('all')

// Computed
const projectFilterOptions = computed(() => {
  const options = [
    { value: 'all', label: t('admin.content.pages.allProjects') }
  ]

  projects.value.forEach(project => {
    options.push({
      value: project.id,
      label: project.name
    })
  })

  return options
})

const filteredPages = computed(() => {
  if (selectedProjectId.value === 'all') {
    return pages.value
  }

  return pages.value.filter(page => page.project_id === selectedProjectId.value)
})

// Methods
async function loadPages() {
  loading.value = true
  try {
    const [pagesData, projectsData] = await Promise.all([
      contentService.getPages(),
      contentService.getProjects()
    ])
    pages.value = pagesData
    projects.value = projectsData
    console.log('Loaded pages:', pagesData)
    console.log('Loaded projects:', projectsData)
  } catch (error) {
    console.error('Failed to load pages:', error)
    toastService?.show({
      message: t('admin.content.pages.loadError'),
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

function getProjectName(projectId: string): string {
  const project = projects.value.find(p => p.id === projectId)
  return project?.name || ''
}

function getPageMetadata(page: ContentPage): string[] {
  const metadata = []

  // Add language
  metadata.push(page.language_code.toUpperCase())

  // Add status
  metadata.push(page.is_published ? t('common.published') : t('common.draft'))

  // Add home page indicator
  if (page.is_home) {
    metadata.push(t('admin.content.pages.homePage'))
  }

  return metadata
}

function handlePageClick(page: ContentPage) {
  router.push(`/content/pages/${page.id}`)
}

function handleEdit(page: ContentPage) {
  const popupId = popupService?.open({
    component: CreatePageDialog,
    title: t('admin.content.pages.edit'),
    props: {
      page,
      mode: 'edit',
      projects: projects.value
    },
    onSave: (pageData: Partial<ContentPage>) => {
      handleSave(pageData, 'edit')
      popupService?.close({ id: popupId })
    }
  })
}

function handleDelete(page: ContentPage) {
  // TODO: Create delete confirmation dialog
  console.log('Delete page:', page)
}

async function handleSave(pageData: Partial<ContentPage>, mode?: 'create' | 'edit') {
  try {
    if (mode === 'edit' && pageData.id) {
      await contentService.updatePage(pageData.id, pageData)
      toastService?.show({
        message: t('admin.content.pages.updateSuccess'),
        type: 'success'
      })
    } else {
      await contentService.createPage(pageData)
      toastService?.show({
        message: t('admin.content.pages.createSuccess'),
        type: 'success'
      })
    }
    await loadPages()
  } catch (error: any) {
    console.error('Failed to save page:', error)

    // Check for duplicate page error
    if (error?.message?.includes('duplicate key value') && error?.message?.includes('content_pages_project_id_language_code_slug_key')) {
      toastService?.show({
        message: t('admin.content.pages.duplicateError'),
        type: 'error'
      })
    } else {
      toastService?.show({
        message: mode === 'edit' ? t('admin.content.pages.updateError') : t('admin.content.pages.createError'),
        type: 'error'
      })
    }
  }
}

function handleCreateClick() {
  const popupId = popupService?.open({
    component: CreatePageDialog,
    title: t('admin.content.pages.create'),
    props: {
      mode: 'create',
      projects: projects.value
    },
    onSave: (pageData: Partial<ContentPage>) => {
      handleSave(pageData, 'create')
      popupService?.close({ id: popupId })
    }
  })
}

// Lifecycle
onMounted(() => {
  loadPages()
})
</script>

<style lang="scss">
.pages-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-lg);

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
}
</style>
