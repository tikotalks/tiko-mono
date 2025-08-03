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
          :icon="Icons.REFRESH"
          :loading="isRefreshing"
          @click="refreshBackups"
        >
          {{ t('common.refresh') }}
        </TButton>

        <TButton
          type="default"
          :icon="Icons.SAVE"
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
        <TIcon :name="Icons.DATABASE" />
        <h3>{{ t('deployment.backups.empty.title') }}</h3>
        <p>{{ t('deployment.backups.empty.description') }}</p>
        <TButton
          type="default"
          :icon="Icons.SAVE"
          @click="triggerBackup"
        >
          {{ t('deployment.backups.createFirst') }}
        </TButton>
      </div>

      <div v-else :class="bemm('grid')">
        <TCard
          v-for="backup in backups"
          :key="backup.id"
          :class="bemm('card')"
          :title="backup.name"
          :description="backup.description"
        >
          <template #content>
            <div :class="bemm('backup-info')">
              <div :class="bemm('info-item')">
                <TIcon :name="Icons.CLOCK" />
                <span>{{ t('deployment.backups.createdAt') }}: {{ formatDate(backup.createdAt) }}</span>
              </div>

              <div v-if="backup.commit" :class="bemm('info-item')">
                <TIcon :name="Icons.GIT_BRANCH" />
                <span>{{ t('deployment.commit') }}: {{ backup.commit }}</span>
              </div>

              <div v-if="backup.metadata?.actor" :class="bemm('info-item')">
                <TIcon :name="Icons.USER" />
                <span>{{ t('deployment.backups.triggeredBy') }}: {{ backup.metadata.actor }}</span>
              </div>

              <div v-if="backup.metadata?.workflowName" :class="bemm('info-item')">
                <TIcon :name="Icons.PLAYBACK_PLAY" />
                <span>{{ t('deployment.backups.workflow') }}: {{ backup.metadata.workflowName }}</span>
              </div>
            </div>

            <TChip
              :class="bemm('status')"
              :color="backup.status"
              :icon="getStatusIcon(backup.status)"
            >
              {{ t(`deployment.backups.status.${backup.status}`) }}
            </TChip>

            <TButtonGroup :class="bemm('card-actions')">
              <TButton
                type="outline"
                :icon="Icons.DOWNLOAD"
                :disabled="backup.status !== 'success'"
                @click="downloadBackup(backup)"
              >
                {{ t('deployment.backups.download') }}
              </TButton>

              <TButton
                type="outline"
                :icon="Icons.EYE"
                @click="showBackupDetails(backup)"
              >
                {{ t('deployment.backups.details') }}
              </TButton>

              <TButton
                type="outline"
                :icon="Icons.TRASH"
                color="error"
                :disabled="true"
                :title="t('deployment.backups.deleteNotSupported')"
              >
                {{ t('deployment.backups.delete') }}
              </TButton>
            </TButtonGroup>
          </template>
        </TCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue';
import { useBemm } from 'bemm';
import { TButtonGroup, TCard, TChip, TSpinner, useI18n } from '@tiko/ui';
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

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: var(--space);
  }

  &__card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: var(--space);
    background: var(--color-background-elevated);
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--color-primary);
      transform: translateY(-2px);
    }
  }

  &__backup-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin-bottom: var(--space);
  }

  &__info-item {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  &__status {
    margin-bottom: var(--space);
  }

  &__card-actions {
    display: flex;
    gap: var(--space-s);
    justify-content: flex-end;
    flex-wrap: wrap;
  }
}
</style>