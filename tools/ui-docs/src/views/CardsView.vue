<template>
  <div :class="bemm()">
    <header :class="bemm('header')">
      <h1>Cards</h1>
      <p>Flexible card components for displaying content in organized containers</p>
    </header>

    <!-- Basic Cards ---->
    <section :class="bemm('section')">
      <h2>Basic Cards</h2>
      <p>Simple card layouts for content organization</p>

      <div :class="bemm('demo', 'grid')">
        <TCard>
          <h3>Simple Card</h3>
          <p>This is a basic card with just content.</p>
        </TCard>

        <TCard>
          <template #header>
            <h3>Card with Header</h3>
          </template>
          <p>This card has a distinct header section.</p>
        </TCard>

        <TCard>
          <h3>Card with Footer</h3>
          <p>This card includes a footer area.</p>
          <template #footer>
            <TButton size="small" type="outline">Learn More</TButton>
          </template>
        </TCard>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TCard&gt;
  &lt;h3&gt;Simple Card&lt;/h3&gt;
  &lt;p&gt;This is a basic card with just content.&lt;/p&gt;
&lt;/TCard&gt;

&lt;TCard&gt;
  &lt;template #header&gt;
    &lt;h3&gt;Card with Header&lt;/h3&gt;
  &lt;/template&gt;
  &lt;p&gt;This card has a distinct header section.&lt;/p&gt;
&lt;/TCard&gt;</code></pre>
      </div>
    </section>

    <!-- Interactive Cards ---->
    <section :class="bemm('section')">
      <h2>Interactive Cards</h2>
      <p>Cards with hover effects and click interactions</p>

      <div :class="bemm('demo', 'grid')">
        <TCard hover @click="handleCardClick('features')">
          <TIcon name="star" size="2rem" style="color: var(--color-primary)" />
          <h3>Features</h3>
          <p>Discover all the amazing features available in our platform.</p>
        </TCard>

        <TCard hover @click="handleCardClick('support')">
          <TIcon name="heart-fat" size="2rem" style="color: var(--color-success)" />
          <h3>Support</h3>
          <p>Get help from our dedicated support team whenever you need it.</p>
        </TCard>

        <TCard hover @click="handleCardClick('updates')">
          <TIcon name="bell" size="2rem" style="color: var(--color-warning)" />
          <h3>Updates</h3>
          <p>Stay informed about the latest updates and improvements.</p>
        </TCard>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TCard hover @click="handleClick"&gt;
  &lt;TIcon name="star" size="2rem" /&gt;
  &lt;h3&gt;Features&lt;/h3&gt;
  &lt;p&gt;Discover all the amazing features...&lt;/p&gt;
&lt;/TCard&gt;</code></pre>
      </div>
    </section>

    <!-- Card Variants ---->
    <section :class="bemm('section')">
      <h2>Card Variants</h2>
      <p>Different visual styles for various use cases</p>

      <div :class="bemm('demo', 'grid')">
        <TCard variant="default">
          <h3>Default Card</h3>
          <p>Standard card appearance with default styling.</p>
        </TCard>

        <TCard variant="outlined">
          <h3>Outlined Card</h3>
          <p>Card with a visible border and transparent background.</p>
        </TCard>

        <TCard variant="elevated">
          <h3>Elevated Card</h3>
          <p>Card with enhanced shadow for depth perception.</p>
        </TCard>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TCard variant="default"&gt;...&lt;/TCard&gt;
&lt;TCard variant="outlined"&gt;...&lt;/TCard&gt;
&lt;TCard variant="elevated"&gt;...&lt;/TCard&gt;</code></pre>
      </div>
    </section>

    <!-- Card Sizes ---->
    <section :class="bemm('section')">
      <h2>Card Sizes</h2>
      <p>Different sizes for various layout needs</p>

      <div :class="bemm('demo', 'sizes')">
        <TCard size="small">
          <h4>Small Card</h4>
          <p>Compact card for minimal content.</p>
        </TCard>

        <TCard size="medium">
          <h3>Medium Card</h3>
          <p>Standard size card for regular content display.</p>
        </TCard>

        <TCard size="large">
          <h2>Large Card</h2>
          <p>Spacious card for detailed content presentation.</p>
        </TCard>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TCard size="small"&gt;...&lt;/TCard&gt;
