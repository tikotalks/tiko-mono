<template>
  <div :class="bemm()">
    <header :class="bemm('header')">
      <h1>PIN Input</h1>
      <p>A customizable PIN input component with visual feedback</p>
    </header>

    <!-- Basic PIN Input -->
    <section :class="bemm('section')">
      <h2>Basic PIN Input</h2>
      <p>Simple PIN input with default 4-digit length</p>

      <div :class="bemm('demo')">
        <TPinInput v-model="basicPin" />
        <div :class="bemm('value')">Value: {{ basicPin || 'empty' }}</div>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TPinInput v-model="pinValue" /&gt;</code></pre>
      </div>
    </section>

    <!-- Different Lengths -->
    <section :class="bemm('section')">
      <h2>Custom Length</h2>
      <p>Configure the number of digits required</p>

      <div :class="bemm('demo')">
        <div :class="bemm('demo-item')">
          <label>4 digits (default)</label>
          <TPinInput v-model="pin4" :length="4" />
        </div>
        <div :class="bemm('demo-item')">
          <label>6 digits</label>
          <TPinInput v-model="pin6" :length="6" />
        </div>
        <div :class="bemm('demo-item')">
          <label>8 digits</label>
          <TPinInput v-model="pin8" :length="8" />
        </div>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TPinInput v-model="pinValue" :length="6" /&gt;</code></pre>
      </div>
    </section>

    <!-- Show Values -->
    <section :class="bemm('section')">
      <h2>Show Values</h2>
      <p>Display entered digits instead of dots</p>

      <div :class="bemm('demo')">
        <div :class="bemm('demo-item')">
          <label>Hidden (default)</label>
          <TPinInput v-model="hiddenPin" />
        </div>
        <div :class="bemm('demo-item')">
          <label>Visible</label>
          <TPinInput v-model="visiblePin" :show-value="true" />
        </div>
        <div :class="bemm('demo-item')">
          <label>Masked</label>
          <TPinInput v-model="maskedPin" :show-value="true" :mask="true" mask-character="•" />
        </div>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;!-- Show actual digits --&gt;
&lt;TPinInput v-model="pin" :show-value="true" /&gt;

&lt;!-- Show masked characters --&gt;
&lt;TPinInput v-model="pin" :show-value="true" :mask="true" mask-character="•" /&gt;</code></pre>
      </div>
    </section>

    <!-- Auto Submit -->
    <section :class="bemm('section')">
      <h2>Auto Submit</h2>
      <p>Automatically trigger complete event when all digits are entered</p>

      <div :class="bemm('demo')">
        <TPinInput
          v-model="autoSubmitPin"
          :auto-submit="true"
          @complete="handleComplete"
        />
        <div :class="bemm('status')" v-if="lastCompleted">
          Last submitted: {{ lastCompleted }}
        </div>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TPinInput
  v-model="pin"
  :auto-submit="true"
  @complete="handlePinComplete"
/&gt;</code></pre>
      </div>
    </section>

    <!-- States -->
    <section :class="bemm('section')">
      <h2>States</h2>
      <p>Different states for validation and feedback</p>

      <div :class="bemm('demo')">
        <div :class="bemm('demo-item')">
          <label>Normal</label>
          <TPinInput v-model="normalPin" />
        </div>
        <div :class="bemm('demo-item')">
          <label>Error</label>
          <TPinInput v-model="errorPin" :error="true" />
        </div>
        <div :class="bemm('demo-item')">
          <label>Disabled</label>
          <TPinInput v-model="disabledPin" :disabled="true" />
        </div>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;!-- Error state --&gt;
&lt;TPinInput v-model="pin" :error="hasError" /&gt;

