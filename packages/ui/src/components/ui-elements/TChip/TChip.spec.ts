import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TChip from './TChip.vue'
import { ChipColor } from './TChip.model'

describe('TChip.vue', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(TChip, {
      slots: {
        default: 'Chip label'
      },
      global: {
        stubs: {
          Icon: true,
          ToolTip: true
        }
      }
    })
    
    expect(wrapper.find('.chip').exists()).toBe(true)
    expect(wrapper.text()).toContain('Chip label')
  })

  it('renders slot content in label', () => {
    const wrapper = mount(TChip, {
      slots: {
        default: 'My Chip'
      },
      global: {
        stubs: {
          Icon: true,
          ToolTip: true
        }
      }
    })
    
    expect(wrapper.find('.chip__label').text()).toBe('My Chip')
  })

  it('applies color classes and styles correctly', () => {
    const colors = ['primary', 'secondary', 'tertiary', 'accent']
    
    colors.forEach(color => {
      const wrapper = mount(TChip, {
        props: { color },
        global: {
          stubs: {
            Icon: true,
            ToolTip: true
          }
        }
      })
      
      expect(wrapper.classes()).toContain(`chip--${color}`)
      expect(wrapper.attributes('style')).toContain(`--chip-color: var(--color-${color})`)
    })
  })

  it('renders icon when provided', () => {
    const wrapper = mount(TChip, {
      props: { icon: 'home' },
      global: {
        stubs: {
          Icon: true,
          ToolTip: true
        }
      }
    })
    
    // Check if icon prop was provided and class is applied
    expect(wrapper.vm.$props.icon).toBe('home')
    expect(wrapper.classes()).toContain('chip--has-icon')
    // The icon component is stubbed, so we just verify the structure
    expect(wrapper.find('.chip__icon').exists()).toBe(true)
  })

  it('renders count when provided', () => {
    const wrapper = mount(TChip, {
      props: { count: 5 },
      global: {
        stubs: {
          Icon: true,
          ToolTip: true
        }
      }
    })
    
    expect(wrapper.find('.chip__count').exists()).toBe(true)
    expect(wrapper.find('.chip__count').text()).toBe('5')
  })

  it('does not render count when undefined', () => {
    const wrapper = mount(TChip, {
      global: {
        stubs: {
          Icon: true,
          ToolTip: true
        }
      }
    })
    
    expect(wrapper.find('.chip__count').exists()).toBe(false)
  })

  it('renders tooltip when provided', () => {
    const tooltipText = 'This is a tooltip'
    const wrapper = mount(TChip, {
      props: { tooltip: tooltipText },
      global: {
        stubs: {
          Icon: true,
          ToolTip: true
        }
      }
    })
    
    // Check that tooltip prop is set and the tooltip attribute is rendered
    expect(wrapper.vm.$props.tooltip).toBe(tooltipText)
    expect(wrapper.attributes('tooltip')).toBe('true')
    // The tooltip text should be in the component somewhere
    expect(wrapper.text()).toContain(tooltipText)
  })

  it('does not render tooltip when not provided', () => {
    const wrapper = mount(TChip, {
      global: {
        stubs: {
          Icon: true,
          ToolTip: true
        }
      }
    })
    
    expect(wrapper.findComponent({ name: 'ToolTip' }).exists()).toBe(false)
    expect(wrapper.attributes('tooltip')).toBe('false')
  })

  it('applies icon hide classes correctly', () => {
    const screens = ['mobile', 'desktop', 'tablet']
    
    screens.forEach(screen => {
      const wrapper = mount(TChip, {
        props: { iconHide: screen },
        global: {
          stubs: {
            Icon: true,
            ToolTip: true
          }
        }
      })
      
      expect(wrapper.classes()).toContain(`chip--icon-hide-${screen}`)
    })
  })

  it('applies label hide classes correctly', () => {
    const screens = ['mobile', 'desktop', 'tablet']
    
    screens.forEach(screen => {
      const wrapper = mount(TChip, {
        props: { labelHide: screen },
        global: {
          stubs: {
            Icon: true,
            ToolTip: true
          }
        }
      })
      
      expect(wrapper.classes()).toContain(`chip--label-hide-${screen}`)
    })
  })

  it('renders pre-content slot', () => {
    const wrapper = mount(TChip, {
      slots: {
        'pre-content': '<span>Pre</span>'
      },
      global: {
        stubs: {
          Icon: true,
          ToolTip: true
        }
      }
    })
    
    expect(wrapper.html()).toContain('<span>Pre</span>')
  })

  it('renders post-content slot', () => {
    const wrapper = mount(TChip, {
      slots: {
        'post-content': '<span>Post</span>'
      },
      global: {
        stubs: {
          Icon: true,
          ToolTip: true
        }
      }
    })
    
    expect(wrapper.html()).toContain('<span>Post</span>')
  })

  it('combines multiple props correctly', () => {
    const wrapper = mount(TChip, {
      props: {
        color: 'primary',
        icon: 'star',
        count: 10,
        tooltip: 'Starred items',
        iconHide: 'mobile',
        labelHide: 'desktop'
      },
      slots: {
        default: 'Stars'
      },
      global: {
        stubs: {
          Icon: true,
          ToolTip: true
        }
      }
    })
    
    expect(wrapper.classes()).toContain('chip--primary')
    expect(wrapper.classes()).toContain('chip--has-icon')
    expect(wrapper.classes()).toContain('chip--icon-hide-mobile')
    expect(wrapper.classes()).toContain('chip--label-hide-desktop')
    expect(wrapper.find('.chip__count').text()).toBe('10')
    expect(wrapper.find('.chip__label').text()).toBe('Stars')
  })

  it('renders content wrapper correctly', () => {
    const wrapper = mount(TChip, {
      global: {
        stubs: {
          Icon: true,
          ToolTip: true
        }
      }
    })
    
    expect(wrapper.find('.chip__content').exists()).toBe(true)
  })
})