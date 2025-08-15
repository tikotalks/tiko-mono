<template>
  <div :class="bemm('wrapper')">
    <article :class="bemm('', ['', 'shimmer'])">
      <div :class="bemm('content')">
        <div :class="bemm('image-placeholder')" />
        <div :class="bemm('title-placeholder')" />
      </div>
    </article>
  </div>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';

const bemm = useBemm('card-ghost-tile');
</script>

<style lang="scss">
.card-ghost-tile {
  width: 100%;
  height: 100%;
  border-radius: var(--border-radius);
  background-color: var(--color-foreground-10);
  position: relative;
  overflow: hidden;
  animation: ghost-fade 2s ease-in-out infinite;

  &--shimmer {
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent 0%,
        var(--color-foreground-10) 50%,
        transparent 100%
      );
      animation: shimmer 1.5s infinite;
    }
  }

  &__wrapper {
    width: 100%;
    height: 100%;
  }

  &__content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: var(--space);
  }

  &__image-placeholder {
    flex: 1;
    background-color: var(--color-foreground-5);
    border-radius: calc(var(--border-radius) * 0.5);
    margin-bottom: var(--space-xs);
  }

  &__title-placeholder {
    height: 20px;
    width: 70%;
    background-color: var(--color-foreground-5);
    border-radius: var(--border-radius-small);
  }
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}

@keyframes ghost-fade {
  0%, 100% {
    opacity: 0.25;
  }
  50% {
    opacity: 0.5;
  }
}
</style>