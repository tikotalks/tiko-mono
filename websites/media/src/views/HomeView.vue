<template>
  <div :class="bemm()">
    <!-- Hero Section -->
    <section :class="bemm('hero')">
      <div :class="bemm('hero-content')">
        <h1 :class="bemm('hero-title')">{{ t('media.home.heroTitle') }}</h1>
        <p :class="bemm('hero-description')">{{ t('media.home.heroDescription') }}</p>
        <div :class="bemm('hero-actions')">
          <TButton
            @click="router.push('/library')"
            size="large"
          >
            {{ t('media.home.browseLibrary') }}
          </TButton>
          <TButton
            type="outline"
            @click="router.push('/categories')"
            size="large"
          >
            {{ t('media.home.viewCategories') }}
          </TButton>
        </div>
      </div>
    </section>

    <!-- Featured Images -->
    <section :class="bemm('featured')" v-if="featuredImages.length > 0">
      <h2 :class="bemm('section-title')">{{ t('media.home.featured') }}</h2>
      <TGrid :min-item-width="'350px'" :lazy="true">
        <router-link
          v-for="media in featuredImages"
          :key="media.id"
          :to="`/media/${media.id}`"
          :class="bemm('media-link')"
        >
          <TMediaTile
            :media="media"
            :get-image-variants="getImageVariants"
          />
        </router-link>
      </TGrid>
    </section>

    <!-- Recent Uploads -->
    <section :class="bemm('recent')" v-if="recentImages.length > 0">
      <div :class="bemm('section-header')">
        <h2 :class="bemm('section-title')">{{ t('media.home.recentUploads') }}</h2>
        <router-link to="/library" :class="bemm('view-all')">
          {{ t('common.viewAll') }}
          <TIcon :name="Icons.ARROW_RIGHT" />
        </router-link>
      </div>
      <TGrid :min-item-width="'300px'" :lazy="true">
        <router-link
          v-for="media in recentImages"
          :key="media.id"
          :to="`/media/${media.id}`"
          :class="bemm('media-link')"
        >
          <TMediaTile
            :media="media"
            :get-image-variants="getImageVariants"
          />
        </router-link>
      </TGrid>
    </section>

    <!-- Stats Section -->
    <section :class="bemm('stats')">
      <div :class="bemm('stat')">
        <div :class="bemm('stat-value')">{{ totalImages }}</div>
        <div :class="bemm('stat-label')">{{ t('media.home.totalImages') }}</div>
      </div>
      <div :class="bemm('stat')">
        <div :class="bemm('stat-value')">{{ totalCollections }}</div>
        <div :class="bemm('stat-label')">{{ t('media.home.totalCollections') }}</div>
      </div>
      <div :class="bemm('stat')">
        <div :class="bemm('stat-value')">{{ totalCategories }}</div>
        <div :class="bemm('stat-label')">{{ t('media.home.totalCategories') }}</div>
      </div>
      <div :class="bemm('stat')">
        <div :class="bemm('stat-value')">{{ totalTags }}</div>
        <div :class="bemm('stat-label')">{{ t('media.home.totalTags') }}</div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { useImageUrl, useImages } from '@tiko/core'
import {
  useI18n,
  TButton,
  TGrid,
  TMediaTile,
  TIcon
} from '@tiko/ui'

const bemm = useBemm('home-view')
const { t } = useI18n()
const router = useRouter()
const { getImageVariants } = useImageUrl()
const { imageList, loading, loadImages } = useImages(true) // Use public mode

// Featured images (can be managed through CMS later)
const featuredImages = computed(() => {
  return imageList.value
    .filter(img => img.tags?.includes('featured'))
    .slice(0, 6)
})

// Recent uploads
const recentImages = computed(() => {
  return [...imageList.value]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 9)
})

// Stats
const totalImages = computed(() => imageList.value.length)
const totalCollections = ref(0) // Will be updated when collections are implemented
const totalCategories = computed(() => {
  const categories = new Set<string>()
  imageList.value.forEach(img => {
    img.categories?.forEach(cat => categories.add(cat))
  })
  return categories.size
})

const totalTags = computed(() => {
  const tags = new Set<string>()
  imageList.value.forEach(img => {
    img.tags?.forEach(tag => tags.add(tag))
  })
  return tags.size
})

onMounted(() => {
  loadImages()
})
</script>

<style lang="scss">
.home-view {
  &__hero {
    padding: var(--spacing);
    color: var(--color-foreground);
    text-align: center;
  }

  &__hero-content {
    display: flex; justify-content: center;
    flex-direction: column;
    align-items: center;
    gap: var(--space-l);
    margin: 0 auto;
  }

  &__hero-title {
    color: var(--color-primary);
    font-size: clamp(2.5em, 5vw, 4em);
    line-height: 1;
  }

  &__hero-description {
    font-size: var(--font-size-lg);
  }

  &__hero-actions {
    display: flex;
    gap: var(--space);
    justify-content: center;
    flex-wrap: wrap;
  }

  &__featured,
  &__recent {
    padding: var(--spacing);
    max-width: var(--max-width);
    margin: 0 auto;
  }

  &__section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-l);
  }

  &__section-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    margin: 0 0 var(--space-lg) 0;
  }

  &__view-all {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    color: var(--color-primary);
    text-decoration: none;
    font-weight: var(--font-weight-medium);

    &:hover {
      text-decoration: underline;
    }
  }

  &__media-link {
    text-decoration: none;
    color: inherit;
    display: block;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing);
    padding: var(--spacing);
    background: color-mix(in srgb, var(--color-primary), var(--color-background) 75%);
    text-align: center;
  }

  &__stat {
    padding: var(--space-lg);
  }

  &__stat-value {
    font-size: var(--font-size-xxl);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
  }

  &__stat-label {
    color: var(--color-foreground-secondary);
    margin-top: var(--space-xs);
  }
}
</style>

