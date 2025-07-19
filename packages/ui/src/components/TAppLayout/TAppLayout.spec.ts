import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import TAppLayout from './TAppLayout.vue'

// Mock the TTopBar component
vi.mock('../TTopBar', () => ({
  TTopBar: {
    name: 'TTopBar',
    template: '<div class="t-top-bar"><slot name="center" /><slot name="actions" /></div>',
    props: ['title', 'subtitle', 'showBackButton', 'backButtonLabel', 'showUserInfo', 'showOnlineStatus', 'isUserOnline', 'isLoading', 'customMenuItems', 'appName'],
    emits: ['back', 'profile', 'settings', 'logout', 'menu-item-click']
  }
}))

describe('TAppLayout.vue', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(TAppLayout, {
      slots: {
        default: '<p>Main content</p>'
      }
    })
    
    expect(wrapper.html()).toBeTruthy()
    expect(wrapper.find('.app-layout').exists()).toBe(true)
    expect(wrapper.find('.app-layout__content').exists()).toBe(true)
    expect(wrapper.text()).toContain('Main content')
  })

  it('shows header when showHeader is true', () => {
    const wrapper = mount(TAppLayout, {
      props: { showHeader: true }
    })
    
    expect(wrapper.find('.app-layout__header').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'TTopBar' }).exists()).toBe(true)
  })

  it('hides header when showHeader is false', () => {
    const wrapper = mount(TAppLayout, {
      props: { showHeader: false }
    })
    
    expect(wrapper.findComponent({ name: 'TTopBar' }).exists()).toBe(false)
  })

  it('passes correct props to TTopBar', () => {
    const props = {
      title: 'Test Title',
      subtitle: 'Test Subtitle',
      showBackButton: true,
      backButtonLabel: 'Custom Back',
      showUserInfo: false,
      showOnlineStatus: true,
      isUserOnline: false,
      isLoading: true,
      appName: 'test-app'
    }
    
    const wrapper = mount(TAppLayout, { props })
    const topBar = wrapper.findComponent({ name: 'TTopBar' })
    
    expect(topBar.props('title')).toBe('Test Title')
    expect(topBar.props('subtitle')).toBe('Test Subtitle')
    expect(topBar.props('showBackButton')).toBe(true)
    expect(topBar.props('backButtonLabel')).toBe('Custom Back')
    expect(topBar.props('showUserInfo')).toBe(false)
    expect(topBar.props('showOnlineStatus')).toBe(true)
    expect(topBar.props('isUserOnline')).toBe(false)
    expect(topBar.props('isLoading')).toBe(true)
    expect(topBar.props('appName')).toBe('test-app')
  })

  it('passes custom menu items to TTopBar', () => {
    const customMenuItems = [
      { id: 'custom', label: 'Custom Action', icon: 'star' }
    ]
    
    const wrapper = mount(TAppLayout, {
      props: { customMenuItems }
    })
    
    const topBar = wrapper.findComponent({ name: 'TTopBar' })
    expect(topBar.props('customMenuItems')).toEqual(customMenuItems)
  })

  it('emits back event when TTopBar emits back', async () => {
    const wrapper = mount(TAppLayout)
    const topBar = wrapper.findComponent({ name: 'TTopBar' })
    
    await topBar.vm.$emit('back')
    expect(wrapper.emitted()).toHaveProperty('back')
    expect(wrapper.emitted('back')).toHaveLength(1)
  })

  it('emits profile event when TTopBar emits profile', async () => {
    const wrapper = mount(TAppLayout)
    const topBar = wrapper.findComponent({ name: 'TTopBar' })
    
    await topBar.vm.$emit('profile')
    expect(wrapper.emitted()).toHaveProperty('profile')
    expect(wrapper.emitted('profile')).toHaveLength(1)
  })

  it('emits settings event when TTopBar emits settings', async () => {
    const wrapper = mount(TAppLayout)
    const topBar = wrapper.findComponent({ name: 'TTopBar' })
    
    await topBar.vm.$emit('settings')
    expect(wrapper.emitted()).toHaveProperty('settings')
    expect(wrapper.emitted('settings')).toHaveLength(1)
  })

  it('emits logout event when TTopBar emits logout', async () => {
    const wrapper = mount(TAppLayout)
    const topBar = wrapper.findComponent({ name: 'TTopBar' })
    
    await topBar.vm.$emit('logout')
    expect(wrapper.emitted()).toHaveProperty('logout')
    expect(wrapper.emitted('logout')).toHaveLength(1)
  })

  it('emits menu-item-click event when TTopBar emits menu-item-click', async () => {
    const wrapper = mount(TAppLayout)
    const topBar = wrapper.findComponent({ name: 'TTopBar' })
    const menuItem = { id: 'test', label: 'Test', icon: 'star' }
    
    await topBar.vm.$emit('menu-item-click', menuItem)
    expect(wrapper.emitted()).toHaveProperty('menu-item-click')
    expect(wrapper.emitted('menu-item-click')).toHaveLength(1)
    expect(wrapper.emitted('menu-item-click')[0]).toEqual([menuItem])
  })

  it('renders top-bar-center slot content', () => {
    const wrapper = mount(TAppLayout, {
      slots: {
        'top-bar-center': '<span>Center content</span>'
      }
    })
    
    expect(wrapper.html()).toContain('<span>Center content</span>')
  })

  it('renders top-bar-actions slot content', () => {
    const wrapper = mount(TAppLayout, {
      slots: {
        'top-bar-actions': '<button>Action</button>'
      }
    })
    
    expect(wrapper.html()).toContain('<button>Action</button>')
  })

  it('renders footer when footer slot is provided', () => {
    const wrapper = mount(TAppLayout, {
      slots: {
        footer: '<div class="footer-content">Footer</div>'
      }
    })
    
    expect(wrapper.find('.app-layout__footer').exists()).toBe(true)
    expect(wrapper.text()).toContain('Footer')
  })

  it('does not render footer when footer slot is empty', () => {
    const wrapper = mount(TAppLayout)
    expect(wrapper.find('.app-layout__footer').exists()).toBe(false)
  })

  it('applies correct default props', () => {
    const wrapper = mount(TAppLayout)
    const topBar = wrapper.findComponent({ name: 'TTopBar' })
    
    expect(topBar.props('showBackButton')).toBe(false)
    expect(topBar.props('backButtonLabel')).toBe('Back')
    expect(topBar.props('showUserInfo')).toBe(true)
    expect(topBar.props('showOnlineStatus')).toBe(true)
    expect(topBar.props('isUserOnline')).toBe(true)
    expect(topBar.props('isLoading')).toBe(false)
  })

  it('maintains correct component structure', () => {
    const wrapper = mount(TAppLayout, {
      slots: {
        default: '<p>Content</p>',
        footer: '<p>Footer</p>'
      }
    })
    
    const layout = wrapper.find('.app-layout')
    expect(layout.exists()).toBe(true)
    
    const header = layout.find('.app-layout__header')
    const content = layout.find('.app-layout__content')
    const footer = layout.find('.app-layout__footer')
    
    expect(header.exists()).toBe(true)
    expect(content.exists()).toBe(true)
    expect(footer.exists()).toBe(true)
  })
})