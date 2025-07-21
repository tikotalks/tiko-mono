import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import TAlert from './TAlert.vue'

// Mock i18n - simple mock that returns keys
vi.mock('../../composables/useI18n', () => ({
  useI18n: () => ({
    t: vi.fn((key: string) => key),
    keys: {
      common: {
        close: 'common.close'
      }
    },
    locale: ref('en'),
    setLocale: vi.fn(),
    availableLocales: ref([
      { code: 'en-GB', name: 'English' },
      { code: 'nl-NL', name: 'Dutch' },
      { code: 'de-DE', name: 'German' },
      { code: 'fr-FR', name: 'French' }
    ])
  })
}))

describe('TAlert.vue', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(TAlert, {
      slots: {
        default: 'Alert message'
      },
      global: {
        stubs: {
          TIcon: true
        }
      }
    })
    
    // Check if the component rendered at all
    expect(wrapper.html()).toBeTruthy()
    
    // Try to find the alert element
    const alertDiv = wrapper.find('div')
    expect(alertDiv.exists()).toBe(true)
    
    // Check text content
    expect(wrapper.text()).toContain('Alert message')
    
    // Check classes - bemm([type]) might produce a different class structure
    const classes = alertDiv.classes().join(' ')
    expect(classes).toContain('t-alert')
  })

  it('applies correct type classes', () => {
    const types = ['info', 'success', 'warning', 'error'] as const
    
    types.forEach(type => {
      const wrapper = mount(TAlert, {
        props: { type },
        global: {
          stubs: {
            TIcon: true
          }
        }
      })
      const alertDiv = wrapper.find('div')
      expect(alertDiv.exists()).toBe(true)
      const classes = alertDiv.classes().join(' ')
      expect(classes).toContain('t-alert')
      expect(classes).toContain(type)
    })
  })

  it('shows correct icon for each type', () => {
    const iconMap = {
      info: 'info-circled',
      success: 'check-circled',
      warning: 'exclamation-mark-circled',
      error: 'multiply-circled'
    }
    
    Object.entries(iconMap).forEach(([type, expectedIcon]) => {
      const wrapper = mount(TAlert, {
        props: { type: type as any },
        global: {
          stubs: {
            TIcon: true
          }
        }
      })
      
      const icon = wrapper.findComponent({ name: 'TIcon' })
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe(expectedIcon)
    })
  })

  it('shows dismiss button when dismissible is true', () => {
    const wrapper = mount(TAlert, {
      props: { dismissible: true },
      global: {
        stubs: {
          TIcon: true
        }
      }
    })
    
    expect(wrapper.find('.t-alert__close').exists()).toBe(true)
  })

  it('hides dismiss button when dismissible is false', () => {
    const wrapper = mount(TAlert, {
      props: { dismissible: false },
      global: {
        stubs: {
          TIcon: true
        }
      }
    })
    
    expect(wrapper.find('.t-alert__close').exists()).toBe(false)
  })

  it('emits dismiss event when close button is clicked', async () => {
    const wrapper = mount(TAlert, {
      props: { dismissible: true },
      global: {
        stubs: {
          TIcon: true
        }
      }
    })
    
    await wrapper.find('.t-alert__close').trigger('click')
    expect(wrapper.emitted()).toHaveProperty('dismiss')
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })

  it('hides alert when dismiss button is clicked', async () => {
    const wrapper = mount(TAlert, {
      props: { dismissible: true },
      global: {
        stubs: {
          TIcon: true
        }
      }
    })
    
    expect(wrapper.find('div').exists()).toBe(true)
    
    await wrapper.find('.t-alert__close').trigger('click')
    expect(wrapper.find('div').exists()).toBe(false)
  })

  it('renders slot content correctly', () => {
    const wrapper = mount(TAlert, {
      slots: {
        default: '<p>Custom alert content</p>'
      },
      global: {
        stubs: {
          TIcon: true
        }
      }
    })
    
    expect(wrapper.find('.t-alert__content').html()).toContain('<p>Custom alert content</p>')
  })

  it('has correct aria-label on close button', () => {
    const wrapper = mount(TAlert, {
      props: { dismissible: true },
      global: {
        stubs: {
          TIcon: true
        }
      }
    })
    
    expect(wrapper.find('.t-alert__close').attributes('aria-label')).toBe('common.close')
  })

  it('displays close icon in dismiss button', () => {
    const wrapper = mount(TAlert, {
      props: { dismissible: true },
      global: {
        stubs: {
          TIcon: true
        }
      }
    })
    
    const closeIcon = wrapper.find('.t-alert__close').findComponent({ name: 'TIcon' })
    expect(closeIcon.exists()).toBe(true)
    expect(closeIcon.attributes('name')).toBe('close')
  })

  it('maintains visibility state independently', async () => {
    const wrapper = mount(TAlert, {
      props: { dismissible: true },
      global: {
        stubs: {
          TIcon: true
        }
      }
    })
    
    expect(wrapper.isVisible()).toBe(true)
    
    await wrapper.find('.t-alert__close').trigger('click')
    
    // The component should be hidden after dismiss
    expect(wrapper.find('.t-alert').exists()).toBe(false)
  })
})