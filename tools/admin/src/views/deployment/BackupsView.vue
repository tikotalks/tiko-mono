<template>
  <div :class="bemm()">
    <THeader
      :title="t('deployment.backups.title')"
      :subtitle="t('deployment.backups.subtitle')"
    />

    <div :class="bemm('section')">
      <div :class="bemm('actions')">
        <TButton
          type="outline"
          :icon="Icons.ARROW_ROTATE_TOP_RIGHT"
          :loading="isRefreshing"
          @click="refreshBackups"
        >
          {{ t('common.refresh') }}
        </TButton>

        <TButton
          type="default"
          :icon="Icons.ARROW_DOWNLOAD"
          :loading="isCreatingBackup"
          @click="triggerBackup"
        >
          {{ t('deployment.backups.create') }}
        </TButton>
      </div>

      <div v-if="isLoading" :class="bemm('loading')">
        <TSpinner />
        <span>{{ t('deployment.backups.loading') }}</span>
      </div>

      <div v-else-if="backups.length === 0" :class="bemm('empty')">
        <TIcon :name="Icons.BOARD_MULTI2_HORIZONTAL" />
        <h3>{{ t('deployment.backups.empty.title') }}</h3>
        <p>{{ t('deployment.backups.empty.description') }}</p>
        <TButton
          type="default"
          :icon="Icons.ARROW_DOWNLOAD"
          @click="triggerBackup"
        >
          {{ t('deployment.backups.createFirst') }}
        </TButton>
      </div>

      <TList v-else :columns="columns">
        <TListItem
          v-for="backup in backups"
          :key="backup.id"
          :clickable="true"
          :class="bemm('item', ['', backup.status])"
          @click="showBackupDetails(backup)"
        >
          <TListCell type="custom">
            <div :class="bemm('name-cell')">
              <TIcon :name="Icons.BOARD_MULTI2_HORIZONTAL" />
              <div>
                <h3 :class="bemm('item-title')">{{ backup.name }}</h3>
                <p v-if="backup.description && backup.name !== backup.description" :class="bemm('item-description')">{{ backup.description }}</p>
              </div>
            </div>
          </TListCell>

          <TListCell type="custom">
            <TChip
              :icon="getStatusIcon(backup.status)"
              :color="backup.status"
              size="small"
            >
              {{ t(`deployment.backups.status.${backup.status}`) }}
            </TChip>
          </TListCell>

          <TListCell type="custom" :size="Size.SMALL">
            <div :class="bemm('meta-cell')">
              <div :class="bemm('meta-item')">
                <TIcon :name="Icons.CLOCK" />
                {{ formatDate(backup.createdAt) }}
              </div>

              <div v-if="backup.commit" :class="bemm('meta-item')">
                <TIcon :name="Icons.GIT_BRANCH" />
                {{ backup.commit }}
              </div>

              <div v-if="backup.metadata?.actor" :class="bemm('meta-item')">
                <TIcon :name="Icons.USER" />
                {{ backup.metadata.actor }}
              </div>

              <div v-if="backup.metadata?.workflowName" :class="bemm('meta-item')">
                <TIcon :name="Icons.PLAYBACK_PLAY" />
                {{ backup.metadata.workflowName }}
              </div>
            </div>
          </TListCell>

          <TListCell
            type="actions"
            :actions="[
              listActions.custom({
                handler: () => downloadBackup(backup),
                tooltip: t('deployment.backups.viewOnGithub'),
                icon: Icons.ARROW_RIGHT,
                disabled: backup.status !== 'success'
              })
            ]"
          />
        </TListItem>
      </TList>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue';
import { useBemm } from 'bemm';
import { TList, TListItem, TListCell, TChip, TSpinner, listActions, Size } from '@tiko/ui';
import { Icons } from 'open-icon';
import { THeader, TButton, TIcon, type PopupService, type ToastService } from '@tiko/ui';
import { backupService, type DatabaseBackup } from '@tiko/core';

const bemm = useBemm('deployment-backups');
const { t } = useI18n();
const popupService = inject<PopupService>('popupService');
const toastService = inject<ToastService>('toastService');

// State
const backups = ref<DatabaseBackup[]>([]);
const isLoading = ref(true);
const isRefreshing = ref(false);
const isCreatingBackup = ref(false);

// Table columns
const columns = [
  { label: t('deployment.backups.name', 'Name'), key: 'name' },
  { label: t('deployment.status', 'Status'), key: 'status' },
  { label: t('deployment.details', 'Details'), key: 'details' },
  { label: t('common.actions', 'Actions'), key: 'actions' }
];

// Methods
const loadBackups = async () => {
  try {
    backups.value = await backupService.getBackups();
  } catch (error) {
    console.error('Error loading backups:', error);
    toastService?.show({
      message: t('deployment.backups.error.load'),
      type: 'error',
    });
  }
};

