<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="t('common.dashboard')"
      :description="t('admin.dashboard.description')"
    />

    <div :class="bemm('content')">
      <!-- User Statistics Section -->
      <section :class="bemm('section')">
        <h2 :class="bemm('section-title')">{{ t('admin.dashboard.users') }}</h2>
        <div :class="bemm('stats')">
          <TCard>
            <h5>{{ t('admin.dashboard.totalUsers') }}</h5>
            <p class="stat-value">{{ userStats?.totalUsers || 0 }}</p>
          </TCard>

          <TCard>
            <h5>{{ t('admin.dashboard.activeUsers') }}</h5>
            <p class="stat-value">{{ userStats?.activeUsers || 0 }}</p>
          </TCard>

          <TCard>
            <h5>{{ t('admin.dashboard.newUsersToday') }}</h5>
            <p class="stat-value">{{ userStats?.newUsersToday || 0 }}</p>
          </TCard>

          <TCard>
            <h5>{{ t('admin.dashboard.adminUsers') }}</h5>
            <p class="stat-value">{{ userStats?.adminUsers || 0 }}</p>
          </TCard>
        </div>
      </section>

      <!-- Media Statistics Section -->
      <section :class="bemm('section')">
        <h2 :class="bemm('section-title')">{{ t('admin.dashboard.media') }}</h2>
        <div :class="bemm('stats')">
          <TCard>
            <h5>{{ t('admin.dashboard.totalMediaItems') }}</h5>
            <p class="stat-value">{{ mediaCount }}</p>
          </TCard>

          <TCard>
            <h5>{{ t('admin.dashboard.storageUsed') }}</h5>
            <p class="stat-value">{{ formatBytes(mediaStats?.storageUsed || 0) }}</p>
          </TCard>

          <TCard>
            <h5>{{ t('admin.dashboard.lastUpload') }}</h5>
            <p class="stat-value">{{ mediaStats?.lastUpload ? formatDate(mediaStats.lastUpload) : t('common.never') }}</p>
          </TCard>
        </div>
      </section>

      <!-- Translation Statistics Section -->
      <section :class="bemm('section')">
        <h2 :class="bemm('section-title')">{{ t('admin.dashboard.translations') }}</h2>
        <div :class="bemm('stats')">
          <TCard>
            <h5>{{ t('admin.dashboard.totalLocales') }}</h5>
            <p class="stat-value">{{ translationStats?.locales?.length || 0 }}</p>
          </TCard>

          <TCard>
            <h5>{{ t('admin.dashboard.totalStrings') }}</h5>
            <p class="stat-value">{{ translationStats?.totalKeys || 0 }}</p>
          </TCard>

          <TCard>
            <h5>{{ t('admin.dashboard.missingTranslations') }}</h5>
            <p class="stat-value">{{ totalMissingTranslations }}</p>
          </TCard>

          <TCard>
            <h5>{{ t('admin.dashboard.completionRate') }}</h5>
            <p class="stat-value">{{ averageCompletionRate }}%</p>
          </TCard>
        </div>

        <!-- Translation completeness by locale -->
        <div :class="bemm('translation-details')" v-if="translationStats?.completeness">
          <h3>{{ t('admin.dashboard.completionByLocale') }}</h3>
          <div :class="bemm('locale-list')">
            <TProgressBar
              v-for="(data, locale) in translationStats.completeness.filter(item => !item.locale.includes('-'))"
              :key="locale"
              :prefix="locale"
              :value="data.percentage"
              :show-percentage="true"
              :max="100"
              :class="bemm('locale-progress')"
            />
