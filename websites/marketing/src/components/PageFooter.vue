<template>
  <footer :class="bemm()">
    <div :class="bemm('container')">
      <div :class="bemm('top')">
        <div :class="bemm('column', ['', 'left'])">
          <TLogo :class="bemm('logo')" />
        </div>

        <div :class="bemm('column', ['', 'right'])">
          <ul :class="bemm('nav-columns')">
            <li
              v-for="nav in navigation"
              :key="nav.label"
              :class="bemm('nav-item', ['', 'main'])"
            >
              <h4 :class="bemm('nav-label')">{{ nav.label }}</h4>
              <ul :class="bemm('nav-list')">
                <li
                  :class="bemm('nav-item')"
                  v-for="item in nav.items"
                  :key="item.text"
                >
                  <a :class="bemm('nav-link')" :href="item.url">
                    <span :class="bemm('nav-text')">{{ item.text }}</span></a
                  >
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
          <a
            v-for="link in links"
            :key="link.text"
            :href="link.url"
            :class="bemm('link')"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ link.text }}
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { TLogo } from '@tiko/ui';
import { useBemm } from 'bemm';
import { computed } from 'vue';
const bemm = useBemm('footer');

const links = computed(() => [
  { text: 'Privacy Policy', url: '/privacy' },
  { text: 'Terms of Service', url: '/terms' },
  { text: 'Contact Us', url: '/contact' },
]);

const navigation = computed<
  Array<{
    label: string;
    items: Array<{ text: string; url: string }>;
  }>
>(() => [
  {
    label: 'Tiko',
    items: [
      { text: 'About', url: '/about' },
      { text: 'Funding', url: '/funding' },
      { text: 'Sponsors', url: '/sponsors' },
      { text: 'Technology', url: '/technology' },
    ],
  },
  {
    label: 'Support',
    items: [
      { text: 'Help Center', url: '/help' },
      { text: 'Contact Support', url: '/support' },
      { text: 'FAQ', url: '/faq' },
    ],
  },
]);
</script>

<style lang="scss">
.footer {
  background-color: var(--color-light);
  color: var(--color-light);
  padding: var(--space);
  background-image: linear-gradient(
    to top,
    var(--color-dark) 10%,
    var(--color-light)
  );

  &__container {
    background-color: var(--color-dark);
    color: var(--color-light);
    padding: calc(var(--spacing) - var(--space));
    border-radius: var(--border-radius);
  }

  &__column {
    width: 50%;
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
  }
  &__nav-list {
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-s);

    list-style: none;
  }

  &__nav-link {
    color: var(--color-light);
    text-decoration: none;
    width: 100%;
    transition: color 0.2s;

    &:hover {
      color: var(--color-primary);
    }
  }
  &__nav-text {
    color: var(--color-light);
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
}
</style>
