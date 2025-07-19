import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import TTopBar from './TTopBar.vue'

// Mock the stores
const mockAuthStore = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'John Doe',
      avatar_url: 'https://example.com/avatar.jpg'
    }
  }
}

const mockAppStore = {
  isOnline: true
}

vi.mock('@tiko/core', () => ({
  useAuthStore: () => mockAuthStore,
  useAppStore: () => mockAppStore
}))

// Mock composables
vi.mock('../../composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    keys: {
      common: {
        back: 'common.back',
        profile: 'common.profile',
        settings: 'common.settings',
        logout: 'common.logout'
      }
    }
  })
}))

vi.mock('../../composables/useParentMode', () => ({
  useParentMode: () => ({
    isUnlocked: { value: false },
    hasPermission: vi.fn().mockReturnValue(true)
  })
}))

// Mock popupService
const mockPopupService = {
  open: vi.fn()
}

// Provide popupService in global
const global = {
  provide: {
    popupService: mockPopupService
  }
}

// Mock child components
vi.mock('../TButton/TButton.vue', () => ({
  default: {
    name: 'TButton',
    template: '<button class="t-button"><slot /></button>',
    props: ['type', 'size', 'color', 'icon', 'disabled'],
    emits: ['click']
  }
}))

vi.mock('../TIcon/TIcon.vue', () => ({
  default: {
    name: 'TIcon',
    template: '<i class="t-icon"></i>',
    props: ['name', 'size']
  }
}))

vi.mock('../TContextMenu/TContextMenu.vue', () => ({
  default: {
    name: 'TContextMenu',
    template: '<div class="t-context-menu"><slot /></div>',
    props: ['items', 'position'],
    emits: ['item-click']
  }
}))

vi.mock('../TParentMode/TParentModeToggle.vue', () => ({
  default: {
    name: 'TParentModeToggle',
    template: '<div class="t-parent-mode-toggle"></div>',
    props: ['appName']
  }
}))

vi.mock('../TSpinner/TSpinner.vue', () => ({
  default: {
    name: 'TSpinner',
    template: '<div class="t-spinner"></div>',
    props: ['size', 'color']
  }
}))

