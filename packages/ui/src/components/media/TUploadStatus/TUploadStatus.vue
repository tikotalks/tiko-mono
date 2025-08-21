<template>
  <div :class="bemm()">
    <div :class="bemm('info')">
      <div :class="bemm('status')">
        <TSpinner v-if="isUploading" size="small" />
        <TIcon
          v-else-if="errorItems.length > 0"
          :name="Icons.EXCLAMATION_MARK_M"
          color="error"
        />
        <TIcon
          v-else-if="successItems.length === queue.length"
          :name="Icons.CHECK_M"
          color="success"
        />
        <TIcon
          v-else
          :name="Icons.THREE_DOTS_HORIZONTAL"
        />
      </div>

      <div :class="bemm('text')">
        <p v-if="currentItem" :class="bemm('current')">
          {{ t('statusBar.uploading', {
            current: successItems.length + 1,
            total: queue.length
          }) }}: {{ currentItem.file.name }}
        </p>
        <p v-else-if="pendingItems.length > 0" :class="bemm('current')">
          {{ t('statusBar.waiting') }}
        </p>
        <p v-else-if="errorItems.length > 0" :class="bemm('current')">
          {{ t('statusBar.errors', { count: errorItems.length }) }}
        </p>
        <p v-else :class="bemm('current')">
          {{ t('statusBar.complete') }}
        </p>

        <p :class="bemm('summary')">
          {{ t('statusBar.uploaded', { count: successItems.length }) }}
        </p>
      </div>
    </div>

    <div :class="bemm('progress')">
      <div :class="bemm('progress-bar')">
        <div
          :class="bemm('progress-fill')"
          :style="{ width: `${totalProgress}%` }"
        />
      </div>
    </div>

    <div :class="bemm('actions')">
      <TButton
        v-if="pendingItems.length > 0 && !isUploading"
        size="small"
        type="ghost"
        :icon="Icons.ARROW_HEADED_UP"
        @click="startUpload()"
      >
        {{ t('statusBar.start') }}
      </TButton>

      <TButton
        v-if="errorItems.length > 0"
        size="small"
        type="ghost"
        :icon="Icons.ARROW_RELOAD_UP_DOWN"
        @click="retryErrors()"
      >
        {{ t('statusBar.retry') }}
      </TButton>

      <TButton
        v-if="successItems.length > 0"
        size="small"
        type="ghost"
        :icon="Icons.CHECK_M"
        @click="clearSuccessful()"
      >
        {{ t('statusBar.clearDone') }}
      </TButton>

      <TButton
        size="small"
        type="ghost"
        :icon="expanded ? Icons.CHEVRON_DOWN : Icons.CHEVRON_UP"
        @click="expanded = !expanded"
      />

      <TButton
        size="small"
        type="ghost"
        :icon="Icons.CROSS"
        @click="handleClose"
        :title="t('common.close')"
      />
    </div>
  </div>

  <Transition name="expand">
    <div v-if="expanded" :class="bemm('details')">
      <div :class="bemm('queue')">
        <div
          v-for="item in queue"
          :key="item.id"
          :class="bemm('item', item.status)"
        >
          <img v-if="item.preview" :src="item.preview" :alt="item.file.name" />
          <span :class="bemm('item-name')">{{ item.file.name }}</span>
          <div :class="bemm('item-status')">
            <TSpinner v-if="item.status === 'uploading'" size="small" />
            <TIcon v-else-if="item.status === 'success'" :name="Icons.CHECK_M" color="success" />
            <TIcon v-else-if="item.status === 'error'" :name="Icons.CROSS" color="error" />
            <TIcon v-else :name="Icons.THREE_DOTS_HORIZONTAL" />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBemm } from 'bemm'
import { useUpload } from '@tiko/core'
import { useI18n } from '@tiko/core';
import { Icons } from 'open-icon'
import TButton from '../../ui-elements/TButton/TButton.vue'
import TIcon from '../../ui-elements/TIcon/TIcon.vue'
import TSpinner from '../../feedback/TSpinner/TSpinner.vue'

const emit = defineEmits<{
  close: []
}>()

const bemm = useBemm('upload-status')
const { t } = useI18n()
const {
  queue,
  hasItems,
  isUploading,
  currentItem,
  pendingItems,
  successItems,
  errorItems,
  totalProgress,
  hasActiveUploads,
  startUpload,
  retryErrors,
  clearSuccessful,
  clearAll
} = useUpload()

const expanded = ref(false)

const handleClose = () => {
  if (hasActiveUploads) {
    if (confirm(t('statusBar.confirmClose'))) {
      clearAll()
      emit('close')
    }
  } else {
    clearAll()
    emit('close')
  }
}
</script>

<style lang="scss">
.upload-status {
  display: flex;
  align-items: center;
  gap: var(--space);

  &__info {
    display: flex;
    align-items: center;
    gap: var(--space);
    flex: 1;
  }

  &__status {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2em;
    height: 2em;
  }

  &__text {
    flex: 1;
  }

  &__current {
    font-weight: 500;
    margin: 0;
  }

  &__summary {
    font-size: var(--font-size-s);
    color: var(--color-text-secondary);
    margin: 0;
  }

  &__progress {
    flex: 1;
    max-width: 200px;
  }

  &__progress-bar {
    height: 4px;
    background: var(--color-border);
    border-radius: 2px;
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background: var(--color-primary);
    transition: width 0.3s ease;
  }

  &__actions {
    display: flex;
    gap: var(--space-xs);
  }

  &__details {
    max-height: 300px;
    overflow-y: auto;
    border-top: 1px solid var(--color-border);
    margin-top: var(--space-s);
  }

  &__queue {
    padding: var(--space);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    padding: var(--space-xs);
    border-radius: var(--border-radius);

    &--pending {
      opacity: 0.5;
    }

    &--uploading {
      background: var(--color-primary-alpha-10);
    }

    &--success {
      background: var(--color-success-alpha-10);
    }

    &--error {
      background: var(--color-error-alpha-10);
    }

    img {
      width: 30px;
      height: 30px;
      object-fit: cover;
      border-radius: var(--border-radius-sm);
    }
  }

  &__item-name {
    flex: 1;
    font-size: var(--font-size-s);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__item-status {
    width: 1.5em;
    height: 1.5em;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

// Expand transition
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
