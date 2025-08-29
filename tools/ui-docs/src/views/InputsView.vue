<template>
  <div :class="bemm()">
    <header :class="bemm('header')">
      <h1>Inputs</h1>
      <p>Form input components for user data collection and interaction</p>
    </header>

    <!-- Basic Text Input ---->
    <section :class="bemm('section')">
      <h2>Basic Text Input</h2>
      <p>Standard text input for single-line text entry</p>

      <div :class="bemm('demo')">
        <TInput v-model="basicText" placeholder="Enter text..." />
        <TInput v-model="basicText" placeholder="With label" label="Name" />
        <TInput v-model="basicText" placeholder="Required field" label="Email" required />
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TInput v-model="text" placeholder="Enter text..." /&gt;
&lt;TInput v-model="text" placeholder="With label" label="Name" /&gt;
&lt;TInput v-model="text" placeholder="Required field" label="Email" required /&gt;</code></pre>
      </div>
    </section>

    <!-- Input with Icons ---->
    <section :class="bemm('section')">
      <h2>Input with Icons</h2>
      <p>Add visual context with icons</p>

      <div :class="bemm('demo')">
        <TInput v-model="searchText" placeholder="Search..." icon="search-fat" />
        <TInput v-model="emailText" placeholder="Email address" icon="mail" label="Email" />
        <TInput v-model="passwordText" type="password" placeholder="Password" icon="lock" label="Password" />
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TInput v-model="text" placeholder="Search..." icon="search-fat" /&gt;
&lt;TInput v-model="text" placeholder="Email address" icon="mail" label="Email" /&gt;
&lt;TInput v-model="text" type="password" placeholder="Password" icon="lock" label="Password" /&gt;</code></pre>
      </div>
    </section>

    <!-- Input Types ---->
    <section :class="bemm('section')">
      <h2>Input Types</h2>
      <p>Different input types for specific data formats</p>

      <div :class="bemm('demo', 'vertical')">
        <TInput v-model="textValue" type="text" placeholder="Text input" label="Text" />
        <TInput v-model="emailValue" type="email" placeholder="email@example.com" label="Email" />
        <TInput v-model="passwordValue" type="password" placeholder="Password" label="Password" />
        <TInput v-model="numberValue" type="number" placeholder="123" label="Number" />
        <TInput v-model="urlValue" type="url" placeholder="https://example.com" label="URL" />
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TInput v-model="text" type="text" label="Text" /&gt;
&lt;TInput v-model="email" type="email" label="Email" /&gt;
&lt;TInput v-model="password" type="password" label="Password" /&gt;
&lt;TInput v-model="number" type="number" label="Number" /&gt;
&lt;TInput v-model="url" type="url" label="URL" /&gt;</code></pre>
      </div>
    </section>

    <!-- Input States ---->
    <section :class="bemm('section')">
      <h2>Input States</h2>
      <p>Different states for user feedback and interaction</p>

      <div :class="bemm('demo', 'vertical')">
        <TInput v-model="normalState" placeholder="Normal state" label="Normal" />
        <TInput v-model="disabledState" placeholder="Disabled state" label="Disabled" disabled />
        <TInput v-model="errorState" placeholder="Error state" label="Error" error="This field is required" />
        <TInput v-model="readonlyState" placeholder="Readonly state" label="Readonly" readonly />
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TInput v-model="text" label="Normal" /&gt;
&lt;TInput v-model="text" label="Disabled" disabled /&gt;
&lt;TInput v-model="text" label="Error" error="This field is required" /&gt;
&lt;TInput v-model="text" label="Readonly" readonly /&gt;</code></pre>
      </div>
    </section>

    <!-- Textarea ---->
    <section :class="bemm('section')">
      <h2>Textarea</h2>
      <p>Multi-line text input for longer content</p>

      <div :class="bemm('demo')">
        <TTextArea v-model="textareaValue" placeholder="Enter multi-line text..." label="Description" />
        <TTextArea v-model="textareaValue" placeholder="With row limit" label="Comments" :rows="3" />
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TTextArea v-model="text" placeholder="Enter multi-line text..." label="Description" /&gt;
&lt;TTextArea v-model="text" placeholder="With row limit" label="Comments" :rows="3" /&gt;</code></pre>
      </div>
    </section>

    <!-- Form Examples ---->
    <section :class="bemm('section')">
      <h2>Form Examples</h2>
      <p>Real-world input combinations in forms</p>

      <div :class="bemm('demo', 'vertical')">
        <div :class="bemm('form-group')">
          <h4>User Profile</h4>
          <TInput v-model="profile.name" placeholder="Full name" label="Name" icon="user" required />
          <TInput v-model="profile.email" type="email" placeholder="email@example.com" label="Email" icon="mail" required />
          <TInput v-model="profile.phone" type="tel" placeholder="+1 (555) 123-4567" label="Phone" icon="phone" />
        </div>

        <div :class="bemm('form-group')">
          <h4>Account Settings</h4>
          <TInput v-model="account.username" placeholder="Username" label="Username" icon="user" />
          <TInput v-model="account.currentPassword" type="password" placeholder="Current password" label="Current Password" icon="lock" />
          <TInput v-model="account.newPassword" type="password" placeholder="New password" label="New Password" icon="lock" />
        </div>
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
              <td><code>modelValue</code></td>
              <td><code>string | number</code></td>
              <td><code>''</code></td>
              <td>Input value (v-model)</td>
            </tr>
            <tr>
              <td><code>type</code></td>
              <td><code>'text' | 'email' | 'password' | 'number' | 'url' | 'tel'</code></td>
              <td><code>'text'</code></td>
              <td>Input type</td>
            </tr>
            <tr>
              <td><code>label</code></td>
              <td><code>string</code></td>
              <td><code>undefined</code></td>
              <td>Input label text</td>
            </tr>
            <tr>
              <td><code>placeholder</code></td>
              <td><code>string</code></td>
              <td><code>undefined</code></td>
              <td>Placeholder text</td>
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
              <td>Disable input interaction</td>
            </tr>
            <tr>
              <td><code>readonly</code></td>
              <td><code>boolean</code></td>
              <td><code>false</code></td>
              <td>Make input readonly</td>
            </tr>
            <tr>
              <td><code>required</code></td>
              <td><code>boolean</code></td>
              <td><code>false</code></td>
              <td>Mark field as required</td>
            </tr>
            <tr>
              <td><code>error</code></td>
              <td><code>string</code></td>
              <td><code>undefined</code></td>
              <td>Error message to display</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBemm } from 'bemm'
import { TInput, TTextArea } from '@tiko/ui'

const bemm = useBemm('inputs-view')

// Demo data
const basicText = ref('')
const searchText = ref('')
const emailText = ref('')
const passwordText = ref('')

const textValue = ref('')
const emailValue = ref('')
const passwordValue = ref('')
const numberValue = ref('')
const urlValue = ref('')

const normalState = ref('')
const disabledState = ref('Cannot edit this')
const errorState = ref('')
const readonlyState = ref('Read only value')

const textareaValue = ref('')

const profile = ref({
  name: '',
  email: '',
  phone: ''
})

const account = ref({
  username: '',
  currentPassword: '',
  newPassword: ''
})
</script>

<style lang="scss">
.inputs-view {
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
    align-items: flex-end;
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

  &__form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space);
    padding: var(--space);
    background: var(--color-background);
    border: 1px solid var(--color-accent);
    border-radius: var(--radius);

    h4 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-foreground-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
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
  .inputs-view {
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
