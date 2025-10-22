<template>
  <ul :class="bemm()" v-if="filteredTokens.length">
    <li
      v-for="(token, index) in filteredTokens"
      :key="index"
      :class="[
        bemm('item'),
        bemm('item', (token.tag || 'X').toLowerCase()),
        clickable ? bemm('item', 'clickable') : ''
      ]"
      :data-tag="token.tag"
      @click="handleClick(token)"
    >
      {{ token.text }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'

export interface WordToken {
  text: string
  tag?: string
  index?: number
}

const props = withDefaults(
  defineProps<{
    tokens: WordToken[]
    showPunct?: boolean
    clickable?: boolean
  }>(),
  {
    showPunct: false,
    clickable: true,
  }
)

const emit = defineEmits<{
  (e: 'item-click', token: WordToken): void
}>()

const bemm = useBemm('t-word-list')

const filteredTokens = computed(() => {
  if (props.showPunct) return props.tokens
  return props.tokens.filter(t => (t.tag || '').toUpperCase() !== 'PUNCT')
})

function handleClick(token: WordToken) {
  if (!props.clickable) return
  emit('item-click', token)
}
</script>

<style scoped lang="scss">
.t-word-list {
  display: flex;
  gap: var(--space-s);
  flex-wrap: wrap;
  padding: 0;
  margin: 0;
  list-style: none;

  &__item {
    display: block;
    border-radius: calc(var(--border-radius) / 2);
    padding: var(--space-xs) var(--space-s);
    border: 1px solid transparent;
    position: relative;

    &--clickable {
      cursor: pointer;
    }

    &:empty {
      display: none;
    }

    &:hover {
      filter: brightness(0.95);
    }

    /* Colors (override via CSS variables; defaults provided here via fallbacks) */
    &--noun { background-color: color-mix(in srgb, var(--upos-noun, #4c78ff), transparent 85%); border-color: color-mix(in srgb, var(--upos-noun, #4c78ff), transparent 50%); }
    &--verb { background-color: color-mix(in srgb, var(--upos-verb, #ff6b6b), transparent 85%); border-color: color-mix(in srgb, var(--upos-verb, #ff6b6b), transparent 50%); }
    &--adj { background-color: color-mix(in srgb, var(--upos-adj, #ffb74d), transparent 85%); border-color: color-mix(in srgb, var(--upos-adj, #ffb74d), transparent 50%); }
    &--adv { background-color: color-mix(in srgb, var(--upos-adv, #64b5f6), transparent 85%); border-color: color-mix(in srgb, var(--upos-adv, #64b5f6), transparent 50%); }
    &--pron { background-color: color-mix(in srgb, var(--upos-pron, #9575cd), transparent 85%); border-color: color-mix(in srgb, var(--upos-pron, #9575cd), transparent 50%); }
    &--det { background-color: color-mix(in srgb, var(--upos-det, #4db6ac), transparent 85%); border-color: color-mix(in srgb, var(--upos-det, #4db6ac), transparent 50%); }
    &--adp { background-color: color-mix(in srgb, var(--upos-adp, #90a4ae), transparent 85%); border-color: color-mix(in srgb, var(--upos-adp, #90a4ae), transparent 50%); }
    &--cconj { background-color: color-mix(in srgb, var(--upos-cconj, #81c784), transparent 85%); border-color: color-mix(in srgb, var(--upos-cconj, #81c784), transparent 50%); }
    &--sconj { background-color: color-mix(in srgb, var(--upos-sconj, #aed581), transparent 85%); border-color: color-mix(in srgb, var(--upos-sconj, #aed581), transparent 50%); }
    &--aux { background-color: color-mix(in srgb, var(--upos-aux, #f06292), transparent 85%); border-color: color-mix(in srgb, var(--upos-aux, #f06292), transparent 50%); }
    &--part { background-color: color-mix(in srgb, var(--upos-part, #ba68c8), transparent 85%); border-color: color-mix(in srgb, var(--upos-part, #ba68c8), transparent 50%); }
    &--propn { background-color: color-mix(in srgb, var(--upos-propn, #26a69a), transparent 85%); border-color: color-mix(in srgb, var(--upos-propn, #26a69a), transparent 50%); }
    &--num { background-color: color-mix(in srgb, var(--upos-num, #26c6da), transparent 85%); border-color: color-mix(in srgb, var(--upos-num, #26c6da), transparent 50%); }
    &--intj { background-color: color-mix(in srgb, var(--upos-intj, #ff8a65), transparent 85%); border-color: color-mix(in srgb, var(--upos-intj, #ff8a65), transparent 50%); }
    &--sym { background-color: color-mix(in srgb, var(--upos-sym, #8d6e63), transparent 85%); border-color: color-mix(in srgb, var(--upos-sym, #8d6e63), transparent 50%); }
    &--punct { background-color: color-mix(in srgb, var(--upos-punct, #bdbdbd), transparent 85%); border-color: color-mix(in srgb, var(--upos-punct, #bdbdbd), transparent 50%); }
    &--x { background-color: color-mix(in srgb, var(--upos-x, #b0bec5), transparent 85%); border-color: color-mix(in srgb, var(--upos-x, #b0bec5), transparent 50%); }
  }
}
</style>
