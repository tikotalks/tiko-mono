<template>
  <div :class="bemm()">
    <h2 :class="bemm('title')">{{ t('radio.searchAudio') }}</h2>

    <!-- Search Input -->
    <div :class="bemm('search-header')">
      <TInputText
        ref="searchInput"
        v-model="localSearchQuery"
        :label="t('common.search')"
        :placeholder="t('radio.searchAudioPlaceholder')"
        icon="search"
        :class="bemm('search-input')"
        @input="handleSearchInput"
      />
    </div>

    <div v-if="localSearchQuery.trim()" :class="bemm('search-info')">
      <p :class="bemm('query')">
        {{ t('radio.searchingFor') }}: <strong>"{{ localSearchQuery }}"</strong>
      </p>
      <p :class="bemm('count')">
        {{ t('radio.resultsFound', { count: results.length }) }}
      </p>
    </div>

    <div :class="bemm('content')">
      <!-- Loading State -->
      <div v-if="loading" :class="bemm('loading')">
        <div :class="bemm('spinner')" />
        <p>{{ t('radio.searchingCollection') }}</p>
      </div>

      <!-- No Results -->
      <div v-else-if="results.length === 0" :class="bemm('no-results')">
        <TIcon name="search" :class="bemm('no-results-icon')" />
        <h3 :class="bemm('no-results-title')">{{ t('radio.noResultsFound') }}</h3>
        <p :class="bemm('no-results-description')">
          {{ t('radio.tryDifferentKeywords') }}
        </p>
      </div>

      <!-- Results List -->
      <div v-else :class="bemm('results')">
        <div
          v-for="item in results"
          :key="item.id"
          :class="bemm('result-item')"
          @click="selectItem(item)"
        >
          <img
            :src="item.customThumbnailUrl || item.thumbnailUrl || '/assets/default-radio-thumbnail.svg'"
            :alt="item.title"
            :class="bemm('result-thumbnail')"
            @error="handleThumbnailError"
          />

          <div :class="bemm('result-info')">
            <h4 :class="bemm('result-title')">{{ item.title }}</h4>
            <p v-if="item.description" :class="bemm('result-description')">
              {{ item.description }}
            </p>

            <div :class="bemm('result-meta')">
              <div v-if="item.tags.length > 0" :class="bemm('result-tags')">
                <span
                  v-for="tag in item.tags.slice(0, 3)"
                  :key="tag"
                  :class="bemm('result-tag')"
                >
                  {{ tag }}
                </span>
                <span v-if="item.tags.length > 3" :class="bemm('result-tag-more')">
                  +{{ item.tags.length - 3 }} {{ t('common.more') }}
                </span>
              </div>

              <div :class="bemm('result-stats')">
                <span v-if="item.durationSeconds" :class="bemm('result-duration')">
                  {{ formatDuration(item.durationSeconds) }}
                </span>
                <span v-if="item.playCount > 0" :class="bemm('result-plays')">
                  {{ item.playCount }} {{ item.playCount === 1 ? t('radio.play') : t('radio.plays') }}
                </span>
                <TIcon
                  v-if="item.isFavorite"
                  name="heart"
                  :class="bemm('result-favorite')"
                />
              </div>
            </div>
          </div>

          <div :class="bemm('result-actions')">
            <TButton
              type="ghost"
              size="small"
              :icon="currentPlayingId === item.id && isPlaying ? 'pause' : 'play'"
              @click.stop="togglePlay(item)"
              :class="bemm('play-button')"
            />

            <TButton
              v-if="canManageContent"
              type="ghost"
              size="small"
              icon="edit"
              @click.stop="editItem(item)"
              :class="bemm('edit-button')"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div :class="bemm('actions')">
      <TButton
        type="ghost"
        @click="emit('close')"
      >
        {{ t('common.close') }}
      </TButton>

      <TButton
        v-if="results.length > 0"
        color="primary"
        @click="playAll"
      >
        {{ t('radio.playAllResults') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useBemm } from 'bemm'
import { TButton, TIcon, TInputText } from '@tiko/ui'
import type { RadioItem } from '../types/radio.types'
import { useI18n } from '@tiko/core';

interface Props {
  searchQuery?: string
  allItems: RadioItem[]
  currentPlayingId?: string | null
  isPlaying?: boolean
  canManageContent?: boolean
  onPlayItem?: (item: RadioItem) => void
  onPauseItem?: (item: RadioItem) => void
  onEditItem?: (item: RadioItem) => void
  onPlayAll?: (items: RadioItem[]) => void
}

const props = withDefaults(defineProps<Props>(), {
  searchQuery: '',
  currentPlayingId: null,
  isPlaying: false,
  canManageContent: false
})

const emit = defineEmits<{
  close: []
  selectItem: [item: RadioItem]
}>()

const bemm = useBemm('search-results-modal')
const { t, keys } = useI18n()

// Refs
const searchInput = ref<InstanceType<typeof TInputText> | null>(null)

// Local state
const loading = ref(false)
const results = ref<RadioItem[]>([])
const localSearchQuery = ref(props.searchQuery || '')
let searchTimeout: NodeJS.Timeout | null = null

// Format duration utility
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// Handle thumbnail errors
const handleThumbnailError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = '/assets/default-radio-thumbnail.svg'
}

