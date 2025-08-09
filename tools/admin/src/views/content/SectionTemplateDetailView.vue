<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="template?.name || t('admin.content.sectionTemplates.details')"
      :description="template?.description"
      :back-to="{ path: '/content/sections' }"
    />

    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <div v-else-if="template" :class="bemm('content')">
      <!-- Template Info -->
      <TCard :class="bemm('template-info')">
        <template #header>
          <h3>{{ t('admin.content.sectionTemplates.information') }}</h3>
        </template>

        <div :class="bemm('template-details')">
          <div :class="bemm('detail-item')">
            <strong>{{ t('common.name') }}:</strong>
            <span>{{ template.name }}</span>
          </div>
          <div :class="bemm('detail-item')">
            <strong>{{ t('common.slug') }}:</strong>
            <span>{{ template.slug }}</span>
          </div>
          <div v-if="template.description" :class="bemm('detail-item')">
            <strong>{{ t('common.description') }}:</strong>
            <span>{{ template.description }}</span>
          </div>
          <div :class="bemm('detail-item')">
            <strong>{{ t('admin.content.sectionTemplates.createdAt') }}:</strong>
            <span>{{ formatDate(template.created_at) }}</span>
          </div>
        </div>
      </TCard>

      <!-- Fields -->
      <TCard :class="bemm('fields')">
        <template #header>
          <div :class="bemm('fields-header')">
            <h3>Fields</h3>
            <TButton
              :icon="Icons.ADD_S"
              color="primary"
              @click="openCreateFieldDialog"
            >
              Create Field
            </TButton>
          </div>
        </template>

        <div v-if="fields.length === 0" :class="bemm('no-fields')">
          <p>No fields defined yet.</p>
        </div>

        <div v-else style="margin-bottom: 1em; padding: 1em; background: #f0f0f0;">
          <strong>Debug: Found {{ fields.length }} fields</strong>
          <pre>{{ JSON.stringify(fields, null, 2) }}</pre>
        </div>

        <TList
          v-else
          :columns="[
            { key: 'label', label: 'Label', width: '25%' },
            { key: 'field_key', label: 'Key', width: '20%' },
            { key: 'field_type', label: 'Type', width: '15%' },
            { key: 'required', label: 'Required', width: '10%' },
            { key: 'translatable', label: 'Translatable', width: '15%' },
            { key: 'actions', label: 'Actions', width: '15%' }
          ]"
        >
          <TListItem
            v-for="field in fields"
            :key="field.id"
            @click="openEditFieldDialog(field)"
          >
            <TListCell type="text" :content="field.label" />
            <TListCell type="custom">
              <code>{{ field.field_key }}</code>
            </TListCell>
            <TListCell type="custom">
              <TChip :color="getFieldTypeColor(field.field_type)">
                {{ getFieldTypeLabel(field.field_type) }}
              </TChip>
            </TListCell>
            <TListCell type="custom">
              <TIcon
                :name="field.is_required ? Icons.CHECK_S : Icons.SUBTRACT_S"
                :color="field.is_required ? 'success' : 'tertiary'"
              />
            </TListCell>
            <TListCell type="custom">
              <TIcon
                :name="field.is_translatable ? Icons.CHECK_S : Icons.SUBTRACT_S"
                :color="field.is_translatable ? 'success' : 'tertiary'"
              />
            </TListCell>
            <TListCell
              type="actions"
              :actions="[
                listActions.delete((e) => { e.stopPropagation(); confirmDeleteField(field) })
              ]"
            />
          </TListItem>
        </TList>
      </TCard>
    </div>

    <div v-else :class="bemm('not-found')">
      <p>{{ t('admin.content.sectionTemplates.notFound') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBemm } from 'bemm'
import { inject } from 'vue'
import {
  TCard,
  TButton,
  TSpinner,
  TList,
  TListItem,
  TListCell,
  TIcon,
  ConfirmDialog,
  useI18n,
  listActions,
  type PopupService,
  type ToastService,
  TChip
} from '@tiko/ui'
import { Icons } from 'open-icon'
import { contentService } from '@tiko/core'
import type { SectionTemplate, ContentField } from '@tiko/core'
import AdminPageHeader from '@/components/AdminPageHeader.vue'
import FieldEditor from './components/FieldEditor.vue'

const route = useRoute()
const bemm = useBemm('section-template-detail-view')
const { t } = useI18n()
const popupService = inject<PopupService>('popupService')
const toastService = inject<ToastService>('toastService')

// State
const template = ref<SectionTemplate | null>(null)
const fields = ref<ContentField[]>([])
const loading = ref(true)

// Computed
const templateId = computed(() => route.params.id as string)

// Methods
async function loadTemplate() {
  try {
    loading.value = true
    template.value = await contentService.getSectionTemplate(templateId.value)

    if (!template.value) {
      console.error('Section template not found:', templateId.value)
      return
    }

    await loadFields()
  } catch (error) {
    console.error('Failed to load section template:', error)
    toastService?.show({
      message: t('admin.content.sectionTemplates.loadError'),
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

async function loadFields() {
  try {
    fields.value = await contentService.getFieldsBySectionTemplate(templateId.value)
    console.log('📋 Loaded fields for section template:', fields.value)
  } catch (error) {
    console.error('Failed to load fields:', error)
    toastService?.show({
      message: 'Failed to load fields',
      type: 'error'
    })
  }
}

function openCreateFieldDialog() {
  if (!template.value) return

  popupService?.open({
    component: FieldEditor,
    title: t('common.fields.create'),
    props: {
      templateId: template.value.id,
      templateType: 'section'
    },
    events: {
      save: handleFieldSave,
      close: () => popupService?.close()
    }
  })
}

function openEditFieldDialog(field: ContentField) {
  if (!template.value) return

  popupService?.open({
    component: FieldEditor,
    title: t('common.fields.edit'),
    props: {
      field,
      templateId: template.value.id,
      templateType: 'section'
    },
    events: {
      save: handleFieldSave,
      close: () => popupService?.close()
    }
  })
}

async function handleFieldSave() {
  popupService?.close()
  await loadFields()
  toastService?.show({
    message: t('common.fields.saveSuccess'),
    type: 'success'
  })
}

function confirmDeleteField(field: ContentField) {
  popupService?.open({
    component: ConfirmDialog,
    props: {
      title: t('common.fields.deleteConfirm'),
      message: t('common.fields.deleteMessage', { name: field.label }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      confirmColor: 'error',
      icon: Icons.ALERT_TRIANGLE,
      onConfirm: async () => {
        try {
          await contentService.deleteField(field.id)
          toastService?.show({
            message: t('common.fields.deleteSuccess'),
            type: 'success'
          })
          await loadFields()
        } catch (error) {
          console.error('Failed to delete field:', error)
          toastService?.show({
            message: t('common.fields.deleteError'),
            type: 'error'
          })
        }
      }
    }
  })
}

function getFieldTypeColor(type: string): string {
  const colors: Record<string, string> = {
    text: 'primary',
    textarea: 'primary',
    richtext: 'accent',
    number: 'secondary',
    boolean: 'tertiary',
    select: 'warning',
    media: 'success',
    list: 'info',
    items: 'error',
    linked_items: 'error'
  }
  return colors[type] || 'primary'
}

function getFieldTypeLabel(type: string): string {
  return t(`admin.content.field.types.${type}`, type)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

// Lifecycle
onMounted(() => {
  loadTemplate()
})
</script>

<style lang="scss">
.section-template-detail-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space);

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  &__template-details {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
  }

  &__detail-item {
    display: flex;
    gap: var(--space-s);

    strong {
      min-width: 120px;
      color: var(--color-foreground);
    }

    span {
      color: var(--color-foreground-light);
    }
  }

  &__fields-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  &__no-fields {
    padding: var(--space-lg);
    text-align: center;
    color: var(--color-foreground-light);
  }

  &__field-actions {
    display: flex;
    gap: var(--space-xs);
    justify-content: flex-end;
  }

  &__not-found {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    color: var(--color-foreground-light);
  }
}
</style>
