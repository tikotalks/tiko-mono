<template>
  <div :class="bemm()">
    <div :class="bemm('content')">
      <!-- Main Stats Grid -->
      <div :class="bemm('stats')">
        <TCard :class="bemm('stat-card')">
          <div :class="bemm('stat-icon')">
            <TIcon :name="Icons.USER_GROUPS" />
          </div>
          <h3>{{ t('admin.dashboard.totalUsers') }}</h3>
          <p class="stat-value">{{ userStats.totalUsers }}</p>
          <p class="stat-trend">{{ userStats.newUsersToday }} {{ t('admin.dashboard.newToday') }}</p>
        </TCard>

        <TCard :class="bemm('stat-card')">
          <div :class="bemm('stat-icon')">
            <TIcon :name="Icons.IMAGE" />
          </div>
          <h3>{{ t('admin.dashboard.totalMedia') }}</h3>
          <p class="stat-value">{{ mediaStats.totalImages }}</p>
          <p class="stat-trend">{{ formatBytes(mediaStats.storageUsed) }} {{ t('admin.dashboard.storage') }}</p>
        </TCard>

        <TCard :class="bemm('stat-card')">
          <div :class="bemm('stat-icon')">
            <TIcon :name="Icons.ACTIVITY" />
          </div>
          <h3>{{ t('admin.dashboard.activeUsers') }}</h3>
          <p class="stat-value">{{ userStats.activeToday }}</p>
          <p class="stat-trend">{{ userStats.activeTrend }}% {{ t('admin.dashboard.fromYesterday') }}</p>
        </TCard>

        <TCard :class="bemm('stat-card')">
          <div :class="bemm('stat-icon')">
            <TIcon :name="Icons.CHART_UP" />
          </div>
          <h3>{{ t('admin.dashboard.totalVisits') }}</h3>
          <p class="stat-value">{{ formatNumber(visitorStats.totalVisits) }}</p>
          <p class="stat-trend">{{ visitorStats.visitsToday }} {{ t('admin.dashboard.today') }}</p>
        </TCard>
      </div>

      <!-- Quick Actions -->
      <h2 :class="bemm('section-title')">{{ t('admin.dashboard.quickActions') }}</h2>
      <div :class="bemm('actions')">
        <TCard
          clickable
          @click="router.push('/users')"
          :class="bemm('action-card')"
        >
          <TIcon :name="Icons.USER_GROUPS" size="large" />
          <h3>{{ t('admin.dashboard.manageUsers') }}</h3>
          <p>{{ t('admin.dashboard.manageUsersDescription') }}</p>
        </TCard>

        <TCard
          clickable
          @click="router.push('/media')"
          :class="bemm('action-card')"
        >
          <TIcon :name="Icons.IMAGE" size="large" />
          <h3>{{ t('admin.dashboard.mediaLibrary') }}</h3>
          <p>{{ t('admin.dashboard.mediaLibraryDescription') }}</p>
        </TCard>

        <TCard
          clickable
          @click="router.push('/analytics')"
          :class="bemm('action-card')"
        >
          <TIcon :name="Icons.CHART_LINE" size="large" />
          <h3>{{ t('admin.dashboard.viewAnalytics') }}</h3>
          <p>{{ t('admin.dashboard.viewAnalyticsDescription') }}</p>
        </TCard>

        <TCard
          clickable
          @click="router.push('/settings')"
          :class="bemm('action-card')"
        >
          <TIcon :name="Icons.SETTINGS" size="large" />
          <h3>{{ t('admin.dashboard.systemSettings') }}</h3>
          <p>{{ t('admin.dashboard.systemSettingsDescription') }}</p>
        </TCard>
      </div>

      <!-- Recent Activity -->
      <h2 :class="bemm('section-title')">{{ t('admin.dashboard.recentActivity') }}</h2>
      <TCard :class="bemm('activity-card')">
        <div v-if="loadingActivity" :class="bemm('loading')">
          <TSpinner />
        </div>
        <div v-else-if="recentActivity.length === 0" :class="bemm('empty')">
          <p>{{ t('admin.dashboard.noRecentActivity') }}</p>
        </div>
        <div v-else :class="bemm('activity-list')">
          <div
            v-for="activity in recentActivity"
            :key="activity.id"
            :class="bemm('activity-item')"
          >
            <TIcon :name="getActivityIcon(activity.type)" :class="bemm('activity-icon')" />
            <div :class="bemm('activity-content')">
              <p :class="bemm('activity-description')">{{ activity.description }}</p>
              <p :class="bemm('activity-time')">{{ formatTimeAgo(activity.timestamp) }}</p>
            </div>
          </div>
        </div>
      </TCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { useI18n, TCard, TIcon, TSpinner } from '@tiko/ui'
import { authService, useImages, userService } from '@tiko/core'
import { Icons } from 'open-icon'
import type { RecentActivity, UserStats, VisitorStats } from '../types/dashboard.types'

const bemm = useBemm('dashboard-view')
const { t } = useI18n()
const router = useRouter()
const { stats: mediaStats, loadImages } = useImages()