// Search function
const performSearch = async (query: string = localSearchQuery.value) => {
  if (!query.trim()) {
    results.value = []
    loading.value = false
    return
  }

  loading.value = true

  try {
    // Simulate async search with slight delay for UX
    await new Promise(resolve => setTimeout(resolve, 200))

    const searchQuery = query.toLowerCase()
    const searchResults = props.allItems.filter(item => {
      return (
        item.title.toLowerCase().includes(searchQuery) ||
        (item.description && item.description.toLowerCase().includes(searchQuery)) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery))
      )
    })

    results.value = searchResults
  } catch (error) {
    console.error('Search error:', error)
    results.value = []
  } finally {
    loading.value = false
  }
}

// Handle search input with debouncing
const handleSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    performSearch()
  }, 300)
}

// Actions
const selectItem = (item: RadioItem) => {
  emit('selectItem', item)
  emit('close')
}

const togglePlay = (item: RadioItem) => {
  if (props.currentPlayingId === item.id && props.isPlaying) {
    if (props.onPauseItem) {
      props.onPauseItem(item)
    }
  } else {
    if (props.onPlayItem) {
      props.onPlayItem(item)
    }
  }
}

const editItem = (item: RadioItem) => {
  if (props.onEditItem) {
    props.onEditItem(item)
  }
}

const playAll = () => {
  if (props.onPlayAll && results.value.length > 0) {
    props.onPlayAll(results.value)
  }
  emit('close')
}

// Initialize search on mount and auto-focus
onMounted(async () => {
  // Auto-focus the search input
  await nextTick()
  if (searchInput.value) {
    // Focus the actual input element inside TInputText
    const inputElement = searchInput.value.$el?.querySelector('input')
    if (inputElement) {
      inputElement.focus()
    }
  }

  // Perform initial search if query was provided
  if (localSearchQuery.value.trim()) {
    performSearch()
  }
})
</script>

