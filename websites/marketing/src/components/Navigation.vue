<template>
  <nav :class="bemm()">
    <button
      :class="bemm('trigger', ['', active ? 'active' : ''])"
      @click="active = !active"
      :aria-label="active ? 'Close navigation' : 'Open navigation'"
    >
      <span />
      <span />
      <span />
    </button>
    <div :class="bemm('overlay')" v-if="active" @click="active = false"></div>
    <div :class="bemm('container', ['', active ? 'active' : ''])">
      <ul :class="bemm('list')">
        <li :class="bemm('item')" v-for="item in items" :key="item.name">
          <router-link
            :to="item.link"
            :class="bemm('link')"
            @mouseenter="preloadPage(item.link)"
            @focus="preloadPage(item.link)"
          >
            <span v-if="item.icon" :class="bemm('icon')">
              <TIcon :name="item.icon" />
            </span>
            <span :class="bemm('text')">
              {{ item.name }}
            </span>
          </router-link>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { TIcon } from '@tiko/ui';
import { useBemm } from 'bemm';
import { Icons } from 'open-icon';
import { ref, watch, onMounted } from 'vue';
import { useContent } from '@tiko/core';
import { useI18n } from '@tiko/ui';
const bemm = useBemm('navigation');

import { useRoute, useRouter } from 'vue-router';

const active = ref(false);
const router = useRouter();
const { locale } = useI18n();

interface NavigationItem {
  name: string;
  link: string;
  icon?: Icons;
  items?: NavigationItem[];
}

// Dynamic navigation items from CMS
const items = ref<NavigationItem[]>([]);

// Initialize content service
const content = useContent({
  projectSlug: 'marketing',
  useWorker: import.meta.env.VITE_USE_CONTENT_WORKER === 'true',
  workerUrl: import.meta.env.VITE_CONTENT_API_URL,
  deployedVersionId: import.meta.env.VITE_DEPLOYED_VERSION_ID,
  noCache: false
});


// Load navigation pages from CMS
async function loadNavigationItems() {
  try {
    // Get the marketing project first
    const project = await content.getProject('marketing');
    if (!project) {
      console.error('[Navigation] Marketing project not found');
      throw new Error('Marketing project not found');
    }

    console.log('[Navigation] Marketing project loaded');

    // Get all pages for this project
    const pages = await content.getPages(project.id);
    console.log(`[Navigation] Found ${pages.length} pages`);

    // Get language code from locale (e.g., 'en-GB' -> 'en')
    const languageCode = locale.value.split('-')[0];

    // Filter pages that should show in navigation
    const navPages = pages.filter(page => {
      const matches = page.show_in_navigation &&
        page.is_published &&
        page.language_code === languageCode &&
        !page.is_home;


      return matches;
    });


    // Sort by navigation order
    navPages.sort((a, b) => a.navigation_order - b.navigation_order);

    // Convert to navigation items
    items.value = navPages.map(page => ({
      name: page.title,
      link: `/${page.slug}`
    }));

    console.log('[Navigation] Loaded navigation items:', items.value);
  } catch (error) {
    console.error('[Navigation] Failed to load navigation items:', error);
    console.error('[Navigation] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Fallback to hardcoded items
    console.warn('[Navigation] Using fallback hardcoded navigation items');
    items.value = [
      { name: 'About', link: '/about' },
      { name: 'Apps', link: '/apps' },
      { name: 'Sponsors', link: '/sponsors' },
    ];
  }
}

// Preload page content on hover
const preloadPage = async (path: string) => {
  // Extract slug from path (e.g., /about -> about)
  const slug = path.replace('/', '') || 'home';

  // Don't preload the current page
  const currentSlug = router.currentRoute.value.path.replace('/', '') || 'home';
  if (slug === currentSlug) return;


  try {
    // Preload the page content using getPage from useContent
    const result = await content.getPage(slug, locale.value);
    if (result) {
    }
  } catch (error: any) {
    // Log warning instead of error for preload failures
  }
};

// Preload all pages after initial load
onMounted(async () => {
  // Load navigation items from CMS
  await loadNavigationItems();

  // Wait a bit for the initial page to load, then preload all pages
  setTimeout(() => {
    items.value.forEach(item => {
      preloadPage(item.link);
    });
  }, 3000); // Wait 3 seconds after mount
});

// Reload navigation when language changes
watch(locale, async (newLocale, oldLocale) => {
  await loadNavigationItems();
});

watch(
  () => useRoute(),
  () => {
    // Close navigation when route changes
    active.value = false;
  },
  {
    deep: true,
  },
);
</script>

<style lang="scss">
.navigation {
  &__trigger {
    position: relative;
    z-index: 30;
    position: fixed;
    width: 3em;
    height: 3em;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    flex-direction: column;
    background-color: var(--color-dark);
    border: none;
    top: 0;
    right: 0;
    margin: var(--space-l);
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: var(--color-primary);
    }

    span {
      display: block;
      width: 1.5em;
      height: 0.2em;
      background-color: var(--color-light);
      border-radius: 0.1em;
      transition: transform 0.3s ease;

      &:nth-child(1) {
        transform:  scaleX(0.8) translateY(-0.3em);
      }
      &:nth-child(2) {
        transform: scaleX(1);
      }
      &:nth-child(3) {
        transform:  scaleX(0.8) translateY(0.3em);
      }
    }
    span {
      width: 1.5em;
      height: 0.2em;
      background-color: var(--color-light);
    }

    &--active{
      span:nth-child(1) {
        transform: rotate(45deg) translateY(0.3em);
      }
      span:nth-child(2) {
        opacity: 0;
      }
      span:nth-child(3) {
        transform: rotate(-45deg) translateY(-0.3em);
      }
    }
    @media screen and (min-width: 1024px) {
      display:none;
    }
  }
  &__container {
    padding: var(--space);
    gap: var(--space);
    background-color: color-mix(in srgb, var(--color-dark), transparent 75%);
    backdrop-filter: blur(10px);
    border-radius: calc(var(--border-radius));
    z-index: 10;

    @media screen and (max-width: 1024px) {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.5);
      opacity: 0;
      pointer-events: none;
      transition: 0.3s ease-in-out;
      font-size: 2em;
    }
    &--active {
      @media screen and (max-width: 1024px) {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
        pointer-events: all;
      }
    }
  }

  &__overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 10;
    @media screen and (min-width: 1024px) {
     display:none;
    }

  }

  &__list {
    display: flex;
    @media screen and (max-width: 1024px) {
      flex-direction: column;
    }
  }

  &__link {
    background-color: color-mix(in srgb, var(--color-light), transparent 100%);
    padding: var(--space-xs) var(--space);
    border-radius: var(--border-radius);
    transition: background-color 0.3s ease;
    color: var(--color-light);
    text-shadow: 1px 1px 3px
      color-mix(in srgb, var(--color-dark), transparent 75%);
    &:hover {
      background-color: color-mix(
        in srgb,
        var(--color-primary),
        transparent 0%
      );
      color: var(--color-light);
    }

    &.router-link-active {
      background-color: var(--color-secondary);
      color: var(--color-secondary-text);
    }
  }
}
</style>