<!--
            <div
              v-for="(data, locale) in translationStats.completeness"
              :key="locale"
              :class="bemm('locale-item')"
            >
              <span :class="bemm('locale-name')">{{ locale }}</span>
              <div :class="bemm('progress-bar')">
                <div
                  :class="bemm('progress-fill')"
                  :style="{ width: `${data.percentage}%` }"
                ></div>
              </div>
              <span :class="bemm('locale-percentage')">{{ data.percentage }}%</span>
            </div> -->
          </div>
        </div>
      </section>

      <!-- Quick Actions Section -->
      <section :class="bemm('section')">
        <h2 :class="bemm('section-title')">{{ t('admin.dashboard.quickActions') }}</h2>
        <div :class="bemm('actions')">
          <TCard
            clickable
            @click="router.push({ name: 'Users' })"
            :class="bemm('action-card')"
          >
            <TIcon :name="Icons.USER_GROUP" size="large" />
            <h3>{{ t('admin.dashboard.manageUsers') }}</h3>
            <p>{{ t('admin.dashboard.manageUsersDescription') }}</p>
          </TCard>

          <TCard
            clickable
            @click="router.push({ name: 'Library' })"
            :class="bemm('action-card')"
          >
            <TIcon :name="Icons.IMAGE" size="large" />
            <h3>{{ t('admin.dashboard.viewLibrary') }}</h3>
            <p>{{ t('admin.dashboard.libraryDescription') }}</p>
          </TCard>

          <TCard
            clickable
            @click="router.push({ name: 'Upload' })"
            :class="bemm('action-card')"
          >
            <TIcon :name="Icons.ARROW_UPLOAD" size="large" />
            <h3>{{ t('admin.dashboard.uploadImages') }}</h3>
            <p>{{ t('admin.dashboard.uploadDescription') }}</p>
          </TCard>

          <TCard
            clickable
            @click="router.push({ name: 'Translations' })"
            :class="bemm('action-card')"
          >
            <TIcon :name="Icons.SPEECH_BALLOONS" size="large" />
            <h3>{{ t('admin.dashboard.manageTranslations') }}</h3>
            <p>{{ t('admin.dashboard.manageTranslationsDescription') }}</p>
          </TCard>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { useI18n, TCard, TIcon, TProgressBar } from '@tiko/ui'
import { userService, translationService, useImages, formatBytes, formatDate, logger } from '@tiko/core'
import { Icons } from 'open-icon'
import AdminPageHeader from '../components/AdminPageHeader.vue'

const { t } = useI18n()
const bemm = useBemm('admin-dashboard')
const router = useRouter()

// State
const userStats = ref<any>(null)
const translationStats = ref<any>(null)
const mediaCount = ref(0)
const { stats: mediaStats, loadImages } = useImages()

// Computed properties
const totalMissingTranslations = computed(() => {
  if (!translationStats.value?.completeness) return 0
  return Object.values(translationStats.value.completeness).reduce(
    (total: number, data: any) => total + data.missing,
    0
  )
})

const averageCompletionRate = computed(() => {
  if (!translationStats.value?.completeness) return 0
  const completeness = Object.values(translationStats.value.completeness)
  if (completeness.length === 0) return 0
  const sum = completeness.reduce((total: number, data: any) => total + data.percentage, 0)
  return Math.round(sum / completeness.length)
})


// Load all statistics
const loadStatistics = async () => {
  try {
    // Load user statistics
    userStats.value = await userService.getUserStats()

    // Load translation statistics
    translationStats.value = await translationService.getStatistics()

    // Load media statistics
    await loadImages()
    mediaCount.value = mediaStats.value.totalImages
  } catch (error) {
    logger.error('Failed to load statistics:', error)
  }
}

onMounted(() => {
  loadStatistics()
})
</script>

<style lang="scss">
.admin-dashboard {
  height: 100%;
  display: flex;
  flex-direction: column;


  &__content {
    flex: 1;
    padding: var(--space);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__section-title {
    font-size: var(--font-size-l);
    color: var(--color-text-secondary);
    margin: 0;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space);

    h3 {
      font-size: var(--font-size-s);
      color: var(--color-text-secondary);
      margin-bottom: var(--space-xs);
    }

    .stat-value {
      font-size: var(--font-size-2xl);
      font-weight: bold;
      margin: 0;
    }
  }

  &__translation-details {
    background: var(--color-background-secondary);
    padding: var(--space);
    border-radius: var(--border-radius);

    h3 {
      font-size: var(--font-size-m);
      margin-bottom: var(--space);
    }
  }

  &__locale-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
  }

  &__locale-item {
    display: flex;
    align-items: center;
    gap: var(--space);
  }

  &__locale-name {
    min-width: 60px;
    font-weight: 500;
  }

  &__progress-bar {
    flex: 1;
    height: 8px;
    background: var(--color-border);
    border-radius: 4px;
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background: var(--color-primary);
    transition: width 0.3s ease;
  }

  &__locale-percentage {
    min-width: 50px;
    text-align: right;
    font-size: var(--font-size-s);
    color: var(--color-text-secondary);
  }

  &__actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space);

    .icon{
      font-size: 2em;
      color: var(--color-secondary)
    }
  }

  &__action-card {
    text-align: center;
    padding: var(--space-l);
    transition: transform 0.2s;
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
    }

    h3 {
      margin: var(--space) 0 var(--space-xs);
    }

    p {
      color: var(--color-text-secondary);
      font-size: var(--font-size-s);
      margin: 0;
    }
  }
}
</style>
