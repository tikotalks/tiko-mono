<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h3 :class="bemm('title')">{{ t('sequence.selectFromPublic') }}</h3>
      <TButton
        v-if="showSearch"
        :icon="Icons.SEARCH"
        type="ghost"
        size="small"
        @click="toggleSearch"
      />
    </div>

    <div v-if="isSearching" :class="bemm('search')">
      <TInput v-model="searchQuery" :placeholder="t('common.search')" @input="debouncedSearch" />
    </div>

    <div :class="bemm('tabs')">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="bemm('tab', activeTab === tab.id ? 'active' : '')"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div :class="bemm('content')">
      <div v-if="isLoading" :class="bemm('loading')">
        <TIcon name="spinner" size="large" />
      </div>

      <div v-else-if="filteredSequences.length === 0" :class="bemm('empty')">
        <p>{{ t('sequence.noPublicSequences') }}</p>
      </div>

      <div v-else :class="bemm('grid')">
        <div
          v-for="sequence in filteredSequences"
          :key="sequence.id"
          :class="bemm('item', selectedId === sequence.id ? 'selected' : '')"
          @click="selectSequence(sequence)"
        >
          <TCardTile :card="sequence" :show-image="true" :show-title="true" :edit-mode="false" />
          <div v-if="sequence.ownerId !== currentUserId" :class="bemm('owner-badge')">
            <TIcon name="users" size="small" />
            {{ sequence.isCurated ? t('sequence.curated') : t('sequence.public') }}
          </div>
        </div>
      </div>
    </div>

    <div :class="bemm('footer')">
      <TButton type="ghost" @click="$emit('cancel')">
        {{ t('common.cancel') }}
      </TButton>
      <TButton type="primary" :disabled="!selectedId" @click="confirmSelection">
        {{ t('common.select') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useBemm } from 'bemm'
  import { useI18n } from '@tiko/core'
  import { TButton, TInput, TIcon, TCardTile } from '@tiko/ui'
  import { useAuthStore } from '@tiko/core'
  import { Icons } from 'open-icon'
  import { sequenceService } from '../services/sequence.service'
  import { useSequenceStore } from '../stores/sequence'
  import { debounce } from 'lodash-es'
  import type { TCardTile as CardTileType } from '@tiko/ui'

  const bemm = useBemm('public-sequence-selector')
  const { t } = useI18n()
  const authStore = useAuthStore()
  const sequenceStore = useSequenceStore()

  const props = defineProps<{
    excludeIds?: string[]
  }>()

  const emit = defineEmits<{
    select: [sequence: CardTileType]
    cancel: []
  }>()

  const currentUserId = computed(() => authStore.user?.id)
  const isLoading = ref(false)
  const items = ref<CardTileType[]>([])
  const searchQuery = ref('')
  const isSearching = ref(false)
  const selectedId = ref<string | null>(null)
  const activeTab = ref<'curated' | 'public' | 'mine'>(
    sequenceStore.settings.showCuratedItems ? 'curated' : 'public'
  )

  const tabs = computed(() => {
    const allTabs = [
      { id: 'curated' as const, label: t('common.curated') },
      { id: 'public' as const, label: t('common.publicItems') },
      {
        id: 'mine' as const,
        label: props.itemType === 'sequence' ? t('sequence.mySequences') : t('cards.myCards'),
      },
    ]

    // Filter out curated tab if showCuratedItems is false
    if (!sequenceStore.settings.showCuratedItems) {
      return allTabs.filter(tab => tab.id !== 'curated')
    }

    return allTabs
  })

  const showSearch = computed(() => items.value.length > 5)

  const filteredItems = computed(() => {
    let filtered = items.value

    // Filter by tab
    switch (activeTab.value) {
      case 'curated':
        filtered = filtered.filter(s => s.isCurated)
        break
      case 'public':
        filtered = filtered.filter(
          s => s.isPublic && !s.isCurated && s.ownerId !== currentUserId.value
        )
        break
      case 'mine':
        filtered = filtered.filter(s => s.ownerId === currentUserId.value)
        break
    }

    // Exclude specified IDs
    if (props.excludeIds?.length) {
      filtered = filtered.filter(s => !props.excludeIds!.includes(s.id))
    }

    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(s => s.title.toLowerCase().includes(query))
    }

    return filtered
  })

  const toggleSearch = () => {
    isSearching.value = !isSearching.value
    if (!isSearching.value) {
      searchQuery.value = ''
    }
  }

  const selectItem = (item: CardTileType) => {
    selectedId.value = item.id
  }

  const confirmSelection = () => {
    const selected = items.value.find(s => s.id === selectedId.value)
    if (selected) {
      emit('select', selected)
    }
  }

  const loadItems = async () => {
    isLoading.value = true
    try {
      const includeCurated = sequenceStore.settings.showCuratedItems
      items.value = await sequenceService.loadPublicItems(props.itemType, includeCurated)
    } catch (error) {
      console.error('Failed to load public items:', error)
    } finally {
      isLoading.value = false
    }
  }

  const searchItems = async (query: string) => {
    if (!query) {
      await loadItems()
      return
    }

    isLoading.value = true
    try {
      const includeCurated = sequenceStore.settings.showCuratedItems
      items.value = await sequenceService.searchPublicItems(
        query,
        props.itemType,
        undefined,
        includeCurated
      )
    } catch (error) {
      console.error('Failed to search items:', error)
    } finally {
      isLoading.value = false
    }
  }

  const debouncedSearch = debounce((value: string) => {
    searchItems(value)
  }, 300)

  onMounted(() => {
    loadItems()
  })
</script>

<style lang="scss">
  .public-item-selector {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 600px;

    &__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space);
      border-bottom: 1px solid var(--color-accent);
    }

    &__title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
    }

    &__search {
      padding: var(--space);
      border-bottom: 1px solid var(--color-accent);
    }

    &__tabs {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--color-accent);
    }

    &__tab {
      flex: 1;
      padding: var(--space-s) var(--space);
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      color: var(--color-text-secondary);
      font-weight: 500;

      &:hover {
        color: var(--color-text);
      }

      &--active {
        color: var(--color-primary);
        border-bottom-color: var(--color-primary);
      }
    }

    &__content {
      flex: 1;
      overflow-y: auto;
      padding: var(--space);
    }

    &__loading,
    &__empty {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      color: var(--color-text-secondary);
    }

    &__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: var(--space);
    }

    &__item {
      position: relative;
      cursor: pointer;
      border: 2px solid transparent;
      border-radius: var(--border-radius);
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--color-primary-light);
      }

      &--selected {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.2);
      }
    }

    &__badges {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    &__badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: var(--border-radius-s);
      font-size: 0.75rem;
      font-weight: 500;

      &--curated {
        background: rgba(255, 215, 0, 0.9); // Gold for curated
        color: #333;
      }

      &--public {
        background: rgba(0, 0, 0, 0.7);
        color: white;
      }
    }

    &__footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-s);
      padding: var(--space);
      border-top: 1px solid var(--color-accent);
    }
  }
</style>
