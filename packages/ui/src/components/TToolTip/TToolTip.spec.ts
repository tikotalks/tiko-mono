import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import TToolTip from './TToolTip.vue'

describe('TToolTip.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders correctly with trigger element', () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: 'Tooltip content'
      },
      slots: {
        default: '<button>Hover me</button>'
      }
    })
    
    expect(wrapper.html()).toBeTruthy()
    expect(wrapper.find('.tooltip').exists()).toBe(true)
    expect(wrapper.find('.tooltip__trigger').exists()).toBe(true)
    expect(wrapper.text()).toContain('Hover me')
  })

  it('shows tooltip on hover', async () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: 'Tooltip content'
      },
      slots: {
        default: '<button>Hover me</button>'
      }
    })
    
    const trigger = wrapper.find('.tooltip__trigger')
    await trigger.trigger('mouseenter')
    
    expect(wrapper.find('.tooltip__content').exists()).toBe(true)
    expect(wrapper.find('.tooltip__content').text()).toBe('Tooltip content')
  })

  it('hides tooltip on mouse leave', async () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: 'Tooltip content'
      },
      slots: {
        default: '<button>Hover me</button>'
      }
    })
    
    const trigger = wrapper.find('.tooltip__trigger')
    await trigger.trigger('mouseenter')
    expect(wrapper.find('.tooltip__content').exists()).toBe(true)
    
    await trigger.trigger('mouseleave')
    expect(wrapper.find('.tooltip__content').exists()).toBe(false)
  })

  it('shows tooltip on focus', async () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: 'Tooltip content'
      },
      slots: {
        default: '<button>Focus me</button>'
      }
    })
    
    const trigger = wrapper.find('.tooltip__trigger')
    await trigger.trigger('focus')
    
    expect(wrapper.find('.tooltip__content').exists()).toBe(true)
  })

  it('hides tooltip on blur', async () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: 'Tooltip content'
      },
      slots: {
        default: '<button>Focus me</button>'
      }
    })
    
    const trigger = wrapper.find('.tooltip__trigger')
    await trigger.trigger('focus')
    expect(wrapper.find('.tooltip__content').exists()).toBe(true)
    
    await trigger.trigger('blur')
    expect(wrapper.find('.tooltip__content').exists()).toBe(false)
  })

  it('applies correct position classes', () => {
    const positions = ['top', 'bottom', 'left', 'right']
    
    positions.forEach(position => {
      const wrapper = mount(TToolTip, {
        props: {
          content: 'Tooltip content',
          position
        },
        slots: {
          default: '<button>Hover me</button>'
        }
      })
      
      expect(wrapper.find('.tooltip').classes()).toContain(`tooltip--${position}`)
    })
  })

  it('respects delay prop', async () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: 'Tooltip content',
        delay: 500
      },
      slots: {
        default: '<button>Hover me</button>'
      }
    })
    
    const trigger = wrapper.find('.tooltip__trigger')
    await trigger.trigger('mouseenter')
    
    // Should not show immediately
    expect(wrapper.find('.tooltip__content').exists()).toBe(false)
    
    // Fast forward time
    vi.advanceTimersByTime(500)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.tooltip__content').exists()).toBe(true)
  })

  it('cancels delayed show on mouse leave', async () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: 'Tooltip content',
        delay: 500
      },
      slots: {
        default: '<button>Hover me</button>'
      }
    })
    
    const trigger = wrapper.find('.tooltip__trigger')
    await trigger.trigger('mouseenter')
    
    // Leave before delay completes
    await trigger.trigger('mouseleave')
    
    vi.advanceTimersByTime(500)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.tooltip__content').exists()).toBe(false)
  })

  it('handles disabled state', () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: 'Tooltip content',
        disabled: true
      },
      slots: {
        default: '<button>Hover me</button>'
      }
    })
    
    expect(wrapper.find('.tooltip').classes()).toContain('tooltip--disabled')
  })

  it('does not show tooltip when disabled', async () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: 'Tooltip content',
        disabled: true
      },
      slots: {
        default: '<button>Hover me</button>'
      }
    })
    
    const trigger = wrapper.find('.tooltip__trigger')
    await trigger.trigger('mouseenter')
    
    expect(wrapper.find('.tooltip__content').exists()).toBe(false)
  })

  it('applies correct theme', () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: 'Tooltip content',
        theme: 'dark'
      },
      slots: {
        default: '<button>Hover me</button>'
      }
    })
    
    expect(wrapper.find('.tooltip').classes()).toContain('tooltip--dark')
  })

  it('handles arrow display', async () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: 'Tooltip content',
        showArrow: true
      },
      slots: {
        default: '<button>Hover me</button>'
      }
    })
    
    const trigger = wrapper.find('.tooltip__trigger')
    await trigger.trigger('mouseenter')
    
    expect(wrapper.find('.tooltip__arrow').exists()).toBe(true)
  })

  it('hides arrow when showArrow is false', async () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: 'Tooltip content',
        showArrow: false
      },
      slots: {
        default: '<button>Hover me</button>'
      }
    })
    
    const trigger = wrapper.find('.tooltip__trigger')
    await trigger.trigger('mouseenter')
    
    expect(wrapper.find('.tooltip__arrow').exists()).toBe(false)
  })

  it('applies correct size classes', () => {
    const sizes = ['small', 'medium', 'large']
    
    sizes.forEach(size => {
      const wrapper = mount(TToolTip, {
        props: {
          content: 'Tooltip content',
          size
        },
        slots: {
          default: '<button>Hover me</button>'
        }
      })
      
      expect(wrapper.find('.tooltip').classes()).toContain(`tooltip--${size}`)
    })
  })

  it('handles max width', async () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: 'Very long tooltip content that should wrap',
        maxWidth: '200px'
      },
      slots: {
        default: '<button>Hover me</button>'
      }
    })
    
    const trigger = wrapper.find('.tooltip__trigger')
    await trigger.trigger('mouseenter')
    
    const content = wrapper.find('.tooltip__content')
    expect(content.attributes('style')).toContain('max-width: 200px')
  })

  it('supports HTML content', async () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: '<strong>Bold</strong> tooltip',
        html: true
      },
      slots: {
        default: '<button>Hover me</button>'
      }
    })
    
    const trigger = wrapper.find('.tooltip__trigger')
    await trigger.trigger('mouseenter')
    
    const content = wrapper.find('.tooltip__content')
    expect(content.html()).toContain('<strong>Bold</strong>')
  })

  it('escapes HTML content when html is false', async () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: '<script>alert("xss")</script>',
        html: false
      },
      slots: {
        default: '<button>Hover me</button>'
      }
    })
    
    const trigger = wrapper.find('.tooltip__trigger')
    await trigger.trigger('mouseenter')
    
    const content = wrapper.find('.tooltip__content')
    expect(content.html()).not.toContain('<script>')
    expect(content.text()).toContain('<script>alert("xss")</script>')
  })

  it('applies correct ARIA attributes', () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: 'Tooltip content'
      },
      slots: {
        default: '<button>Hover me</button>'
      }
    })
    
    const trigger = wrapper.find('.tooltip__trigger')
    expect(trigger.attributes('aria-describedby')).toBeDefined()
  })

  it('handles keyboard events', async () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: 'Tooltip content'
      },
      slots: {
        default: '<button>Press me</button>'
      }
    })
    
    const trigger = wrapper.find('.tooltip__trigger')
    await trigger.trigger('keydown', { key: 'Escape' })
    
    expect(wrapper.find('.tooltip__content').exists()).toBe(false)
  })

  it('positions tooltip correctly relative to trigger', async () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: 'Tooltip content',
        position: 'top'
      },
      slots: {
        default: '<button>Hover me</button>'
      }
    })
    
    const trigger = wrapper.find('.tooltip__trigger')
    await trigger.trigger('mouseenter')
    
    const content = wrapper.find('.tooltip__content')
    expect(content.classes()).toContain('tooltip__content--top')
  })

  it('handles touch events on mobile', async () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: 'Tooltip content'
      },
      slots: {
        default: '<button>Touch me</button>'
      }
    })
    
    const trigger = wrapper.find('.tooltip__trigger')
    await trigger.trigger('touchstart')
    
    expect(wrapper.find('.tooltip__content').exists()).toBe(true)
  })

  it('auto-hides after timeout on touch', async () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: 'Tooltip content',
        touchTimeout: 2000
      },
      slots: {
        default: '<button>Touch me</button>'
      }
    })
    
    const trigger = wrapper.find('.tooltip__trigger')
    await trigger.trigger('touchstart')
    
    expect(wrapper.find('.tooltip__content').exists()).toBe(true)
    
    vi.advanceTimersByTime(2000)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.tooltip__content').exists()).toBe(false)
  })

  it('clears timers on component unmount', () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: 'Tooltip content'
      },
      slots: {
        default: '<button>Hover me</button>'
      }
    })
    
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
    wrapper.unmount()
    
    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  it('handles empty content gracefully', () => {
    const wrapper = mount(TToolTip, {
      props: {
        content: ''
      },
      slots: {
        default: '<button>Hover me</button>'
      }
    })
    
    expect(wrapper.find('.tooltip').exists()).toBe(true)
    expect(wrapper.find('.tooltip').classes()).toContain('tooltip--disabled')
  })
})