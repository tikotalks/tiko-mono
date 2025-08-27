<template>
  <div :class="bemm()">
    <!-- Item info -->
    <div :class="bemm('info')">
      <div :class="bemm('item-preview')">
        <div :class="bemm('item-icon')" :style="{ backgroundColor: sequence.color }">
          <img v-if="sequence.image" :src="sequence.image" :alt="sequence.title" />
          <TIcon v-else :name="Icons.SQUARE" />
        </div>
        <div :class="bemm('item-details')">
          <h3 :class="bemm('item-title')">{{ sequence.title }}</h3>
          <p :class="bemm('item-type')">{{ t('sequence.curatedSequence') }}</p>
        </div>
      </div>

      <div :class="bemm('curated-badge')">
        <TIcon :name="Icons.STAR_M" size="small" />
        <span>{{ t('common.curated') }}</span>
      </div>
    </div>

    <!-- Explanation -->
    <div :class="bemm('explanation')">
      <p>{{ t('sequence.curatedItemExplanation') }}</p>
    </div>

    <!-- Actions -->
    <div :class="bemm('actions')">
      <TButton
        :icon="Icons.EYE_OFF"
        type="outline"
        color="secondary"
        @click="handleHide"
        size="large"
      >
        {{ t('sequence.hideThisItem') }}
      </TButton>

      <TButton
        :icon="Icons.COPY"
        type="default"
        color="primary"
        @click="handleDuplicate"
        size="large"
      >
        {{ t('sequence.duplicateToEdit') }}
      </TButton>
    </div>

    <!-- Info about actions -->
    <div :class="bemm('action-info')">
      <div :class="bemm('action-description')">
        <TIcon :name="Icons.EYE_OFF" size="small" />
        <span>{{ t('sequence.hideActionDescription') }}</span>
      </div>
      <div :class="bemm('action-description')">
        <TIcon :name="Icons.COPY" size="small" />
        <span>{{ t('sequence.duplicateActionDescription') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { useI18n } from '@tiko/core';
import { TButton, TIcon } from '@tiko/ui'
import { Icons } from 'open-icon'
import type { TCardTile } from '@tiko/ui'

interface Props {
  sequence: TCardTile
  onHide?: (sequenceId: string) => void
  onDuplicate?: (sequence: TCardTile) => void
}

const props = defineProps<Props>()
const bemm = useBemm('curated-item-actions')
const { t } = useI18n()

const handleHide = () => {
  if (props.onHide) {
    props.onHide(props.sequence.id)
  }
}

const handleDuplicate = () => {
  if (props.onDuplicate) {
    props.onDuplicate(props.sequence)
  }
}
</script>

<style lang="scss">
.curated-item-actions {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0.5rem;

  &__info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__item-preview {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__item-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .icon {
      color: white;
      font-size: 1.5rem;
    }
  }

  &__item-details {
    flex: 1;
  }

  &__item-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.25rem;
    color: var(--color-text);
  }

  &__item-type {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin: 0;
  }

  &__curated-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, #ffd700, #ffa500);
    color: #8b4513;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    align-self: flex-start;
  }

  &__explanation {
    background: var(--color-background-secondary);
    border: 1px solid var(--color-accent);
    border-radius: 0.75rem;
    padding: 1rem;

    p {
      margin: 0;
      color: var(--color-text-secondary);
      line-height: 1.5;
    }
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__action-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__action-description {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text-secondary);

    .icon {
      color: var(--color-text-muted);
    }
  }
}
</style>
