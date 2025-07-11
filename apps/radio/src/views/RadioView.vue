<template>
  <div :class="bemm()">
    <!-- Full-screen Player Mode -->
      <RadioPlayer
      v-if="playerMode === 'fullscreen'"
      :current-item="currentItem"
      :playlist="playlist"
      :current-index="currentIndex"
      :shuffle-mode="settings.shuffleMode"
      :repeat-mode="settings.repeatMode"
      :sleep-timer="sleepTimer"
      @update:current-time="handleTimeUpdate"
      @update:duration="handleDurationUpdate"
      @update:is-playing="handlePlayingUpdate"
      @update:volume="handleVolumeUpdate"
      @track-ended="handleTrackEnded"
      @previous-track="previousTrack"
      @next-track="nextTrack"
      @toggle-shuffle="toggleShuffle"
      @toggle-repeat="toggleRepeat"
      @back-to-grid="playerMode = 'grid'"
      @cancel-sleep-timer="cancelSleepTimer"
      @error="handlePlayerError"
    />

    <!-- Grid Mode -->
    <div v-else :class="bemm('grid-container')">
      <!-- Header -->
      <div :class="bemm('header')">
        <!-- Tag Filters -->
        <div :class="bemm('filters-section')">
          <div v-if="availableTags.length > 0" :class="bemm('tag-filters')">
            <TButton
              v-for="tag in availableTags"
              :key="tag"
              type="ghost"
              size="small"
              :color="selectedTags.includes(tag) ? 'primary' : 'secondary'"
              @click="toggleTagFilter(tag)"
              :class="bemm('tag-filter')"
            >
              {{ tag }}
            </TButton>

            <TButton
              v-if="selectedTags.length > 0"
              type="ghost"
              size="small"
              icon="x"
              @click="clearTagFilters"
              :class="bemm('clear-filters')"
            >
              Clear
            </TButton>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div :class="bemm('content')">
        <!-- Quick Filters -->
        <div v-if="items.length > 0" :class="bemm('quick-filters')">
          <TButton
            :type="activeFilter === 'all' ? 'default' : 'ghost'"
            size="small"
            @click="activeFilter = 'all'"
          >
            All ({{ items.length }})
          </TButton>

          <TButton
            :type="activeFilter === 'favorites' ? 'default' : 'ghost'"
            size="small"
            @click="activeFilter = 'favorites'"
          >
            Favorites ({{ favoriteItems.length }})
          </TButton>

          <TButton
            :type="activeFilter === 'recent' ? 'default' : 'ghost'"
            size="small"
            @click="activeFilter = 'recent'"
          >
            Recent ({{ recentItems.length }})
          </TButton>
        </div>

        <!-- Loading State -->
        <div v-if="loading" :class="bemm('loading')">
          <div :class="bemm('spinner')" />
          <p>Loading your audio collection...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" :class="bemm('error')">
          <TIcon name="alert-circle" :class="bemm('error-icon')" />
          <p :class="bemm('error-text')">{{ error }}</p>
          <TButton @click="fetchItems">Try Again</TButton>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredItems.length === 0 && items.length === 0" :class="bemm('empty')">
          <TIcon name="music" :class="bemm('empty-icon')" />
          <h3 :class="bemm('empty-title')">No audio tracks yet</h3>
          <p :class="bemm('empty-description')">
            Start building your audio collection by adding your first track
          </p>
          <TButton
            v-if="parentMode.canManageContent.value"
            color="primary"
            icon="plus"
            @click="handleAddClick"
          >
            Add Your First Audio
          </TButton>
        </div>

        <!-- No Search Results -->
        <div v-else-if="filteredItems.length === 0" :class="bemm('no-results')">
          <TIcon name="search" :class="bemm('no-results-icon')" />
          <h3 :class="bemm('no-results-title')">No results found</h3>
          <p :class="bemm('no-results-description')">
            Try adjusting your search or filters
          </p>
          <TButton @click="clearFilters">Clear All Filters</TButton>
        </div>

        <!-- Audio Grid -->
        <div v-else :class="bemm('grid')">
          <RadioCard
            v-for="item in filteredItems"
            :key="item.id"
            :item="item"
            :is-currently-playing="currentItem?.id === item.id && isPlaying"
            @play="playItem"
            @pause="pauseItem"
            @edit="editItem"
            @delete="deleteItem"
            @toggle-favorite="toggleFavorite"
            :class="bemm('grid-item')"
          />
        </div>
      </div>

      <!-- Mini Player -->
      <div v-if="currentItem && playerMode === 'grid'" :class="bemm('mini-player')">
        <div :class="bemm('mini-content')">
          <img
            :src="currentItem.customThumbnailUrl || currentItem.thumbnailUrl || '/assets/default-radio-thumbnail.svg'"
            :alt="currentItem.title"
            :class="bemm('mini-thumbnail')"
          />

          <div :class="bemm('mini-info')">
            <h4 :class="bemm('mini-title')">{{ currentItem.title }}</h4>
            <div :class="bemm('mini-progress')">
              <div
                :class="bemm('mini-progress-bar')"
                :style="{ width: progressPercentage + '%' }"
              />
            </div>
          </div>
        </div>

        <div :class="bemm('mini-controls')">
          <TButton
            type="ghost"
            size="medium"
            icon="skip-back"
            :disabled="!hasPrevious"
            @click="previousTrack"
          />

          <TButton
            type="default"
            color="primary"
            size="medium"
            :icon="isPlaying ? 'pause' : 'play'"
            @click="togglePlay"
          />

          <TButton
            type="ghost"
            size="medium"
            icon="skip-forward"
            :disabled="!hasNext"
            @click="nextTrack"
          />

          <TButton
            type="ghost"
            size="medium"
            icon="maximize-2"
            @click="playerMode = 'fullscreen'"
          />
        </div>
      </div>
    </div>

    <!-- Modals are now handled by popup service -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, inject } from 'vue'