&lt;!-- Disabled state --&gt;
&lt;TPinInput v-model="pin" :disabled="true" /&gt;</code></pre>
      </div>
    </section>

    <!-- Interactive Example -->
    <section :class="bemm('section')">
      <h2>Interactive Example</h2>
      <p>Try different configurations</p>

      <div :class="bemm('demo', 'interactive')">
        <div :class="bemm('controls')">
          <label>
            <input type="checkbox" v-model="interactive.showValue">
            Show values
          </label>
          <label>
            <input type="checkbox" v-model="interactive.mask" :disabled="!interactive.showValue">
            Mask values
          </label>
          <label>
            <input type="checkbox" v-model="interactive.autoSubmit">
            Auto submit
          </label>
          <label>
            <input type="checkbox" v-model="interactive.error">
            Error state
          </label>
          <label>
            <input type="checkbox" v-model="interactive.disabled">
            Disabled
          </label>
          <label>
            Length:
            <input
              type="number"
              v-model.number="interactive.length"
              min="1"
              max="10"
              style="width: 60px; margin-left: 8px;"
            >
          </label>
        </div>

        <div :class="bemm('result')">
          <TPinInput
            v-model="interactive.value"
            :length="interactive.length"
            :show-value="interactive.showValue"
            :mask="interactive.mask"
            :auto-submit="interactive.autoSubmit"
            :error="interactive.error"
            :disabled="interactive.disabled"
            @complete="handleInteractiveComplete"
          />
          <div :class="bemm('value')">
            Value: {{ interactive.value || 'empty' }}
            <span v-if="interactive.lastCompleted">
              (completed: {{ interactive.lastCompleted }})
            </span>
          </div>
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
              <td><code>modelValue</code></td>
              <td><code>string</code></td>
              <td><code>''</code></td>
              <td>The PIN value (v-model)</td>
            </tr>
            <tr>
              <td><code>length</code></td>
              <td><code>number</code></td>
              <td><code>4</code></td>
              <td>Number of digits required</td>
            </tr>
            <tr>
              <td><code>showValue</code></td>
              <td><code>boolean</code></td>
              <td><code>false</code></td>
              <td>Show entered digits instead of dots</td>
            </tr>
            <tr>
              <td><code>mask</code></td>
              <td><code>boolean</code></td>
              <td><code>false</code></td>
              <td>Mask values when showValue is true</td>
            </tr>
            <tr>
              <td><code>maskCharacter</code></td>
              <td><code>string</code></td>
              <td><code>'*'</code></td>
              <td>Character to show when masked</td>
            </tr>
            <tr>
              <td><code>autoSubmit</code></td>
              <td><code>boolean</code></td>
              <td><code>false</code></td>
              <td>Auto-trigger complete event when full</td>
            </tr>
            <tr>
              <td><code>autoFocus</code></td>
              <td><code>boolean</code></td>
              <td><code>false</code></td>
              <td>Focus input on mount</td>
            </tr>
            <tr>
              <td><code>disabled</code></td>
              <td><code>boolean</code></td>
              <td><code>false</code></td>
              <td>Disable input</td>
            </tr>
            <tr>
              <td><code>error</code></td>
              <td><code>boolean</code></td>
              <td><code>false</code></td>
              <td>Show error state</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Events Documentation -->
    <section :class="bemm('section')">
      <h2>Events</h2>
      <div :class="bemm('props-table')">
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Payload</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>update:modelValue</code></td>
              <td><code>string</code></td>
              <td>Emitted when value changes</td>
            </tr>
            <tr>
              <td><code>complete</code></td>
              <td><code>string</code></td>
              <td>Emitted when PIN is complete</td>
            </tr>
            <tr>
              <td><code>focus</code></td>
              <td><code>FocusEvent</code></td>
              <td>Emitted when input gains focus</td>
            </tr>
            <tr>
              <td><code>blur</code></td>
              <td><code>FocusEvent</code></td>
              <td>Emitted when input loses focus</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Methods Documentation -->
    <section :class="bemm('section')">
      <h2>Exposed Methods</h2>
      <div :class="bemm('props-table')">
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>focus()</code></td>
              <td>Focus the input element</td>
            </tr>
            <tr>
              <td><code>clear()</code></td>
              <td>Clear the PIN value</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useBemm } from 'bemm'
import { TPinInput } from '@tiko/ui'

const bemm = useBemm('pin-input-view')

// Demo states
const basicPin = ref('')
const pin4 = ref('')
const pin6 = ref('')
const pin8 = ref('')
const hiddenPin = ref('')
const visiblePin = ref('')
const maskedPin = ref('')
const autoSubmitPin = ref('')
const normalPin = ref('')
const errorPin = ref('123')
const disabledPin = ref('12')
const lastCompleted = ref('')

// Interactive example
const interactive = reactive({
  value: '',
  length: 4,
  showValue: false,
  mask: false,
  autoSubmit: false,
  error: false,
  disabled: false,
  lastCompleted: ''
})

const handleComplete = (pin: string) => {
  lastCompleted.value = pin
  // Clear after showing
  setTimeout(() => {
    autoSubmitPin.value = ''
    lastCompleted.value = ''
  }, 2000)
}

const handleInteractiveComplete = (pin: string) => {
  interactive.lastCompleted = pin
  setTimeout(() => {
    interactive.lastCompleted = ''
  }, 2000)
}
</script>

<style lang="scss">
.pin-input-view {
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
    flex-direction: column;
    gap: var(--space);
    margin-bottom: var(--space);
    padding: var(--space-lg);
    background: var(--color-background-secondary);
    border-radius: var(--radius);
    border: 1px solid var(--color-accent);

    &--interactive {
      gap: var(--space-lg);
    }
  }

  &__demo-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);

    label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-foreground-secondary);
    }
  }

  &__value {
    font-size: 0.875rem;
    color: var(--color-foreground-secondary);
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }

  &__status {
    padding: var(--space-s) var(--space);
    background: var(--color-success);
    color: var(--color-success-text);
    border-radius: var(--radius);
    font-size: 0.875rem;
    font-weight: 500;
  }

  &__controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space);

    label {
      display: flex;
      align-items: center;
      gap: var(--space-s);
      font-size: 0.875rem;
      color: var(--color-foreground);
      cursor: pointer;

      input[type="checkbox"] {
        cursor: pointer;
      }
    }
  }

  &__result {
    display: flex;
    flex-direction: column;
    gap: var(--space);
    align-items: center;
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
  .pin-input-view {
    padding: var(--space);

    &__header h1 {
      font-size: 2rem;
    }
  }
}
</style>
