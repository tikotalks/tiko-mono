<template>
  <div :class="bemm()">
    <THeader
      :title="t('deployment.dashboard.title')"
      :subtitle="t('deployment.dashboard.subtitle')"
    />

    <div :class="bemm('section')">
      <div :class="bemm('filters')">
        <TButton
          v-for="filter in filters"
          :key="filter.value"
          :type="selectedFilter === filter.value ? 'default' : 'ghost'"
          :class="bemm('filter')"
          @click="selectedFilter = filter.value"
        >
          {{ filter.label }}
        </TButton>

        <TButton
          type="outline"
          :icon="Icons.REFRESH"
          :loading="isRefreshing"
          @click="refreshStatus"
        >
          {{ t('common.refresh') }}
        </TButton>
      </div>

      <TList :columns="columns">
        <TListItem
          v-for="target in filteredTargets"
          :key="target.id"
          :clickable="true"
          :class="bemm('item', ['', target.status as string])"
          @click="showHistory(target)"
        >
          <TListCell type="custom">
            <div :class="bemm('name-cell')">
              <TIcon :name="getTypeIcon(target.type)" />
              <div>
                <h3 :class="bemm('item-title')">{{ target.name }}</h3>
                <p :class="bemm('item-description')">{{ target.description }}</p>
              </div>
            </div>
          </TListCell>
          
          <TListCell type="custom">
            <TChip
              :icon="getStatusIcon(target.status)"
              :color="target.status"
              size="small"
            >
              {{ t(`deployment.status.${target.status}`) }}
            </TChip>
          </TListCell>
          
          <TListCell type="custom">
            <div :class="bemm('meta-cell')">
              <div v-if="target.version" :class="bemm('meta-item')">
                <TIcon :name="Icons.TAG" />
                {{ target.version }}
              </div>
              
              <div v-if="target.commit" :class="bemm('meta-item')">
                <TIcon :name="Icons.GIT_BRANCH" />
                {{ target.commit }}
              </div>
              
              <div v-if="target.lastDeployed" :class="bemm('meta-item')">
                <TIcon :name="Icons.CLOCK" />
                {{ formatDate(target.lastDeployed) }}
              </div>
              
              <div v-if="target.buildDuration" :class="bemm('meta-item')">
                <TIcon :name="Icons.TIMER" />
                {{ formatDuration(target.buildDuration) }}
              </div>
            </div>
          </TListCell>
          
          <TListCell 
            type="actions" 
            :actions="[
              ...(target.url ? [listActions.custom({
                handler: () => window.open(target.url, '_blank'),
                tooltip: t('deployment.visit'),
                icon: Icons.ARROW_RIGHT
              })] : []),
              listActions.custom({
                handler: () => triggerDeployment(target),
                tooltip: t('deployment.deploy'),
                icon: Icons.PLAYBACK_PLAY,
                disabled: target.status === 'building' || deploymentStates[target.id]?.isDeploying,
                loading: deploymentStates[target.id]?.isDeploying
              })
            ]"
          />
        </TListItem>
      </TList>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, inject } from 'vue';
import { useBemm } from 'bemm';
import { TList, TListItem, TListCell, TChip, listActions } from '@tiko/ui';
import { Icons } from 'open-icon';
import {
  deploymentService,
  type DeploymentTarget,
  type DeploymentHistory,
} from '@tiko/core';
import { THeader, TButton, TIcon, type PopupService } from '@tiko/ui';

const bemm = useBemm('deployment-dashboard');
const { t } = useI18n();
const popupService = inject<PopupService>('popupService');

// State
const targets = ref<DeploymentTarget[]>([]);
const selectedFilter = ref<string>('all');
const isRefreshing = ref(false);
const deploymentStates = reactive<Record<string, { isDeploying: boolean }>>({});

// Table columns
const columns = [
  { label: t('deployment.target', 'Target'), key: 'name' },
  { label: t('deployment.status', 'Status'), key: 'status' },
  { label: t('deployment.details', 'Details'), key: 'details' },
  { label: t('common.actions', 'Actions'), key: 'actions' }
];

