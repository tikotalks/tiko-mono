<template>
  <div :class="bemm()">
    <header :class="bemm('header')">
      <h1>Number Pad</h1>
      <p>A customizable numeric keypad component for touch-friendly number input</p>
    </header>

    <!-- Basic Number Pad -->
    <section :class="bemm('section')">
      <h2>Basic Number Pad</h2>
      <p>Simple number pad with default configuration</p>

      <div :class="bemm('demo')">
        <TNumberPad
          @number="handleBasicNumber"
          @clear="handleBasicClear"
          @submit="handleBasicSubmit"
        />
        <div :class="bemm('output')">
          <div :class="bemm('value')">Value: {{ basicValue || '0' }}</div>
          <div :class="bemm('log')" v-if="basicLog">Last action: {{ basicLog }}</div>
        </div>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TNumberPad
  @number="handleNumber"
  @clear="handleClear"
  @submit="handleSubmit"
/&gt;</code></pre>
      </div>
    </section>

    <!-- Sizes -->
    <section :class="bemm('section')">
      <h2>Sizes</h2>
      <p>Different sizes for various contexts</p>

      <div :class="bemm('demo', 'sizes')">
        <div :class="bemm('demo-item')">
          <label>Small</label>
          <TNumberPad
            size="small"
            @number="val => sizes.small += val"
            @clear="() => sizes.small = sizes.small.slice(0, -1)"
          />
          <div :class="bemm('value')">{{ sizes.small || '0' }}</div>
        </div>
        <div :class="bemm('demo-item')">
          <label>Medium (default)</label>
          <TNumberPad
            size="medium"
            @number="val => sizes.medium += val"
            @clear="() => sizes.medium = sizes.medium.slice(0, -1)"
          />
          <div :class="bemm('value')">{{ sizes.medium || '0' }}</div>
        </div>
        <div :class="bemm('demo-item')">
          <label>Large</label>
          <TNumberPad
            size="large"
            @number="val => sizes.large += val"
            @clear="() => sizes.large = sizes.large.slice(0, -1)"
          />
          <div :class="bemm('value')">{{ sizes.large || '0' }}</div>
        </div>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TNumberPad size="small" /&gt;
&lt;TNumberPad size="medium" /&gt;
&lt;TNumberPad size="large" /&gt;</code></pre>
      </div>
    </section>

    <!-- Variants -->
    <section :class="bemm('section')">
      <h2>Variants</h2>
      <p>Different visual styles</p>

      <div :class="bemm('demo', 'variants')">
        <div :class="bemm('demo-item')">
          <label>Default</label>
          <TNumberPad
            variant="default"
            @number="val => variants.default += val"
            @clear="() => variants.default = variants.default.slice(0, -1)"
          />
          <div :class="bemm('value')">{{ variants.default || '0' }}</div>
        </div>
        <div :class="bemm('demo-item')">
          <label>Flat</label>
          <TNumberPad
            variant="flat"
            @number="val => variants.flat += val"
            @clear="() => variants.flat = variants.flat.slice(0, -1)"
          />
          <div :class="bemm('value')">{{ variants.flat || '0' }}</div>
        </div>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TNumberPad variant="default" /&gt;
&lt;TNumberPad variant="flat" /&gt;</code></pre>
      </div>
    </section>

    <!-- Number Shuffling -->
    <section :class="bemm('section')">
      <h2>Number Shuffling</h2>
      <p>Randomize number positions for security</p>

      <div :class="bemm('demo')">
        <div :class="bemm('demo-item')">
          <label>Shuffled Numbers</label>
          <TNumberPad
            :shuffle="true"
            @number="val => shuffledValue += val"
            @clear="() => shuffledValue = shuffledValue.slice(0, -1)"
          />
          <div :class="bemm('value')">{{ shuffledValue || '0' }}</div>
          <p :class="bemm('note')">Numbers are randomly positioned</p>
        </div>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TNumberPad :shuffle="true" /&gt;</code></pre>
      </div>
    </section>

    <!-- Custom Icons -->
    <section :class="bemm('section')">
      <h2>Custom Icons</h2>
      <p>Customize action button icons</p>

      <div :class="bemm('demo')">
        <TNumberPad
          :clear-icon="Icons.TRASH"
          :submit-icon="Icons.ARROW_RIGHT"
          @number="val => customIconValue += val"
          @clear="() => customIconValue = ''"
          @submit="() => customIconLog = `Submitted: ${customIconValue}`"
        />
        <div :class="bemm('output')">
          <div :class="bemm('value')">Value: {{ customIconValue || '0' }}</div>
          <div :class="bemm('log')" v-if="customIconLog">{{ customIconLog }}</div>
        </div>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>import type { Icons } from '@tiko/ui'

