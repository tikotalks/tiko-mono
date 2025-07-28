<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h1>{{ t('admin.analytics.title') }}</h1>
      <div :class="bemm('date-range')">
        <TButton
          v-for="range in dateRanges"
          :key="range.value"
          :type="selectedRange === range.value ? 'default' : 'ghost'"
          size="small"
          @click="selectedRange = range.value"
        >
          {{ t(range.label) }}
        </TButton>
      </div>
    </div>

    <div :class="bemm('content')">
      <!-- Overview Cards -->
      <div :class="bemm('overview')">
        <TCard :class="bemm('metric-card')">
          <h3>{{ t('admin.analytics.pageViews') }}</h3>
          <p class="metric-value">{{ formatNumber(analytics.pageViews) }}</p>
          <p class="metric-change" :class="{ positive: analytics.pageViewsChange > 0 }">
            {{ analytics.pageViewsChange > 0 ? '+' : '' }}{{ analytics.pageViewsChange }}%
          </p>
        </TCard>

        <TCard :class="bemm('metric-card')">
          <h3>{{ t('admin.analytics.uniqueVisitors') }}</h3>
          <p class="metric-value">{{ formatNumber(analytics.uniqueVisitors) }}</p>
          <p class="metric-change" :class="{ positive: analytics.visitorsChange > 0 }">
            {{ analytics.visitorsChange > 0 ? '+' : '' }}{{ analytics.visitorsChange }}%
          </p>
        </TCard>

        <TCard :class="bemm('metric-card')">
          <h3>{{ t('admin.analytics.avgSessionDuration') }}</h3>
          <p class="metric-value">{{ formatDuration(analytics.avgSessionDuration) }}</p>
          <p class="metric-change" :class="{ positive: analytics.sessionChange > 0 }">
            {{ analytics.sessionChange > 0 ? '+' : '' }}{{ analytics.sessionChange }}%
          </p>
        </TCard>

        <TCard :class="bemm('metric-card')">
          <h3>{{ t('admin.analytics.bounceRate') }}</h3>
          <p class="metric-value">{{ analytics.bounceRate }}%</p>
          <p class="metric-change" :class="{ positive: analytics.bounceChange < 0 }">
            {{ analytics.bounceChange > 0 ? '+' : '' }}{{ analytics.bounceChange }}%
          </p>
        </TCard>
      </div>

      <!-- Charts Section -->
      <div :class="bemm('charts')">
        <TCard :class="bemm('chart-card', 'full-width')">
          <h3>{{ t('admin.analytics.visitorTrend') }}</h3>
          <div :class="bemm('chart-placeholder')">
            <p>{{ t('admin.analytics.chartPlaceholder') }}</p>
          </div>
        </TCard>

        <TCard :class="bemm('chart-card')">
          <h3>{{ t('admin.analytics.topPages') }}</h3>
          <div :class="bemm('list')">
            <div
              v-for="page in topPages"
              :key="page.path"
              :class="bemm('list-item')"
            >
              <span :class="bemm('page-path')">{{ page.path }}</span>
              <span :class="bemm('page-views')">{{ formatNumber(page.views) }}</span>
            </div>
          </div>
        </TCard>

        <TCard :class="bemm('chart-card')">
          <h3>{{ t('admin.analytics.userActivity') }}</h3>
          <div :class="bemm('list')">
            <div
              v-for="activity in userActivities"
              :key="activity.action"
              :class="bemm('list-item')"
            >
              <span :class="bemm('activity-name')">{{ t(activity.label) }}</span>
              <span :class="bemm('activity-count')">{{ formatNumber(activity.count) }}</span>
            </div>
          </div>
        </TCard>
      </div>

      <!-- User Behavior -->
      <TCard :class="bemm('behavior-card')">
        <h3>{{ t('admin.analytics.userBehavior') }}</h3>
        <div :class="bemm('behavior-grid')">
          <div :class="bemm('behavior-item')">
            <h4>{{ t('admin.analytics.deviceTypes') }}</h4>
            <div :class="bemm('device-list')">
              <div v-for="device in deviceTypes" :key="device.type" :class="bemm('device-item')">
                <TIcon :name="getDeviceIcon(device.type)" />
                <span>{{ device.label }}</span>
                <span class="percentage">{{ device.percentage }}%</span>
              </div>
            </div>
          </div>

          <div :class="bemm('behavior-item')">
            <h4>{{ t('admin.analytics.trafficSources') }}</h4>
            <div :class="bemm('source-list')">
              <div v-for="source in trafficSources" :key="source.type" :class="bemm('source-item')">
                <span class="source-name">{{ source.label }}</span>
                <div class="source-bar">
                  <div class="source-fill" :style="{ width: source.percentage + '%' }"></div>
                </div>
                <span class="source-value">{{ source.percentage }}%</span>
              </div>
            </div>
          </div>
        </div>
      </TCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { useI18n, TCard, TButton, TIcon } from '@tiko/ui'
import { Icons } from 'open-icon'

const bemm = useBemm('analytics-view')
const { t } = useI18n()

