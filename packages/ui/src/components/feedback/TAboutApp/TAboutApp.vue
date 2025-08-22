<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <!-- <h2 :class="bemm('title')">{{ title || appName }}</h2> -->
    </div>

    <div v-if="appInfo?.content?.description || appInfo?.description" :class="bemm('description')">
      <p>{{ appInfo.content?.description || appInfo.description }}</p>
    </div>

    <div v-if="!loading && !contentLoading" :class="bemm('info')">
      <div :class="bemm('info-row')">
        <span :class="bemm('label')">{{ t('common.version') }}:</span>
        <span :class="bemm('value')">{{ versionString }}</span>
      </div>

      <div :class="bemm('info-row')">
        <span :class="bemm('label')">{{ t('common.build') }}:</span>
        <span :class="bemm('value')">{{ deploymentString }}</span>
      </div>

      <div v-if="buildInfo?.environment" :class="bemm('info-row')">
        <span :class="bemm('label')">{{ t('common.environment') }}:</span>
        <span :class="bemm('value')">{{ buildInfo.environment }}</span>
      </div>
    </div>

    <div v-else-if="loading || contentLoading" :class="bemm('loading')">
      <span>{{ t('common.loading') }}...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { useContent } from '@tiko/core'
import { useI18n } from '@tiko/core';
import { useBuildInfo } from '../../../composables/useBuildInfo'

interface TAboutAppProps {
  appName: string
  title?: string
}

const props = defineProps<TAboutAppProps>()
const bemm = useBemm('about-app')
const { t } = useI18n()

// State
const appInfo = ref<any>(null)
const contentLoading = ref(false)

// Build info
const { buildInfo, versionString, deploymentString, loading, loadBuildInfo } = useBuildInfo()

// Load app info on mount
onMounted(async () => {
  contentLoading.value = true
  try {
    const { getContentItem } = useContent()
    // Use appName as the slug to fetch content
    const contentItem = await getContentItem(props.appName)
    console.log(`[TAboutApp] Fetched content for app '${props.appName}':`, contentItem)
    appInfo.value = contentItem
  } catch (error) {
    console.error(`[TAboutApp] Failed to load app info for '${props.appName}':`, error)
    // Try with lowercase if the first attempt fails
    try {
      const { getContentItem } = useContent()
      const contentItem = await getContentItem(props.appName.toLowerCase())
      console.log(`[TAboutApp] Fetched content with lowercase slug '${props.appName.toLowerCase()}':`, contentItem)
      appInfo.value = contentItem
    } catch (retryError) {
      console.error(`[TAboutApp] Failed to load app info with lowercase slug:`, retryError)
    }
  } finally {
    contentLoading.value = false
  }

  // Load build info
  await loadBuildInfo()
})
</script>

<style lang="scss">
.about-app {
  padding: var(--space);
  text-align: center;

  &__header {
    margin-bottom: var(--space);
  }

  &__title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-foreground);
  }

  &__description {
    margin: var(--space) 0;
    color: var(--color-text-secondary);

    p {
      margin: 0;
      line-height: 1.5;
    }
  }

  &__info {
    margin-top: var(--space-xl);
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  &__info-row {
    margin: var(--space-s) 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-s);
  }

  &__label {
    font-weight: 600;
  }

  &__value {
    color: var(--color-foreground);
  }

  &__loading {
    margin-top: var(--space-xl);
    color: var(--color-text-secondary);
  }
}
</style>
