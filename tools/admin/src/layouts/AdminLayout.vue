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

            <div
              v-else
              :class="bemm('nav-link',['','header'])"
              :key="item.label"
            >
              <TIcon :name="item.icon" />
              <span>{{ item.label }}</span>
            </div>

            <ul :class="bemm('nav-list')" v-if="item.items">
              <li
                :class="bemm('nav-item', ['', 'sub'])"
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
                <a
                  v-else-if="subItem.action"
                  @click="subItem.action"
                  :class="bemm('nav-link', ['', 'action'])"
                  href="#"
                  @click.prevent
                >
                  <TIcon :name="subItem.icon" />
                  <span>{{ subItem.label }}</span>
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
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
import { Icons } from 'open-icon';
import { useI18n, TIcon, TStatusBar, AddTranslationKeyDialog } from '@tiko/ui';
import { useUpload, useI18nDatabaseService } from '@tiko/core';
import { uploadService } from '../services/upload.service';
import type { ToastService, PopupService } from '@tiko/ui';
import UploadStatus from '../components/UploadStatus.vue';

const { keys, t } = useI18n();

const bemm = useBemm('admin-layout');
const toastService = inject<ToastService>('toastService');
const popupService = inject<PopupService>('popupService');
const translationService = useI18nDatabaseService();

// Initialize upload composable with service
const { hasItems } = useUpload(uploadService, toastService);

interface NavigationItem {
  name: string;
  to?: { name: string };
  icon: string;
  label: string;
  items?: NavigationItem[];
  action?: () => void;
}

// Function to open Add Key dialog
function openAddKeyDialog() {
  if (!popupService) {
    console.error('PopupService not available');
    return;
  }

  popupService.open({
    component: AddTranslationKeyDialog,
    title: t('admin.i18n.addKey.title'),
    props: {
      mode: 'create',
      onSave: async (data) => {
        try {
          // Create the key
          const key = await translationService.createTranslationKey({
            key: data.key,
            category: data.category,
            description: data.description,
          });

          // Create translations for each language
          for (const [localeCode, value] of Object.entries(data.translations)) {
            if (value) {
              await translationService.createTranslation({
                key_id: key.id,
                language_code: localeCode,
                value: value as string,
                is_published: true,
                notes: 'Created via admin interface',
              });
            }
          }

          toastService?.show({
            message: t('admin.i18n.addKey.success'),
            type: 'success',
          });
        } catch (error) {
          console.error('Failed to create translation key:', error);
          toastService?.show({
            message: t('admin.i18n.addKey.error'),
            type: 'error',
          });
        }
      },
    },
  });
}

const navigationItems: NavigationItem[] = [
  {
    name: 'dashboard',
    to: { name: 'Dashboard' },
    icon: Icons.BUILDING_HOUSE2,
    label: t('admin.navigation.dashboard'),
  },
  {
    name: 'media',
    to: { name: 'MediaDashboard' },
    icon: Icons.IMAGE,
    label: t('admin.navigation.media'),
    items: [
      {
        name: 'library',
        to: { name: 'Library' },
        icon: Icons.IMAGE,
        label: t('admin.navigation.library'),
      },
      {
        name: 'upload',
        to: { name: 'Upload' },
        icon: Icons.ARROW_HEADED_UP,
        label: t('admin.navigation.upload'),
      },
    ],
  },
  {
    name: 'users',
    to: { name: 'Users' },
    icon: Icons.USER_GROUP,
    label: t('admin.navigation.users'),
  },
  {
    name: 'i18n',
    icon: Icons.SPEECH_BALLOONS,
    label: t('admin.navigation.i18n.title'),
    items: [
      {
        name: 'i18n-add-key',
        icon: Icons.ADD,
        label: t('admin.navigation.i18n.addKey'),
        action: openAddKeyDialog,
      },
      {
        name: 'i18n-database',
        to: { name: 'I18nDatabase' },
        icon: Icons.FILE_CLOUD,
        label: t('admin.navigation.i18nDatabase'),
      },
      {
        name: 'i18n-import',
        to: { name: 'I18nImport' },
        icon: Icons.UPLOAD,
        label: t('admin.navigation.i18n.import'),
      },
      {
        name: 'i18n-languages',
        to: { name: 'I18nLanguages' },
        icon: Icons.SPEECH_BALLOON_SQUARE,
        label: t('admin.navigation.i18nLanguages'),
      },
    ]
  },
  // {
  //   name: 'analytics',
  //   to: { name: 'Analytics' },
  //   icon: Icons.CHART_LINE,
  //   label: t('admin.navigation.analytics', 'Analytics'),
  // },
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
    width: clamp(240px, 15vw, 320px);
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
    padding: var(--space);
  }

  &__nav-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);

    .admin-layout__nav-list {
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
    // background-color: color-mix(in srgb, var(--color-primary), transparent 80%);
    border-radius: 4px;
    transition: background-color 0.2s;
    gap: var(--space-xs);
    cursor: pointer;

    &:hover:not(.admin-layout__nav-link--header) {
      background-color: var(--color-primary);
    }

    &--header {
      font-weight: 600;
      cursor: default;
      opacity: 0.8;
    }

    &--action {
      border: 1px dashed var(--color-primary);

      &:hover {
        background-color: var(--color-primary);
        border-style: solid;
      }
    }

    &.router-link-exact-active {
      background-color: color-mix(
        in srgb,
        var(--color-primary),
        transparent 80%
      );
      box-shadow: 0 0 0 1px var(--color-primary);
    }
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
    background: var(--color-border);
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
