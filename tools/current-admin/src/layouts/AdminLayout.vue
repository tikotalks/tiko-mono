<template>

<div :class="bemm('container')">
  <aside :class="bemm('sidebar')">
    <nav :class="bemm('navigation')">
      <ul :class="bemm('nav-list')">
        <li :class="bemm('nav-item')" v-for="item in navigationItems">
          <router-link
            v-if="item.to"
            :to="item.to"
            :class="bemm('nav-link')"
            :key="item.name"
          >
            <TIcon :name="item.icon" />
            <span>{{ item.label }}</span>
          </router-link>

          <div v-else :class="bemm('nav-link app__nav-link--header')"
            :key="item.label">
            <TIcon :name="item.icon" />
            <span>{{ item.label }}</span>
          </div>

          <ul :class="bemm('nav-list')" v-if="item.items">
            <li
              :class="bemm('nav-item', ['','sub'])"
              v-for="subItem in item.items"
              :key="subItem.name"
            >
              <router-link
                v-if="subItem.to"
                :to="subItem.to"
                :class="bemm('nav-link')"
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
  <div :class="bemm('content')" v-if="!isCheckingAuth">
    <router-view />
  </div>
  <div v-else class="loading-container">
    <TSpinner />
  </div>
</div>
</template>


<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { useI18n, TIcon, TSpinner  } from '@tiko/ui'
import { useRouter, useRoute } from 'vue-router'

const { keys, t } = useI18n();

const bemm = useBemm('admin-layout');

interface NavigationItem {
  name: string;
  to?: { name: string };
  icon: string;
  label: string;
  items?: NavigationItem[];
}


const navigationItems: NavigationItem[] = [
  {
    name: 'dashboard',
    to: { name: 'dashboard' },
    icon: Icons.BUILDING_HOUSE2,
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
    icon: Icons.USER_GROUP,
    label: t(keys.admin.navigation.users),
  },
  {
    name: 'analytics',
    to: { name: 'analytics' },
    icon: Icons.CHART_LINE,
    label: t(keys.admin.navigation.analytics),
  },
];

</script>


<style lang="scss">

.admin-layout {
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


.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

</style>
