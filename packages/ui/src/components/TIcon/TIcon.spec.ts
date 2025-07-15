import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TIcon from './TIcon.vue'

// Mock the open-icon module
vi.mock('open-icon', () => ({
  getIcon: vi.fn((iconName: string) => Promise.resolve(`<svg data-icon="${iconName}"><path d="test"/></svg>`))
}))

describe('TIcon.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly with default props', () => {
    const wrapper = mount(TIcon)
    expect(wrapper.find('.icon').exists()).toBe(true)
  })

  it('loads and displays icon by name', async () => {
    const wrapper = mount(TIcon, {
      props: { name: 'home' }
    })
    
    await flushPromises()
    
    expect(wrapper.html()).toContain('data-icon="home"')
    const iconDiv = wrapper.find('.icon')
    expect(iconDiv.classes().join(' ')).toContain('icon--home')
  })

  it('applies animation class when animation prop is true', () => {
    const wrapper = mount(TIcon, {
      props: { 
        name: 'home',
        animation: true 
      }
    })
    
    const iconDiv = wrapper.find('.icon')
    expect(iconDiv.classes().join(' ')).toContain('icon--animated')
  })

  it('maps icon aliases correctly', async () => {
    const aliasTests = [
      { input: 'edit', expected: 'edit-m' },
      { input: 'plus', expected: 'add-m' },
      { input: 'check', expected: 'check-m' },
      { input: 'x', expected: 'multiply-m' },
      { input: 'play', expected: 'playback-play' },
      { input: 'pause', expected: 'playback-pause' }
    ]

    for (const test of aliasTests) {
      const wrapper = mount(TIcon, {
        props: { name: test.input }
      })
      
      await flushPromises()
      
      expect(wrapper.html()).toContain(`data-icon="${test.expected}"`)
    }
  })

  it('uses original name when no alias exists', async () => {
    const wrapper = mount(TIcon, {
      props: { name: 'custom-icon' }
    })
    
    await flushPromises()
    
    expect(wrapper.html()).toContain('data-icon="custom-icon"')
  })

  it('updates icon when name prop changes', async () => {
    const wrapper = mount(TIcon, {
      props: { name: 'home' }
    })
    
    await flushPromises()
    expect(wrapper.html()).toContain('data-icon="home"')
    
    await wrapper.setProps({ name: 'settings' })
    await flushPromises()
    
    expect(wrapper.html()).toContain('data-icon="settings"')
    const iconDiv = wrapper.find('.icon')
    expect(iconDiv.classes().join(' ')).toContain('icon--settings')
  })

  it('renders SVG content correctly', async () => {
    const wrapper = mount(TIcon, {
      props: { name: 'test-icon' }
    })
    
    await flushPromises()
    
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('path').exists()).toBe(true)
  })

  it('applies correct CSS classes for styling', () => {
    const wrapper = mount(TIcon, {
      props: { name: 'test-icon' }
    })
    
    const iconElement = wrapper.find('.icon')
    expect(iconElement.exists()).toBe(true)
  })

  it('handles empty name prop gracefully', async () => {
    const wrapper = mount(TIcon, {
      props: { name: '' }
    })
    
    await flushPromises()
    
    const iconDiv = wrapper.find('.icon')
    expect(iconDiv.exists()).toBe(true)
    // Empty name still gets applied as modifier
    expect(iconDiv.classes().length).toBeGreaterThan(0)
  })

  it('maintains reactivity when toggling animation', async () => {
    const wrapper = mount(TIcon, {
      props: { 
        name: 'home',
        animation: false 
      }
    })
    
    let iconDiv = wrapper.find('.icon')
    expect(iconDiv.classes().join(' ')).not.toContain('icon--animated')
    
    await wrapper.setProps({ animation: true })
    iconDiv = wrapper.find('.icon')
    expect(iconDiv.classes().join(' ')).toContain('icon--animated')
    
    await wrapper.setProps({ animation: false })
    iconDiv = wrapper.find('.icon')
    expect(iconDiv.classes().join(' ')).not.toContain('icon--animated')
  })
})