&lt;TCard size="medium"&gt;...&lt;/TCard&gt;
&lt;TCard size="large"&gt;...&lt;/TCard&gt;</code></pre>
      </div>
    </section>

    <!-- Complex Card Examples ---->
    <section :class="bemm('section')">
      <h2>Complex Examples</h2>
      <p>Real-world card implementations</p>

      <div :class="bemm('demo', 'complex')">
        <TCard variant="elevated" hover>
          <template #header>
            <div style="display: flex; align-items: center; gap: var(--space-s);">
              <TIcon name="user" />
              <span>User Profile</span>
            </div>
          </template>

          <div style="display: flex; flex-direction: column; gap: var(--space);">
            <div style="display: flex; align-items: center; gap: var(--space);">
              <div style="width: 3rem; height: 3rem; background: var(--color-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <TIcon name="user" style="color: white;" />
              </div>
              <div>
                <h3 style="margin: 0;">John Doe</h3>
                <p style="margin: 0; color: var(--color-foreground-secondary);">Software Engineer</p>
              </div>
            </div>
            <p>Passionate developer with 5 years of experience in Vue.js and TypeScript.</p>
          </div>

          <template #footer>
            <div style="display: flex; gap: var(--space-s);">
              <TButton size="small" type="outline">Message</TButton>
              <TButton size="small" color="primary">Follow</TButton>
            </div>
          </template>
        </TCard>

        <TCard variant="outlined">
          <template #header>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span>Settings</span>
              <TIcon name="settings" />
            </div>
          </template>

          <div style="display: flex; flex-direction: column; gap: var(--space);">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span>Dark Mode</span>
              <TButton size="small" type="ghost">Toggle</TButton>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span>Notifications</span>
              <TButton size="small" type="ghost">Enabled</TButton>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span>Language</span>
              <TButton size="small" type="ghost">English</TButton>
            </div>
          </div>
        </TCard>
      </div>
    </section>

    <!-- Props Documentation ---->
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
              <td><code>variant</code></td>
              <td><code>'default' | 'outlined' | 'elevated'</code></td>
              <td><code>'default'</code></td>
              <td>Visual style variant</td>
            </tr>
            <tr>
              <td><code>size</code></td>
              <td><code>'small' | 'medium' | 'large'</code></td>
              <td><code>'medium'</code></td>
              <td>Card size</td>
            </tr>
            <tr>
              <td><code>hover</code></td>
              <td><code>boolean</code></td>
              <td><code>false</code></td>
              <td>Enable hover effects</td>
            </tr>
            <tr>
              <td><code>clickable</code></td>
              <td><code>boolean</code></td>
              <td><code>false</code></td>
              <td>Add click interaction styles</td>
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

      <h3>Slots</h3>
      <div :class="bemm('props-table')">
        <table>
          <thead>
            <tr>
              <th>Slot</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>default</code></td>
              <td>Main card content</td>
            </tr>
            <tr>
              <td><code>header</code></td>
              <td>Card header content</td>
            </tr>
            <tr>
              <td><code>footer</code></td>
              <td>Card footer content</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { TCard, TButton, TIcon } from '@tiko/ui'

const bemm = useBemm('cards-view')

const handleCardClick = (type: string) => {
  console.log(`Clicked ${type} card`)
  // Could show a toast notification here
}
</script>

<style lang="scss" scoped>
.cards-view {
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

    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-foreground);
      margin: var(--space-lg) 0 var(--space-s);
    }

    p {
      color: var(--color-foreground-secondary);
      margin: 0 0 var(--space);
      line-height: 1.6;
    }
  }

  &__demo {
    margin-bottom: var(--space);
    padding: var(--space-lg);
    background: var(--color-background-secondary);
    border-radius: var(--radius);
    border: 1px solid var(--color-accent);

    &--grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--space);
    }

    &--sizes {
      display: flex;
      gap: var(--space);
      align-items: flex-start;
      flex-wrap: wrap;
    }

    &--complex {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: var(--space-lg);
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
    margin-bottom: var(--space);

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
  .cards-view {
    padding: var(--space);

    &__header h1 {
      font-size: 2rem;
    }

    &__demo {
      &--grid {
        grid-template-columns: 1fr;
      }

      &--sizes {
        flex-direction: column;
        align-items: stretch;
      }

      &--complex {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>
