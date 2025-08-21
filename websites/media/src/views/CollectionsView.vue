<template>
  <div :class="bemm()">
    <section :class="bemm('intro')">

    <div :class="bemm('header')">
      <h1 :class="bemm('title')">{{ t('media.collections.title') }}</h1>
      <p :class="bemm('description')">{{ t('media.collections.description') }}</p>
    </div>
  </section>

    <!-- My Collections Section (when logged in) -->
    <MyCollections
      v-if="authStore.user"
      @create="showCreateDialog = true"
      :class="bemm('section')"
    />

    <!-- Signup Inspiration Section (when not logged in) -->
    <SignupInspiration
      v-else
      :class="bemm('section')"
    />

    <!-- Curated Collections Section (always visible) -->
    <CuratedCollections :class="bemm('section')" />

    <!-- Create Collection Dialog -->
    <CreateCollectionDialog
      v-if="showCreateDialog"
      @close="showCreateDialog = false"
      @success="handleCollectionCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBemm } from 'bemm'
import { useI18n, useAuthStore, useCollectionsStore } from '@tiko/core'
import MyCollections from '@/components/MyCollections.vue'
import SignupInspiration from '@/components/SignupInspiration.vue'
import CuratedCollections from '@/components/CuratedCollections.vue'
import CreateCollectionDialog from '@/components/CreateCollectionDialog.vue'

const bemm = useBemm('collections-view')
const { t } = useI18n()
const authStore = useAuthStore()
const collectionsStore = useCollectionsStore()

// State
const showCreateDialog = ref(false)

// Methods
const handleCollectionCreated = () => {
  showCreateDialog.value = false
  // Refresh collections
  collectionsStore.loadCollections()
}
</script>

<style lang="scss">
.collections-view {
  max-width: var(--max-width);
  margin: 0 auto;


  &__intro{
    padding: var(--spacing);
  }

  &__header {
    margin-bottom: var(--space-xl);
  }

  &__title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    margin: 0 0 var(--space-s) 0;
  }

  &__description {
    color: var(--color-foreground-secondary);
    margin: 0;
  }

  &__section {

    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