// Mock data for now - replace with actual API calls
const userStats = ref<UserStats>({
  totalUsers: 0,
  activeToday: 0,
  newUsersToday: 0,
  activeTrend: 0
})

const visitorStats = ref<VisitorStats>({
  totalVisits: 0,
  visitsToday: 0,
  uniqueVisitors: 0,
  averageSessionDuration: 0
})

const recentActivity = ref<RecentActivity[]>([])
const loadingActivity = ref(true)



const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date: Date | null): string => {
  if (!date) return t('common.never')
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatTimeAgo = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (days > 0) return t('admin.dashboard.daysAgo', { count: days })
  if (hours > 0) return t('admin.dashboard.hoursAgo', { count: hours })
  if (minutes > 0) return t('admin.dashboard.minutesAgo', { count: minutes })
  return t('admin.dashboard.justNow')
}

const getActivityIcon = (type: string): Icons => {
  switch (type) {
    case 'user_login': return Icons.USER
    case 'user_register': return Icons.USER_ADD
    case 'media_upload': return Icons.ARROW_UPLOAD
    case 'media_delete': return Icons.MULTIPLY_M
    case 'settings_change': return Icons.SETTINGS
    default: return Icons.ACTIVITY
  }
}

const loadDashboardData = async () => {
  try {
    // Load media stats
    await loadImages()

    // Load real user stats
    const stats = await userService.getUserStats()
    userStats.value = {
      totalUsers: stats.totalUsers,
      activeToday: stats.activeUsers,
      newUsersToday: stats.newUsersToday,
      activeTrend: 0 // TODO: Calculate trend when we have historical data
    }

    // Mock visitor stats
    visitorStats.value = {
      totalVisits: 45678,
      visitsToday: 234,
      uniqueVisitors: 12345,
      averageSessionDuration: 345
    }

    // Mock recent activity
    recentActivity.value = [
      {
        id: '1',
        type: 'user_login',
        description: t('admin.dashboard.userLoggedIn', { username: 'john.doe' }),
        timestamp: new Date(Date.now() - 15 * 60000)
      },
      {
        id: '2',
        type: 'media_upload',
        description: t('admin.dashboard.mediaUploaded', { filename: 'product-image.jpg' }),
        timestamp: new Date(Date.now() - 45 * 60000)
      },
      {
        id: '3',
        type: 'user_register',
        description: t('admin.dashboard.newUserRegistered', { username: 'jane.smith' }),
        timestamp: new Date(Date.now() - 2 * 3600000)
      }
    ]
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loadingActivity.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style lang="scss">
.dashboard-view {
  height: 100%;
  display: flex;
  flex-direction: column;

  &__content {
    flex: 1;
    padding: var(--space);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-l);
  }

  &__section-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin: var(--space) 0;
    color: var(--color-foreground);
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space);
  }

  &__stat-card {
    position: relative;
    overflow: hidden;

    .stat-value {
      font-size: var(--font-size-3xl);
      font-weight: bold;
      color: var(--color-primary);
      margin: var(--space-xs) 0;
    }

    .stat-trend {
      font-size: var(--font-size-s);
      color: var(--color-text-secondary);
      opacity: 0.8;
    }

    h3 {
      font-size: var(--font-size-s);
      color: var(--color-text-secondary);
      margin-bottom: var(--space-xs);
      font-weight: normal;
    }
  }

  &__stat-icon {
    position: absolute;
    top: var(--space);
    right: var(--space);
    font-size: 2rem;
    opacity: 0.1;
    color: var(--color-primary);
  }

  &__actions {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: var(--space);
  }

  &__action-card {
    text-align: center;
    padding: var(--space-l);
    transition: all 0.2s;
    cursor: pointer;
    border: 2px solid transparent;

    &:hover {
      transform: translateY(-2px);
      border-color: var(--color-primary);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .t-icon {
      color: var(--color-primary);
      margin-bottom: var(--space);
    }

    h3 {
      margin: var(--space) 0 var(--space-xs);
      font-size: var(--font-size);
    }

    p {
      color: var(--color-text-secondary);
      font-size: var(--font-size-s);
      line-height: 1.4;
    }
  }

  &__activity-card {
    min-height: 300px;
  }

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--space-xl);
  }

  &__empty {
    text-align: center;
    padding: var(--space-xl);
    color: var(--color-text-secondary);
  }

  &__activity-list {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__activity-item {
    display: flex;
    gap: var(--space);
    padding: var(--space);
    border-radius: var(--border-radius);
    background: var(--color-background-secondary);
    transition: background-color 0.2s;

    &:hover {
      background: var(--color-background-tertiary);
    }
  }

  &__activity-icon {
    font-size: 1.5rem;
    color: var(--color-primary);
    opacity: 0.7;
  }

  &__activity-content {
    flex: 1;
  }

  &__activity-description {
    font-size: var(--font-size);
    margin-bottom: var(--space-xs);
  }

  &__activity-time {
    font-size: var(--font-size-s);
    color: var(--color-text-secondary);
    opacity: 0.7;
  }
}</style>
