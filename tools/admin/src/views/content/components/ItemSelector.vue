<template>
  <div :class="bemm()">
    <!-- Filters -->
    <div :class="bemm('filters')">
      <TInput
        v-model="searchQuery"
        :placeholder="t('common.search')"
        :icon="Icons.SEARCH_M"
        clearable
      />
      <TInputSelect
        v-model="selectedTemplateId"
        :options="templateOptions"
        :placeholder="t('admin.content.field.allTemplates')"
        clearable
      />
    </div>

    <!-- Items List -->
    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <div v-else-if="filteredItems.length > 0" :class="bemm('items')">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        :class="bemm('item', { selected: isSelected(item.id) })"
        @click="toggleItem(item.id)"
      >
        <div :class="bemm('item-checkbox')">
          <TInputCheckbox
            :modelValue="isSelected(item.id)"
            @update:modelValue="() => toggleItem(item.id)"
            @click.stop
          />
        </div>
        <div :class="bemm('item-content')">
          <div :class="bemm('item-main')">
            <h4 :class="bemm('item-name')">{{ item.name }}</h4>
            <p v-if="item.description" :class="bemm('item-description')">{{ item.description }}</p>
          </div>
          <div :class="bemm('item-meta')">
            <span :class="bemm('item-template')">{{ item.templateName }}</span>
            <span v-if="item.language_code" :class="bemm('item-language')">
              {{ item.language_code }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <TEmptyState
      v-else
      :icon="Icons.SEARCH_M"
      :title="t('common.noResults')"
      :description="t('admin.content.field.noItemsFound')"
      :compact="true"
    />

    <!-- Footer -->
    <div :class="bemm('footer')">
      <span :class="bemm('count')">
        {{ selectedIds.length }} items selected
      </span>
      <TButton
        color="primary"
        :disabled="selectedIds.length === 0"
        @click="confirmSelection"
      >
        {{ t('common.confirmLabel') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBemm } from 'bemm'
import {
  TInput,
  TInputSelect,
  TInputCheckbox,
  TButton,
  TSpinner,
  TEmptyState,
} from '@tiko/ui'
import { Icons } from 'open-icon'
import { contentService, type Item, type ItemTemplate,
  useI18n } from '@tiko/core'

interface Props {
  selectedIds: string[]
  itemTemplateId?: string // Optional: pre-filter by template
  onSelect?: (itemIds: string[]) => void
}

interface ItemWithTemplate extends Item {
  templateName: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedIds: () => []
})

const emit = defineEmits<{
  select: [itemIds: string[]]
  close: []
}>()

const bemm = useBemm('item-selector')
const { t } = useI18n()

// State
const loading = ref(false)
const items = ref<ItemWithTemplate[]>([])
const templates = ref<ItemTemplate[]>([])
const selectedIds = ref<string[]>([...props.selectedIds])
const searchQuery = ref('')
const selectedTemplateId = ref(props.itemTemplateId || '')

// Computed
const templateOptions = computed(() => [
  { value: '', label: t('admin.content.field.allTemplates') },
  ...templates.value.map(template => ({
    value: template.id,
    label: template.name
  }))
])

const filteredItems = computed(() => {
  let filtered = items.value

  // Filter by template
  if (selectedTemplateId.value) {
    filtered = filtered.filter(item => item.item_template_id === selectedTemplateId.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.templateName.toLowerCase().includes(query)
    )
  }

  // Only show base items (not translations)
  filtered = filtered.filter(item => !item.base_item_id)

  return filtered
})

// Methods
async function loadData() {
  loading.value = true
  try {
    // Load templates
    templates.value = await contentService.getItemTemplates()

    // Load items (only base items)
    const baseItems = await contentService.getItems(undefined, null)

    // Enhance with template names
    items.value = await Promise.all(
      baseItems.map(async (item) => {
        const template = templates.value.find(t => t.id === item.item_template_id)
        return {
          ...item,
          templateName: template?.name || 'Unknown'
        }
      })
    )
  } catch (error) {
    console.error('Failed to load items:', error)
  } finally {
    loading.value = false
  }
}

function isSelected(itemId: string): boolean {
  return selectedIds.value.includes(itemId)
}

function toggleItem(itemId: string) {
  const index = selectedIds.value.indexOf(itemId)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(itemId)
  }
}

function confirmSelection() {
  if (props.onSelect) {
    props.onSelect([...selectedIds.value])
  } else {
    emit('select', [...selectedIds.value])
  }
  emit('close')
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style lang="scss">
.item-selector {
  display: flex;
  flex-direction: column;
  gap: var(--space);
  min-height: 400px;

  &__filters {
    display: flex;
    gap: var(--space);
  }

  &__loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__items {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    overflow-y: auto;
    max-height: 400px;
    padding: var(--space-xs);
  }

  &__item {
    display: flex;
    align-items: flex-start;
    gap: var(--space);
    padding: var(--space);
    background: var(--color-background);
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: var(--color-primary);
      background: var(--color-background-secondary);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      cursor: pointer;
    }

    &--selected {
      border-color: var(--color-primary);
      background: var(--color-primary-background);
      box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.2);
    }
  }

  &__item-checkbox {
    flex-shrink: 0;
    margin-top: var(--space-2xs);
  }

  &__item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    min-width: 0;
    pointer-events: none; // Ensure clicks go to parent
  }

  &__item-main {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
  }

  &__item-name {
    font-size: var(--font-size-md);
    font-weight: 500;
    color: var(--color-foreground);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__item-description {
    font-size: var(--font-size-sm);
    color: var(--color-foreground-secondary);
    margin: 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__item-meta {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    flex-wrap: wrap;
  }

  &__item-template {
    font-size: var(--font-size-sm);
    color: var(--color-foreground-secondary);
    background: var(--color-background-tertiary);
    padding: var(--space-2xs) var(--space-xs);
    border-radius: var(--radius-xs);
    font-weight: 500;
  }

  &__item-language {
    font-size: var(--font-size-sm);
    color: var(--color-foreground-secondary);
    background: var(--color-background-tertiary);
    padding: var(--space-2xs) var(--space-xs);
    border-radius: var(--radius-xs);
    text-transform: uppercase;
    font-weight: 500;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: var(--space);
    border-top: 1px solid var(--color-accent);
  }

  &__count {
    font-size: var(--font-size-sm);
    color: var(--color-foreground-secondary);
  }
}
</style>
