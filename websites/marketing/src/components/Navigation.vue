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

        <li :class="bemm('item')" v-for="item in navigationItems" :key="item.id">
          <!-- External links -->
          <a v-if="item.type === 'external' && item.url" :href="item.url" :class="bemm('link')"
            :target="item.target || '_blank'" rel="noopener noreferrer">
            <span v-if="item.icon" :class="bemm('icon')">
              <TIcon :name="item.icon" />
            </span>
            <span :class="bemm('text')">
              {{ item.label }}
            </span>
          </a>
          <!-- Page links -->
          <router-link v-else-if="item.type === 'page' && item.page_slug"
            :to="{ name: 'content', params: { view: item.page_slug } }" :class="bemm('link')">
            <span v-if="item.icon" :class="bemm('icon')">
              <TIcon :name="item.icon" />
            </span>
            <span :class="bemm('text')">
              {{ item.label }}
            </span>
          </router-link>
          <!-- Custom internal links -->
          <router-link v-else-if="item.type === 'custom' && item.url"
            :to="{ name: 'content', params: { view: item.url.replace(/^\//, '') } }" :class="bemm('link')">
            <span v-if="item.icon" :class="bemm('icon')">
              <TIcon :name="item.icon" />
            </span>
            <span :class="bemm('text')">
              {{ item.label }}
            </span>
          </router-link>
          <!-- Label only (no link) -->
          <span v-else :class="bemm('link', 'label')">
            <span v-if="item.icon" :class="bemm('icon')">
              <TIcon :name="item.icon" />
            </span>
            <span :class="bemm('text')">
              {{ item.label }}
            </span>
          </span>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { TIcon } from '@tiko/ui';
import { useBemm } from 'bemm';
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { useContentStore } from '@/stores';
import { useRoute } from 'vue-router';

const bemm = useBemm('navigation');
const route = useRoute();
const active = ref(false);

// Use content store
const contentStore = useContentStore();

// Detect if mobile
const isMobile = ref(window.innerWidth < 1024);

// Get navigation items from store based on device type
const navigationItems = computed(() => {
  const menu = isMobile.value ? contentStore.mobileMenu : contentStore.headerMenu;
  if (!menu || !menu.items) return [];

  // Filter visible items only - worker now provides page_slug for page items
  return menu.items.filter(item => item.is_visible);
});

// Update isMobile on window resize
function handleResize() {
  isMobile.value = window.innerWidth < 1024;
}

// Initialize navigation
onMounted(async () => {
  await contentStore.loadAllNavigation();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// Close navigation when route changes
watch(() => route.path, () => {
  active.value = false;
});
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
    position: relative;
  }

  &__link {
    background-color: color-mix(in srgb, var(--color-light), transparent 100%);
    padding: var(--space-xs) var(--space);
    border-radius: var(--border-radius);
    transition: background-color 0.3s ease;
    color: var(--color-light);
    text-shadow: 1px 1px 3px color-mix(in srgb, var(--color-dark), transparent 75%);
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);

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

    &--label {
      cursor: default;

      &:hover {
        background-color: transparent;
      }
    }
  }

  &__dropdown {
    position: relative;
  }

  &__dropdown-toggle {
    background-color: color-mix(in srgb, var(--color-light), transparent 100%);
    padding: var(--space-xs) var(--space);
    border-radius: var(--border-radius);
    transition: background-color 0.3s ease;
    color: var(--color-light);
    text-shadow: 1px 1px 3px color-mix(in srgb, var(--color-dark), transparent 75%);
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    border: none;
    cursor: pointer;
    font-size: inherit;
    font-family: inherit;

    &:hover {
      background-color: color-mix(in srgb,
          var(--color-primary),
          transparent 0%);
      color: var(--color-light);
    }
  }

  &__dropdown-arrow {
    margin-left: var(--space-xs);
    transition: transform 0.3s ease;
  }

  &__dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: var(--space-xs);
    background-color: var(--color-dark);
    border-radius: var(--border-radius);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    min-width: 200px;
    z-index: 20;

    @media screen and (max-width: 1024px) {
      position: static;
      margin-top: var(--space);
      margin-left: var(--space);
      box-shadow: none;
      background-color: transparent;
    }
  }

  &__dropdown-item {
    list-style: none;
  }

  &__dropdown-link {
    display: block;
    padding: var(--space-xs) var(--space);
    color: var(--color-light);
    text-decoration: none;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: var(--color-primary);
    }

    &--label {
      cursor: default;

      &:hover {
        background-color: transparent;
      }
    }
  }

  &__icon {
    display: inline-flex;
    align-items: center;
  }

  &__text {
    display: inline-flex;
    align-items: center;
  }
}
</style>
