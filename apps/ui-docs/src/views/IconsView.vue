<template>
  <div :class="bemm()">
    <header :class="bemm('header')">
      <h1>Icons</h1>
      <p>Complete icon library with {{ allIcons.length }} available icons from open-icon</p>
    </header>

    <!-- Search -->
    <section :class="bemm('section')">
      <div :class="bemm('search')">
        <TInput
          v-model="searchQuery"
          placeholder="Search icons..."
          icon="search-fat"
        />
      </div>
    </section>

    <!-- Icon Categories -->
    <section :class="bemm('section')">
      <h2>Icon Categories</h2>
      <div :class="bemm('categories')">
        <button
          v-for="category in categories"
          :key="category"
          :class="bemm('category-btn', { active: selectedCategory === category })"
          @click="selectedCategory = category"
        >
          {{ category }}
        </button>
      </div>
    </section>

    <!-- Icon Usage -->
    <section :class="bemm('section')">
      <h2>Basic Usage</h2>
      <div :class="bemm('demo')">
        <TIcon name="heart-fat" />
        <TIcon name="star" size="1.5rem" />
        <TIcon name="crown" size="2rem" />
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TIcon name="heart-fat" /&gt;
&lt;TIcon name="star" size="1.5rem" /&gt;
&lt;TIcon name="crown" size="2rem" /&gt;</code></pre>
      </div>
    </section>

    <!-- Icon Sizes -->
    <section :class="bemm('section')">
      <h2>Icon Sizes</h2>
      <div :class="bemm('demo')">
        <TIcon name="heart-fat" size="1rem" />
        <TIcon name="heart-fat" size="1.5rem" />
        <TIcon name="heart-fat" size="2rem" />
        <TIcon name="heart-fat" size="3rem" />
      </div>

      <div :class="bemm('code')">
        <h4>Size Examples</h4>
        <pre><code>&lt;TIcon name="heart-fat" size="1rem" /&gt;
&lt;TIcon name="heart-fat" size="1.5rem" /&gt;
&lt;TIcon name="heart-fat" size="2rem" /&gt;
&lt;TIcon name="heart-fat" size="3rem" /&gt;</code></pre>
      </div>
    </section>

    <!-- Popular Icons -->
    <section :class="bemm('section')">
      <h2>Popular Icons</h2>
      <div :class="bemm('icon-grid')">
        <div
          v-for="icon in filteredIcons"
          :key="icon"
          :class="bemm('icon-item')"
          @click="copyIconCode(icon)"
        >
          <TIcon :name="icon" size="1.5rem" />
          <span :class="bemm('icon-name')">{{ icon }}</span>
        </div>
      </div>
    </section>

    <!-- Props Documentation -->
    <section :class="bemm('section')">
      <h2>Props</h2>
      <div :class="bemm('props-table')">
        <table>
          <thead>
            <tr>
              <th>Prop</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>name</code></td>
              <td><code>string</code></td>
              <td><code>required</code></td>
              <td>Icon name from the icon library</td>
            </tr>
            <tr>
              <td><code>size</code></td>
              <td><code>string</code></td>
              <td><code>'1rem'</code></td>
              <td>Icon size (CSS units)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBemm } from 'bemm'
import { TIcon, TInput } from '@tiko/ui'
import { Icons } from 'open-icon'

const bemm = useBemm('icons-view')

const searchQuery = ref('')
const selectedCategory = ref('All')

// Get all available icons from open-icon
const allIcons = Object.keys(Icons)

const categories = ['All', 'Interface', 'Actions', 'Communication', 'Media', 'Navigation', 'Shapes']

const filteredIcons = computed(() => {
  let icons = allIcons
  
  if (searchQuery.value) {
    icons = icons.filter(icon => 
      icon.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  return icons.sort()
})

const copyIconCode = (iconName: string) => {
  const code = `<TIcon name="${iconName}" />`
  navigator.clipboard.writeText(code)
  // Could add a toast notification here
}
</script>

<style lang="scss" scoped>
.icons-view {
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
      margin: 0 0 var(--space);
    }
  }

  &__search {
    max-width: 400px;
  }

  &__categories {
    display: flex;
    gap: var(--space-s);
    flex-wrap: wrap;
  }

  &__category-btn {
    padding: var(--space-s) var(--space);
    border: 1px solid var(--color-border);
    background: var(--color-background);
    color: var(--color-foreground-secondary);
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;

    &:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    &--active {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: var(--color-primary-text);
    }
  }

  &__demo {
    display: flex;
    gap: var(--space);
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: var(--space);
    padding: var(--space-lg);
    background: var(--color-background-secondary);
    border-radius: var(--radius);
    border: 1px solid var(--color-border);
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

  &__icon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--space-s);
  }

  &__icon-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-s);
    padding: var(--space);
    background: var(--color-background-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--color-primary);
      background: var(--color-background);
      transform: translateY(-1px);
    }
  }

  &__icon-name {
    font-size: 0.75rem;
    color: var(--color-foreground-secondary);
    text-align: center;
    word-break: break-word;
  }

  &__props-table {
    overflow-x: auto;
    
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      
      th, td {
        padding: var(--space-s) var(--space);
        text-align: left;
        border-bottom: 1px solid var(--color-border);
      }
      
      th {
        background: var(--color-background-secondary);
        font-weight: 600;
        color: var(--color-foreground);
        font-size: 0.875rem;
      }
      
      td {
        color: var(--color-foreground-secondary);
        font-size: 0.875rem;
        
        code {
          background: var(--color-background-secondary);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.8rem;
          color: var(--color-foreground);
        }
      }
      
      tbody tr:last-child {
        th, td {
          border-bottom: none;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .icons-view {
    padding: var(--space);
    
    &__header h1 {
      font-size: 2rem;
    }
    
    &__icon-grid {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }
  }
}
</style>