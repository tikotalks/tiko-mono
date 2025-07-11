<template>
  <div :class="bemm()">
    <header :class="bemm('header')">
      <h1>Color System</h1>
      <p>Design tokens and color palette for consistent theming across all Tiko applications</p>
    </header>

    <!-- Colors (Design Tokens) ---->
    <section :class="bemm('section')">
      <h2>Colors (Design Tokens)</h2>
      <p>Semantic color tokens that adapt to themes and provide consistent meaning across the UI. These are the primary colors you should use in components.</p>
      
      <div :class="bemm('color-grid')">
        <div v-for="color in semanticColors" :key="color.name" :class="bemm('color-item')">
          <div 
            :class="bemm('color-swatch')" 
            :style="{ backgroundColor: `var(--color-${color.name})` }"
            @click="copyColor(`var(--color-${color.name})`)"
          >
            <span 
              :class="bemm('color-text', 'light')"
              :style="{ color: color.hasTextColor ? `var(--color-${color.name}-text)` : 'white' }"
            >
              {{ color.name }}
            </span>
          </div>
          <div :class="bemm('color-info')">
            <h4>{{ color.displayName }}</h4>
            <div :class="bemm('color-tokens')">
              <code @click="copyColor(`var(--color-${color.name})`)">var(--color-{{ color.name }})</code>
              <code 
                v-if="color.hasTextColor" 
                @click="copyColor(`var(--color-${color.name}-text)`)"
                :class="bemm('text-token')"
              >
                var(--color-{{ color.name }}-text)
              </code>
            </div>
            <p>{{ color.usage }}</p>
            
            <!-- Text color demo -->
            <div v-if="color.hasTextColor" :class="bemm('text-demo')">
              <span 
                :style="{ 
                  backgroundColor: `var(--color-${color.name})`, 
                  color: `var(--color-${color.name}-text)`,
                  padding: 'var(--space-xs) var(--space-s)',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.875rem'
                }"
              >
                Text on {{ color.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Base Colors ---->
    <section :class="bemm('section')">
      <h2>Base Colors</h2>
      <p>Hardcoded color values that serve as the foundation for the design tokens above. These colors are used internally by the design system to generate theme variations.</p>
      
      <div :class="bemm('color-grid')">
        <div v-for="color in baseColors" :key="color.name" :class="bemm('color-item')">
          <div 
            :class="bemm('color-swatch')" 
            :style="{ backgroundColor: `var(--color-${color.name})` }"
            @click="copyColor(`var(--color-${color.name})`)"
          >
            <span 
              :class="bemm('color-text', isLightBaseColor(color.name) ? 'dark' : 'light')"
            >
              {{ color.name }}
            </span>
          </div>
          <div :class="bemm('color-info')">
            <h4>{{ color.displayName }}</h4>
            <div :class="bemm('color-tokens')">
              <code @click="copyColor(`var(--color-${color.name})`)">var(--color-{{ color.name }})</code>
              <code 
                v-if="color.hasTextColor" 
                @click="copyColor(`var(--color-${color.name}-text)`)"
                :class="bemm('text-token')"
              >
                var(--color-{{ color.name }}-text)
              </code>
            </div>
            <p>{{ color.usage }}</p>
            
            <!-- Text color demo -->
            <div v-if="color.hasTextColor" :class="bemm('text-demo')">
              <span 
                :style="{ 
                  backgroundColor: `var(--color-${color.name})`, 
                  color: `var(--color-${color.name}-text)`,
                  padding: 'var(--space-xs) var(--space-s)',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.875rem'
                }"
              >
                Text on {{ color.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Usage Guidelines ---->
    <section :class="bemm('section')">
      <h2>Usage Guidelines</h2>
      <p>Understanding when to use Colors vs BaseColors</p>
      
      <div :class="bemm('guidelines')">
        <div :class="bemm('guideline-card', 'recommended')">
          <h4>✅ Recommended: Use Colors (Design Tokens)</h4>
          <p>Always use semantic color tokens in your components. These adapt to themes and provide consistent meaning.</p>
          <div :class="bemm('code-example')">
            <code>background-color: var(--color-primary);</code>
            <code>color: var(--color-primary-text);</code>
            <code>border-color: var(--color-success);</code>
          </div>
        </div>

        <div :class="bemm('guideline-card', 'avoid')">
          <h4>⚠️ Avoid: Using BaseColors Directly</h4>
          <p>BaseColors are hardcoded values used internally. Avoid using them directly in components.</p>
          <div :class="bemm('code-example')">
            <code>background-color: var(--color-blue); /* ❌ Don't do this */</code>
            <code>color: var(--color-red); /* ❌ Not semantic */</code>
          </div>
        </div>
      </div>

      <div :class="bemm('demo')">
        <div :class="bemm('usage-example')">
          <h4>Proper Component Styling</h4>
          <div :class="bemm('example-card')" style="background: var(--color-background); border: 1px solid var(--color-border); color: var(--color-foreground);">
            <h3 style="color: var(--color-primary);">Primary Heading</h3>
            <p style="color: var(--color-foreground-secondary);">Secondary text content</p>
            <TButton color="primary">Primary Action</TButton>
            <TButton color="success" type="outline">Success Action</TButton>
          </div>
        </div>

        <div :class="bemm('usage-example')">
          <h4>Status Indicators</h4>
          <div style="display: flex; flex-direction: column; gap: var(--space-s);">
            <div style="padding: var(--space-s); background: var(--color-success); color: var(--color-success-text); border-radius: var(--radius);">
              <TIcon name="check" /> Success message
            </div>
            <div style="padding: var(--space-s); background: var(--color-warning); color: var(--color-warning-text); border-radius: var(--radius);">
              <TIcon name="warning" /> Warning message
            </div>
            <div style="padding: var(--space-s); background: var(--color-error); color: var(--color-error-text); border-radius: var(--radius);">
              <TIcon name="x" /> Error message
            </div>
          </div>
        </div>
      </div>

      <div :class="bemm('code')">
        <h4>CSS Best Practices</h4>
        <pre><code>/* ✅ Good: Use semantic color tokens */
.component {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-foreground);
}

.primary-button {
  background-color: var(--color-primary);
  color: var(--color-primary-text);
}

.success-indicator {
  background-color: var(--color-success);
  color: var(--color-success-text);
}

/* ❌ Avoid: Using base colors directly */
.bad-example {
  background-color: var(--color-blue); /* Not semantic */
  color: var(--color-red); /* Hard to maintain */
}</code></pre>
      </div>
    </section>

    <!-- Color Accessibility ---->
    <section :class="bemm('section')">
      <h2>Accessibility</h2>
      <p>Color contrast and accessibility considerations</p>
      
      <div :class="bemm('accessibility-grid')">
        <div :class="bemm('contrast-example')">
          <h4>Good Contrast</h4>
          <div style="background: var(--color-primary); color: var(--color-primary-text); padding: var(--space); border-radius: var(--radius);">
            <strong>Primary text on primary background</strong>
            <br>WCAG AA compliant contrast ratio
          </div>
        </div>

        <div :class="bemm('contrast-example')">
          <h4>Text Hierarchy</h4>
          <div style="background: var(--color-background); padding: var(--space); border: 1px solid var(--color-border); border-radius: var(--radius);">
            <h3 style="color: var(--color-foreground); margin: 0 0 var(--space-s);">Primary text</h3>
            <p style="color: var(--color-foreground-secondary); margin: 0;">Secondary text with appropriate contrast</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Copy Notification -->
    <div v-if="showCopyNotification" :class="bemm('copy-notification')">
      Color copied to clipboard!
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBemm } from 'bemm'
import { TButton, TIcon, Colors, BaseColors } from '@tiko/ui'

const bemm = useBemm('colors-view')

const showCopyNotification = ref(false)

// Create color objects from the actual types
const semanticColors = computed(() => 
  Object.values(Colors).map(color => ({
    name: color,
    displayName: color.charAt(0).toUpperCase() + color.slice(1),
    usage: getColorUsage(color),
    hasTextColor: hasTextColorVariant(color)
  }))
)

const baseColors = computed(() => 
  Object.values(BaseColors).map(color => ({
    name: color,
    displayName: color.charAt(0).toUpperCase() + color.slice(1),
    usage: `Hardcoded ${color} color value used internally by the design system`,
    hasTextColor: false // Base colors don't have text variants
  }))
)

function getColorUsage(color: string): string {
  const usageMap: Record<string, string> = {
    primary: 'Main brand color, primary actions, links, call-to-action buttons',
    secondary: 'Secondary actions, complementary elements, subtle buttons',
    tertiary: 'Subtle actions, background elements, tertiary buttons',
    quaternary: 'Fourth level elements, very subtle backgrounds',
    quinary: 'Fifth level elements, minimal contrast elements',
    accent: 'Highlighting, special elements, focus states, badges',
    background: 'Main application background, card backgrounds',
    foreground: 'Primary text content, main typography',
    dark: 'Dark theme elements, shadows, overlays',
    light: 'Light theme elements, highlights, elevated surfaces',
    success: 'Success states, positive feedback, confirmation messages',
    warning: 'Warning states, caution indicators, attention messages',
    error: 'Error states, destructive actions, validation errors',
    info: 'Information messages, neutral feedback, tooltips'
  }
  return usageMap[color] || `Semantic token for ${color} related UI elements`
}

function hasTextColorVariant(color: string): boolean {
  // Common colors that have text variants
  const colorsWithText = ['primary', 'secondary', 'tertiary', 'accent', 'success', 'warning', 'error', 'info', 'background']
  return colorsWithText.includes(color)
}

function isLightBaseColor(color: string): boolean {
  const lightColors = ['white', 'yellow', 'lime', 'silver', 'cyan']
  return lightColors.includes(color)
}

const isLightColor = (colorName: string): boolean => {
  // Simple logic to determine if we should use dark text
  const lightColors = ['background', 'background-secondary', 'surface']
  return lightColors.includes(colorName)
}

const isLightBackground = (colorName: string): boolean => {
  return colorName.includes('background') || colorName === 'surface'
}

const copyColor = async (colorValue: string) => {
  try {
    await navigator.clipboard.writeText(colorValue)
    showCopyNotification.value = true
    setTimeout(() => {
      showCopyNotification.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy color:', err)
  }
}
</script>

<style lang="scss" scoped>
.colors-view {
  padding: var(--space-lg);
  max-width: 1200px;
  margin: 0 auto;

  &__header {
    margin-bottom: var(--space-xl);
    
    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--color-foreground);
      margin: 0 0 var(--space-s);
    }

    p {
      font-size: 1.125rem;
      color: var(--color-foreground-secondary);
      margin: 0;
    }
  }

  &__section {
    margin-bottom: var(--space-xl);
    
    h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-foreground);
      margin: 0 0 var(--space-s);
    }

    p {
      color: var(--color-foreground-secondary);
      margin: 0 0 var(--space);
      line-height: 1.6;
    }
  }

  &__color-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--space);
    margin-bottom: var(--space);
  }

  &__color-item {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    overflow: hidden;
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-2px);
    }
  }

  &__color-swatch {
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 0.2s ease;
    position: relative;

    &:hover {
      opacity: 0.9;
    }

    &--text {
      height: 60px;
      font-size: 1.125rem;
      font-weight: 500;
    }
  }

  &__color-text {
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: capitalize;

    &--light {
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }

    &--dark {
      color: #333;
    }
  }

  &__color-info {
    padding: var(--space);

    h4 {
      margin: 0 0 var(--space-xs);
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-foreground);
    }

    p {
      margin: var(--space-xs) 0 0;
      font-size: 0.875rem;
      color: var(--color-foreground-secondary);
      line-height: 1.4;
    }
  }

  &__color-tokens {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin-bottom: var(--space-xs);

    code {
      background: var(--color-background-secondary);
      padding: 0.125rem 0.25rem;
      border-radius: 0.25rem;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.75rem;
      color: var(--color-foreground);
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background: var(--color-border);
      }
    }
  }

  &__text-token {
    opacity: 0.7;
    font-style: italic;
  }

  &__text-demo {
    margin-top: var(--space-xs);
    
    span {
      display: inline-block;
      font-weight: 500;
    }
  }

  &__guidelines {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: var(--space);
    margin-bottom: var(--space-lg);
  }

  &__guideline-card {
    padding: var(--space);
    border-radius: var(--radius);
    border: 2px solid;

    &--recommended {
      background: rgba(var(--color-success-rgb, 34, 197, 94), 0.05);
      border-color: var(--color-success);
      
      h4 {
        color: var(--color-success);
        margin: 0 0 var(--space-s);
      }
    }

    &--avoid {
      background: rgba(var(--color-warning-rgb, 251, 191, 36), 0.05);
      border-color: var(--color-warning);
      
      h4 {
        color: var(--color-warning);
        margin: 0 0 var(--space-s);
      }
    }

    p {
      margin: 0 0 var(--space-s);
      line-height: 1.5;
    }
  }

  &__code-example {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);

    code {
      background: var(--color-background);
      border: 1px solid var(--color-border);
      padding: var(--space-xs) var(--space-s);
      border-radius: var(--radius);
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.75rem;
      color: var(--color-foreground);
    }
  }

  &__demo {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space);
    margin-bottom: var(--space);
    padding: var(--space-lg);
    background: var(--color-background-secondary);
    border-radius: var(--radius);
    border: 1px solid var(--color-border);
  }

  &__usage-example {
    h4 {
      margin: 0 0 var(--space-s);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-foreground);
    }
  }

  &__example-card {
    padding: var(--space);
    border-radius: var(--radius);

    h3 {
      margin: 0 0 var(--space-s);
      font-size: 1.125rem;
    }

    p {
      margin: 0 0 var(--space);
      line-height: 1.4;
    }
  }

  &__accessibility-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space);
  }

  &__contrast-example {
    h4 {
      margin: 0 0 var(--space-s);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-foreground);
    }
  }

  &__code {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: var(--space);

    h4 {
      margin: 0 0 var(--space-s);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-foreground);
    }

    pre {
      margin: 0;
      padding: 0;
      overflow-x: auto;
      
      code {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.875rem;
        line-height: 1.5;
        color: var(--color-foreground);
        white-space: pre;
      }
    }
  }

  &__copy-notification {
    position: fixed;
    bottom: var(--space);
    right: var(--space);
    background: var(--color-success);
    color: var(--color-success-text);
    padding: var(--space-s) var(--space);
    border-radius: var(--radius);
    font-size: 0.875rem;
    font-weight: 500;
    z-index: 1000;
    animation: slideInUp 0.3s ease;
  }
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .colors-view {
    padding: var(--space);
    
    &__header h1 {
      font-size: 2rem;
    }
    
    &__color-grid {
      grid-template-columns: 1fr;
    }
    
    &__demo {
      grid-template-columns: 1fr;
    }
    
    &__accessibility-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>