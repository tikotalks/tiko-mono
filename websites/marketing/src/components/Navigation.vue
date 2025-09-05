<template>
  <nav :class="bemm()">
    <button :class="bemm('trigger', ['', active ? 'active' : ''])" @click="active = !active"
      :aria-label="active ? 'Close navigation' : 'Open navigation'">
      <span />
      <span />
      <span />
    </button>
    <div :class="bemm('overlay')" v-if="active" @click="active = false"></div>
    <div :class="bemm('container', ['', active ? 'active' : ''])">
      <ul :class="bemm('list')">
        <li :class="bemm('item', ['', item.mobile ? 'mobile-only' : 'show-all'])" v-for="item in items" :key="item.label">
          <!-- External links -->
          <a v-if="item.type === 'external' && item.url" 
            :href="item.link" 
            :class="bemm('link')"
            :target="item.target || '_blank'"
            rel="noopener noreferrer">
            <span v-if="item.icon" :class="bemm('icon')">
              <TIcon :name="item.icon" />
            </span>
            <span :class="bemm('text')">
              {{ item.label }}
            </span>
          </a>
          <!-- Label only (no link) -->
          <span v-else-if="item.type === 'label'" :class="bemm('link', 'label')">
            <span v-if="item.icon" :class="bemm('icon')">
              <TIcon :name="item.icon" />
            </span>
            <span :class="bemm('text')">
              {{ item.label }}
            </span>
          </span>
          <!-- Internal links -->
          <router-link v-else :to="item.to" :class="bemm('link')" @mouseenter="preloadPage(item.link)"
            @focus="preloadPage(item.link)">
            <span v-if="item.icon" :class="bemm('icon')">
              <TIcon :name="item.icon" />
            </span>
            <span :class="bemm('text')">
              {{ item.label }}
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
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useI18n } from '@tiko/core';
import { useContentStore } from '@/stores';
const bemm = useBemm('navigation');

import { RouterLinkProps, useRoute, useRouter } from 'vue-router';

const active = ref(false);
const router = useRouter();
const { locale } = useI18n();
const windowWidth = ref(window.innerWidth);

interface NavigationItem {
  label: string;
  link: string;
  mobile?: boolean;
  to: { name: string; params: { view: string } };
  icon?: Icons;
  items?: NavigationItem[];
  type?: 'page' | 'custom' | 'external' | 'label';
  target?: '_self' | '_blank';
  url?: string;
}

// Dynamic navigation items from CMS
const items = ref<NavigationItem[]>([]);

// Use content store
const contentStore = useContentStore();
const { content } = contentStore;


