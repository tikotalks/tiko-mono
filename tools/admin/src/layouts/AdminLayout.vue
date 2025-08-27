<template>
  <div :class="bemm('container')">
    <aside :class="bemm('sidebar')">
      <AdminNavigation />
    </aside>
    <div :class="bemm('content')">
      <router-view />
    </div>

    <!-- Upload Status Bar -->
    <TStatusBar :show="hasItems">
      <UploadStatus @close="hasItems = false" />
    </TStatusBar>
  </div>
</template>

<script lang="ts" setup>
import { inject } from 'vue';
import { useBemm } from 'bemm';
import { TStatusBar } from '@tiko/ui';
import { useUpload } from '@tiko/core';
import { uploadService } from '../services/upload.service';
import type { ToastService } from '@tiko/ui';
import UploadStatus from '../components/UploadStatus.vue';
import AdminNavigation from '@/components/AdminNavigation.vue';


const bemm = useBemm('admin-layout');
const toastService = inject<ToastService>('toastService');

// Initialize upload composable with service
const { hasItems } = useUpload(uploadService, toastService);

</script>

<style lang="scss">
.admin-layout {


  &__container {
    display: flex;
    position: sticky;
    top: 100px;
  }

  &__sidebar {
    --topbar-height: calc(4rem + var(--space));

    width: clamp(240px, 15vw, 320px);
    border-right: 1px solid var(--color-accent);
    height: fit-content;
    max-height: calc(100vh - (var(--topbar-height)) - var(--space));
    position: sticky;
    top: var(--topbar-height);


    @media screen and (max-width: 1024px) {
      position: fixed;
      top: var(--topbar-height);
      border: 1px solid var(--color-secondary);
      z-index: 10;
      background-color: var(--color-background);
      padding: var(--space);
      width: auto;
      border-radius: 0 var(--border-radius) var(--border-radius) 0;
      border-left: 0;
      transform: translateX(calc(-100% + var(--space-l)));

      transition: transform 0.3s ease-in-out;

      &:hover{
        transform: translateX(0);

      }
    }
  }

  &__navigation {
    display: flex;
    flex-direction: column;
    padding: var(--space);
    position: sticky;
    top: 80px;
  }

  &__content {
    width: 100%;
    padding: var(--spacing);
  }

}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

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
    background: var(--color-accent);
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
}
</style>
