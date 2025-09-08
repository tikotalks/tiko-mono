<template>
  <div :class="bemm()" @click="handleCardClick">
    <!-- Thumbnail Container -->
    <div :class="bemm('thumbnail')">
      <img
        :src="displayThumbnail"
        :alt="item.title"
        :class="bemm('thumbnail-image')"
        @error="handleImageError"
      />

      <!-- Play Overlay -->
      <div :class="bemm('play-overlay')">
        <div :class="bemm('play-button')">
          <TIcon :name="isCurrentlyPlaying ? 'pause' : 'play'" :class="bemm('play-icon')" />
        </div>
      </div>

      <!-- Duration Badge -->
      <div v-if="item.durationSeconds" :class="bemm('duration')">
        {{ formatDuration(item.durationSeconds) }}
      </div>

      <!-- Favorite Badge -->
      <TButton
        v-if="item.isFavorite"
        type="ghost"
        size="small"
        icon="heart"
        color="error"
        :class="bemm('favorite')"
        @click.stop="toggleFavorite"
      />
    </div>

    <!-- Content -->
    <div :class="bemm('content')">
      <h3 :class="bemm('title')">{{ item.title }}</h3>

      <p v-if="item.description && showDescription" :class="bemm('description')">
        {{ truncatedDescription }}
      </p>

      <!-- Tags -->
      <div v-if="item.tags.length > 0" :class="bemm('tags')">
        <span v-for="tag in visibleTags" :key="tag" :class="bemm('tag')">
          {{ tag }}
        </span>
        <span v-if="item.tags.length > maxVisibleTags" :class="bemm('tag-more')">
          +{{ item.tags.length - maxVisibleTags }}
        </span>
      </div>

      <!-- Metadata -->
      <div :class="bemm('meta')">
        <span :class="bemm('play-count')">
          <TIcon name="headphones" :class="bemm('meta-icon')" />
          {{ formatPlayCount(item.playCount) }}
        </span>

        <span v-if="item.lastPlayedAt" :class="bemm('last-played')">
          <TIcon name="clock" :class="bemm('meta-icon')" />
          {{ formatLastPlayed(item.lastPlayedAt) }}
        </span>
      </div>

      <!-- Parent Mode Actions -->
      <div v-if="canManageContent" :class="bemm('admin-actions')">
        <TButton
          type="ghost"
          size="small"
          icon="edit"
          :class="bemm('admin-button')"
          @click.stop="editItem"
        >
          {{ t('common.edit') }}
        </TButton>

        <TButton
          type="ghost"
          size="small"
          icon="trash-2"
          color="error"
          :class="bemm('admin-button')"
          @click.stop="deleteItem"
        >
          {{ t('common.delete') }}
        </TButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useBemm } from 'bemm'
  import { TButton, TIcon, useParentMode } from '@tiko/ui'
  import { formatDuration } from '@tiko/ui'
  import { useI18n } from '@tiko/core'
  import type { RadioItem } from '../types/radio.types'

  interface Props {
    item: RadioItem
    isCurrentlyPlaying?: boolean
    showDescription?: boolean
    maxDescriptionLength?: number
    maxVisibleTags?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    isCurrentlyPlaying: false,
    showDescription: true,
    maxDescriptionLength: 100,
    maxVisibleTags: 3,
  })

  const emit = defineEmits<{
    play: [item: RadioItem]
    pause: []
    edit: [item: RadioItem]
    delete: [item: RadioItem]
    'toggle-favorite': [item: RadioItem]
  }>()

  const bemm = useBemm('radio-card')
  const parentMode = useParentMode('radio')
  const { t, keys } = useI18n()

  // Computed properties
  const canManageContent = computed(() => parentMode.hasPermission('radio', 'canManageItems'))

  const displayThumbnail = computed(
    () =>
      props.item.customThumbnailUrl ||
      props.item.thumbnailUrl ||
      '/assets/default-radio-thumbnail.svg'
  )

  const truncatedDescription = computed(() => {
    if (!props.item.description) return ''

    if (props.item.description.length <= props.maxDescriptionLength) {
      return props.item.description
    }

    return props.item.description.slice(0, props.maxDescriptionLength) + '...'
  })

  const visibleTags = computed(() => props.item.tags.slice(0, props.maxVisibleTags))

  /**
   * Handle card click to play/pause audio
   */
  const handleCardClick = () => {
    if (props.isCurrentlyPlaying) {
      emit('pause')
    } else {
      emit('play', props.item)
    }
  }

  /**
   * Handle image load error
   */
  const handleImageError = (event: Event) => {
    const target = event.target as HTMLImageElement
    target.src = '/assets/default-radio-thumbnail.svg'
  }

  /**
   * Toggle favorite status
   */
  const toggleFavorite = () => {
    emit('toggle-favorite', props.item)
  }

  /**
   * Edit item (parent mode only)
   */
  const editItem = () => {
    if (canManageContent.value) {
      emit('edit', props.item)
    }
  }

  /**
   * Delete item (parent mode only)
   */
  const deleteItem = () => {
    if (canManageContent.value) {
      emit('delete', props.item)
    }
  }

  /**
   * Format play count for display
   */
  const formatPlayCount = (count: number): string => {
    if (count === 0) return t('radio.neverPlayed')
    if (count === 1) return t('radio.onePlay')
    if (count < 1000) return `${count} ${t('radio.plays')}`
    if (count < 1000000) return `${Math.floor(count / 100) / 10}K ${t('radio.plays')}`
    return `${Math.floor(count / 100000) / 10}M ${t('radio.plays')}`
  }

  /**
   * Format last played date as relative time
   */
  const formatLastPlayed = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return t('common.justNow')
    if (diffMins < 60) return t('common.minutesAgo', { count: diffMins })
    if (diffHours < 24) return t('common.hoursAgo', { count: diffHours })
    if (diffDays < 7) return t('common.daysAgo', { count: diffDays })

    // For older dates, just show the date
    return date.toLocaleDateString()
  }
