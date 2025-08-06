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
import { ref, watch } from 'vue';
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

const items: NavigationItem[] = [
  { name: 'About', link: '/about' },
  { name: 'Apps', link: '/apps' },
  { name: 'Sponsors', link: '/sponsors' },
];

// Initialize content service for preloading
const content = useContent({
  projectSlug: 'marketing',
  useWorker: import.meta.env.VITE_USE_CONTENT_WORKER === 'true',
  workerUrl: import.meta.env.VITE_CONTENT_API_URL,
  deployedVersionId: import.meta.env.VITE_DEPLOYED_VERSION_ID,
  noCache: false
});

// Preload page content on hover
const preloadPage = (path: string) => {
  // Extract slug from path (e.g., /about -> about)
  const slug = path.replace('/', '') || 'home';

  // Don't preload the current page
  const currentSlug = router.currentRoute.value.path.replace('/', '') || 'home';
  if (slug === currentSlug) return;

  // Preload the page content
  content.loadPage('marketing', slug, locale.value).catch(() => {
    // Silently fail if preload doesn't work
  });
};

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
  }
}
</style>
