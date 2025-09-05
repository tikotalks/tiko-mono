<template>
  <footer :class="bemm()">
    <div :class="bemm('container')">
      <div :class="bemm('top')">
        <div :class="bemm('column', ['', 'left'])">
          <TLogo :class="bemm('logo')" />
        </div>

        <div :class="bemm('column', ['', 'right'])">
          <ul :class="bemm('nav-columns')">
            <li v-for="nav in navigation" :key="nav.label" :class="bemm('nav-item', ['', 'main'])">
              <h4 :class="bemm('nav-label')">{{ nav.label }}</h4>
              <ul :class="bemm('nav-list')">
                <li :class="bemm('nav-item')" v-for="item in nav.items" :key="item.text">
                  <RouterLink :to="item.to" :class="bemm('nav-link')">
                    <span :class="bemm('nav-text')">{{ item.text }}</span>
                  </RouterLink>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>

      <div :class="bemm('bottom')">
        <p :class="bemm('text')">
          &copy; {{ new Date().getFullYear() }} Tiko. All rights reserved.
        </p>
        <div :class="bemm('links')">
          <RouterLink v-for="link in links" :key="link.text" :to="link.to" :class="bemm('link')">
            {{ link.text }}
          </RouterLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { TLogo } from '@tiko/ui';
import { useBemm } from 'bemm';
import { computed, ref, onMounted } from 'vue';
import { RouterLinkProps } from 'vue-router';
import { useContent } from '@tiko/core';
const bemm = useBemm('footer');

const links = computed(() => [
  { text: 'Privacy Policy', to: { name: 'content', params: { view: 'privacy-policy' } } },
  { text: 'Terms of Service', to: { name: 'content', params: { view: 'terms-of-service' } } },
  { text: 'Contact Us', to: { name: 'content', params: { view: 'contact' } } },
]);

// Initialize content service
const content = useContent({
  projectSlug: 'marketing',
  useWorker: import.meta.env.VITE_USE_CONTENT_WORKER === 'true',
  workerUrl: import.meta.env.VITE_CONTENT_API_URL,
  deployedVersionId: import.meta.env.VITE_DEPLOYED_VERSION_ID,
  noCache: false
});

// Dynamic navigation from database
const navigation = ref<Array<{
  label: string;
  items: Array<{ text: string; url: string; to: { name: string; params: { view: string } } }>;
}>>([]);

// Fallback navigation
const fallbackNavigation = [
  {
    label: 'Tiko',
    items: [
      {
        text: 'Team', url: '/team', to: {
          name: 'content',
          params: { view: 'team' }
        }
      },
      {
        text: 'Apps', url: '/apps', to: {
          name: 'content',
          params: { view: 'apps' }
        }
      },
      {
        text: 'Contact',
        url: '/contact',
        to: { name: 'content', params: { view: 'contact' } }
      },
    ],
  },
  {
    label: 'About',
    items: [
      {
        text: 'About', url: '/about', to: {
          name: 'content',
          params: { view: 'about' }
        }
      },
      {
        text: 'Updates',
        url: '/updates',
        to: { name: 'content', params: { view: 'update' } }
      },
      {
        text: 'FAQ',
        url: '/faq',
        to: { name: 'content', params: { view: 'faq' } }
      },
    ],
  },
  {
    label: 'Information',
    items: [
      {
        text: 'Sponsors',
        url: '/sponsors',
        to: { name: 'content', params: { view: 'sponsors' } }
      },
      {
        text: 'Technology', url: '/technology', to: {
          name: 'content',
          params: { view: 'technology' }
        }
      },
      {
        text: 'Speech Therapy',
        url: '/speech-therapy', to: {
          name: 'content',
          params: { view: 'speech-therapy' }
        }
      },
    ]
  }
];