// Load navigation from database navigation menus
async function loadNavigationItems() {
  try {
    // Load navigation will automatically initialize project if needed
    await contentStore.loadAllNavigation();
    
    // Detect if we're on mobile to determine which menu to use
    const isMobile = window.innerWidth < 1024;
    const menu = isMobile ? contentStore.mobileMenu : contentStore.headerMenu;
    
    console.log('[Navigation] Using menu:', {
      isMobile,
      menu: menu ? menu.slug : 'none'
    });
    
    if (!menu) {
      console.warn('[Navigation] No menu found, falling back to page-based navigation');
      const project = contentStore.currentProject;
      if (project) {
        await loadNavigationFromPages(project);
      }
      return;
    }

    console.log(`[Navigation] Loaded menu "${menu.slug}" with ${menu.items?.length || 0} items`);
    console.log('[Navigation] Menu items:', menu.items);

    // Convert navigation items to the expected format
    items.value = await convertMenuItemsToNavigationItems(menu.items || []);

    console.log('[Navigation] Loaded navigation items:', items.value);
    
    // Preload pages from navigation
    items.value.forEach(item => {
      if (item.link && item.link !== '#') {
        contentStore.preloadPage(item.link.replace('/', ''));
      }
    });
  } catch (error) {
    console.error('[Navigation] Failed to load navigation items:', error);
    console.error('[Navigation] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Fallback to hardcoded items
    console.warn('[Navigation] Using fallback hardcoded navigation items');
    items.value = [
      {
        label: 'About',
        link: '/about',
        to: {
          name: 'content',
          params: { view: 'about' }
        }
      },
      {
        label: 'Apps',
        link: '/apps',
        to: {
          name: 'content',
          params: { view: 'apps' }
        }
      },
      {
        label: 'Sponsors',
        link: '/sponsors',
        to: {
          name: 'content',
          params: { view: 'sponsors' }
        }
      },
      {
        label: 'Technology',
        link: '/technology',
        mobile: true,
        to: {
          name: 'content',
          params: { view: 'technology' }
        }
      },
      {
        label: 'Contact',
        link: '/contact',
        mobile: true,
        to: { name: 'content', params: { view: 'contact' } }
      },
      {
        label: 'Updates',
        link: '/updates',
        mobile: true,
        to: { name: 'content', params: { view: 'update' } }
      }, {
        label: 'FAQ',
        link: '/faq',
        mobile: true,
        to: { name: 'content', params: { view: 'faq' } }
      },
    ];
  }
}

// Convert database navigation items to component format
async function convertMenuItemsToNavigationItems(menuItems: any[]): Promise<NavigationItem[]> {
  const navItems: NavigationItem[] = [];
  
  for (const item of menuItems) {
    // Skip invisible items
    if (!item.is_visible) continue;
    
    let navItem: NavigationItem;
    
    if (item.type === 'page' && item.page_id) {
      // Get the page details
      const page = await content.getPage(item.page_id);
      if (page) {
        navItem = {
          label: item.label || page.title,
          link: page.slug ? `/${page.slug}` : '/',
          to: { name: 'content', params: { view: page.slug || 'home' } },
          icon: item.icon,
          type: 'page'
        };
      } else {
        continue; // Skip if page not found
      }
    } else if (item.type === 'custom' && item.url) {
      // Custom internal link
      const slug = item.url.replace(/^\//, ''); // Remove leading slash
      navItem = {
        label: item.label,
        link: item.url,
        to: { name: 'content', params: { view: slug || 'home' } },
        icon: item.icon,
        type: 'custom',
        url: item.url
      };
    } else if (item.type === 'external' && item.url) {
      // External link
      navItem = {
        label: item.label,
        link: item.url,
        to: { name: 'content', params: { view: '' } }, // External links won't use router
        icon: item.icon,
        type: 'external',
        target: item.target || '_blank',
        url: item.url
      };
    } else if (item.type === 'label') {
      // Label-only item (no link)
      navItem = {
        label: item.label,
        link: '#',
        to: { name: 'content', params: { view: '' } },
        icon: item.icon,
        type: 'label'
      };
    } else {
      continue; // Skip unknown types
    }
    
    // Add children if any
    if (item.items && item.items.length > 0) {
      navItem.items = await convertMenuItemsToNavigationItems(item.items);
    }
    
    navItems.push(navItem);
  }
  
  return navItems;
}

// Fallback function to load navigation from pages (old method)
async function loadNavigationFromPages(project: any) {
  try {
    // Get all pages for this project
    const pages = await content.getPages(project.id);
    console.log(`[Navigation] Fallback: Found ${pages.length} pages`);

    // Get language code from locale (e.g., 'en-GB' -> 'en')
    const currentLocale = locale.value || 'en-GB';
    const languageCode = currentLocale.split('-')[0];

    // Detect if we're on mobile
    const isMobile = window.innerWidth < 1024;

    // Filter pages that should show in navigation
    const navPages = pages.filter(page => {
      // Check basic conditions
      if (!page.is_published || page.language_code !== languageCode || page.is_home) {
        return false;
      }

      // Check show_in_navigation value
      const showInNav = page.show_in_navigation;
      
      // Handle the different values
      if (showInNav === 'false' || showInNav === false) {
        return false;
      } else if (showInNav === 'mobile') {
        return isMobile;
      } else if (showInNav === 'desktop') {
        return !isMobile;
      }
      
      // Default to showing (for 'true', true, or any other value)
      return true;
    });

    // Sort by navigation order
    navPages.sort((a, b) => a.navigation_order - b.navigation_order);

    // Convert to navigation items
    items.value = navPages.map(page => ({
      label: page.title,
      link: page.slug ? `/${page.slug}` : undefined,
      to: { name: 'content', params: { view: page.slug } },
      mobile: page.show_in_navigation === 'mobile'
    })).filter(item => item.link);

    console.log('[Navigation] Fallback: Loaded navigation items from pages:', items.value);
  } catch (error) {
    console.error('[Navigation] Fallback failed:', error);
    // Will use hardcoded items as last resort
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

// Update window width on resize
function handleResize() {
  windowWidth.value = window.innerWidth;
  // Reload navigation items when window size changes
  loadNavigationItems();
}

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
  
  // Add resize listener
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// Reload navigation when language changes
watch(() => locale.value, async (newLocale, oldLocale) => {
  if (newLocale !== oldLocale) {
    await loadNavigationItems();
  }
});

const route = useRoute();
watch(
  () => route,
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
        transform: scaleX(0.8) translateY(-0.3em);
      }

      &:nth-child(2) {
        transform: scaleX(1);
      }

      &:nth-child(3) {
        transform: scaleX(0.8) translateY(0.3em);
      }
    }

    span {
      width: 1.5em;
      height: 0.2em;
      background-color: var(--color-light);
    }

    &--active {
      span:nth-child(1) {
        transform: translateX(.25em) rotate(45deg) translateY(0.3em);
      }

      span:nth-child(2) {
        opacity: 0;
      }

      span:nth-child(3) {
        transform: translateX(.25em) rotate(-45deg) translateY(-0.3em);
      }
    }

    @media screen and (min-width: 1024px) {
      display: none;
    }

    @media screen and (max-width:720px) {
      margin: var(--space);
    }

  }

  &__container {
    padding: var(--space);
    gap: var(--space);
    background-color: color-mix(in srgb, var(--color-dark), transparent 75%);
    backdrop-filter: blur(10px);
    border-radius: calc(var(--border-radius));
    z-index: 10;
    font-size: 1.25em;

    @media screen and (max-width: 1024px) {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.5);
      opacity: 0;
      pointer-events: none;
      transition: 0.3s ease-in-out;
      font-size: 1.5em;
      line-height: 2;
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
      display: none;
    }

  }

  &__list {
    display: flex;
    gap: var(--space-s);

    @media screen and (max-width: 1024px) {
      flex-direction: column;
    }
  }

  &__item {

    &--mobile-only {
      @media screen and (min-width: 1024px) {
        display: none;
      }
    }
  }

  &__link {
    background-color: color-mix(in srgb, var(--color-light), transparent 100%);
    padding: var(--space-xs) var(--space);
    border-radius: var(--border-radius);
    transition: background-color 0.3s ease;
    color: var(--color-light);
    text-shadow: 1px 1px 3px color-mix(in srgb, var(--color-dark), transparent 75%);
    white-space: nowrap;

    &:hover {
      background-color: color-mix(in srgb,
          var(--color-primary),
          transparent 0%);
      color: var(--color-light);
    }

    &.router-link-active {
      background-color: var(--color-secondary);
      color: var(--color-secondary-text);
    }
  }
}
</style>
