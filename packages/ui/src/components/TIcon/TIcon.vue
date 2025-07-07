<template>
  <span
    :class="iconClasses"
    :style="iconStyles"
    role="img"
    :aria-label="ariaLabel"
    :aria-hidden="ariaHidden"
    v-html="iconSvg"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useBemm } from 'bemm'
// Simple fallback for icon loading
const getIcon = async (name: string): Promise<string> => {
  // For now, return a simple placeholder SVG
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
    <text x="12" y="16" text-anchor="middle" font-size="12" fill="currentColor">${name.charAt(0).toUpperCase()}</text>
  </svg>`
}

export interface TIconProps {
  name: string
  size?: 'small' | 'medium' | 'large' | string
  color?: string
  ariaLabel?: string
  ariaHidden?: boolean
}

const props = withDefaults(defineProps<TIconProps>(), {
  size: 'medium',
  ariaHidden: true
})

// BEM classes
const bemm = useBemm('icon')

// Icon SVG content
const iconSvg = ref<string>('')

// Load icon asynchronously
const loadIcon = async (iconName: string) => {
  try {
    const svg = await getIcon(iconName)
    iconSvg.value = svg || ''
  } catch (error) {
    console.warn(`Failed to load icon: ${iconName}`, error)
    iconSvg.value = ''
  }
}

// Watch for icon name changes
watch(() => props.name, loadIcon, { immediate: true })

// Computed properties
const iconClasses = computed(() => {
  const sizeClass = typeof props.size === 'string' && ['small', 'medium', 'large'].includes(props.size)
    ? props.size
    : 'custom'
    
  return bemm('', {
    [sizeClass]: true
  })
})

const iconStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  // Custom size handling
  if (typeof props.size === 'string' && !['small', 'medium', 'large'].includes(props.size)) {
    styles.fontSize = props.size
    styles.width = props.size
    styles.height = props.size
  }
  
  // Custom color
  if (props.color) {
    styles.color = props.color
  }
  
  return styles
})
</script>

<style lang="scss" scoped>
.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: currentColor;
  
  // Size variants
  &--small {
    font-size: 0.8em;
    width: 0.8em;
    height: 0.8em;
  }
  
  &--medium {
    font-size: 1em;
    width: 1em;
    height: 1em;
  }
  
  &--large {
    font-size: 1.2em;
    width: 1.2em;
    height: 1.2em;
  }
  
  // Ensure SVG fills the container
  :deep(svg) {
    width: 100%;
    height: 100%;
    fill: currentColor;
    stroke: currentColor;
  }
}
</style>