<template>
  <div :class="bemm()">
    <div v-if="hiddenSequences.length === 0" :class="bemm('empty')">
      <TIcon :name="Icons.EYE" size="large" />
      <p>{{ t('sequence.noHiddenSequences') }}</p>
    </div>

    <div v-else :class="bemm('list')">
      <div v-for="sequence in hiddenSequences" :key="sequence.id" :class="bemm('item')">
        <div :class="bemm('item-content')">
          <TCardTile :card="sequence" size="small" :clickable="false" :class="bemm('tile')" />
          <div :class="bemm('item-info')">
            <h4 :class="bemm('item-title')">{{ sequence.title }}</h4>
            <p :class="bemm('item-description')">
              {{ sequence.type === 'sequence' ? t('sequence.sequence') : t('sequence.item') }}
            </p>
          </div>
        </div>

        <TButton
          :icon="Icons.EYE"
          type="outline"
          size="small"
          @click="handleShowItem(sequence.id)"
          :tooltip="t('sequence.showThisItem')"
        >
          {{ t('common.show') }}
        </TButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useI18n } from '@tiko/core'
  import { TButton, TIcon, TCardTile, type TCardTile as CardTileType } from '@tiko/ui'
  import { useBemm } from 'bemm'
  import { Icons } from 'open-icon'
  import { useSequenceStore } from '../stores/sequence'
  import { sequenceService } from '../services/sequence.service'

  const props = defineProps<{
    hiddenItemIds: string[]
    onItemShown?: (itemId: string) => void
  }>()

  const { t, currentLocale } = useI18n()
  const bemm = useBemm('hidden-sequences-list')
  const sequenceStore = useSequenceStore()

  const hiddenSequences = ref<CardTileType[]>([])
  const isLoading = ref(true)

  // Load the actual sequence data for the hidden IDs
  const loadHiddenSequences = async () => {
    isLoading.value = true
    try {
      // Load all sequences to find the hidden ones
      const allSequences = await sequenceStore.loadSequence(undefined, currentLocale.value)

      // Filter to only show hidden items
      hiddenSequences.value = allSequences.filter(seq => props.hiddenItemIds.includes(seq.id))

      // If some hidden items weren't found in the root, they might be curated items
      const missingIds = props.hiddenItemIds.filter(
        id => !hiddenSequences.value.some(seq => seq.id === id)
      )

      if (missingIds.length > 0) {
        // Try to load curated items if enabled
        if (sequenceStore.settings.showCuratedItems) {
          try {
            const curatedSequences = await sequenceService.loadSequence(
              undefined,
              currentLocale.value
            )
            const additionalHidden = curatedSequences.filter(seq => missingIds.includes(seq.id))
            hiddenSequences.value.push(...additionalHidden)
          } catch (error) {
            console.error('Failed to load curated sequences:', error)
          }
        }
      }

      // Sort by title
      hiddenSequences.value.sort((a, b) => a.title.localeCompare(b.title))
    } catch (error) {
      console.error('Failed to load hidden sequences:', error)
    } finally {
      isLoading.value = false
    }
  }

  const handleShowItem = async (itemId: string) => {
    await sequenceStore.showItem(itemId)

    // Remove from local list immediately for better UX
    hiddenSequences.value = hiddenSequences.value.filter(seq => seq.id !== itemId)

    // Notify parent
    if (props.onItemShown) {
      props.onItemShown(itemId)
    }
  }

  onMounted(() => {
    loadHiddenSequences()
  })
</script>

<style lang="scss">
  .hidden-sequences-list {
    &__empty {
      text-align: center;
      padding: var(--space-xxl) var(--space-l);
      color: var(--color-text-secondary);

      .t-icon {
        margin-bottom: var(--space-m);
        opacity: 0.5;
      }

      p {
        margin: 0;
        font-size: var(--font-size-m);
      }
    }

    &__list {
      display: flex;
      flex-direction: column;
      gap: var(--space-m);
      max-height: 400px;
      overflow-y: auto;
      padding: var(--space-xs);
    }

    &__item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-m);
      background: var(--color-surface);
      border: 1px solid var(--color-accent-subtle);
      border-radius: var(--border-radius-m);
      transition: all var(--transition-fast);

      &:hover {
        background: var(--color-surface-hover);
        border-color: var(--color-accent);
      }
    }

    &__item-content {
      display: flex;
      align-items: center;
      gap: var(--space-m);
      flex: 1;
      min-width: 0;
    }

    &__tile {
      flex-shrink: 0;
    }

    &__item-info {
      flex: 1;
      min-width: 0;
    }

    &__item-title {
      margin: 0;
      font-size: var(--font-size-m);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__item-description {
      margin: var(--space-xs) 0 0 0;
      font-size: var(--font-size-s);
      color: var(--color-text-secondary);
      opacity: 0.8;
    }

    // Mobile adjustments
    @media (max-width: 600px) {
      &__list {
        max-height: 300px;
      }

      &__item {
        padding: var(--space-s);
      }

      &__item-content {
        gap: var(--space-s);
      }

      &__item-title {
        font-size: var(--font-size-s);
      }

      &__item-description {
        font-size: var(--font-size-xs);
      }
    }
  }
</style>