describe('TTopBar.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPopupService.open.mockClear()
  })

  const createWrapper = (props = {}) => {
    return mount(TTopBar, {
      props,
      global: {
        provide: {
          popupService: mockPopupService
        }
    })
  }

  it('renders correctly with basic props', () => {
    const wrapper = createWrapper({
      title: 'Test App',
      appName: 'test-app'
    })
    
    expect(wrapper.html()).toBeTruthy()
    expect(wrapper.find('.top-bar').exists()).toBe(true)
    expect(wrapper.find('.top-bar__title').text()).toBe('Test App')
  })

  it('displays subtitle when provided', () => {
    const wrapper = createWrapper({
        title: 'Test App',
        subtitle: 'Test Subtitle',
        appName: 'test-app'
    })
    
    expect(wrapper.find('.top-bar__subtitle').text()).toBe('Test Subtitle')
  })

  it('shows back button when showBackButton is true', () => {
    const wrapper = createWrapper({
        title: 'Test App',
        showBackButton: true,
        appName: 'test-app'
    })
    
    const backButton = wrapper.find('.top-bar__back')
    expect(backButton.exists()).toBe(true)
  })

  it('hides back button when showBackButton is false', () => {
    const wrapper = createWrapper({
        title: 'Test App',
        showBackButton: false,
        appName: 'test-app'
    })
    
    const backButton = wrapper.find('.top-bar__back')
    expect(backButton.exists()).toBe(false)
  })

  it('emits back event when back button is clicked', async () => {
    const wrapper = createWrapper({
        title: 'Test App',
        showBackButton: true,
        appName: 'test-app'
    })
    
    const backButton = wrapper.findComponent({ name: 'TButton' })
    await backButton.trigger('click')
    
    expect(wrapper.emitted('back')).toBeTruthy()
    expect(wrapper.emitted('back')).toHaveLength(1)
  })

  it('uses custom back button label', () => {
    const wrapper = createWrapper({
        title: 'Test App',
        showBackButton: true,
        backButtonLabel: 'Go Back',
        appName: 'test-app'
    })
    
    const backButton = wrapper.findComponent({ name: 'TButton' })
    expect(backButton.text()).toBe('Go Back')
  })

  it('shows user info when showUserInfo is true', () => {
    const wrapper = createWrapper({
        title: 'Test App',
        showUserInfo: true,
        appName: 'test-app'
    })
    
    expect(wrapper.find('.top-bar__user').exists()).toBe(true)
    expect(wrapper.find('.top-bar__user-avatar').exists()).toBe(true)
  })

  it('hides user info when showUserInfo is false', () => {
    const wrapper = createWrapper({
        title: 'Test App',
        showUserInfo: false,
        appName: 'test-app'
    })
    
    expect(wrapper.find('.top-bar__user').exists()).toBe(false)
  })

  it('displays user avatar when available', () => {
    const wrapper = createWrapper({
        title: 'Test App',
        showUserInfo: true,
        appName: 'test-app'
    })
    
    const avatar = wrapper.find('.top-bar__user-avatar img')
    expect(avatar.exists()).toBe(true)
    expect(avatar.attributes('src')).toBe('https://example.com/avatar.jpg')
  })

  it('shows user initials when no avatar is available', () => {
    mockAuthStore.user.user_metadata.avatar_url = null
    
    const wrapper = createWrapper({
        title: 'Test App',
        showUserInfo: true,
        appName: 'test-app'
    })
    
    const avatar = wrapper.find('.top-bar__user-avatar')
    expect(avatar.text()).toBe('JD') // John Doe initials
  })

  it('shows online status when showOnlineStatus is true', () => {
    const wrapper = createWrapper({
        title: 'Test App',
        showOnlineStatus: true,
        appName: 'test-app'
    })
    
    expect(wrapper.find('.top-bar__status').exists()).toBe(true)
  })

  it('applies correct online status styling', () => {
    const wrapper = createWrapper({
        title: 'Test App',
        showOnlineStatus: true,
        isUserOnline: true,
        appName: 'test-app'
    })
    
    const status = wrapper.find('.top-bar__status')
    expect(status.classes()).toContain('top-bar__status--online')
  })

  it('applies correct offline status styling', () => {
    const wrapper = createWrapper({
        title: 'Test App',
        showOnlineStatus: true,
        isUserOnline: false,
        appName: 'test-app'
    })
    
    const status = wrapper.find('.top-bar__status')
    expect(status.classes()).toContain('top-bar__status--offline')
  })

  it('shows loading spinner when isLoading is true', () => {
    const wrapper = createWrapper({
        title: 'Test App',
        isLoading: true,
        appName: 'test-app'
    })
    
    expect(wrapper.findComponent({ name: 'TSpinner' }).exists()).toBe(true)
  })

  it('hides loading spinner when isLoading is false', () => {
    const wrapper = createWrapper({
        title: 'Test App',
        isLoading: false,
        appName: 'test-app'
    })
    
    expect(wrapper.findComponent({ name: 'TSpinner' }).exists()).toBe(false)
  })

  it('shows parent mode toggle when appropriate', () => {
    const wrapper = createWrapper({
        title: 'Test App',
        appName: 'test-app'
    })
    
    expect(wrapper.findComponent({ name: 'TParentModeToggle' }).exists()).toBe(true)
  })

  it('shows context menu with user actions', () => {
    const wrapper = createWrapper({
        title: 'Test App',
        showUserInfo: true,
        appName: 'test-app'
    })
    
    expect(wrapper.findComponent({ name: 'TContextMenu' }).exists()).toBe(true)
  })

  it('includes custom menu items in context menu', () => {
    const customItems = [
      { id: 'custom', label: 'Custom Action', icon: 'star' }
    ]
    
    const wrapper = createWrapper({
        title: 'Test App',
        customMenuItems: customItems,
        appName: 'test-app'
    })
    
    const contextMenu = wrapper.findComponent({ name: 'TContextMenu' })
    const menuItems = contextMenu.props('items')
    expect(menuItems).toContainEqual(expect.objectContaining({
      id: 'custom',
      label: 'Custom Action',
      icon: 'star'
    }))
  })

  it('emits profile event when profile menu item is clicked', async () => {
    const wrapper = createWrapper({
        title: 'Test App',
        showUserInfo: true,
        appName: 'test-app'
    })
    
    const contextMenu = wrapper.findComponent({ name: 'TContextMenu' })
    await contextMenu.vm.$emit('item-click', { id: 'profile' })
    
    expect(wrapper.emitted('profile')).toBeTruthy()
  })

  it('emits settings event when settings menu item is clicked', async () => {
    const wrapper = createWrapper({
        title: 'Test App',
        showUserInfo: true,
        appName: 'test-app'
    })
    
    const contextMenu = wrapper.findComponent({ name: 'TContextMenu' })
    await contextMenu.vm.$emit('item-click', { id: 'settings' })
    
    expect(wrapper.emitted('settings')).toBeTruthy()
  })

  it('emits logout event when logout menu item is clicked', async () => {
    const wrapper = createWrapper({
        title: 'Test App',
        showUserInfo: true,
        appName: 'test-app'
    })
    
    const contextMenu = wrapper.findComponent({ name: 'TContextMenu' })
    await contextMenu.vm.$emit('item-click', { id: 'logout' })
    
    expect(wrapper.emitted('logout')).toBeTruthy()
  })

  it('emits menu-item-click event for custom menu items', async () => {
    const customItems = [
      { id: 'custom', label: 'Custom Action', icon: 'star' }
    ]
    
    const wrapper = createWrapper({
        title: 'Test App',
        customMenuItems: customItems,
        appName: 'test-app'
    })
    
    const contextMenu = wrapper.findComponent({ name: 'TContextMenu' })
    await contextMenu.vm.$emit('item-click', { id: 'custom' })
    
    expect(wrapper.emitted('menu-item-click')).toBeTruthy()
    expect(wrapper.emitted('menu-item-click')[0]).toEqual([{ id: 'custom' }])
  })

  it('renders center slot content', () => {
    const wrapper = createWrapper({
        title: 'Test App',
        appName: 'test-app'
      },
      slots: {
        center: '<div class="custom-center">Center Content</div>'
    })
    
    expect(wrapper.html()).toContain('<div class="custom-center">Center Content</div>')
  })

  it('renders actions slot content', () => {
    const wrapper = createWrapper({
        title: 'Test App',
        appName: 'test-app'
      },
      slots: {
        actions: '<button class="custom-action">Action</button>'
    })
    
    expect(wrapper.html()).toContain('<button class="custom-action">Action</button>')
  })

  it('applies correct CSS classes structure', () => {
    const wrapper = createWrapper({
        title: 'Test App',
        appName: 'test-app'
    })
    
    expect(wrapper.find('.top-bar').exists()).toBe(true)
    expect(wrapper.find('.top-bar__left').exists()).toBe(true)
    expect(wrapper.find('.top-bar__center').exists()).toBe(true)
    expect(wrapper.find('.top-bar__right').exists()).toBe(true)
  })

  it('generates consistent avatar color based on user email', () => {
    mockAuthStore.user.user_metadata.avatar_url = null
    
    const wrapper = createWrapper({
        title: 'Test App',
        showUserInfo: true,
        appName: 'test-app'
    })
    
    const avatar = wrapper.find('.top-bar__user-avatar')
    expect(avatar.attributes('style')).toContain('background-color')
  })

  it('handles user without metadata gracefully', () => {
    mockAuthStore.user.user_metadata = null
    
    const wrapper = createWrapper({
        title: 'Test App',
        showUserInfo: true,
        appName: 'test-app'
    })
    
    expect(wrapper.find('.top-bar__user').exists()).toBe(true)
    const avatar = wrapper.find('.top-bar__user-avatar')
    expect(avatar.text()).toBe('??') // Default initials
  })

  it('applies loading class when loading', () => {
    const wrapper = createWrapper({
        title: 'Test App',
        isLoading: true,
        appName: 'test-app'
    })
    
    expect(wrapper.find('.top-bar').classes()).toContain('top-bar--loading')
  })

  it('maintains responsive design', () => {
    const wrapper = createWrapper({
        title: 'Test App',
        appName: 'test-app'
    })
    
    expect(wrapper.find('.top-bar').classes()).toContain('top-bar--responsive')
  })
})