<style lang="scss" scoped>
.search-results-modal {
  width: 100%;
  max-width: 700px;
  padding: var(--space-lg, 1.5em);
  max-height: 80vh;
  display: flex;
  flex-direction: column;

  &__title {
    font-size: 1.5em;
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0 0 var(--space-lg, 1.5em) 0;
    text-align: center;
  }

  &__search-header {
    margin-bottom: var(--space-lg, 1.5em);
  }

  &__search-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md, 1em);
    background: color-mix(in srgb, var(--color-primary), transparent 95%);
    border-radius: var(--border-radius, 0.75em);
    margin-bottom: var(--space-lg, 1.5em);
    gap: var(--space-md, 1em);
  }

  &__query {
    margin: 0;
    font-size: 0.9em;
    color: var(--color-foreground);
    flex: 1;
  }

  &__count {
    margin: 0;
    font-size: 0.8em;
    color: color-mix(in srgb, var(--color-foreground), transparent 30%);
    font-weight: 500;
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    margin-bottom: var(--space-lg, 1.5em);
  }

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-xxl, 4em);
    gap: var(--space-lg, 1.5em);
  }

  &__spinner {
    width: 2em;
    height: 2em;
    border: 0.2em solid color-mix(in srgb, var(--color-foreground), transparent 85%);
    border-left-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  &__no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-xxl, 4em);
    gap: var(--space-lg, 1.5em);
    text-align: center;
  }

  &__no-results-icon {
    font-size: 3em;
    color: color-mix(in srgb, var(--color-foreground), transparent 60%);
  }

  &__no-results-title {
    font-size: 1.2em;
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0;
  }

  &__no-results-description {
    color: color-mix(in srgb, var(--color-foreground), transparent 30%);
    max-width: 30em;
    line-height: 1.5;
    margin: 0;
  }

  &__results {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm, 0.5em);
  }

  &__result-item {
    display: flex;
    align-items: center;
    gap: var(--space-md, 1em);
    padding: var(--space-md, 1em);
    background: var(--color-background);
    border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 90%);
    border-radius: var(--border-radius, 0.75em);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: color-mix(in srgb, var(--color-primary), transparent 95%);
      border-color: color-mix(in srgb, var(--color-primary), transparent 70%);
      transform: translateY(-1px);
    }
  }

  &__result-thumbnail {
    width: 4em;
    height: 4em;
    object-fit: cover;
    border-radius: var(--radius-sm, 0.25em);
    flex-shrink: 0;
  }

  &__result-info {
    flex: 1;
    min-width: 0;
  }

  &__result-title {
    font-size: 1em;
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0 0 var(--space-xs, 0.25em) 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__result-description {
    font-size: 0.8em;
    color: color-mix(in srgb, var(--color-foreground), transparent 30%);
    line-height: 1.3;
    margin: 0 0 var(--space-xs, 0.25em) 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__result-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-sm, 0.5em);
  }

  &__result-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs, 0.25em);
    flex: 1;
  }

  &__result-tag {
    font-size: 0.7em;
    background: color-mix(in srgb, var(--color-secondary), transparent 90%);
    color: color-mix(in srgb, var(--color-secondary), var(--color-foreground) 20%);
    padding: 0.2em 0.4em;
    border-radius: var(--radius-xs, 0.125em);
    font-weight: 500;
  }

  &__result-tag-more {
    font-size: 0.7em;
    color: color-mix(in srgb, var(--color-foreground), transparent 50%);
    font-style: italic;
  }

  &__result-stats {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 0.5em);
    font-size: 0.7em;
    color: color-mix(in srgb, var(--color-foreground), transparent 40%);
  }

  &__result-duration,
  &__result-plays {
    white-space: nowrap;
  }

  &__result-favorite {
    color: var(--color-error);
    font-size: 0.9em;
  }

  &__result-actions {
    display: flex;
    gap: var(--space-xs, 0.25em);
    flex-shrink: 0;
  }

  &__play-button,
  &__edit-button {
    min-width: 2.5em;
    min-height: 2.5em;
  }

  &__actions {
    display: flex;
    gap: var(--space-md, 1em);
    justify-content: flex-end;
    padding-top: var(--space-lg, 1.5em);
    border-top: 1px solid color-mix(in srgb, var(--color-foreground), transparent 90%);
  }
}

// Responsive design
@media (max-width: 768px) {
  .search-results-modal {
    max-width: 100%;
    max-height: 90vh;

    &__search-info {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-xs, 0.25em);
    }

    &__result-item {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-sm, 0.5em);
    }

    &__result-thumbnail {
      width: 100%;
      height: 8em;
      align-self: center;
    }

    &__result-meta {
      width: 100%;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-xs, 0.25em);
    }

    &__result-actions {
      align-self: flex-end;
    }

    &__actions {
      flex-direction: column-reverse;
    }
  }
}

// Spin animation
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
