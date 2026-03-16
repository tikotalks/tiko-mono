import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TypeSettingsForm from './TypeSettingsForm.vue'

vi.mock('@tiko/core', () => ({
  useI18n: () => ({
    t: (value: string) => value,
    locale: { value: 'en-US' },
  }),
}))

const createSettings = () => ({
  voice: null,
  rate: 1,
  pitch: 1,
  volume: 1,
  autoSave: true,
  historyLimit: 50,
  hapticFeedback: true,
  speakOnType: true,
  keyboardTheme: 'default',
  keyboardLanguage: 'auto',
  keyboardAlphabetical: false,
  keyboardLayout: 'qwerty',
  keyboardCharacterSet: 'auto',
  funLetters: false,
  speakWordByWord: true,
  playTypingSounds: false,
})

describe('TypeSettingsForm', () => {
  it('renders keyboard language and alphabetical controls', () => {
    const wrapper = mount(TypeSettingsForm, {
      props: {
        settings: createSettings(),
        onApply: vi.fn(),
      },
      global: {
        stubs: {
          TInputSelect: {
            name: 'TInputSelect',
            props: ['modelValue', 'options', 'label', 'disabled'],
            template:
              '<select :data-test="$attrs[\'data-test\'] || label" :disabled="disabled"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>',
          },
          TInputToggle: {
            name: 'TInputToggle',
            props: ['modelValue', 'label'],
            template:
              '<input type="checkbox" :data-test="$attrs[\'data-test\'] || label" :checked="modelValue" />',
          },
          TButton: true,
          TFormActions: { template: '<div><slot /></div>' },
        },
      },
    })

    expect(wrapper.find('[data-test="Keyboard Language"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="Alphabetical Layout"]').exists()).toBe(true)
  })

  it('applies the native layout for the selected keyboard language', async () => {
    const onApply = vi.fn()

    const wrapper = mount(TypeSettingsForm, {
      props: {
        settings: createSettings(),
        onApply,
      },
      global: {
        stubs: {
          TInputSelect: {
            name: 'TInputSelect',
            props: ['modelValue', 'options', 'label', 'disabled'],
            emits: ['update:model-value'],
            template:
              '<select :data-test="$attrs[\'data-test\'] || label" :value="modelValue" :disabled="disabled" @change="$emit(\'update:model-value\', $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>',
          },
          TInputToggle: {
            name: 'TInputToggle',
            props: ['modelValue', 'label'],
            emits: ['update:model-value'],
            template:
              '<input type="checkbox" :data-test="$attrs[\'data-test\'] || label" :checked="modelValue" @change="$emit(\'update:model-value\', $event.target.checked)" />',
          },
          TButton: {
            props: ['type', 'color'],
            emits: ['click'],
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          TFormActions: { template: '<div><slot /></div>' },
        },
      },
    })

    wrapper.getComponent({ name: 'TInputSelect' }).vm.$emit('update:model-value', 'ru')
    await nextTick()

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
    ;(buttons[1].element as HTMLButtonElement).click()
    await nextTick()

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        keyboardLanguage: 'ru',
        keyboardAlphabetical: false,
        keyboardLayout: 'russian',
        keyboardCharacterSet: 'ru',
      })
    )
  })

  it('applies the alphabetical layout for the selected keyboard language', async () => {
    const onApply = vi.fn()

    const wrapper = mount(TypeSettingsForm, {
      props: {
        settings: createSettings(),
        onApply,
      },
      global: {
        stubs: {
          TInputSelect: {
            name: 'TInputSelect',
            props: ['modelValue', 'options', 'label', 'disabled'],
            emits: ['update:model-value'],
            template:
              '<select :data-test="$attrs[\'data-test\'] || label" :value="modelValue" :disabled="disabled" @change="$emit(\'update:model-value\', $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>',
          },
          TInputToggle: {
            name: 'TInputToggle',
            props: ['modelValue', 'label'],
            emits: ['update:model-value'],
            template:
              '<input type="checkbox" :data-test="$attrs[\'data-test\'] || label" :checked="modelValue" @change="$emit(\'update:model-value\', $event.target.checked)" />',
          },
          TButton: {
            props: ['type', 'color'],
            emits: ['click'],
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          TFormActions: { template: '<div><slot /></div>' },
        },
      },
    })

    wrapper.getComponent({ name: 'TInputSelect' }).vm.$emit('update:model-value', 'hy')
    wrapper.getComponent({ name: 'TInputToggle' }).vm.$emit('update:model-value', true)
    await nextTick()

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
    ;(buttons[1].element as HTMLButtonElement).click()
    await nextTick()

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        keyboardLanguage: 'hy',
        keyboardAlphabetical: true,
        keyboardLayout: 'alphabet',
        keyboardCharacterSet: 'hy',
      })
    )
  })
})
