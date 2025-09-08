<template>
  <div :class="bemm()">
    <ul :class="bemm('list')" :style="`--top: ${number * (100 / 11)}%`">
      <li :class="bemm('item')" v-for="(num, index) in 11" :key="num || index">
        {{ num - 1 }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
  import { useBemm } from 'bemm'

  const bemm = useBemm('time-number')

  const props = defineProps<{
    number: number
  }>()
</script>

<style lang="scss">
  .time-number {
    width: 0.75em;
    height: 1em;
    overflow: hidden;
    background-color: var(--color-background);
    border: 2px solid var(--color-accent);
    border-radius: 8px;

    &__list {
      height: fit-content;
      display: flex;
      flex-direction: column;
      transform: translateY(calc(var(--top) * -1));
      transition: transform 0.3s ease;
    }
    &__item {
      height: 1em;
      width: 0.75em;
      line-height: 1em;
      text-align: center;
    }
  }
</style>