&lt;TNumberPad
  :clear-icon="Icons.TRASH"
  :submit-icon="Icons.ARROW_RIGHT"
/&gt;</code></pre>
      </div>
    </section>

    <!-- Disabled Buttons -->
    <section :class="bemm('section')">
      <h2>Conditional Button States</h2>
      <p>Disable clear/submit buttons based on conditions</p>

      <div :class="bemm('demo')">
        <TNumberPad
          :disable-clear="conditionalValue.length === 0"
          :disable-submit="conditionalValue.length < 4"
          @number="val => conditionalValue += val"
          @clear="() => conditionalValue = conditionalValue.slice(0, -1)"
          @submit="() => conditionalLog = `Submitted: ${conditionalValue}`"
        />
        <div :class="bemm('output')">
          <div :class="bemm('value')">Value: {{ conditionalValue || '0' }}</div>
          <div :class="bemm('note')">
            Clear: {{ conditionalValue.length === 0 ? 'disabled' : 'enabled' }},
            Submit: {{ conditionalValue.length < 4 ? 'disabled (need 4 digits)' : 'enabled' }}
          </div>
          <div :class="bemm('log')" v-if="conditionalLog">{{ conditionalLog }}</div>
        </div>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;TNumberPad
  :disable-clear="value.length === 0"
  :disable-submit="value.length < 4"
/&gt;</code></pre>
      </div>
    </section>

    <!-- Hide Action Buttons -->
    <section :class="bemm('section')">
      <h2>Hide Action Buttons</h2>
      <p>Hide clear or submit buttons when not needed</p>

      <div :class="bemm('demo', 'hide-actions')">
        <div :class="bemm('demo-item')">
          <label>Numbers Only</label>
          <TNumberPad
            :show-clear="false"
            :show-submit="false"
            @number="val => numbersOnlyValue += val"
          />
          <div :class="bemm('value')">{{ numbersOnlyValue || '0' }}</div>
        </div>
        <div :class="bemm('demo-item')">
          <label>No Submit Button</label>
          <TNumberPad
            :show-submit="false"
            @number="val => noSubmitValue += val"
            @clear="() => noSubmitValue = noSubmitValue.slice(0, -1)"
          />
          <div :class="bemm('value')">{{ noSubmitValue || '0' }}</div>
        </div>
      </div>

      <div :class="bemm('code')">
        <h4>Usage</h4>
        <pre><code>&lt;!-- Hide both action buttons --&gt;
&lt;TNumberPad :show-clear="false" :show-submit="false" /&gt;

&lt;!-- Hide only submit button --&gt;
&lt;TNumberPad :show-submit="false" /&gt;</code></pre>
      </div>
    </section>

    <!-- Interactive Example -->
    <section :class="bemm('section')">
      <h2>Interactive Example</h2>
      <p>Try different configurations</p>

      <div :class="bemm('demo', 'interactive')">
        <div :class="bemm('controls')">
          <label>
            Size:
            <select v-model="interactive.size">
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </label>
          <label>
            Variant:
            <select v-model="interactive.variant">
              <option value="default">Default</option>
              <option value="flat">Flat</option>
            </select>
          </label>
          <label>
            <input type="checkbox" v-model="interactive.shuffle">
            Shuffle numbers
          </label>
          <label>
            <input type="checkbox" v-model="interactive.showClear">
            Show clear button
          </label>
          <label>
            <input type="checkbox" v-model="interactive.showSubmit">
            Show submit button
          </label>
        </div>

        <div :class="bemm('result')">
          <TNumberPad
            :size="interactive.size"
            :variant="interactive.variant"
            :shuffle="interactive.shuffle"
            :show-clear="interactive.showClear"
            :show-submit="interactive.showSubmit"
            :disable-clear="interactive.value.length === 0"
            @number="val => interactive.value += val"
            @clear="() => interactive.value = interactive.value.slice(0, -1)"
            @submit="() => interactive.log = `Submitted: ${interactive.value}`"
          />
          <div :class="bemm('output')">
            <div :class="bemm('value')">Value: {{ interactive.value || '0' }}</div>
            <div :class="bemm('log')" v-if="interactive.log">{{ interactive.log }}</div>
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
              <td><code>size</code></td>
              <td><code>'small' | 'medium' | 'large'</code></td>
              <td><code>'medium'</code></td>
              <td>Size of the number pad</td>
            </tr>
            <tr>
              <td><code>variant</code></td>
              <td><code>'default' | 'flat'</code></td>
              <td><code>'default'</code></td>
              <td>Visual style variant</td>
            </tr>
            <tr>
              <td><code>shuffle</code></td>
              <td><code>boolean</code></td>
              <td><code>false</code></td>
              <td>Randomize number positions</td>
            </tr>
            <tr>
              <td><code>showClear</code></td>
              <td><code>boolean</code></td>
              <td><code>true</code></td>
              <td>Show clear button</td>
            </tr>
            <tr>
              <td><code>showSubmit</code></td>
              <td><code>boolean</code></td>
              <td><code>true</code></td>
              <td>Show submit button</td>
            </tr>
            <tr>
              <td><code>disableClear</code></td>
              <td><code>boolean</code></td>
              <td><code>false</code></td>
              <td>Disable clear button</td>
            </tr>
            <tr>
              <td><code>disableSubmit</code></td>
              <td><code>boolean</code></td>
              <td><code>false</code></td>
              <td>Disable submit button</td>
            </tr>
            <tr>
              <td><code>clearIcon</code></td>
              <td><code>string</code></td>
              <td><code>Icons.CHEVRON_LEFT</code></td>
              <td>Icon for clear button</td>
            </tr>
            <tr>
              <td><code>submitIcon</code></td>
              <td><code>string</code></td>
              <td><code>Icons.CHECK</code></td>
              <td>Icon for submit button</td>
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
              <td><code>number</code></td>
              <td><code>string</code></td>
              <td>Emitted when a number is pressed</td>
            </tr>
            <tr>
              <td><code>clear</code></td>
              <td><code>void</code></td>
              <td>Emitted when clear button is pressed</td>
            </tr>
            <tr>
              <td><code>submit</code></td>
              <td><code>void</code></td>
              <td>Emitted when submit button is pressed</td>
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
import { TNumberPad } from '@tiko/ui'
import type { Icons } from '@tiko/ui'

