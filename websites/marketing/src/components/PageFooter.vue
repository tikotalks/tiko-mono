<template>
  <footer :class="bemm()">
    <div :class="bemm('container')">
      <div :class="bemm('top')">
        <div :class="bemm('column', ['', 'left'])">
          <TLogo :class="bemm('logo')" />
        </div>

        <div :class="bemm('column', ['', 'right'])">
          <ul :class="bemm('nav-columns')">
            <li v-for="section in footerSections" :key="section.id" :class="bemm('nav-item', ['', 'main'])">
              <h4 :class="bemm('nav-label')">{{ section.label }}</h4>
              <ul :class="bemm('nav-list')">
                <li :class="bemm('nav-item')" v-for="item in section.items" :key="item.id">
                  <!-- External links -->
                  <a v-if="item.type === 'external' && item.url" 
                    :href="item.url"
                    :class="bemm('nav-link')"
                    :target="item.target || '_blank'"
                    rel="noopener noreferrer">
                    <span :class="bemm('nav-text')">{{ item.label }}</span>
                  </a>
                  <!-- Page links -->
                  <RouterLink v-else-if="item.type === 'page' && item.page_slug" 
                    :to="{ name: 'content', params: { view: item.page_slug } }" 
                    :class="bemm('nav-link')">
                    <span :class="bemm('nav-text')">{{ item.label }}</span>
                  </RouterLink>
                  <!-- Custom internal links -->
                  <RouterLink v-else-if="item.type === 'custom' && item.url"
                    :to="{ name: 'content', params: { view: item.url.replace(/^\//, '') } }"
                    :class="bemm('nav-link')">
                    <span :class="bemm('nav-text')">{{ item.label }}</span>
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
          <RouterLink v-for="link in bottomLinks" :key="link.id" 
            :to="{ name: 'content', params: { view: link.page_slug || link.url?.replace(/^\//, '') } }" 
            :class="bemm('link')">
            {{ link.label }}
          </RouterLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { TLogo } from '@tiko/ui';
import { useBemm } from 'bemm';
import { computed, onMounted } from 'vue';
import { useContentStore } from '@/stores';

const bemm = useBemm('footer');

// Use content store
const contentStore = useContentStore();

// Get footer sections from navigation menu
const footerSections = computed(() => {
  const menu = contentStore.footerMenu;
  if (!menu || !menu.items) return [];
  
  // Filter to only show label items with children (sections)
  return menu.items
    .filter(item => item.is_visible && item.type === 'label' && item.items && item.items.length > 0)
    .map(section => ({
      ...section,
      items: section.items.filter(child => child.is_visible)
    }));
});

// Bottom links - could come from a separate menu or be hardcoded
const bottomLinks = computed(() => {
  // These could be managed in the CMS as a separate menu
  // For now, returning static links
  return [
    { id: '1', label: 'Privacy Policy', page_slug: 'privacy-policy' },
    { id: '2', label: 'Terms of Service', page_slug: 'terms-of-service' },
    { id: '3', label: 'Contact Us', page_slug: 'contact' }
  ];
});

// Initialize navigation on mount
onMounted(() => {
  contentStore.loadAllNavigation();
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