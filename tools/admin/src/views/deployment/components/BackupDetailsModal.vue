<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <div :class="bemm('info')">
        <h3 :class="bemm('name')">{{ backup.name }}</h3>
        <p v-if="backup.description" :class="bemm('description')">
          {{ backup.description }}
        </p>
      </div>

      <TChip
        :color="backup.status"
        :icon="getStatusIcon(backup.status)"
      >
        {{ t(`deployment.backups.status.${backup.status}`) }}
      </TChip>
    </div>

    <div :class="bemm('details')">
      <div :class="bemm('detail-grid')">
        <div :class="bemm('detail-item')">
          <TIcon :name="Icons.CLOCK" />
          <div>
            <strong>{{ t('deployment.backups.createdAt') }}</strong>
            <span>{{ formatDate(backup.createdAt) }}</span>
          </div>
        </div>

        <div :class="bemm('detail-item')">
          <TIcon :name="Icons.ARCHIVE" />
          <div>
            <strong>{{ t('deployment.backups.size') }}</strong>
            <span>{{ formatFileSize(backup.size) }}</span>
          </div>
        </div>

        <div v-if="backup.rows" :class="bemm('detail-item')">
          <TIcon :name="Icons.DATABASE" />
          <div>
            <strong>{{ t('deployment.backups.rows') }}</strong>
            <span>{{ backup.rows.toLocaleString() }}</span>
          </div>
        </div>

        <div v-if="backup.tables && backup.tables.length > 0" :class="bemm('detail-item')">
          <TIcon :name="Icons.TABLE" />
          <div>
            <strong>{{ t('deployment.backups.tables') }}</strong>
            <span>{{ backup.tables.length }}</span>
          </div>
        </div>
      </div>

      <div v-if="backup.tables && backup.tables.length > 0" :class="bemm('tables')">
        <h4>{{ t('deployment.backups.tablesIncluded') }}</h4>
        <div :class="bemm('table-list')">
          <TChip
            v-for="table in backup.tables"
            :key="table"
            type="outline"
            size="small"
          >
            {{ table }}
          </TChip>
        </div>
      </div>

      <div v-if="backup.metadata && Object.keys(backup.metadata).length > 0" :class="bemm('metadata')">
        <h4>{{ t('deployment.backups.metadata') }}</h4>
        <div :class="bemm('metadata-grid')">
          <div
            v-for="(value, key) in backup.metadata"
            :key="key"
            :class="bemm('metadata-item')"
          >
            <strong>{{ formatMetadataKey(key) }}:</strong>
            <span>{{ formatMetadataValue(value) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div :class="bemm('actions')">
      <TButton
        type="outline"
        :icon="Icons.DOWNLOAD"
        :disabled="backup.status !== 'success'"
        @click="handleDownload"
      >
        {{ t('deployment.backups.download') }}
      </TButton>

      <TButton
        type="ghost"
        @click="handleClose"
      >
        {{ t('common.close') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import { TButton, TChip, TIcon, useI18n } from '@tiko/ui';
import { Icons } from 'open-icon';
import type { DatabaseBackup } from '@tiko/core';

const bemm = useBemm('backup-details-modal');
const { t } = useI18n();

interface Props {
  backup: DatabaseBackup;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  download: [];
  close: [];
}>();

// Methods
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'creating':
      return Icons.LOADING;
    case 'success':
      return Icons.CHECK;
    case 'failed':
      return Icons.X;
    default:
      return Icons.CIRCLE;
  }
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
};

const formatFileSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const formatMetadataKey = (key: string) => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatMetadataValue = (value: any) => {
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

const handleDownload = () => {
  emit('download');
};

const handleClose = () => {
  emit('close');
};
</script>

<style lang="scss">
.backup-details-modal {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-lg);
    gap: var(--space);
  }

  &__info {
    flex: 1;
  }

  &__name {
    margin: 0 0 var(--space-xs) 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
  }

  &__description {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  &__details {
    margin-bottom: var(--space-lg);
  }

  &__detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space);
    margin-bottom: var(--space-lg);
  }

  &__detail-item {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    padding: var(--space-s);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-background-elevated);

    .t-icon {
      color: var(--color-primary);
      font-size: var(--font-size-lg);
    }

    div {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);

      strong {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-secondary);
      }

      span {
        font-weight: var(--font-weight-semibold);
      }
    }
  }

  &__tables,
  &__metadata {
    margin-bottom: var(--space);

    h4 {
      margin: 0 0 var(--space-s) 0;
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
    }
  }

  &__table-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  &__metadata-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__metadata-item {
    display: flex;
    gap: var(--space-s);
    padding: var(--space-xs);
    background: var(--color-background);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);

    strong {
      color: var(--color-text-secondary);
      min-width: 120px;
    }

    span {
      color: var(--color-text-primary);
      word-break: break-all;
    }
  }

  &__actions {
    display: flex;
    gap: var(--space-s);
    justify-content: flex-end;
    padding-top: var(--space);
    border-top: 1px solid var(--color-border);
  }
}
</style>