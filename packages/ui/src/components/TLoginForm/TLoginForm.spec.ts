import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import TLoginForm from './TLoginForm.vue'

// Mock the auth store
const mockAuthStore = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPassword: vi.fn(),
  signInWithOAuth: vi.fn()
}

vi.mock('@tiko/core', () => ({
  useAuthStore: () => mockAuthStore
}))

// Mock child components
vi.mock('../TForm/TForm.vue', () => ({
  default: {
    name: 'TForm',
    template: '<form class="t-form"><slot /></form>',
    props: ['modelValue', 'disabled'],
    emits: ['update:modelValue', 'submit']
  }
}))

vi.mock('../TForm/inputs/TInputText/TInputText.vue', () => ({
  default: {
    name: 'TInputText',
    template: '<input class="t-input-text" />',
    props: ['modelValue', 'label', 'placeholder', 'type', 'required', 'disabled', 'error'],
    emits: ['update:modelValue']
  }
}))

vi.mock('../TButton/TButton.vue', () => ({
  default: {
    name: 'TButton',
    template: '<button class="t-button"><slot /></button>',
    props: ['type', 'color', 'size', 'disabled', 'loading', 'full']
  }
}))

vi.mock('../TSSOButton/TSSOButton.vue', () => ({
  default: {
    name: 'TSSOButton',
    template: '<button class="t-sso-button"><slot /></button>',
    props: ['provider', 'disabled', 'loading']
  }
}))

vi.mock('../TAlert/TAlert.vue', () => ({
  default: {
    name: 'TAlert',
    template: '<div class="t-alert"><slot /></div>',
    props: ['type', 'dismissible']
  }
}))