import { useBemm } from 'bemm'
import {
  TButton,
  TInputText,
  TIcon,
  useParentMode,
  useEventBus,
  type PopupService,
  type ToastService
} from '@tiko/ui'
import RadioCard from '../components/RadioCard.vue'
import RadioPlayer from '../components/RadioPlayer.vue'
import AddItemModal from '../components/AddItemModal.vue'
import EditItemModal from '../components/EditItemModal.vue'
import RadioSettingsModal from '../components/RadioSettingsModal.vue'
import SearchResultsModal from '../components/SearchResultsModal.vue'
import { useRadioItems } from '../composables/useRadioItems'
import { useRadioPlayer } from '../composables/useRadioPlayer'
import { useRadioSettings } from '../composables/useRadioSettings'
import type { RadioItem } from '../types/radio.types'

const bemm = useBemm('radio-view')
const parentMode = useParentMode('radio')
const popupService = inject('popupService')!
const toastService = inject('toastService')!
const eventBus = useEventBus()

// Composables
const radioItems = useRadioItems()
const radioPlayer = useRadioPlayer()
const radioSettings = useRadioSettings()

// Destructure for cleaner template access
const {
  items,
  loading,
  error,
  favoriteItems,
  recentItems,
  fetchItems,
  addItem,
  updateItem,
  deleteItem: removeItem,
  toggleFavorite,
  searchItems,
  filterByTags,
  getAllTags
} = useRadioItems()

const {
  currentItem,
  currentIndex,
  isPlaying,
  currentTime,
  duration,
  playlist,
  playItem,
  pauseItem,
  togglePlay,
  nextTrack,
  previousTrack,
  setPlaylist,
  updateCurrentTime,
  updateDuration,
  updatePlayingState,
  updateVolume
} = useRadioPlayer()

const {
  settings,
  sleepTimer,
  updateSettings,
  toggleShuffle,
  toggleRepeat,
  cancelSleepTimer,
  loadSettings
} = useRadioSettings()

// Local state
const playerMode = ref<'grid' | 'fullscreen'>('grid')
const searchQuery = ref('')
const selectedTags = ref<string[]>([])
const activeFilter = ref<'all' | 'favorites' | 'recent'>('all')

// Computed properties (canManageContent moved to temporary section below)

const availableTags = computed(() => getAllTags())

const filteredItems = computed(() => {
  let filtered = items.value

  // Apply active filter
  switch (activeFilter.value) {
    case 'favorites':
      filtered = favoriteItems.value
      break
    case 'recent':
      filtered = recentItems.value
      break
    default:
      // 'all' - no additional filtering
      break
  }

  // Apply tag filters (keep tag filtering for the main view)
  if (selectedTags.value.length > 0) {
    filtered = filterByTags(selectedTags.value)
  }

  return filtered
})

