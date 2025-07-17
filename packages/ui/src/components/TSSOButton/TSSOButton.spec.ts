import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import TSSOButton from './TSSOButton.vue'

// Mock TButton component
vi.mock('../TButton/TButton.vue', () => ({
  default: {
    name: 'TButton',
    template: '<button class="t-button"><slot /></button>',
    props: ['type', 'color', 'size', 'disabled', 'loading', 'full', 'icon']
  }
}))

// Mock TIcon component
vi.mock('../TIcon/TIcon.vue', () => ({
  default: {
    name: 'TIcon',
    template: '<i class="t-icon"></i>',
    props: ['name', 'size']
  }
}))

describe('TSSOButton.vue', () => {
  it('renders correctly with Google provider', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'google'
      }
    })
    
    expect(wrapper.html()).toBeTruthy()
    expect(wrapper.find('.sso-button').exists()).toBe(true)
    expect(wrapper.text()).toContain('Continue with Google')
  })

  it('renders correctly with GitHub provider', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'github'
      }
    })
    
    expect(wrapper.text()).toContain('Continue with GitHub')
  })

  it('renders correctly with Microsoft provider', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'microsoft'
      }
    })
    
    expect(wrapper.text()).toContain('Continue with Microsoft')
  })

  it('renders correctly with Apple provider', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'apple'
      }
    })
    
    expect(wrapper.text()).toContain('Continue with Apple')
  })

  it('renders correctly with Facebook provider', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'facebook'
      }
    })
    
    expect(wrapper.text()).toContain('Continue with Facebook')
  })

  it('renders correctly with Twitter provider', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'twitter'
      }
    })
    
    expect(wrapper.text()).toContain('Continue with Twitter')
  })

  it('displays correct icon for each provider', () => {
    const providerIcons = {
      google: 'brand-google',
      github: 'brand-github',
      microsoft: 'brand-microsoft',
      apple: 'brand-apple',
      facebook: 'brand-facebook',
      twitter: 'brand-twitter'
    }
    
    Object.entries(providerIcons).forEach(([provider, expectedIcon]) => {
      const wrapper = mount(TSSOButton, {
        props: { provider }
      })
      
      const icon = wrapper.findComponent({ name: 'TIcon' })
      expect(icon.exists()).toBe(true)
      expect(icon.props('name')).toBe(expectedIcon)
    })
  })

  it('applies correct color for each provider', () => {
    const providerColors = {
      google: 'default',
      github: 'dark',
      microsoft: 'primary',
      apple: 'dark',
      facebook: 'primary',
      twitter: 'info'
    }
    
    Object.entries(providerColors).forEach(([provider, expectedColor]) => {
      const wrapper = mount(TSSOButton, {
        props: { provider }
      })
      
      const button = wrapper.findComponent({ name: 'TButton' })
      expect(button.props('color')).toBe(expectedColor)
    })
  })

  it('applies disabled state correctly', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'google',
        disabled: true
      }
    })
    
    const button = wrapper.findComponent({ name: 'TButton' })
    expect(button.props('disabled')).toBe(true)
  })

  it('applies loading state correctly', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'google',
        loading: true
      }
    })
    
    const button = wrapper.findComponent({ name: 'TButton' })
    expect(button.props('loading')).toBe(true)
  })

  it('applies full width correctly', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'google',
        full: true
      }
    })
    
    const button = wrapper.findComponent({ name: 'TButton' })
    expect(button.props('full')).toBe(true)
  })

  it('applies correct size', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'google',
        size: 'large'
      }
    })
    
    const button = wrapper.findComponent({ name: 'TButton' })
    expect(button.props('size')).toBe('large')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'google'
      }
    })
    
    const button = wrapper.findComponent({ name: 'TButton' })
    await button.trigger('click')
    
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'google',
        disabled: true
      }
    })
    
    const button = wrapper.findComponent({ name: 'TButton' })
    await button.trigger('click')
    
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('uses outline button type by default', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'google'
      }
    })
    
    const button = wrapper.findComponent({ name: 'TButton' })
    expect(button.props('type')).toBe('outline')
  })

  it('applies correct CSS classes', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'google'
      }
    })
    
    expect(wrapper.find('.sso-button').exists()).toBe(true)
    expect(wrapper.find('.sso-button--google').exists()).toBe(true)
  })

  it('applies loading class when loading', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'google',
        loading: true
      }
    })
    
    expect(wrapper.find('.sso-button--loading').exists()).toBe(true)
  })

  it('applies disabled class when disabled', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'google',
        disabled: true
      }
    })
    
    expect(wrapper.find('.sso-button--disabled').exists()).toBe(true)
  })

  it('shows loading text when loading', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'google',
        loading: true
      }
    })
    
    expect(wrapper.text()).toContain('Signing in...')
  })

  it('handles custom text prop', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'google',
        text: 'Sign in with Google'
      }
    })
    
    expect(wrapper.text()).toContain('Sign in with Google')
  })

  it('handles unknown provider gracefully', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'unknown'
      }
    })
    
    expect(wrapper.text()).toContain('Continue with Unknown')
  })

  it('applies correct accessibility attributes', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'google'
      }
    })
    
    const button = wrapper.findComponent({ name: 'TButton' })
    expect(button.attributes('aria-label')).toBe('Continue with Google')
  })

  it('displays icon with correct size', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'google'
      }
    })
    
    const icon = wrapper.findComponent({ name: 'TIcon' })
    expect(icon.props('size')).toBe('1.2em')
  })

  it('maintains brand consistency', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'google'
      }
    })
    
    const button = wrapper.findComponent({ name: 'TButton' })
    expect(button.props('type')).toBe('outline')
    expect(button.props('full')).toBe(true)
  })

  it('handles provider capitalization correctly', () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'GOOGLE'
      }
    })
    
    expect(wrapper.text()).toContain('Continue with Google')
  })

  it('emits provider information with click event', async () => {
    const wrapper = mount(TSSOButton, {
      props: {
        provider: 'google'
      }
    })
    
    const button = wrapper.findComponent({ name: 'TButton' })
    await button.trigger('click')
    
    const emittedEvents = wrapper.emitted('click')
    expect(emittedEvents).toBeTruthy()
    expect(emittedEvents[0]).toEqual([{ provider: 'google' }])
  })
})