describe('TLoginForm.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly in login mode', () => {
    const wrapper = mount(TLoginForm, {
      props: {
        appId: 'test-app'
      }
    })
    
    expect(wrapper.html()).toBeTruthy()
    expect(wrapper.find('.login-form').exists()).toBe(true)
    expect(wrapper.text()).toContain('Sign In')
  })

  it('shows email and password fields in login mode', () => {
    const wrapper = mount(TLoginForm, {
      props: {
        appId: 'test-app'
      }
    })
    
    const inputs = wrapper.findAllComponents({ name: 'TInputText' })
    expect(inputs).toHaveLength(2)
    
    expect(inputs[0].props('label')).toBe('Email')
    expect(inputs[0].props('type')).toBe('email')
    expect(inputs[1].props('label')).toBe('Password')
    expect(inputs[1].props('type')).toBe('password')
  })

  it('switches to signup mode when signup link is clicked', async () => {
    const wrapper = mount(TLoginForm, {
      props: {
        appId: 'test-app'
      }
    })
    
    expect(wrapper.text()).toContain('Sign In')
    
    // Find and click the signup link
    const signupLink = wrapper.find('a[href="#"]')
    await signupLink.trigger('click')
    
    expect(wrapper.text()).toContain('Sign Up')
  })

  it('shows error message when error prop is provided', () => {
    const wrapper = mount(TLoginForm, {
      props: {
        appId: 'test-app',
        error: 'Invalid credentials'
      }
    })
    
    const alert = wrapper.findComponent({ name: 'TAlert' })
    expect(alert.exists()).toBe(true)
    expect(alert.props('type')).toBe('error')
    expect(alert.text()).toContain('Invalid credentials')
  })

  it('shows loading state when isLoading is true', () => {
    const wrapper = mount(TLoginForm, {
      props: {
        appId: 'test-app',
        isLoading: true
      }
    })
    
    const button = wrapper.findComponent({ name: 'TButton' })
    expect(button.props('loading')).toBe(true)
    expect(button.props('disabled')).toBe(true)
  })

  it('disables form when isLoading is true', () => {
    const wrapper = mount(TLoginForm, {
      props: {
        appId: 'test-app',
        isLoading: true
      }
    })
    
    const form = wrapper.findComponent({ name: 'TForm' })
    expect(form.props('disabled')).toBe(true)
    
    const inputs = wrapper.findAllComponents({ name: 'TInputText' })
    inputs.forEach(input => {
      expect(input.props('disabled')).toBe(true)
    })
  })

  it('calls signInWithPassword on form submission in login mode', async () => {
    mockAuthStore.signInWithPassword.mockResolvedValue({ user: { id: 'user-123' } })
    
    const wrapper = mount(TLoginForm, {
      props: {
        appId: 'test-app'
      }
    })
    
    // Set form values
    const inputs = wrapper.findAllComponents({ name: 'TInputText' })
    await inputs[0].vm.$emit('update:modelValue', 'test@example.com')
    await inputs[1].vm.$emit('update:modelValue', 'password123')
    
    // Submit form
    const form = wrapper.findComponent({ name: 'TForm' })
    await form.vm.$emit('submit')
    
    expect(mockAuthStore.signInWithPassword).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('calls signUp on form submission in signup mode', async () => {
    mockAuthStore.signUp.mockResolvedValue({ user: { id: 'user-123' } })
    
    const wrapper = mount(TLoginForm, {
      props: {
        appId: 'test-app'
      }
    })
    
    // Switch to signup mode
    const signupLink = wrapper.find('a[href="#"]')
    await signupLink.trigger('click')
    
    // Set form values
    const inputs = wrapper.findAllComponents({ name: 'TInputText' })
    await inputs[0].vm.$emit('update:modelValue', 'test@example.com')
    await inputs[1].vm.$emit('update:modelValue', 'password123')
    
    // Submit form
    const form = wrapper.findComponent({ name: 'TForm' })
    await form.vm.$emit('submit')
    
    expect(mockAuthStore.signUp).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('emits success event on successful login', async () => {
    const user = { id: 'user-123', email: 'test@example.com' }
    mockAuthStore.signInWithPassword.mockResolvedValue({ user })
    
    const wrapper = mount(TLoginForm, {
      props: {
        appId: 'test-app'
      }
    })
    
    // Set form values and submit
    const inputs = wrapper.findAllComponents({ name: 'TInputText' })
    await inputs[0].vm.$emit('update:modelValue', 'test@example.com')
    await inputs[1].vm.$emit('update:modelValue', 'password123')
    
    const form = wrapper.findComponent({ name: 'TForm' })
    await form.vm.$emit('submit')
    
    expect(wrapper.emitted('success')).toBeTruthy()
    expect(wrapper.emitted('success')[0]).toEqual([user])
  })

  it('emits error event on failed login', async () => {
    const error = new Error('Invalid credentials')
    mockAuthStore.signInWithPassword.mockRejectedValue(error)
    
    const wrapper = mount(TLoginForm, {
      props: {
        appId: 'test-app'
      }
    })
    
    // Set form values and submit
    const inputs = wrapper.findAllComponents({ name: 'TInputText' })
    await inputs[0].vm.$emit('update:modelValue', 'test@example.com')
    await inputs[1].vm.$emit('update:modelValue', 'password123')
    
    const form = wrapper.findComponent({ name: 'TForm' })
    await form.vm.$emit('submit')
    
    expect(wrapper.emitted('error')).toBeTruthy()
    expect(wrapper.emitted('error')[0]).toEqual([error.message])
  })

  it('shows SSO buttons when available', () => {
    const wrapper = mount(TLoginForm, {
      props: {
        appId: 'test-app'
      }
    })
    
    const ssoButtons = wrapper.findAllComponents({ name: 'TSSOButton' })
    expect(ssoButtons.length).toBeGreaterThan(0)
  })

  it('handles SSO login correctly', async () => {
    const user = { id: 'user-123', email: 'test@example.com' }
    mockAuthStore.signInWithOAuth.mockResolvedValue({ user })
    
    const wrapper = mount(TLoginForm, {
      props: {
        appId: 'test-app'
      }
    })
    
    const ssoButton = wrapper.findComponent({ name: 'TSSOButton' })
    await ssoButton.vm.$emit('click')
    
    expect(mockAuthStore.signInWithOAuth).toHaveBeenCalled()
  })

  it('validates email format', async () => {
    const wrapper = mount(TLoginForm, {
      props: {
        appId: 'test-app'
      }
    })
    
    const emailInput = wrapper.findAllComponents({ name: 'TInputText' })[0]
    await emailInput.vm.$emit('update:modelValue', 'invalid-email')
    
    const form = wrapper.findComponent({ name: 'TForm' })
    await form.vm.$emit('submit')
    
    expect(mockAuthStore.signInWithPassword).not.toHaveBeenCalled()
  })

  it('validates password length', async () => {
    const wrapper = mount(TLoginForm, {
      props: {
        appId: 'test-app'
      }
    })
    
    const inputs = wrapper.findAllComponents({ name: 'TInputText' })
    await inputs[0].vm.$emit('update:modelValue', 'test@example.com')
    await inputs[1].vm.$emit('update:modelValue', '123') // Too short
    
    const form = wrapper.findComponent({ name: 'TForm' })
    await form.vm.$emit('submit')
    
    expect(mockAuthStore.signInWithPassword).not.toHaveBeenCalled()
  })

  it('shows forgot password link in login mode', () => {
    const wrapper = mount(TLoginForm, {
      props: {
        appId: 'test-app'
      }
    })
    
    expect(wrapper.text()).toContain('Forgot Password?')
  })

  it('handles forgot password flow', async () => {
    mockAuthStore.resetPassword.mockResolvedValue({})
    
    const wrapper = mount(TLoginForm, {
      props: {
        appId: 'test-app'
      }
    })
    
    // Click forgot password link
    const forgotLink = wrapper.find('a[href="#forgot"]')
    await forgotLink.trigger('click')
    
    // Enter email and submit
    const emailInput = wrapper.findComponent({ name: 'TInputText' })
    await emailInput.vm.$emit('update:modelValue', 'test@example.com')
    
    const form = wrapper.findComponent({ name: 'TForm' })
    await form.vm.$emit('submit')
    
    expect(mockAuthStore.resetPassword).toHaveBeenCalledWith('test@example.com')
  })

  it('applies correct CSS classes', () => {
    const wrapper = mount(TLoginForm, {
      props: {
        appId: 'test-app'
      }
    })
    
    expect(wrapper.find('.login-form').exists()).toBe(true)
  })

  it('shows different titles for different modes', async () => {
    const wrapper = mount(TLoginForm, {
      props: {
        appId: 'test-app'
      }
    })
    
    expect(wrapper.text()).toContain('Sign In')
    
    // Switch to signup
    const signupLink = wrapper.find('a[href="#"]')
    await signupLink.trigger('click')
    
    expect(wrapper.text()).toContain('Sign Up')
  })
})