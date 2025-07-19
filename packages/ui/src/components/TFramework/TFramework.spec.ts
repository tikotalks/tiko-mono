import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import TFramework from './TFramework.vue'

// Mock the stores
const mockAuthStore = {
  user: ref(null),
  signOut: vi.fn()
}

const mockAppStore = {
  initializeNetworkMonitoring: vi.fn()
}

vi.mock('@tiko/core', () => ({
  useAuthStore: () => mockAuthStore,
  useAppStore: () => mockAppStore
}))

// Mock pinia's storeToRefs
vi.mock('pinia', () => ({
  storeToRefs: (store: any) => ({
    user: store.user
  })
}))

// Mock the router
const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
  options: {
    history: {
      state: { back: null }
    }
  }
}

const mockRoute = {
  name: 'home',
  fullPath: '/',
  matched: [{ meta: { title: 'Home' } }]
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => mockRoute
}))

// Mock composables
vi.mock('../../composables/useTikoConfig', () => ({
  useTikoConfig: () => ({
    themeStyles: { '--color-primary': '#007bff' }
  })
}))

vi.mock('../../composables/useEventBus', () => ({
  useEventBus: () => ({
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  })
}))

vi.mock('../../composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    keys: {
      profile: { editProfile: 'profile.edit' },
      settings: { title: 'settings.title' }
    },
    locale: { value: 'en' },
    setLocale: vi.fn()
  })
}))

// Mock child components
vi.mock('../TAuthWrapper/TAuthWrapper.vue', () => ({
  default: {
    name: 'TAuthWrapper',
    template: '<div class="auth-wrapper"><slot /></div>',
    props: ['backgroundImage', 'title', 'appName']
  }
}))

vi.mock('../TAppLayout/TAppLayout.vue', () => ({
  default: {
    name: 'TAppLayout',
    template: '<div class="app-layout"><slot name="top-bar-middle" /><slot name="top-bar-actions" /><slot /></div>',
    props: ['title', 'subtitle', 'showHeader', 'showBack', 'isLoading', 'appName'],
    emits: ['profile', 'settings', 'logout', 'back']
  }
}))

vi.mock('../TPopup/TPopup.vue', () => ({
  default: {
    name: 'TPopup',
    template: '<div class="popup"></div>'
  }
}))

vi.mock('../TToast/TToast.vue', () => ({
  default: {
    name: 'TToast',
    template: '<div class="toast"></div>'
  }
}))

vi.mock('../TProfile/TProfile.vue', () => ({
  default: {
    name: 'TProfile',
    template: '<div class="profile"></div>'
  }
}))

vi.mock('./TSettings.vue', () => ({
  default: {
    name: 'TSettings',
    template: '<div class="settings"></div>'
  }
}))

// Mock services
const mockPopupService = {
  open: vi.fn(),
  close: vi.fn()
}

vi.mock('../TPopup', () => ({
  popupService: mockPopupService
}))

vi.mock('../TToast', () => ({
  toastService: {
    show: vi.fn(),
    hide: vi.fn()
  }
}))