const progressPercentage = computed(() =>
  duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
)

const hasPrevious = computed(() =>
  currentIndex.value > 0 || settings.value.repeatMode === 'all'
)

const hasNext = computed(() =>
  currentIndex.value < playlist.value.length - 1 || settings.value.repeatMode === 'all'
)

// Methods
const toggleTagFilter = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

const clearTagFilters = () => {
  selectedTags.value = []
}

const clearFilters = () => {
  selectedTags.value = []
  activeFilter.value = 'all'
}

const editItem = (item: RadioItem) => {
  console.log('Edit item clicked - opening EditItemModal for:', item.title)
  popupService.showPopup({
    component: EditItemModal,
    title: 'Edit Audio Item',
    props: {
      item: item,
      onSubmit: (itemId: string, updates: Partial<RadioItem>) => handleEditItem(itemId, updates)
    }
  })
}

const deleteItem = async (item: RadioItem) => {
  if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
    await removeItem(item.id)
  }
}

const handleAddItem = async (itemData: Partial<RadioItem>) => {
  const newItem = await addItem(itemData)
  if (newItem) {
    popupService.closePopup()
  }
}

const handleEditItem = async (itemId: string, updates: Partial<RadioItem>) => {
  const success = await updateItem(itemId, updates)
  if (success) {
    popupService.closePopup()
  }
}

const handleSettingsUpdate = async (newSettings: typeof settings.value) => {
  await updateSettings(newSettings)
  popupService.closePopup()
}

// Player event handlers
const handleTimeUpdate = (time: number) => updateCurrentTime(time)
const handleDurationUpdate = (dur: number) => updateDuration(dur)
const handlePlayingUpdate = (playing: boolean) => updatePlayingState(playing)
const handleVolumeUpdate = (vol: number) => updateVolume(vol)

const handleTrackEnded = () => {
  if (settings.value.autoplayNext) {
    nextTrack()
  }
}

const handlePlayerError = (errorMessage: string) => {
  console.error('Player error:', errorMessage)
}


// Modal handlers using popup service
const handleAddClick = () => {
  console.log('Add button clicked - opening AddItemModal')
  popupService.showPopup({
    component: AddItemModal,
    props: {
      onSubmit: handleAddItem
    }
  })
}

const handleSettingsClick = () => {
  console.log('Settings button clicked - opening RadioSettingsModal')
  popupService.showPopup({
    component: RadioSettingsModal,
    props: {
      settings: settings.value,
      onUpdate: handleSettingsUpdate
    }
  })
}

// Search handlers
const handleSearch = (query: string) => {
  searchQuery.value = query
  if (query.trim().length >= 3) {
    openSearchModal()
  }
}

const openSearchModal = () => {
  console.log('Opening search modal with query:', searchQuery.value)
  popupService.showPopup({
    component: SearchResultsModal,
    props: {
      searchQuery: searchQuery.value,
      allItems: items.value,
      currentPlayingId: currentItem.value?.id,
      isPlaying: isPlaying.value,
      canManageContent: parentMode.canManageContent.value,
      onPlayItem: playItem,
      onPauseItem: pauseItem,
      onEditItem: editItem,
      onPlayAll: (searchResults: RadioItem[]) => {
        // Play all search results as a playlist
        if (searchResults.length > 0) {
          const searchResultIds = searchResults.map(item => item.id)
          setPlaylist(searchResultIds)
          playItem(searchResults[0])
        }
      }
    }
  })
}


// Watch for filtered items changes to update playlist
watch(filteredItems, (newItems) => {
  setPlaylist(newItems.map(item => item.id))
}, { immediate: true })

// Listen to events from App.vue topbar
onMounted(async () => {
  console.log('Radio app mounting...')
  
  // Set up event listeners
  eventBus.on('radio:search', (data: { query: string }) => {
    searchQuery.value = data.query
    if (data.query.trim().length >= 3) {
      openSearchModal()
    }
  })
  
  eventBus.on('radio:add-item', () => {
    handleAddClick()
  })
  
  eventBus.on('radio:show-settings', () => {
    handleSettingsClick()
  })
  
  try {
    console.log('Fetching radio items...')
    await fetchItems()
    console.log('Loading radio settings...')
    await loadSettings()
    console.log('Radio app initialization complete')
  } catch (error) {
    console.error('Error during Radio app initialization:', error)
  }
})
</script>

