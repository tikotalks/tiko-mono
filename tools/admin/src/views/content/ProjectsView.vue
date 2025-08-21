<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="t('admin.content.projects.title')"
      :description="t('admin.content.projects.description')"
    >
      <template #actions>
        <TButton
          @click="openCreateDialog"
          :icon="Icons.ADD"
          color="primary"
        >
          {{ t('admin.content.projects.create') }}
        </TButton>
      </template>
    </AdminPageHeader>

    <TList
      :columns="[
        { key: 'name', label: t('common.name'), width: '30%' },
        { key: 'slug', label: t('common.slug'), width: '20%' },
        { key: 'languages', label: t('common.languages'), width: '20%' },
        { key: 'pages', label: t('admin.content.projects.pageCount'), width: '15%' },
        { key: 'actions', label: t('common.actions'), width: '80px' }
      ]"
      :striped="true"
      :bordered="true"
      :hover="true"
      :show-stats="true"
      :style="{width: '100%'}"
    >
      <TListItem
        v-for="project in projects"
        :key="project.id"
        :clickable="true"
        @click="viewProject(project)"
      >
        <TListCell type="text" :content="project.name" />
        <TListCell type="text" :content="project.slug" />
        <TListCell type="custom">
          <div :class="bemm('languages')">
            <span v-for="lang in project.languages" :key="lang" :class="bemm('language-badge')">
              {{ lang }}
            </span>
          </div>
        </TListCell>
        <TListCell type="text" :content="pageCount[project.id] || 0" />
        <TListCell
          type="actions"
          :actions="[
            listActions.edit((e) => { e.stopPropagation(); editProject(project) }),
            listActions.custom({
              icon: Icons.SETTINGS,
              color: 'secondary',
              handler: (e) => { e.stopPropagation(); manageProject(project) },
              tooltip: t('admin.content.projects.manage')
            })
          ]"
        />
      </TListItem>
    </TList>

    <div v-if="projects.length === 0" :class="bemm('empty')">
      <p>{{ t('admin.content.projects.empty') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import {
  TButton,
  TList,
  TListItem,
  TListCell,
  listActions,
  ToastService
} from '@tiko/ui'
import { contentService,
  useI18n } from '@tiko/core'
import { type PopupService } from "@tiko/ui";
import type { ContentProject } from '@tiko/core'
import CreateProjectDialog from './components/CreateProjectDialog.vue'
import AdminPageHeader from '@/components/AdminPageHeader.vue'

const bemm = useBemm('content-projects-view')
const { t } = useI18n()
const router = useRouter()
const toastService = inject<ToastService>('toastService')
const popupService = inject<PopupService>('popupService')

// State
const projects = ref<ContentProject[]>([])
const pageCount = ref<Record<string, number>>({})
const loading = ref(false)

// Load projects
async function loadProjects() {
  loading.value = true
  try {
    projects.value = await contentService.getProjects()

    // Load page counts for each project
    for (const project of projects.value) {
      const pages = await contentService.getPages(project.id)
      pageCount.value[project.id] = pages.length
    }
  } catch (error) {
    console.error('Failed to load projects:', error)
    toastService?.show({
      message: t('admin.content.projects.loadError'),
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Open create dialog
function openCreateDialog() {
  if (!popupService) return

  popupService.open({
    component: CreateProjectDialog,
    title: t('admin.content.projects.create'),
    props: {
      onSave: async (projectData: Omit<ContentProject, 'id' | 'created_at' | 'updated_at'>) => {
        try {
          await contentService.createProject(projectData)
          toastService?.show({
            message: t('admin.content.projects.createSuccess'),
            type: 'success'
          })
          await loadProjects()
        } catch (error) {
          console.error('Failed to create project:', error)
          toastService?.show({
            message: t('admin.content.projects.createError'),
            type: 'error'
          })
        }
      }
    }
  })
}

// View project details
function viewProject(project: ContentProject) {
  router.push({
    name: 'ContentProjectDetail',
    params: { projectId: project.id }
  })
}

// Edit project
function editProject(project: ContentProject) {
  if (!popupService) return

  popupService.open({
    component: CreateProjectDialog,
    title: t('admin.content.projects.edit'),
    props: {
      project,
      mode: 'edit',
      onSave: async (projectData: Partial<ContentProject>) => {
        try {
          await contentService.updateProject(project.id, projectData)
          toastService?.show({
            message: t('admin.content.projects.updateSuccess'),
            type: 'success'
          })
          await loadProjects()
        } catch (error) {
          console.error('Failed to update project:', error)
          toastService?.show({
            message: t('admin.content.projects.updateError'),
            type: 'error'
          })
        }
      }
    }
  })
}

// Manage project sections
function manageProject(project: ContentProject) {
  router.push({
    name: 'ContentProjectSections',
    params: { projectId: project.id }
  })
}

// Lifecycle
onMounted(() => {
  loadProjects()
})
</script>

<style lang="scss">
.content-projects-view {
  display: flex;
  flex-direction: column;
  gap: var(--space);


  &__languages {
    display: flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  &__language-badge {
    display: inline-block;
    padding: var(--space-2xs) var(--space-xs);
    background: var(--color-primary-10);
    color: var(--color-primary);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: 500;
  }

  &__actions {
    display: flex;
    gap: var(--space-xs);
  }

  &__empty {
    text-align: center;
    padding: var(--space-2xl);
    color: var(--color-foreground-secondary);
  }
}
</style>