// Date range selection
const selectedRange = ref('week')
const dateRanges = [
  { value: 'today', label: 'admin.analytics.today' },
  { value: 'week', label: 'admin.analytics.thisWeek' },
  { value: 'month', label: 'admin.analytics.thisMonth' },
  { value: 'year', label: 'admin.analytics.thisYear' }
]

// Mock analytics data - replace with actual API calls
const analytics = ref({
  pageViews: 45678,
  pageViewsChange: 12.5,
  uniqueVisitors: 12345,
  visitorsChange: 8.3,
  avgSessionDuration: 234,
  sessionChange: -2.1,
  bounceRate: 42.3,
  bounceChange: -5.2
})

const topPages = ref([
  { path: '/', views: 12345 },
  { path: '/timer', views: 8934 },
  { path: '/radio', views: 6789 },
  { path: '/cards', views: 5432 },
  { path: '/yes-no', views: 3210 }
])

const userActivities = ref([
  { action: 'login', label: 'admin.analytics.logins', count: 1234 },
  { action: 'timer_start', label: 'admin.analytics.timerStarts', count: 987 },
  { action: 'radio_play', label: 'admin.analytics.radioPlays', count: 654 },
  { action: 'card_created', label: 'admin.analytics.cardsCreated', count: 321 }
])

const deviceTypes = ref([
  { type: 'desktop', label: 'Desktop', percentage: 45, icon: Icons.COMPUTER },
  { type: 'mobile', label: 'Mobile', percentage: 38, icon: Icons.PHONE },
  { type: 'tablet', label: 'Tablet', percentage: 17, icon: Icons.TABLET }
])

const trafficSources = ref([
  { type: 'direct', label: 'Direct', percentage: 42 },
  { type: 'search', label: 'Search', percentage: 28 },
  { type: 'social', label: 'Social', percentage: 18 },
  { type: 'referral', label: 'Referral', percentage: 12 }
])

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const getDeviceIcon = (type: string): Icons => {
  switch (type) {
    case 'desktop': return Icons.COMPUTER
    case 'mobile': return Icons.PHONE
    case 'tablet': return Icons.TABLET
    default: return Icons.DEVICE
  }
}

onMounted(() => {
  // TODO: Load actual analytics data
  console.log('Loading analytics for range:', selectedRange.value)
})
</script>

<style lang="scss">
.analytics-view {
  padding: var(--space);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-l);

    h1 {
      font-size: var(--font-size-xl);
      font-weight: 600;
    }
  }

  &__date-range {
    display: flex;
    gap: var(--space-xs);
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-l);
  }

  &__overview {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--space);
  }

  &__metric-card {
    text-align: center;

    h3 {
      font-size: var(--font-size-s);
      color: var(--color-text-secondary);
      margin-bottom: var(--space-xs);
      font-weight: normal;
    }

    .metric-value {
      font-size: var(--font-size-2xl);
      font-weight: bold;
      color: var(--color-primary);
      margin: var(--space-xs) 0;
    }

    .metric-change {
      font-size: var(--font-size-s);
      color: var(--color-error);

      &.positive {
        color: var(--color-success);
      }
    }
  }

  &__charts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: var(--space);
  }

  &__chart-card {
    h3 {
      margin-bottom: var(--space);
      font-size: var(--font-size);
    }

    &--full-width {
      grid-column: 1 / -1;
    }
  }

  &__chart-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 300px;
    background: var(--color-background-secondary);
    border-radius: var(--border-radius);
    color: var(--color-text-secondary);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__list-item {
    display: flex;
    justify-content: space-between;
    padding: var(--space-xs) 0;
    border-bottom: 1px solid var(--color-border);

    &:last-child {
      border-bottom: none;
    }
  }

  &__page-path,
  &__activity-name {
    font-size: var(--font-size-s);
  }

  &__page-views,
  &__activity-count {
    font-weight: 600;
    color: var(--color-primary);
  }

  &__behavior-card {
    h3 {
      margin-bottom: var(--space);
    }
  }

  &__behavior-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space-l);
  }

  &__behavior-item {
    h4 {
      font-size: var(--font-size);
      margin-bottom: var(--space);
    }
  }

  &__device-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__device-item {
    display: flex;
    align-items: center;
    gap: var(--space-xs);

    .t-icon {
      font-size: 1.25rem;
      color: var(--color-primary);
    }

    .percentage {
      margin-left: auto;
      font-weight: 600;
    }
  }

  &__source-list {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__source-item {
    display: grid;
    grid-template-columns: 100px 1fr 50px;
    align-items: center;
    gap: var(--space);

    .source-name {
      font-size: var(--font-size-s);
    }

    .source-bar {
      height: 8px;
      background: var(--color-background-secondary);
      border-radius: 4px;
      overflow: hidden;
    }

    .source-fill {
      height: 100%;
      background: var(--color-primary);
      transition: width 0.3s ease;
    }

    .source-value {
      text-align: right;
      font-weight: 600;
      font-size: var(--font-size-s);
    }
  }
}</style>
