<template>
  <section :class="bemm()" :style="sectionStyle">
    <div :class="bemm('container')">
      <div :class="bemm('content')">
        <h2 v-if="content?.title" :class="bemm('title')">
          {{ content.title }}
        </h2>
        
        <p v-if="content?.description" :class="bemm('description')">
          {{ content.description }}
        </p>
        
        <div v-if="content?.buttons?.length" :class="bemm('actions')">
          <TButton
            v-for="(button, index) in content.buttons"
            :key="index"
            :type="index === 0 ? 'primary' : 'outline'"
            :size="'large'"
            @click="handleButtonClick(button)"
          >
            {{ button.label }}
          </TButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'
import { useRouter } from 'vue-router'
import type { ContentSection } from '@tiko/core'
import TButton from '../components/ui-elements/TButton/TButton.vue'

// Props
interface CTAButton {
  label: string
  url: string
  external?: boolean
}

interface Props {
  section: ContentSection
  content: {
    title?: string
    description?: string
    backgroundColor?: string
    textColor?: string
    buttons?: CTAButton[]
  }
}

const props = defineProps<Props>()
const bemm = useBemm('cta-section')
const router = useRouter()

const sectionStyle = computed(() => {
  const styles: Record<string, string> = {}
  
  if (props.content?.backgroundColor) {
    styles.backgroundColor = props.content.backgroundColor
  }
  
  if (props.content?.textColor) {
    styles.color = props.content.textColor
  }
  
  return styles
})

const handleButtonClick = (button: CTAButton) => {
  if (button.external || button.url.startsWith('http')) {
    window.open(button.url, '_blank')
  } else {
    router.push(button.url)
  }
}
</script>

<style lang="scss">
.cta-section {
  padding: var(--space-3xl) 0;
  background: var(--color-primary);
  color: white;
  text-align: center;

  &__container {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 0 var(--space);
  }

  &__content {
    max-width: 800px;
    margin: 0 auto;
  }

  &__title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    margin: 0 0 var(--space) 0;
  }

  &__description {
    font-size: var(--font-size-lg);
    margin: 0 0 var(--space-xl) 0;
    opacity: 0.95;
  }

  &__actions {
    display: flex;
    gap: var(--space);
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>