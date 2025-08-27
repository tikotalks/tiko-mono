<template>
  <div :class="bemm()">
    <header :class="bemm('header')">
      <h1>Buttons</h1>
      <p>Interactive button components with various styles, sizes, and states</p>
    </header>

    <!-- Button Types -->
    <section :class="bemm('section')">
      <h2>Button Types</h2>
      <p>Different visual styles for various use cases</p>

      <div :class="bemm('demo')">
        <TButton type="default">Default</TButton>
        <TButton type="ghost">Ghost</TButton>
        <TButton type="outline">Outline</TButton>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TButton type="default"&gt;Default&lt;/TButton&gt;
&lt;TButton type="ghost"&gt;Ghost&lt;/TButton&gt;
&lt;TButton type="outline"&gt;Outline&lt;/TButton&gt;</code></pre>
      </div>
    </section>

    <!-- Button Sizes -->
    <section :class="bemm('section')">
      <h2>Button Sizes</h2>
      <p>Different sizes for various contexts</p>

      <div :class="bemm('demo')">
        <TButton size="small">Small</TButton>
        <TButton size="medium">Medium</TButton>
        <TButton size="large">Large</TButton>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TButton size="small"&gt;Small&lt;/TButton&gt;
&lt;TButton size="medium"&gt;Medium&lt;/TButton&gt;
&lt;TButton size="large"&gt;Large&lt;/TButton&gt;</code></pre>
      </div>
    </section>

    <!-- Button Colors -->
    <section :class="bemm('section')">
      <h2>Button Colors</h2>
      <p>Semantic color variants for different actions</p>

      <div :class="bemm('demo')">
        <TButton color="primary">Primary</TButton>
        <TButton color="secondary">Secondary</TButton>
        <TButton color="success">Success</TButton>
        <TButton color="warning">Warning</TButton>
        <TButton color="error">Error</TButton>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TButton color="primary"&gt;Primary&lt;/TButton&gt;
&lt;TButton color="secondary"&gt;Secondary&lt;/TButton&gt;
&lt;TButton color="success"&gt;Success&lt;/TButton&gt;
&lt;TButton color="warning"&gt;Warning&lt;/TButton&gt;
&lt;TButton color="error"&gt;Error&lt;/TButton&gt;</code></pre>
      </div>
    </section>

    <!-- Button with Icons -->
    <section :class="bemm('section')">
      <h2>Buttons with Icons</h2>
      <p>Add icons to provide visual context</p>

      <div :class="bemm('demo')">
        <TButton icon="add">Add Item</TButton>
        <TButton icon="edit">Edit</TButton>
        <TButton icon="trash" color="error">Delete</TButton>
        <TButton icon="check" color="success">Confirm</TButton>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TButton icon="add"&gt;Add Item&lt;/TButton&gt;
&lt;TButton icon="edit"&gt;Edit&lt;/TButton&gt;
&lt;TButton icon="trash" color="error"&gt;Delete&lt;/TButton&gt;
&lt;TButton icon="check" color="success"&gt;Confirm&lt;/TButton&gt;</code></pre>
      </div>
    </section>

    <!-- Button States -->
    <section :class="bemm('section')">
      <h2>Button States</h2>
      <p>Different states for user interaction feedback</p>

      <div :class="bemm('demo')">
        <TButton>Normal</TButton>
        <TButton disabled>Disabled</TButton>
        <TButton loading>Loading</TButton>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TButton&gt;Normal&lt;/TButton&gt;
&lt;TButton disabled&gt;Disabled&lt;/TButton&gt;
&lt;TButton loading&gt;Loading&lt;/TButton&gt;</code></pre>
      </div>
    </section>

    <!-- Combined Examples -->
    <section :class="bemm('section')">
      <h2>Combined Examples</h2>
      <p>Real-world button combinations</p>

      <div :class="bemm('demo', 'vertical')">
        <div :class="bemm('demo-group')">
          <h4>Action Group</h4>
          <TButton color="primary" icon="check">Save Changes</TButton>
          <TButton type="outline" icon="x">Cancel</TButton>
        </div>

        <div :class="bemm('demo-group')">
          <h4>Destructive Action</h4>
          <TButton color="error" type="outline" icon="trash">Delete Account</TButton>
        </div>

        <div :class="bemm('demo-group')">
          <h4>Call-to-Action</h4>
          <TButton size="large" color="primary" icon="arrow-right">Get Started</TButton>
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
              <td><code>type</code></td>
              <td><code>'default' | 'ghost' | 'outline'</code></td>
              <td><code>'default'</code></td>
              <td>Visual style variant</td>
            </tr>
            <tr>
              <td><code>size</code></td>
              <td><code>'small' | 'medium' | 'large'</code></td>
              <td><code>'medium'</code></td>
              <td>Button size</td>
            </tr>
            <tr>
              <td><code>color</code></td>
              <td><code>'primary' | 'secondary' | 'success' | 'warning' | 'error'</code></td>
              <td><code>'primary'</code></td>
              <td>Color variant</td>
            </tr>
            <tr>
              <td><code>icon</code></td>
              <td><code>string</code></td>
              <td><code>undefined</code></td>
              <td>Icon name to display</td>
            </tr>
            <tr>
              <td><code>disabled</code></td>
              <td><code>boolean</code></td>
              <td><code>false</code></td>
              <td>Disable button interaction</td>
            </tr>
            <tr>
              <td><code>loading</code></td>
              <td><code>boolean</code></td>
              <td><code>false</code></td>
              <td>Show loading state</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { TButton } from '@tiko/ui'

const bemm = useBemm('buttons-view')
</script>

<style lang="scss" scoped>
.buttons-view {
  padding: var(--space-lg);
  max-width: 1000px;
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

  &__demo {
    display: flex;
    gap: var(--space);
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: var(--space);
    padding: var(--space-lg);
    background: var(--color-background-secondary);
    border-radius: var(--radius);
    border: 1px solid var(--color-accent);

    &--vertical {
      flex-direction: column;
      align-items: stretch;
    }
  }

  &__demo-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);

    h4 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-foreground-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .t-button {
      align-self: flex-start;
    }
  }

  &__code {
    background: var(--color-background);
    border: 1px solid var(--color-accent);
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

  &__props-table {
    overflow-x: auto;

    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--color-background);
      border: 1px solid var(--color-accent);
      border-radius: var(--radius);

      th, td {
        padding: var(--space-s) var(--space);
        text-align: left;
        border-bottom: 1px solid var(--color-accent);
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
  .buttons-view {
    padding: var(--space);

    &__header h1 {
      font-size: 2rem;
    }

    &__demo {
      flex-direction: column;
      align-items: stretch;
    }
  }
}
</style>
