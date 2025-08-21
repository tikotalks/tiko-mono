<template>
  <nav :class="bemm()">
    <ul :class="bemm('nav-list')">
      <li
        :class="
          bemm('nav-item', [
            '',
            'main',
            item.active ? 'active' : '',
            item.items ? 'has-children' : '',
            item.name,
          ])
        "
        v-for="item in navigationItems"
      >
        <router-link
          v-if="item.to"
          :to="item.to"
          :class="bemm('nav-link', ['','main'])"
          :key="item.name"
          @click.native="item.action"
        >
          <TIcon :name="item.icon" />
          <span :class="bemm('label')">{{ item.label }}</span>
          <span
            :class="
              bemm('active-indicator', [
                '',
                isOpen(item.name) ? 'active' : 'inactive',
              ])
            "
            v-if="item.items?.length"
            ><TIcon :name="Icons.CHEVRON_DOWN"
          /></span>
        </router-link>

        <div
          v-else
          :class="bemm('nav-link', ['', 'header'])"
          :key="item.label"
          @click="item.action"
        >
          <TIcon :name="item.icon" />
          <span :class="bemm('label')">{{ item.label }}</span>
          <span
            :class="
              bemm('active-indicator', [
                '',
                isOpen(item.name) ? 'active' : 'inactive',
              ])
            "
            v-if="item.items?.length"
            ><TIcon :name="Icons.CHEVRON_DOWN"
          /></span>
        </div>

        <ul :class="bemm('nav-list', ['', 'sub'])" v-if="item.items">
          <li
            :class="bemm('nav-item', ['', 'sub'])"
            v-for="subItem in item.items"
            :key="subItem.name"
          >
            <router-link
              v-if="subItem.to"
              :to="subItem.to"
              :class="bemm('nav-link',['', 'sub'])"
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
</template>

<script lang="ts" setup>
import { inject, computed, ref, onMounted } from 'vue';

import { useBemm } from 'bemm';
import { Icons } from 'open-icon';
import { TIcon } from '@tiko/ui';
import {
  useI18n,
  useI18nDatabaseService,
  useUserPreferences,
  USER_PREFERENCE_KEYS,
} from '@tiko/core';

import type { ToastService, PopupService } from '@tiko/ui';

const toastService = inject<ToastService>('toastService');
const popupService = inject<PopupService>('popupService');
const translationService = useI18nDatabaseService();

const { t } = useI18n();
const bemm = useBemm('admin-navigation');
const { preferences, loadPreferences } = useUserPreferences();

interface NavigationItem {
  name: string;
  to?: { name: string };
  icon: string;
  label: string;
  active?: boolean;
  items?: NavigationItem[];
  action?: () => void;
}

const openedItems = ref<string[]>([]);

onMounted(async () => {
  // Load user preferences
  await loadPreferences();

  // Initialize opened items from preferences
  const savedOpenItems =
    preferences.value[USER_PREFERENCE_KEYS.ADMIN.NAVIGATION] || [];
  openedItems.value = savedOpenItems;
});

