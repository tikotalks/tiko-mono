<template>
  <nav :class="bemm()">
    <button
      v-if="showMobileToggle"
      :class="bemm('trigger', ['', active ? 'active' : ''])"
      @click="active = !active"
      :aria-label="active ? t('navigation.close') : t('navigation.open')"
    >
      <span />
      <span />
      <span />
    </button>
    <div :class="bemm('overlay')" v-if="active && showMobileToggle" @click="active = false"></div>
    <div :class="bemm('container', ['', active ? 'active' : ''])">
      <router-link v-if="showLogo && logo" to="/" :class="bemm('logo')">
        {{ logo }}
      </router-link>
      <ul :class="bemm('list')">
        <li :class="bemm('item')" v-for="item in items" :key="item.id">
          <router-link
            :to="item.path"
            :class="bemm('link', ['', isActive(item.path) ? 'active' : ''])"
            @click="handleLinkClick"
          >
            <span :class="bemm('text')">
              {{ item.title }}
            </span>
          </router-link>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBemm } from 'bemm'
import { useRoute } from 'vue-router'
import { useI18n } from '../../../composables/useI18n'
import type { TNavigationProps } from './TNavigation.model'

withDefaults(defineProps<TNavigationProps>(), {
  showMobileToggle: true,
  showLogo: true
})

const bemm = useBemm('t-navigation')
const { t } = useI18n()
const route = useRoute()

const active = ref(false)

const isActive = (path: string) => {
  return route.path === path || (path !== '/' && route.path.startsWith(path))
}

const handleLinkClick = () => {
  // Close mobile menu when link is clicked
  active.value = false
}
</script>

<style lang="scss">
.t-navigation {
  &__trigger {
    position: relative;
    z-index: 30;
    position: fixed;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    flex-direction: column;
    background-color: var(--color-primary);
    border: none;
    top: 0;
    right: 0;
    margin: calc(var(--space-l) + var(--space-s));
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: var(--color-primary-hover);
    }

    span {
      display: block;
      width: 1.5em;
      height: 0.2em;
      background-color: var(--color-background);
      border-radius: 0.1em;
      transition: transform 0.3s ease, opacity 0.3s ease;
      margin: 0.2em 0;

      &:nth-child(1) {
        transform: scaleX(0.8) translateY(-0.1em);
      }
      &:nth-child(2) {
        transform: scaleX(1);
      }
      &:nth-child(3) {
        transform: scaleX(0.8) translateY(0.1em);
      }
    }

    &--active {
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
      display: none;
    }
  }

  &__overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 20;

    @media screen and (min-width: 1024px) {
      display: none;
    }
  }

  &__container {
    display: flex;
    align-items: center;
    gap: var(--space-lg);
    padding: var(--space);
    background-color: var(--color-background);
    border-radius: var(--border-radius);
    z-index: 25;

    @media screen and (max-width: 1024px) {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.5);
      opacity: 0;
      pointer-events: none;
      transition: 0.3s ease-in-out;
      font-size: 1.5em;
      flex-direction: column;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }

    &--active {
      @media screen and (max-width: 1024px) {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
        pointer-events: all;
      }
    }
  }

  &__logo {
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-lg);
    color: var(--color-primary);
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover {
      color: var(--color-primary-hover);
    }
  }

  &__list {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: var(--space-s);

    @media screen and (max-width: 1024px) {
      flex-direction: column;
      gap: var(--space);
    }
  }

  &__item {
    margin: 0;
  }

  &__link {
    display: flex;
    align-items: center;
    padding: var(--space-xs) var(--space);
    border-radius: var(--border-radius);
    transition: background-color 0.3s ease, color 0.3s ease;
    color: var(--color-foreground);
    text-decoration: none;

    &:hover {
      background-color: var(--color-primary);
      color: var(--color-primary-text);
    }

    &--active {
      background-color: var(--color-primary);
      color: var(--color-primary-text);
    }
  }

  &__text {
    font-weight: var(--font-weight-medium);
  }
}
</style>
