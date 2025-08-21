<template>
  <span
    :data-i18n="key"
    :class="['t-text', { 't-text--untranslated': isUntranslated }]"
    v-if="wrapped"
  >
    {{ text }}
  </span>
  <template v-else>
    {{ text }}
  </template>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from '@tiko/core';

const { t } = useI18n();

interface TTextProps {
  key: string;
  fallback?: string;
  wrapped?: boolean;
}
const props = withDefaults(defineProps<TTextProps>(), {
  wrapped: true,
  fallback: ''
});

const text = computed(() => {
  // Ensure key is a string
  const keyStr = String(props.key);
  const translated = t(keyStr);
  console.log('TText debug:', {
    key: props.key,
    keyStr: keyStr,
    translated: translated,
    typeOfTranslated: typeof translated,
    isUndefined: translated === undefined,
    isNull: translated === null,
    isString: typeof translated === 'string',
    translatedLength: translated ? translated.length : 0
  });
  // Handle undefined/null cases or the string "undefined"
  if (translated === undefined || translated === null || translated === 'undefined') {
    return props.fallback || keyStr;
  }
  return translated;
});

const isUntranslated = computed(() => {
  // Check if the translation returned is the same as the key (meaning it's untranslated)
  return text.value === props.key;
});

</script>

<style lang="scss">
.t-text {
  &--untranslated {
    opacity: 0.5;
    border: 1px solid var(--color-error);
    border-radius: var(--radius-sm);
    padding: 0 var(--space-xs);
    font-family: var(--font-family-mono);
    font-size: 0.9em;
  }
}
</style>