const refreshBackups = async () => {
  isRefreshing.value = true;
  try {
    await loadBackups();
  } finally {
    isRefreshing.value = false;
  }
};

const triggerBackup = async () => {
  if (!popupService) return;

  try {
    // Import the component dynamically
    const { default: BackupTriggerModal } = await import('./components/BackupTriggerModal.vue');

    popupService.open({
      title: t('deployment.backups.confirm.title'),
      component: BackupTriggerModal,
      props: {
        defaultName: `backup-${new Date().toISOString().split('T')[0]}`,
      },
      on: {
        confirm: async (backupName: string, description: string) => {
          isCreatingBackup.value = true;

          try {
            const success = await backupService.createBackup({
              name: backupName,
              description,
            });

            if (success) {
              toastService?.show({
                message: t('deployment.backups.success.created'),
                type: 'success',
              });

              // Refresh backups after a short delay
              setTimeout(refreshBackups, 2000);
            } else {
              toastService?.show({
                message: t('deployment.backups.error.create'),
                type: 'error',
              });
            }
          } catch (error) {
            console.error('Error creating backup:', error);
            toastService?.show({
              message: t('deployment.backups.error.create'),
              type: 'error',
            });
          } finally {
            isCreatingBackup.value = false;
            popupService.close();
          }
        },
        cancel: () => {
          popupService.close();
        },
      },
    });
  } catch (error) {
    console.error('Error loading backup trigger modal:', error);
  }
};

const downloadBackup = async (backup: DatabaseBackup) => {
  // For GitHub-based backups, open the workflow run page where artifacts can be downloaded
  if (backup.runUrl) {
    window.open(backup.runUrl, '_blank');
    return;
  }

  try {
    const downloadUrl = await backupService.getBackupDownloadUrl(backup.id);
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    } else {
      toastService?.show({
        message: t('deployment.backups.error.download'),
        type: 'error',
      });
    }
  } catch (error) {
    console.error('Error downloading backup:', error);
    toastService?.show({
      message: t('deployment.backups.error.download'),
      type: 'error',
    });
  }
};

const showBackupDetails = async (backup: DatabaseBackup) => {
  if (!popupService) return;

  try {
    const { default: BackupDetailsModal } = await import('./components/BackupDetailsModal.vue');

    popupService.open({
      title: t('deployment.backups.details.title', { name: backup.name }),
      component: BackupDetailsModal,
      props: {
        backup,
      },
    });
  } catch (error) {
    console.error('Error loading backup details modal:', error);
  }
};

const confirmDeleteBackup = (backup: DatabaseBackup) => {
  if (!popupService) return;

  popupService.confirm({
    title: t('deployment.backups.delete.title'),
    message: t('deployment.backups.delete.message', { name: backup.name }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    confirmColor: 'error',
    onConfirm: async () => {
      try {
        const success = await backupService.deleteBackup(backup.id);
        if (success) {
          toastService?.show({
            message: t('deployment.backups.success.deleted'),
            type: 'success',
          });
          await refreshBackups();
        } else {
          toastService?.show({
            message: t('deployment.backups.error.delete'),
            type: 'error',
          });
        }
      } catch (error) {
        console.error('Error deleting backup:', error);
        toastService?.show({
          message: t('deployment.backups.error.delete'),
          type: 'error',
        });
      }
    },
  });
};

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
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatFileSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

onMounted(async () => {
  await loadBackups();
  isLoading.value = false;
});
</script>

<style lang="scss">
.deployment-backups {
  &__section {
    margin-bottom: var(--space-xl);
  }

  &__actions {
    display: flex;
    gap: var(--space-s);
    align-items: center;
    margin-bottom: var(--space-lg);
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space);
    padding: var(--space-xl);
    color: var(--color-text-secondary);
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space);
    padding: var(--space-xl);
    text-align: center;
    color: var(--color-text-secondary);

    .t-icon {
      font-size: 3em;
      opacity: 0.5;
    }

    h3 {
      margin: 0;
      color: var(--color-text-primary);
    }

    p {
      margin: 0;
      max-width: 400px;
    }
  }

  &__item {
    &--creating {
      border-left: 3px solid var(--color-warning);
      background: var(--color-warning-background);
    }

    &--success {
      border-left: 3px solid var(--color-success);
    }

    &--failed {
      border-left: 3px solid var(--color-error);
    }
  }

  &__name-cell {
    display: flex;
    align-items: center;
    gap: var(--space-s);

    .t-icon {
      font-size: var(--font-size-lg);
      color: var(--color-primary);
    }
  }

  &__item-title {
    margin: 0;
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
  }

  &__item-description {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  &__meta-cell {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__meta-item {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-xs);
    color: var(--color-text-tertiary);

    .t-icon {
      font-size: var(--font-size-sm);
    }
  }
}
</style>