// Function to open Add Key dialog
async function openAddKeyDialog() {
  if (!popupService) {
    console.error('PopupService not available');
    return;
  }

  // Import AddTranslationKeyDialog dynamically
  const { default: AddTranslationKeyDialog } = await import(
    '../components/dialogs/AddTranslationKeyDialog.vue'
  );

  popupService.open({
    component: AddTranslationKeyDialog,
    title: t('admin.i18n.addKey.title'),
    props: {
      mode: 'create',
      onSave: async (data: any) => {
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

const toggleOpen = (name: string) => {
  if (openedItems.value.includes(name)) {
    openedItems.value = openedItems.value.filter((item) => item !== name);
  } else {
    openedItems.value.push(name);
  }

  // Save to preferences
  preferences.value[USER_PREFERENCE_KEYS.ADMIN.NAVIGATION] = [
    ...openedItems.value,
  ];
};
const isOpen = (name: string) => {
  return openedItems.value.includes(name);
};

const navigationItems = computed<NavigationItem[]>(() => [
  {
    name: 'dashboard',
    to: { name: 'Dashboard' },
    icon: Icons.BOARD_MULTI_DASHBOARD,
    label: t('admin.navigation.dashboard'),
    active: isOpen('dashboard'),
    action: () => toggleOpen('dashboard'),
  },
  {
    name: 'media',
    to: { name: 'MediaDashboard' },
    icon: Icons.IMAGE,
    label: t('admin.navigation.media'),
    active: isOpen('media'),
    action: () => toggleOpen('media'),
    items: [
      {
        name: 'library',
        to: { name: 'Library' },
        icon: Icons.IMAGE,
        active: isOpen('library'),
        label: t('admin.navigation.library'),
      },
      {
        name: 'upload',
        to: { name: 'Upload' },
        icon: Icons.ARROW_UPLOAD,
        label: t('admin.navigation.upload'),
      },
      {
        name: 'generate',
        to: { name: 'Generate' },
        icon: Icons.AI_FACE,
        active: isOpen('library'),
        label: t('admin.navigation.generate'),
      },
      {
        name: 'personal-library',
        to: { name: 'PersonalLibrary' },
        icon: Icons.USER,
        label: t('admin.navigation.personalLibrary'),
      },
      {
        name: 'collections',
        to: { name: 'Collections' },
        icon: Icons.FOLDER,
        label: t('admin.navigation.collections'),
      },
      {
        name: 'assets',
        to: { name: 'Assets' },
        icon: Icons.FILE,
        label: t('admin.navigation.assets'),
        action: () => toggleOpen('assets'),
        active: isOpen('assets'),
      },
    ],
  },
  {
    name: 'users',
    to: { name: 'Users' },
    icon: Icons.USER_GROUP,
    active: isOpen('users'),
    action: () => toggleOpen('users'),
    label: t('admin.navigation.usersLabel'),
    items: [
      {
        name: 'users-list',
        to: { name: 'Users' },
        icon: Icons.USER,
        label: t('admin.navigation.users.list'),
      },
      // {
      //   name: 'users-roles',
      //   to: { name: 'UserRoles' },
      //   icon: Icons.USER_GROUP,
      //   label: t('admin.navigation.users.roles'),
      // },
    ],
  },
  {
    name: 'i18n',
    icon: Icons.SPEECH_BALLOONS,
    label: t('admin.navigation.i18n.title'),
    active: isOpen('i18n'),
    action: () => toggleOpen('i18n'),
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
        icon: Icons.ARROW_DOWNLOAD,
        label: t('admin.navigation.i18n.import'),
      },
      {
        name: 'i18n-languages',
        to: { name: 'I18nLanguages' },
        icon: Icons.SPEECH_BALLOON_SQUARE,
        label: t('admin.navigation.i18nLanguages'),
      },
      {
        name: 'i18n-status',
        to: { name: 'I18nStatus' },
        icon: Icons.SPEECH_BALLOON2,
        label: t('admin.navigation.i18nStatus') || 'Status',
      },
    ],
  },
  {
    name: 'content',
    icon: Icons.FILE_TEXT,
    label: t('admin.navigation.content.title'),
    active: isOpen('content'),
    action: () => toggleOpen('content'),
    items: [
      {
        name: 'content-projects',
        to: { name: 'ContentProjects' },
        icon: Icons.FOLDER,
        label: t('admin.navigation.content.projects'),
      },
      {
        name: 'content-pages',
        to: { name: 'ContentPages' },
        icon: Icons.BOARD_SPLIT_T_UP,
        label: t('admin.navigation.content.pages'),
      },
      {
        name: 'content-sections',
        to: { name: 'ContentSections' },
        icon: Icons.BOARD_MULTI2_HORIZONTAL,
        label: t('admin.navigation.content.sections'),
      },
      {
        name: 'content-items',
        to: { name: 'admin-content-items' },
        icon: Icons.FOLDER,
        label: t('admin.navigation.content.items'),
      },
    ],
  },
  {
    name: 'items',
    icon: Icons.GRID_SQUARES,
    label: t('admin.navigation.items.title'),
    active: isOpen('items'),
    action: () => toggleOpen('items'),
    items: [
      {
        name: 'public-items',
        to: { name: 'PublicItems' },
        icon: Icons.SPARKLE,
        label: t('admin.navigation.items.publicItems'),
      },
    ],
  },
  {
    name: 'data',
    icon: Icons.ARROW_UPLOAD,
    label: t('admin.navigation.data'),
    active: isOpen('data'),
    action: () => toggleOpen('data'),
    items: [
      {
        name: 'deployment',
        to: { name: 'Deployment' },
        icon: Icons.CLOUD,
        label: t('admin.navigation.deployment'),
      },
      {
        name: 'deployment-backups',
        to: { name: 'DeploymentBackups' },
        icon: Icons.TOY_BLOCKS,
        label: t('admin.navigation.backup'),
      },
    ],
  },
]);
</script>

<style lang="scss">

.admin-navigation {
  display: flex;
  flex-direction: column;
  width: 250px;
  border-right: 1px solid var(--color-border);
  padding: var(--space);

  container-type: inline-size;

  @container (max-width: 200px) {
  border: 2px solid red;
}
@container (min-width: 200px) {
  border: 2px solid green;
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

    &--sub {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.2s ease-in-out;
      padding-left: 1em;
    }
  }
  &__nav-item {
    .icon {
      color: color-mix(
        in srgb,
        var(--color-secondary),
        var(--color-foreground) 50%
      );
    }

    &--main{
      .icon{}
    }
    &--sub {
      font-size: 0.75em;
    }

    &--active {
      background-color: var(--color-background);
      // border: 1px solid var(--color-primary);
      border-radius: 4px;
    }

    &--has-children {
      // border: 2px solid red;
    }

    &--active {
      .admin-navigation__nav-list {
        max-height: fit-content;
      }
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
      background-color: color-mix(
        in srgb,
        var(--color-primary),
        transparent 80%
      );
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

    &.router-link-active {
      // background-color: var(--color-primary);
      // box-shadow: 0 0 0 1px var(--color-primary);
    }

    &.router-link-exact-active {
      background-color: color-mix(
        in srgb,
        var(--color-primary),
        transparent 80%
      );
      // box-shadow: 0 0 0 1px var(--color-primary);
    }
  }

  &__label {
    width: 100%;
  }

  &__active-indicator {
    transition: 0.2s ease-in-out;

    &--active {
      transform: scale(1, -1);
    }
  }
}
</style>