<style lang="scss" scoped>
.radio-view {


  &__grid-container {
    display: flex;
    flex-direction: column;
  }

  &__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 1.5em);
    padding: var(--space-xl, 2em);
    border-bottom: 1px solid color-mix(in srgb, var(--color-foreground), transparent 90%);
  }

  &__title {
    font-size: 2em;
    font-weight: 700;
    color: var(--color-foreground);
    margin: 0;
  }

  &__search-input {
    max-width: 25em;
  }

  &__filters-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-md, 1em);
  }

  &__tag-filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-s, 0.75em);
    align-items: center;
  }

  &__actions {
    display: flex;
    gap: var(--space-md, 1em);
    align-items: center;
    flex-wrap: wrap;
  }

  &__content {
    flex: 1;
    padding: var(--space-xl, 2em);
  }

  &__quick-filters {
    display: flex;
    gap: var(--space-s, 0.75em);
    margin-bottom: var(--space-xl, 2em);
    flex-wrap: wrap;
  }

  &__loading,
  &__error,
  &__empty,
  &__no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--space-xxl, 4em);
    gap: var(--space-lg, 1.5em);
  }

  &__spinner {
    width: 3em;
    height: 3em;
    border: 0.25em solid color-mix(in srgb, var(--color-foreground), transparent 85%);
    border-left-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  &__error-icon,
  &__empty-icon,
  &__no-results-icon {
    font-size: 3em;
    color: color-mix(in srgb, var(--color-foreground), transparent 60%);
  }

  &__empty-title,
  &__no-results-title {
    font-size: 1.5em;
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0;
  }

  &__empty-description,
  &__no-results-description {
    color: color-mix(in srgb, var(--color-foreground), transparent 30%);
    max-width: 30em;
    line-height: 1.5;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(18em, 1fr));
    gap: var(--space-lg, 1.5em);
  }

  &__mini-player {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--color-background);
    border-top: 1px solid color-mix(in srgb, var(--color-foreground), transparent 85%);
    padding: var(--space-md, 1em);
    display: flex;
    align-items: center;
    gap: var(--space-lg, 1.5em);
    z-index: 100;
    box-shadow: 0 -4px 12px color-mix(in srgb, var(--color-foreground), transparent 90%);
  }

  &__mini-content {
    display: flex;
    align-items: center;
    gap: var(--space-md, 1em);
    flex: 1;
    min-width: 0;
  }

  &__mini-thumbnail {
    width: 3em;
    height: 3em;
    border-radius: var(--radius-sm, 0.25em);
    object-fit: cover;
    flex-shrink: 0;
  }

  &__mini-info {
    flex: 1;
    min-width: 0;
  }

  &__mini-title {
    font-size: 0.875em;
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0 0 var(--space-xs, 0.25em) 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__mini-progress {
    height: 0.25em;
    background: color-mix(in srgb, var(--color-foreground), transparent 90%);
    border-radius: var(--radius-sm, 0.25em);
    overflow: hidden;
  }

  &__mini-progress-bar {
    height: 100%;
    background: var(--color-primary);
    transition: width 0.1s ease;
  }

  &__mini-controls {
    display: flex;
    align-items: center;
    gap: var(--space-s, 0.75em);
  }
}

// Responsive design
@media (max-width: 768px) {
  .radio-view {
    &__header {
      padding: var(--space-lg, 1.5em);
    }

    &__content {
      padding: var(--space-lg, 1.5em);
    }

    &__grid {
      grid-template-columns: repeat(auto-fill, minmax(15em, 1fr));
      gap: var(--space-md, 1em);
    }

    &__actions {
      flex-direction: column;
      align-items: stretch;
    }
  }
}

@media (max-width: 480px) {
  .radio-view {
    &__header {
      padding: var(--space-md, 1em);
    }

    &__content {
      padding: var(--space-md, 1em);
    }

    &__grid {
      grid-template-columns: 1fr;
    }

    &__mini-player {
      padding: var(--space-s, 0.75em);
    }

    &__mini-controls {
      gap: var(--space-xs, 0.5em);
    }
  }
}

// Spin animation for the loading spinner
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
