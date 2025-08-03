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

      <div :class="bemm('grid')">
        <TCard
          v-for="target in filteredTargets"
          :key="target.id"
          :class="bemm('card', ['', target.status as string])"
          :title="target.name"
          :description="target.description"
          :category="target.type"
        >
          <span :class="bemm('card-trigger')">{{ target.trigger }}</span>

          <template #content>
            <TChip
              :class="bemm('card-status')"
              :icon="getStatusIcon(target.status)"
              :color="target.status"
            >
              {{ t(`deployment.status.${target.status}`) }}
            </TChip>

            <div v-if="target.lastDeployed" :class="bemm('last-deployed')">
              <TIcon :name="Icons.CLOCK" />
              <span
                >{{ t('deployment.lastDeployed') }}:
                {{ formatDate(target.lastDeployed) }}</span
              >
            </div>

            <div v-if="target.buildDuration" :class="bemm('build-duration')">
              <TIcon :name="Icons.TIMER" />
              <span
                >{{ t('deployment.duration') }}:
                {{ formatDuration(target.buildDuration) }}</span
              >
            </div>

            <div v-if="target.version" :class="bemm('version-info')">
              <TIcon :name="Icons.TAG" />
              <span>{{ t('deployment.version') }}: {{ target.version }}</span>
            </div>

            <div v-if="target.buildNumber" :class="bemm('build-info')">
              <TIcon :name="Icons.HASH" />
              <span>{{ t('deployment.buildNumber') }}: #{{ target.buildNumber }}</span>
            </div>

            <div v-if="target.commit" :class="bemm('commit-info')">
              <TIcon :name="Icons.GIT_BRANCH" />
              <span>{{ t('deployment.commit') }}: {{ target.commit }}</span>
            </div>

            <TButton    :href="target.url" :type="'outline'" :icon="Icons.ARROW_RIGHT" v-if="target.url" :class="bemm('url')">


                {{ target.url }}
            </TButton>

            <TButtonGroup :class="bemm('card-actions')">
              <TButton
                type="outline"
                :icon="Icons.ARROW_ROTATE_TOP_LEFT"
                @click="showHistory(target)"
              >
                {{ t('deployment.history') }}
              </TButton>

              <TButton
                type="default"
                :icon="Icons.PLAYBACK_PLAY"
                :loading="deploymentStates[target.id]?.isDeploying"
                :disabled="target.status === 'building'"
                @click="triggerDeployment(target)"
              >
                {{ t('deployment.deploy') }}
              </TButton>
            </TButtonGroup>
          </template>
        </TCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, inject } from 'vue';
import { useBemm } from 'bemm';
import { TButtonGroup, TCard, TChip, useI18n } from '@tiko/ui';
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

    &--building {
      border-color: var(--color-warning);
      background: var(--color-warning-background);
    }

    &--success {
      border-color: var(--color-success);
    }

    &--failed {
      border-color: var(--color-error);
    }
  }

  &__card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space);
  }

  &__card-info {
    flex: 1;
  }

  &__card-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-bottom: var(--space-xs);
  }

  &__card-description {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    margin-bottom: var(--space-s);
  }

  &__card-meta {
    display: flex;
    gap: var(--space-s);
    align-items: center;
  }

  &__card-type {
    padding: var(--space-xs) var(--space-s);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);

    &--app {
      background: var(--color-primary-background);
      color: var(--color-primary);
    }

    &--tool {
      background: var(--color-secondary-background);
      color: var(--color-secondary);
    }

    &--website {
      background: var(--color-accent-background);
      color: var(--color-accent);
    }

    &--worker {
      background: var(--color-warning-background);
      color: var(--color-warning);
    }
  }

  &__card-trigger {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--color-text-tertiary);
    background: var(--color-background);
    padding: var(--space-xs);
    border-radius: var(--radius-sm);
  }

  &__card-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
  }

  &__status-icon {
    font-size: var(--font-size-lg);

    &--idle {
      color: var(--color-text-tertiary);
    }

    &--building {
      color: var(--color-warning);
      animation: spin 1s linear infinite;
    }

    &--success {
      color: var(--color-success);
    }

    &--failed {
      color: var(--color-error);
    }
  }

  &__status-text {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
  }

  &__card-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin-bottom: var(--space);
  }

  &__last-deployed,
  &__build-duration,
  &__version-info,
  &__build-info,
  &__commit-info,
  &__url {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  &__url-link {
    color: var(--color-primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__card-actions {
    display: flex;
    gap: var(--space-s);
    justify-content: flex-end;
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
