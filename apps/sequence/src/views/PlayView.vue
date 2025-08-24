<template>
  <TAppLayout :title="sequenceTitle" :show-header="true" app-name="sequence" @profile="handleProfile"
    @settings="handleSettings" @logout="handleLogout">
    <template #app-controls>
      <!-- Back button to exit play mode -->
      <TButton :icon="Icons.CHEVRON_LEFT" type="outline" color="primary" @click="handleBack"
        :aria-label="t('common.back')">{{ t('common.back') }}</TButton>

      <!-- Restart button -->
      <TButton :icon="Icons.ARROW_ROTATE_BOTTOM_LEFT" type="outline" color="secondary" @click="handleRestart"
        :aria-label="t('sequence.restart')" :tooltip="t('sequence.restart')" />
    </template>

    <div :class="bemm('container')">
      <!-- Play area -->
      <div :class="bemm('main')">
        <SequencePlay v-if="sequenceId" :sequence-id="sequenceId" :edit-mode="false"
          @restart="handleRestart" @close="handleBack" />
      </div>
    </div>
  </TAppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useBemm } from 'bemm';
import { useRoute, useRouter } from 'vue-router';
import { TButton, TAppLayout, TIcon } from '@tiko/ui';
import { Icons } from 'open-icon';
import { useI18n } from '@tiko/core';
import { useSequenceStore } from '../stores/sequence';
import { sequenceService } from '../services/sequence.service';
import SequencePlay from '../components/SequencePlay.vue';

const bemm = useBemm('play-view');
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const sequenceStore = useSequenceStore();

// Get sequence ID from route
const sequenceId = computed(() => route.params.sequenceId as string);

// Breadcrumbs for navigation
const sequenceTitle = ref(t('sequence.sequenceTitle'));


const handleBack = async () => {
  // Exit play mode and go back to the home view
  sequenceStore.resetPlay();
  await router.push('/');
};

const handleRestart = () => {
  sequenceStore.restartPlay();
};

const handleProfile = () => {
  console.log('Profile clicked');
};

const handleSettings = () => {
  console.log('Settings clicked');
};

const handleLogout = () => {
  console.log('User logged out');
};

// Initialize
onMounted(async () => {
  console.log('[PlayView] Component mounted for sequence:', sequenceId.value);

  // Start play mode
  if (sequenceId.value) {
    await sequenceStore.startPlay(sequenceId.value);
  }
});
</script>

<style lang="scss">
.play-view {
  &__container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: var(--spacing-md);
    gap: var(--spacing-md);
    overflow: hidden; // Prevent scrollbars
  }

  &__breadcrumbs {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    overflow-x: auto;
    white-space: nowrap;
    padding-bottom: var(--spacing-sm);
    border-bottom: 1px solid var(--color-border);
  }


  &__main {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}
</style>