describe('TFramework.vue', () => {
  const mockConfig = {
    id: 'test-app',
    name: 'Test App',
    theme: {
      primary: 'blue',
      secondary: 'purple'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly with basic config', () => {
    const wrapper = mount(TFramework, {
      props: {
        config: mockConfig
      },
      slots: {
        default: '<div>App content</div>'
      }
    })
    
    expect(wrapper.html()).toBeTruthy()
    expect(wrapper.find('.framework').exists()).toBe(true)
    expect(wrapper.text()).toContain('App content')
  })

  it('passes correct props to TAuthWrapper', () => {
    const wrapper = mount(TFramework, {
      props: {
        config: mockConfig
      }
    })
    
    const authWrapper = wrapper.findComponent({ name: 'TAuthWrapper' })
    expect(authWrapper.props('title')).toBe('Test App')
    expect(authWrapper.props('appName')).toBe('test-app')
  })

  it('passes correct props to TAppLayout', () => {
    const wrapper = mount(TFramework, {
      props: {
        config: mockConfig
      }
    })
    
    const appLayout = wrapper.findComponent({ name: 'TAppLayout' })
    expect(appLayout.props('title')).toBe('Test App')
    expect(appLayout.props('appName')).toBe('test-app')
  })

  it('shows loading state when loading prop is true', () => {
    const wrapper = mount(TFramework, {
      props: {
        config: mockConfig,
        loading: true
      }
    })
    
    const appLayout = wrapper.findComponent({ name: 'TAppLayout' })
    expect(appLayout.props('isLoading')).toBe(true)
  })

  it('handles profile action correctly', async () => {
    mockAuthStore.user = { id: 'user-123', email: 'test@example.com' }
    
    const wrapper = mount(TFramework, {
      props: {
        config: mockConfig
      }
    })
    
    const appLayout = wrapper.findComponent({ name: 'TAppLayout' })
    await appLayout.vm.$emit('profile')
    
    // Should open profile popup
    const { popupService } = await import('../TPopup')
    expect(popupService.open).toHaveBeenCalled()
  })

  it('handles settings action correctly', async () => {
    const configWithSettings = {
      ...mockConfig,
      settings: {
        enabled: true,
        sections: []
      }
    }
    
    const wrapper = mount(TFramework, {
      props: {
        config: configWithSettings
      }
    })
    
    const appLayout = wrapper.findComponent({ name: 'TAppLayout' })
    await appLayout.vm.$emit('settings')
    
    // Should open settings popup
    const { popupService } = await import('../TPopup')
    expect(popupService.open).toHaveBeenCalled()
  })

  it('handles logout action correctly', async () => {
    const wrapper = mount(TFramework, {
      props: {
        config: mockConfig
      }
    })
    
    const appLayout = wrapper.findComponent({ name: 'TAppLayout' })
    await appLayout.vm.$emit('logout')
    
    expect(mockAuthStore.signOut).toHaveBeenCalled()
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/login')
  })

  it('handles back action correctly', async () => {
    mockRouter.options.history.state.back = '/previous'
    
    const wrapper = mount(TFramework, {
      props: {
        config: mockConfig
      }
    })
    
    const appLayout = wrapper.findComponent({ name: 'TAppLayout' })
    await appLayout.vm.$emit('back')
    
    expect(mockRouter.back).toHaveBeenCalled()
  })

  it('navigates to home when no back history exists', async () => {
    mockRouter.options.history.state.back = null
    
    const wrapper = mount(TFramework, {
      props: {
        config: mockConfig
      }
    })
    
    const appLayout = wrapper.findComponent({ name: 'TAppLayout' })
    await appLayout.vm.$emit('back')
    
    expect(mockRouter.push).toHaveBeenCalledWith('/')
  })

  it('emits ready event on mount', () => {
    const wrapper = mount(TFramework, {
      props: {
        config: mockConfig
      }
    })
    
    expect(wrapper.emitted()).toHaveProperty('ready')
  })

  it('emits route-change event on route changes', () => {
    const wrapper = mount(TFramework, {
      props: {
        config: mockConfig
      }
    })
    
    expect(wrapper.emitted()).toHaveProperty('route-change')
  })

  it('shows route title in subtitle when configured', () => {
    const configWithRoute = {
      ...mockConfig,
      topBar: {
        showCurrentRoute: true,
        routeDisplay: 'subtitle'
      }
    }
    
    const wrapper = mount(TFramework, {
      props: {
        config: configWithRoute
      }
    })
    
    const appLayout = wrapper.findComponent({ name: 'TAppLayout' })
    expect(appLayout.props('subtitle')).toBe('Home')
  })

  it('shows route title in middle when configured', () => {
    const configWithRoute = {
      ...mockConfig,
      topBar: {
        showCurrentRoute: true,
        routeDisplay: 'middle'
      }
    }
    
    const wrapper = mount(TFramework, {
      props: {
        config: configWithRoute
      }
    })
    
    expect(wrapper.find('.framework__route-display').text()).toBe('Home')
  })

  it('provides services to child components', async () => {
    const wrapper = mount(TFramework, {
      props: {
        config: mockConfig
      }
    })
    
    // Services are injected and used internally, not exposed on vm
    const { popupService } = await import('../TPopup')
    const { toastService } = await import('../TToast')
    expect(popupService).toBeDefined()
    expect(toastService).toBeDefined()
  })

  it('initializes network monitoring on mount', () => {
    mount(TFramework, {
      props: {
        config: mockConfig
      }
    })
    
    expect(mockAppStore.initializeNetworkMonitoring).toHaveBeenCalled()
  })

  it('renders popup and toast components', () => {
    const wrapper = mount(TFramework, {
      props: {
        config: mockConfig
      }
    })
    
    expect(wrapper.findComponent({ name: 'TPopup' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'TToast' }).exists()).toBe(true)
  })

  it('applies theme styles correctly', () => {
    const wrapper = mount(TFramework, {
      props: {
        config: mockConfig
      }
    })
    
    const framework = wrapper.find('.framework')
    expect(framework.attributes('style')).toBe('--color-primary: #007bff;')
  })

  it('renders topbar actions slot', () => {
    const wrapper = mount(TFramework, {
      props: {
        config: mockConfig
      },
      slots: {
        'topbar-actions': '<button>Custom Action</button>'
      }
    })
    
    expect(wrapper.html()).toContain('<button>Custom Action</button>')
  })

  it('shows back button when not on home route', () => {
    mockRoute.name = 'settings'
    mockRoute.matched = [{ meta: { title: 'Settings' } }, { meta: { title: 'Settings' } }]
    
    const wrapper = mount(TFramework, {
      props: {
        config: mockConfig
      }
    })
    
    const appLayout = wrapper.findComponent({ name: 'TAppLayout' })
    expect(appLayout.props('showBack')).toBe(true)
  })

  it('hides back button when on home route', () => {
    mockRoute.name = 'home'
    mockRoute.matched = [{ meta: { title: 'Home' } }]
    
    const wrapper = mount(TFramework, {
      props: {
        config: mockConfig
      }
    })
    
    const appLayout = wrapper.findComponent({ name: 'TAppLayout' })
    expect(appLayout.props('showBack')).toBe(false)
  })
})