</script>

<style lang="scss">
  .radio-card {
    display: flex;
    flex-direction: column;
    background: var(--color-background);
    border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 85%);
    border-radius: var(--border-radius, 0.75em);
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px color-mix(in srgb, var(--color-foreground), transparent 90%);

    &:hover {
      border-color: color-mix(in srgb, var(--color-primary), transparent 60%);
      box-shadow: 0 4px 12px color-mix(in srgb, var(--color-foreground), transparent 85%);
      transform: translateY(-2px);

      .radio-card__play-overlay {
        opacity: 1;
      }
    }

    &:active {
      transform: translateY(0);
    }

    &__thumbnail {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      background: color-mix(in srgb, var(--color-foreground), transparent 95%);
    }

    &__thumbnail-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      transition: transform 0.2s ease;

      .radio-card:hover & {
        transform: scale(1.05);
      }
    }

    &__play-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in srgb, var(--color-foreground), transparent 40%);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    &__play-button {
      width: 3em;
      height: 3em;
      border-radius: 50%;
      background: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &:hover {
        transform: scale(1.1);
        background: color-mix(in srgb, var(--color-primary), var(--color-background) 10%);
      }
    }

    &__play-icon {
      color: var(--color-background);
      font-size: 1.25em;
    }

    &__duration {
      position: absolute;
      bottom: var(--space-xs, 0.5em);
      right: var(--space-xs, 0.5em);
      background: color-mix(in srgb, var(--color-foreground), transparent 10%);
      color: var(--color-background);
      padding: var(--space-xs, 0.25em) var(--space-s, 0.5em);
      border-radius: var(--border-radius, 0.25em);
      font-size: 0.75em;
      font-weight: 600;
    }

    &__favorite {
      position: absolute;
      top: var(--space-xs, 0.5em);
      right: var(--space-xs, 0.5em);
    }

    &__content {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs, 0.5em);
      padding: var(--space-md, 1em);
    }

    &__title {
      font-size: 1em;
      font-weight: 600;
      color: var(--color-foreground);
      margin: 0;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }

    &__description {
      font-size: 0.875em;
      color: color-mix(in srgb, var(--color-foreground), transparent 30%);
      line-height: 1.4;
      margin: 0;
    }

    &__tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-xs, 0.25em);
    }

    &__tag {
      background: color-mix(in srgb, var(--color-primary), transparent 90%);
      color: color-mix(in srgb, var(--color-primary), var(--color-foreground) 20%);
      padding: var(--space-xs, 0.25em) var(--space-s, 0.5em);
      border-radius: var(--border-radius, 0.25em);
      font-size: 0.75em;
      font-weight: 500;
    }

    &__tag-more {
      background: color-mix(in srgb, var(--color-foreground), transparent 90%);
      color: color-mix(in srgb, var(--color-foreground), transparent 20%);
      padding: var(--space-xs, 0.25em) var(--space-s, 0.5em);
      border-radius: var(--border-radius, 0.25em);
      font-size: 0.75em;
      font-weight: 500;
    }

    &__meta {
      display: flex;
      gap: var(--space-md, 1em);
      font-size: 0.75em;
      color: color-mix(in srgb, var(--color-foreground), transparent 40%);
    }

    &__play-count,
    &__last-played {
      display: flex;
      align-items: center;
      gap: var(--space-xs, 0.25em);
    }

    &__meta-icon {
      font-size: 1em;
    }

    &__admin-actions {
      display: flex;
      gap: var(--space-s, 0.5em);
      margin-top: var(--space-xs, 0.5em);
      padding-top: var(--space-xs, 0.5em);
      border-top: 1px solid color-mix(in srgb, var(--color-foreground), transparent 90%);
    }

    &__admin-button {
      flex: 1;
    }
  }

  // Responsive design
  @media (max-width: 480px) {
    .radio-card {
      &__content {
        padding: var(--space-s, 0.75em);
      }

      &__title {
        font-size: 0.925em;
      }

      &__admin-actions {
        flex-direction: column;
      }
    }
  }
</style>
