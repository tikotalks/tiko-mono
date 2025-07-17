import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import TToast from './TToast.vue'

// Mock the toast service
const mockToasts = [
  {
    id: '1',
    type: 'success',
    title: 'Success',
    message: 'Operation completed successfully',
    duration: 3000,
    actions: [],
    persistent: false
  },
  {
    id: '2',
    type: 'error',
    title: 'Error',
    message: 'Something went wrong',
    duration: 5000,
    actions: [{ label: 'Retry', action: vi.fn() }],
    persistent: false
  }
]

const mockToastService = {
  toasts: mockToasts,
  show: vi.fn(),
  hide: vi.fn(),
  clear: vi.fn()
}

vi.mock('./TToast.service', () => ({
  toastService: mockToastService
}))

// Mock child components
vi.mock('../TIcon/TIcon.vue', () => ({
  default: {
    name: 'TIcon',
    template: '<i class="t-icon"></i>',
    props: ['name', 'size']
  }
}))

vi.mock('../TButton/TButton.vue', () => ({
  default: {
    name: 'TButton',
    template: '<button class="t-button"><slot /></button>',
    props: ['type', 'size', 'color'],
    emits: ['click']
  }
}))

describe('TToast.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders correctly with toast messages', () => {
    const wrapper = mount(TToast)
    
    expect(wrapper.html()).toBeTruthy()
    expect(wrapper.find('.toast-container').exists()).toBe(true)
    expect(wrapper.findAll('.toast')).toHaveLength(2)
  })

  it('displays toast with correct type styling', () => {
    const wrapper = mount(TToast)
    
    const toasts = wrapper.findAll('.toast')
    expect(toasts[0].classes()).toContain('toast--success')
    expect(toasts[1].classes()).toContain('toast--error')
  })

  it('displays toast title and message', () => {
    const wrapper = mount(TToast)
    
    const toasts = wrapper.findAll('.toast')
    expect(toasts[0].text()).toContain('Success')
    expect(toasts[0].text()).toContain('Operation completed successfully')
    expect(toasts[1].text()).toContain('Error')
    expect(toasts[1].text()).toContain('Something went wrong')
  })

  it('shows correct icon for each toast type', () => {
    const wrapper = mount(TToast)
    
    const icons = wrapper.findAllComponents({ name: 'TIcon' })
    expect(icons.length).toBeGreaterThan(0)
    
    // Success toast should have success icon
    expect(icons[0].props('name')).toBe('check-circle')
    
    // Error toast should have error icon
    expect(icons[1].props('name')).toBe('x-circle')
  })

  it('displays action buttons when provided', () => {
    const wrapper = mount(TToast)
    
    const actionButtons = wrapper.findAllComponents({ name: 'TButton' })
    const retryButton = actionButtons.find(btn => btn.text() === 'Retry')
    expect(retryButton).toBeDefined()
  })

  it('calls action function when action button is clicked', async () => {
    const wrapper = mount(TToast)
    
    const actionButtons = wrapper.findAllComponents({ name: 'TButton' })
    const retryButton = actionButtons.find(btn => btn.text() === 'Retry')
    
    await retryButton.trigger('click')
    
    expect(mockToasts[1].actions[0].action).toHaveBeenCalled()
  })

  it('shows close button for each toast', () => {
    const wrapper = mount(TToast)
    
    const closeButtons = wrapper.findAll('.toast__close')
    expect(closeButtons).toHaveLength(2)
  })

  it('hides toast when close button is clicked', async () => {
    const wrapper = mount(TToast)
    
    const closeButton = wrapper.find('.toast__close')
    await closeButton.trigger('click')
    
    expect(mockToastService.hide).toHaveBeenCalledWith('1')
  })

  it('auto-hides toast after duration', async () => {
    const wrapper = mount(TToast)
    
    // Fast forward time beyond first toast duration
    vi.advanceTimersByTime(3000)
    await wrapper.vm.$nextTick()
    
    expect(mockToastService.hide).toHaveBeenCalledWith('1')
  })

  it('does not auto-hide persistent toasts', async () => {
    const persistentToast = {
      ...mockToasts[0],
      persistent: true
    }
    mockToastService.toasts = [persistentToast]
    
    const wrapper = mount(TToast)
    
    vi.advanceTimersByTime(5000)
    await wrapper.vm.$nextTick()
    
    expect(mockToastService.hide).not.toHaveBeenCalled()
  })

  it('applies correct CSS classes for positioning', () => {
    const wrapper = mount(TToast)
    
    const container = wrapper.find('.toast-container')
    expect(container.classes()).toContain('toast-container--top-right')
  })

  it('handles different toast positions', () => {
    const wrapper = mount(TToast, {
      props: {
        position: 'bottom-left'
      }
    })
    
    const container = wrapper.find('.toast-container')
    expect(container.classes()).toContain('toast-container--bottom-left')
  })

  it('limits maximum number of toasts displayed', () => {
    const manyToasts = Array.from({ length: 10 }, (_, i) => ({
      id: `toast-${i}`,
      type: 'info',
      title: `Toast ${i}`,
      message: `Message ${i}`,
      duration: 3000,
      actions: [],
      persistent: false
    }))
    
    mockToastService.toasts = manyToasts
    
    const wrapper = mount(TToast, {
      props: {
        maxToasts: 5
      }
    })
    
    expect(wrapper.findAll('.toast')).toHaveLength(5)
  })

  it('shows newest toasts first', () => {
    const wrapper = mount(TToast)
    
    const toasts = wrapper.findAll('.toast')
    expect(toasts[0].text()).toContain('Success')
    expect(toasts[1].text()).toContain('Error')
  })

  it('applies enter and leave transitions', () => {
    const wrapper = mount(TToast)
    
    const transitionGroup = wrapper.find('.toast-container')
    expect(transitionGroup.exists()).toBe(true)
  })

  it('handles toast without title', () => {
    const toastWithoutTitle = {
      id: '3',
      type: 'info',
      message: 'Just a message',
      duration: 3000,
      actions: [],
      persistent: false
    }
    
    mockToastService.toasts = [toastWithoutTitle]
    
    const wrapper = mount(TToast)
    
    expect(wrapper.find('.toast__title').exists()).toBe(false)
    expect(wrapper.text()).toContain('Just a message')
  })

  it('handles toast without message', () => {
    const toastWithoutMessage = {
      id: '4',
      type: 'info',
      title: 'Just a title',
      duration: 3000,
      actions: [],
      persistent: false
    }
    
    mockToastService.toasts = [toastWithoutMessage]
    
    const wrapper = mount(TToast)
    
    expect(wrapper.find('.toast__message').exists()).toBe(false)
    expect(wrapper.text()).toContain('Just a title')
  })

  it('applies correct ARIA attributes', () => {
    const wrapper = mount(TToast)
    
    const toasts = wrapper.findAll('.toast')
    toasts.forEach(toast => {
      expect(toast.attributes('role')).toBe('alert')
      expect(toast.attributes('aria-live')).toBe('polite')
    })
  })

  it('handles keyboard navigation', async () => {
    const wrapper = mount(TToast)
    
    const closeButton = wrapper.find('.toast__close')
    await closeButton.trigger('keydown', { key: 'Enter' })
    
    expect(mockToastService.hide).toHaveBeenCalled()
  })

  it('clears all timers on component unmount', () => {
    const wrapper = mount(TToast)
    
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
    wrapper.unmount()
    
    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  it('updates when toast service changes', async () => {
    const wrapper = mount(TToast)
    
    // Add new toast to service
    const newToast = {
      id: '5',
      type: 'warning',
      title: 'Warning',
      message: 'This is a warning',
      duration: 4000,
      actions: [],
      persistent: false
    }
    
    mockToastService.toasts = [...mockToasts, newToast]
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.findAll('.toast')).toHaveLength(3)
    expect(wrapper.text()).toContain('Warning')
  })

  it('handles toast with HTML content safely', () => {
    const toastWithHTML = {
      id: '6',
      type: 'info',
      title: 'HTML <script>alert("xss")</script>',
      message: 'Message with <b>bold</b> text',
      duration: 3000,
      actions: [],
      persistent: false
    }
    
    mockToastService.toasts = [toastWithHTML]
    
    const wrapper = mount(TToast)
    
    // Should escape HTML to prevent XSS
    expect(wrapper.html()).not.toContain('<script>')
    expect(wrapper.text()).toContain('HTML <script>alert("xss")</script>')
  })

  it('applies correct z-index for layering', () => {
    const wrapper = mount(TToast)
    
    const container = wrapper.find('.toast-container')
    const computedStyle = getComputedStyle(container.element)
    expect(parseInt(computedStyle.zIndex)).toBeGreaterThan(1000)
  })

  it('handles empty toast list', () => {
    mockToastService.toasts = []
    
    const wrapper = mount(TToast)
    
    expect(wrapper.find('.toast-container').exists()).toBe(true)
    expect(wrapper.findAll('.toast')).toHaveLength(0)
  })
})