// Filters
const filters = computed(() => [
  { label: t('deployment.filters.all'), value: 'all' },
  { label: t('deployment.filters.apps'), value: 'app' },
  { label: t('deployment.filters.tools'), value: 'tool' },
  { label: t('deployment.filters.websites'), value: 'website' },
  { label: t('deployment.filters.workers'), value: 'worker' },
]);

const filteredTargets = computed(() => {
  if (selectedFilter.value === 'all') {
    return targets.value;
  }
  return targets.value.filter((target) => target.type === selectedFilter.value);
});

// Methods
const loadDeploymentStatus = async () => {
  try {
    targets.value = await deploymentService.getDeploymentStatus();
  } catch (error) {
    console.error('Error loading deployment status:', error);
  }
};

const refreshStatus = async () => {
  isRefreshing.value = true;
  try {
    await loadDeploymentStatus();
  } finally {
    isRefreshing.value = false;
  }
};

const triggerDeployment = async (target: DeploymentTarget) => {
  if (!popupService) return;

  try {
    // Import the component dynamically
    const { default: DeploymentTriggerModal } = await import(
      './components/DeploymentTriggerModal.vue'
    );

    popupService.open({
      title: t('deployment.confirmDeploy', { name: target.name }),
      component: DeploymentTriggerModal,
      props: {
        targetName: target.name,
        defaultMessage: `Deploy ${target.name} via admin dashboard`,
      },
      on: {
        confirm: async (message: string) => {
          deploymentStates[target.id] = { isDeploying: true };

          try {
            const success = await deploymentService.triggerDeployment(
              target.id,
              message,
            );

            if (success) {
              // Save deployment event
              await deploymentService.saveDeploymentEvent(
                target.id,
                'triggered',
                { triggeredFrom: 'admin-dashboard', message },
              );

              // Refresh status after a short delay
              setTimeout(refreshStatus, 2000);
            }
          } catch (error) {
            console.error('Error triggering deployment:', error);
          } finally {
            deploymentStates[target.id] = { isDeploying: false };
            popupService.close();
          }
        },
        cancel: () => {
          popupService.close();
        },
      },
    });
  } catch (error) {
    console.error('Error loading deployment trigger modal:', error);
  }
};

const showHistory = async (target: DeploymentTarget) => {
  if (!popupService) return;

  try {
    const history = await deploymentService.getDeploymentHistory(target.id);

    // Import the component dynamically
    const { default: DeploymentHistoryModal } = await import(
      './components/DeploymentHistoryModal.vue'
    );

    popupService.open({
      title: t('deployment.historyFor', { name: target.name }),
      component: DeploymentHistoryModal,
      props: {
        history,
        targetName: target.name,
      },
    });
  } catch (error) {
    console.error('Error loading deployment history:', error);
  }
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'building':
      return Icons.LOADING;
    case 'success':
      return Icons.CHECK;
    case 'failed':
      return Icons.X;
    default:
      return Icons.CIRCLE;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'app':
      return Icons.BOARD_MULTI_DASHBOARD;
    case 'tool':
      return Icons.SETTINGS;
    case 'website':
      return Icons.GLOBE;
    case 'worker':
      return Icons.CLOUD;
    default:
      return Icons.CIRCLE;
  }
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

// Initialize deployment states
const initializeDeploymentStates = () => {
  targets.value.forEach((target) => {
    deploymentStates[target.id] = { isDeploying: false };
  });
};

onMounted(async () => {
  await loadDeploymentStatus();
  initializeDeploymentStates();

  // Auto-refresh every 30 seconds
  setInterval(refreshStatus, 30000);
});
</script>

<style lang="scss">
.deployment-dashboard {
  &__section {
    margin-bottom: var(--space-xl);
  }

  &__filters {
    display: flex;
    gap: var(--space-s);
    align-items: center;
    margin-bottom: var(--space-lg);
    flex-wrap: wrap;
  }

  &__filter {
    // Styling handled by TButton
  }

  &__item {
    &--building {
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

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
