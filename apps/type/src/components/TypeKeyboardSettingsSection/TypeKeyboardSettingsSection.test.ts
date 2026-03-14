import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive, ref } from 'vue'
import TypeKeyboardSettingsSection from './TypeKeyboardSettingsSection.vue'

const mockLocale = ref('en-US')
const mockTypeStore = reactive({
  settings: {
    keyboardLanguage: 'auto',
    keyboardAlphabetical: false,
    keyboardLayout: 'qwerty',
    keyboardCharacterSet: 'auto',
  },
})

vi.mock('@tiko/core', () => ({
  useI18n: () => ({
    locale: mockLocale,
  }),
}))

vi.mock('../../stores/type', () => ({
  useTypeStore: () => mockTypeStore,
}))

describe('TypeKeyboardSettingsSection', () => {
  beforeEach(() => {
    mockLocale.value = 'en-US'
    mockTypeStore.settings.keyboardLanguage = 'auto'
    mockTypeStore.settings.keyboardAlphabetical = false
    mockTypeStore.settings.keyboardLayout = 'qwerty'
    mockTypeStore.settings.keyboardCharacterSet = 'auto'
  })

  it('emits native keyboard settings when the language changes', async () => {
    const wrapper = mount(TypeKeyboardSettingsSection, {
      global: {
        stubs: {
          TInputSelect: {
            name: 'TInputSelect',
            props: ['modelValue', 'options', 'label', 'disabled'],
            emits: ['update:model-value'],
            template:
              '<select data-test="layout-select" :value="modelValue" @change="$emit(\'update:model-value\', $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>',
          },
          TInputCheckbox: true,
        },
      },
    })

    wrapper.getComponent({ name: 'TInputSelect' }).vm.$emit('update:model-value', 'ru')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('change')).toEqual([
      [
        {
          keyboardLanguage: 'ru',
          keyboardAlphabetical: false,
          keyboardLayout: 'russian',
          keyboardCharacterSet: 'ru',
        },
      ],
    ])
  })

  it('emits alphabetical keyboard settings when toggled', async () => {
    mockTypeStore.settings.keyboardLanguage = 'hy'

    const wrapper = mount(TypeKeyboardSettingsSection, {
      global: {
        stubs: {
          TInputSelect: {
            name: 'TInputSelect',
            props: ['modelValue', 'options', 'label', 'disabled'],
            emits: ['update:model-value'],
            template:
              '<select :data-test="label" :value="modelValue" :disabled="disabled" @change="$emit(\'update:model-value\', $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>',
          },
          TInputCheckbox: {
            name: 'TInputCheckbox',
            props: ['modelValue', 'label'],
            emits: ['update:model-value'],
            template:
              '<input type="checkbox" :data-test="label" :checked="modelValue" @change="$emit(\'update:model-value\', $event.target.checked)" />',
          },
        },
      },
    })

    wrapper.getComponent({ name: 'TInputCheckbox' }).vm.$emit('update:model-value', true)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('change')).toEqual([
      [
        {
          keyboardLanguage: 'hy',
          keyboardAlphabetical: true,
          keyboardLayout: 'alphabet',
          keyboardCharacterSet: 'hy',
        },
      ],
    ])
  })

  it('includes requested keyboard languages as selectable options', () => {
    const wrapper = mount(TypeKeyboardSettingsSection, {
      global: {
        stubs: {
          TInputSelect: {
            name: 'TInputSelect',
            props: ['modelValue', 'options', 'label', 'disabled'],
            template:
              '<select data-test="layout-select"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.value }}</option></select>',
          },
          TInputCheckbox: true,
        },
      },
    })

    const optionValues = wrapper.findAll('option').map(option => option.element.getAttribute('value'))

    expect(optionValues).toContain('auto')
    expect(optionValues).toContain('ru')
    expect(optionValues).toContain('hy')
    expect(optionValues).toContain('fa')
  })

  it('reflects the saved alphabetical setting', () => {
    mockTypeStore.settings.keyboardAlphabetical = true

    const wrapper = mount(TypeKeyboardSettingsSection, {
      global: {
        stubs: {
          TInputSelect: {
            name: 'TInputSelect',
            props: ['modelValue', 'options', 'label', 'disabled'],
            template: '<select :data-test="label"></select>',
          },
          TInputCheckbox: {
            name: 'TInputCheckbox',
            props: ['modelValue', 'label'],
            template: '<input type="checkbox" :data-test="label" :checked="modelValue" />',
          },
        },
      },
    })

    expect(wrapper.find('[data-test="Alphabetical Layout"]').attributes('checked')).toBeDefined()
  })

  it('shows the current language code hint', () => {
    mockLocale.value = 'ru-RU'

    const wrapper = mount(TypeKeyboardSettingsSection, {
      global: {
        stubs: {
          TInputSelect: true,
          TInputCheckbox: true,
        },
      },
    })

    expect(wrapper.text()).toContain('RU')
  })
})