const bemm = useBemm('number-pad-view')

// Basic demo
const basicValue = ref('')
const basicLog = ref('')

const handleBasicNumber = (num: string) => {
  basicValue.value += num
  basicLog.value = `Pressed: ${num}`
}

const handleBasicClear = () => {
  basicValue.value = basicValue.value.slice(0, -1)
  basicLog.value = 'Cleared last digit'
}

const handleBasicSubmit = () => {
  basicLog.value = `Submitted: ${basicValue.value}`
}

// Size demos
const sizes = reactive({
  small: '',
  medium: '',
  large: ''
})

// Variant demos
const variants = reactive({
  default: '',
  flat: ''
})

// Other demos
const shuffledValue = ref('')
const customIconValue = ref('')
const customIconLog = ref('')
const conditionalValue = ref('')
const conditionalLog = ref('')
const numbersOnlyValue = ref('')
const noSubmitValue = ref('')

// Interactive example
const interactive = reactive({
  size: 'medium' as 'small' | 'medium' | 'large',
  variant: 'default' as 'default' | 'flat',
  shuffle: false,
  showClear: true,
  showSubmit: true,
  value: '',
  log: ''
})
</script>

<style lang="scss" scoped>
.number-pad-view {
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
    align-items: center;

    &--sizes, &--variants, &--hide-actions {
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: space-around;
    }

    &--interactive {
      gap: var(--space-lg);
    }
  }

  &__demo-item {
    display: flex;
    flex-direction: column;
    gap: var(--space);
    align-items: center;

    label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-foreground-secondary);
    }
  }

  &__output {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
    align-items: center;
    width: 100%;
  }

  &__value {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-foreground);
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    padding: var(--space-s) var(--space);
    background: var(--color-background);
    border: 1px solid var(--color-accent);
    border-radius: var(--radius);
    min-width: 200px;
    text-align: center;
  }

  &__log {
    font-size: 0.875rem;
    color: var(--color-success);
    font-weight: 500;
  }

  &__note {
    font-size: 0.875rem;
    color: var(--color-foreground-secondary);
    text-align: center;
  }

  &__controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space);
    justify-content: center;

    label {
      display: flex;
      align-items: center;
      gap: var(--space-s);
      font-size: 0.875rem;
      color: var(--color-foreground);
      cursor: pointer;

      select, input[type="checkbox"] {
        cursor: pointer;
      }

      select {
        padding: var(--space-xs) var(--space-s);
        border: 1px solid var(--color-accent);
        border-radius: var(--radius-s);
        background: var(--color-background);
        color: var(--color-foreground);
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
  .number-pad-view {
    padding: var(--space);

    &__header h1 {
      font-size: 2rem;
    }

    &__demo {
      &--sizes, &--variants, &--hide-actions {
        flex-direction: column;
      }
    }
  }
}
</style>