// Load footer navigation from database
async function loadFooterNavigation() {
  try {
    // Get the marketing project
    const project = await content.getProject('marketing');
    if (!project) {
      console.error('[Footer] Marketing project not found');
      navigation.value = fallbackNavigation;
      return;
    }

    // Get the footer menu
    const menu = await content.getNavigationMenuBySlug('main-footer-menu', project.id);
    
    if (!menu || !menu.items || menu.items.length === 0) {
      console.warn('[Footer] Menu "main-footer-menu" not found or empty, using fallback');
      navigation.value = fallbackNavigation;
      return;
    }

    console.log(`[Footer] Loaded footer menu with ${menu.items.length} sections`);

    // Convert navigation items to footer format
    // Footer expects items with children to be grouped into sections
    navigation.value = menu.items
      .filter(item => item.is_visible && item.type === 'label' && item.items && item.items.length > 0)
      .map(section => ({
        label: section.label,
        items: section.items
          .filter(child => child.is_visible)
          .map(child => convertToFooterItem(child))
          .filter(item => item !== null) as Array<{ text: string; url: string; to: { name: string; params: { view: string } } }>
      }));

    console.log('[Footer] Loaded navigation sections:', navigation.value);
  } catch (error) {
    console.error('[Footer] Failed to load footer navigation:', error);
    navigation.value = fallbackNavigation;
  }
}

// Convert navigation item to footer format
function convertToFooterItem(item: any) {
  if (item.type === 'page' && item.page_id) {
    // For page links, we need to get the page slug
    // Since we can't await here, we'll use the item label as fallback
    const slug = item.url?.replace(/^\//, '') || item.label.toLowerCase().replace(/\s+/g, '-');
    return {
      text: item.label,
      url: `/${slug}`,
      to: { name: 'content', params: { view: slug } }
    };
  } else if (item.type === 'custom' && item.url) {
    const slug = item.url.replace(/^\//, '');
    return {
      text: item.label,
      url: item.url,
      to: { name: 'content', params: { view: slug } }
    };
  } else if (item.type === 'external' && item.url) {
    // External links - won't use router
    return {
      text: item.label,
      url: item.url,
      to: { name: '', params: { view: '' } } // Dummy route for external links
    };
  }
  
  // Skip label-only items in footer
  return null;
}

// Load navigation on mount
onMounted(() => {
  loadFooterNavigation();
});
</script>

<style lang="scss">
.footer {
  background-color: var(--color-background);
  color: var(--color-foreground);
  padding: var(--space);
  background-image: linear-gradient(to bottom,
      var(--color-background) 25%,
      var(--color-primary));

  &__container {
    background-color: var(--color-background);
    color: var(--color-foreground);
    padding: calc(var(--spacing) - var(--space));
    border-radius: var(--border-radius);
  }

  &__logo{
    width: 10em;
  }


  &__column {
    width: 50%;
    @media screen and (max-width: 768px) {
      width: 100%;
    }

    &--left {
      text-align: left;

      @media screen and (max-width: 768px) {
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }

    &--right {
      display: flex;
      justify-content: flex-end;

      @media screen and (max-width: 768px) {

        justify-content: center;
      }
    }
  }

  &__nav-columns {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--space);
    gap: var(--space);
  }

  &__nav-item {
    margin: 0;
    padding: 0;
    list-style: none;

    &--main {
      padding: var(--space);
    }
  }

  &__nav-label {
    font-weight: bold;
    color: var(--color-primary);
    text-transform: uppercase;
font-size: .75em;
letter-spacing: .1em;
  }

  &__nav-list {
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-s);

    list-style: none;
    margin-top: var(--space);
  }

  &__nav-link {
    color: var(--color-foreground);
    text-decoration: none;
    width: 100%;
    transition: color 0.2s;

    &:hover {
      color: var(--color-secondary);
    }
  }

  &__nav-text {
    color: inherit;
  }

  &__top {
    display: flex;

    @media screen and (max-width: 768px) {
      flex-direction: column;
      align-items: center;
    }
  }

  &__content {
    margin-bottom: var(--space-md);
  }

  &__bottom {
    display: flex;
    justify-content: space-between;
    padding: var(--space-s) var(--space);
    gap: var(--space);
    opacity: 0.5;
    font-size: var(--font-size-s);

    @media screen and (max-width: 768px) {
      flex-direction: column;
      align-items: center;
    }
  }

  &__links {
    display: flex;
    gap: var(--space);
  }

  &__link {
    &:hover {
      color: var(--color-primary);
    }
  }
}
</style>
