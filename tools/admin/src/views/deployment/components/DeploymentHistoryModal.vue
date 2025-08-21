<template>
  <div :class="bemm()">
    <div v-if="history.length === 0" :class="bemm('empty')">
      <p>{{ t('deployment.noHistory') }}</p>
    </div>
    
    <div v-else :class="bemm('list')">
      <div
        v-for="event in history"
        :key="event.id"
        :class="bemm('item')"
      >
        <div :class="bemm('item-header')">
          <div :class="bemm('commit')">
            <TIcon :name="Icons.GIT_COMMIT" />
            <code>{{ event.commit }}</code>
          </div>
          <div :class="bemm('status', [event.status])">
            <TIcon :name="getStatusIcon(event.status)" />
            {{ t(`deployment.status.${event.status}`) }}
          </div>
        </div>
        
        <div :class="bemm('item-meta')">
          <div :class="bemm('meta-item')">
            <TIcon :name="Icons.USER" />
            <span>{{ event.triggeredBy }}</span>
          </div>
          <div :class="bemm('meta-item')">
            <TIcon :name="Icons.CLOCK" />
            <span>{{ formatDate(event.startedAt) }}</span>
          </div>
          <div v-if="event.duration" :class="bemm('meta-item')">
            <TIcon :name="Icons.TIMER" />
            <span>{{ formatDuration(event.duration) }}</span>
          </div>
        </div>
        
        <div v-if="event.logUrl" :class="bemm('item-actions')">
          <TButton
            type="outline"
            size="small"
            :icon="Icons.EXTERNAL_LINK"
            @click="openLogs(event.logUrl)"
          >
            {{ t('deployment.viewLogs') }}
          </TButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { useI18n } from '@tiko/core'
import { Icons } from 'open-icon'
import { TIcon, TButton } from '@tiko/ui'
import type { DeploymentHistory } from '@tiko/core/services/deployment.service'

interface Props {
  history: DeploymentHistory[]
  targetName: string
}

const props = defineProps<Props>()

const bemm = useBemm('deployment-history-modal')
const { t } = useI18n()

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'running': return Icons.LOADING
    case 'success': return Icons.CHECK
    case 'failed': return Icons.X
    default: return Icons.CIRCLE
  }
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

const openLogs = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<style lang="scss">
.deployment-history-modal {
  min-width: 500px;

  &__empty {
    text-align: center;
    padding: var(--space-xl);
    color: var(--color-text-secondary);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__item {
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: var(--space);
    background: var(--color-background-elevated);
  }

  &__item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-s);
  }

  &__commit {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-family: var(--font-mono);

    code {
      background: var(--color-background);
      padding: var(--space-xs);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-sm);
    }
  }

  &__status {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);

    &--running {
      color: var(--color-warning);
    }

    &--success {
      color: var(--color-success);
    }

    &--failed {
      color: var(--color-error);
    }
  }

  &__item-meta {
    display: flex;
    gap: var(--space);
    margin-bottom: var(--space-s);
  }

  &__meta-item {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  &__item-actions {
    display: flex;
    justify-content: flex-end;
  }
}
</style>