<template>
  <TFramework
    app-name="admin"
    :allow-navigation="false"
    :config="frameworkConfig"
    :is-app="false"
    class="app"
  >
    <div class="app__container">
      <aside class="app__sidebar">
        <nav class="app__navigation">
          <ul class="app__nav-list">
            <li class="app__nav-item" v-for="item in navigationItems">
              <router-link
                v-if="item.to"
                :to="item.to"
                class="app__nav-link"
                :key="item.name"
              >
                <TIcon :name="item.icon" />
                <span>{{ item.label }}</span>
              </router-link>

              <div v-else class="app__nav-link app__nav-link--header"
                :key="item.label">
                <TIcon :name="item.icon" />
                <span>{{ item.label }}</span>
              </div>

              <ul class="app__nav-list" v-if="item.items">
                <li
                  class="app__nav-item app__nav-item--sub"
                  v-for="subItem in item.items"
                  :key="subItem.name"
                >
                  <router-link
                    v-if="subItem.to"
                    :to="subItem.to"
                    class="app__nav-link"
                  >
                    <TIcon :name="subItem.icon" />
                    <span>{{ subItem.label }}</span>
                  </router-link>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </aside>
      <div class="app__content" v-if="!isCheckingAuth">
        <router-view />
      </div>
      <div v-else class="loading-container">
        <TSpinner />
      </div>
    </div>
  </TFramework>
</template>

<script setup lang="ts">
import { Icons } from 'open-icon';
import { TFramework, TSpinner, useI18n, TButton, TIcon } from '@tiko/ui';
import { authService } from '@tiko/core';
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { FrameworkConfig } from '@tiko/ui';
import tikoConfig from '../tiko.config';

const router = useRouter();
const route = useRoute();
const isCheckingAuth = ref(true);
const { t, keys } = useI18n();

interface NavigationItem {
  name: string;
  to?: { name: string };
  icon: string;
  label: string;
  items?: NavigationItem[];
}

// Framework configuration
const frameworkConfig = computed<FrameworkConfig>(() => ({
  ...tikoConfig,
  topBar: {
    showUser: true,
    showTitle: true,
    showSubtitle: false,
    showCurrentRoute: false,
  },
  settings: {
    enabled: true,
    sections: [
    ],
  },
}));

const navigationItems: NavigationItem[] = [
  {
    name: 'dashboard',
    to: { name: 'dashboard' },
    icon: Icons.HOME,
    label: t(keys.admin.navigation.dashboard),
  },
  {
    name: 'media',
    to: { name: 'media-dashboard' },
    icon: Icons.IMAGE,
    label: t(keys.admin.navigation.media),
    items: [
      {
        name: 'library',
        to: { name: 'library' },
        icon: Icons.IMAGE,
        label: t(keys.admin.navigation.library),
      },
      {
        name: 'upload',
        to: { name: 'upload' },
        icon: Icons.ARROW_UPLOAD,
        label: t(keys.admin.navigation.upload),
      },
    ],
  },
  {
    name: 'users',
    to: { name: 'users' },
    icon: Icons.USER_GROUPS,
    label: t(keys.admin.navigation.users),
  },
  {
    name: 'analytics',
    to: { name: 'analytics' },
    icon: Icons.CHART_LINE,
    label: t(keys.admin.navigation.analytics),
  },
];

onMounted(async () => {
  // Wait a moment for auth to process if we have tokens in URL
  if (window.location.hash && window.location.hash.includes('access_token')) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  isCheckingAuth.value = false;
});
</script>

<style lang="scss">
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.app {
  &__container {
    display: flex;
    position: sticky;
    top: 100px;
  }

  &__sidebar {
    width: 250px;
    border-right: 1px solid var(--color-border);
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
  }

  &__nav-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);

    .app__nav-list {
     padding-left: var(--space);
     padding-top: var(--space-xs);
    }
  }
  &__nav-item {
    &--sub {
      // padding-left: 1rem;
    }
  }

&__nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-s);
  text-decoration: none;
  color: var(--color-foreground);
  background-color: color-mix(in srgb, var(--color-primary), transparent 80%);
  border-radius: var(--border-radius);
  transition: background-color 0.2s;
  gap: var(--space-xs);

  &:hover:not(.nav-link--header) {
    background-color: var(--color-primary);
  }

  &--header {
    font-weight: 600;
    cursor: default;
    opacity: 0.8;
  }

  &.router-link-active {
    background-color: var(--color-primary);
    color: var(--color-primary-text);
  }
}
}

</style>
