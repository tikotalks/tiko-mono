import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TLoginForm from './TLoginForm.vue'
import type { LoginFormStep } from './TLoginForm.model'

// Mock child components
vi.mock('../TForm/TForm.vue', () => ({
  default: {
    name: 'TForm',
    template: '<form class="t-form" @submit="$emit(\'submit\', $event)"><slot /></form>',
    props: ['modelValue', 'disabled'],
    emits: ['update:modelValue', 'submit']
  }
}))

vi.mock('../TForm/inputs/TInputText/TInputText.vue', () => ({
  default: {
    name: 'TInputText',
    template: '<input class="t-input-text" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'label', 'placeholder', 'type', 'required', 'disabled', 'error', 'maxlength'],
    emits: ['update:modelValue']
  }
}))

vi.mock('../TForm/InputEmail/InputEmail.vue', () => ({
  default: {
    name: 'TInputEmail',
    template: '<input class="t-input-email" type="email" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'label', 'placeholder', 'type', 'required', 'disabled'],
    emits: ['update:modelValue']
  }
}))

vi.mock('../TButton/TButton.vue', () => ({
  default: {
    name: 'TButton',
    template: '<button class="t-button" :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>',
    props: ['type', 'color', 'size', 'disabled', 'loading', 'full', 'icon', 'label'],
    emits: ['click']
  }
}))

vi.mock('../TButton/TButtonGroup.vue', () => ({
  default: {
    name: 'TButtonGroup',
    template: '<div class="t-button-group"><slot /></div>',
    props: []
  }
}))

vi.mock('../TSSOButton/TSSOButton.vue', () => ({
  default: {
    name: 'TSSOButton',
    template: '<button class="t-sso-button"><slot /></button>',
    props: ['appId', 'appName', 'size', 'disabled'],
    emits: ['click']
  }
}))

vi.mock('../TIcon/TIcon.vue', () => ({
  default: {
    name: 'TIcon',
    template: '<span class="t-icon">{{ name }}</span>',
    props: ['name']
  }
}))

describe('TLoginForm.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Email Step', () => {
    it('renders correctly with email step', () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app'
        }
      })
      
      expect(wrapper.html()).toBeTruthy()
      expect(wrapper.find('.login-form').exists()).toBe(true)
      expect(wrapper.text()).toContain('Login to your account')
    })

    it('shows email input field in email step', () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app'
        }
      })
      
      const emailInput = wrapper.findComponent({ name: 'TInputEmail' })
      expect(emailInput.exists()).toBe(true)
      expect(emailInput.props('label')).toBe('Email Address')
      expect(emailInput.props('placeholder')).toBe('Enter your email')
    })

    it('shows Apple Sign-In button', () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app'
        }
      })
      
      const appleButton = wrapper.find('.login-form__apple-button')
      expect(appleButton.exists()).toBe(true)
      expect(appleButton.text()).toContain('Login with Apple')
    })

    it('shows SSO button when enabled and not in Tiko app', () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'radio',
          appName: 'Radio App',
          enableSSO: true
        }
      })
      
      const ssoButton = wrapper.findComponent({ name: 'TSSOButton' })
      expect(ssoButton.exists()).toBe(true)
      expect(ssoButton.props('appId')).toBe('radio')
      expect(ssoButton.props('appName')).toBe('Radio App')
    })

    it('hides SSO button when disabled', () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app',
          enableSSO: false
        }
      })
      
      const ssoButton = wrapper.findComponent({ name: 'TSSOButton' })
      expect(ssoButton.exists()).toBe(false)
    })

    it('hides SSO button for Tiko app', () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'tiko',
          enableSSO: true
        }
      })
      
      const ssoButton = wrapper.findComponent({ name: 'TSSOButton' })
      expect(ssoButton.exists()).toBe(false)
    })

    it('emits emailSubmit when form is submitted with valid email', async () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app'
        }
      })
      
      const emailInput = wrapper.findComponent({ name: 'TInputEmail' })
      await emailInput.vm.$emit('update:modelValue', 'test@example.com')
      
      const submitButton = wrapper.find('.login-form__submit-button')
      await submitButton.trigger('click')
      
      expect(wrapper.emitted('emailSubmit')).toBeTruthy()
      expect(wrapper.emitted('emailSubmit')?.[0]).toEqual(['test@example.com'])
    })

    it('does not emit emailSubmit with invalid email', async () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app'
        }
      })
      
      const emailInput = wrapper.findComponent({ name: 'TInputEmail' })
      await emailInput.vm.$emit('update:modelValue', 'invalid-email')
      
      const submitButton = wrapper.find('.login-form__submit-button')
      expect(submitButton.attributes('disabled')).toBeDefined()
      
      await submitButton.trigger('click')
      
      expect(wrapper.emitted('emailSubmit')).toBeFalsy()
    })

    it('emits appleSignIn when Apple button is clicked', async () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app'
        }
      })
      
      const appleButton = wrapper.find('.login-form__apple-button')
      await appleButton.trigger('click')
      
      expect(wrapper.emitted('appleSignIn')).toBeTruthy()
    })

    it('switches to register mode when register link is clicked', async () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app'
        }
      })
      
      expect(wrapper.text()).toContain('Login to your account')
      
      const registerLink = wrapper.find('.login-form__register-link')
      await registerLink.trigger('click')
      
      expect(wrapper.text()).toContain('Create your account')
    })

    it('disables inputs when isLoading is true', () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app',
          isLoading: true
        }
      })
      
      const emailInput = wrapper.findComponent({ name: 'TInputEmail' })
      expect(emailInput.props('disabled')).toBe(true)
      
      const submitButton = wrapper.find('.login-form__submit-button')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })
  })

  describe('Verification Step', () => {
    it('shows verification step after email submission', async () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app'
        }
      })
      
      // Submit email
      const emailInput = wrapper.findComponent({ name: 'TInputEmail' })
      await emailInput.vm.$emit('update:modelValue', 'test@example.com')
      
      const submitButton = wrapper.find('.login-form__submit-button')
      await submitButton.trigger('click')
      
      // Check verification step
      expect(wrapper.text()).toContain('We\'ve sent you an email with two options:')
      expect(wrapper.text()).toContain('test@example.com')
      expect(wrapper.text()).toContain('Option 1: Click the magic link in your email')
      expect(wrapper.text()).toContain('Option 2: Enter the 6-digit code below')
    })

    it('shows verification code input', async () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app'
        }
      })
      
      // Move to verification step
      const emailInput = wrapper.findComponent({ name: 'TInputEmail' })
      await emailInput.vm.$emit('update:modelValue', 'test@example.com')
      const submitButton = wrapper.find('.login-form__submit-button')
      await submitButton.trigger('click')
      
      const codeInput = wrapper.findComponent({ name: 'TInputText' })
      expect(codeInput.exists()).toBe(true)
      expect(codeInput.props('label')).toBe('Verification Code')
      expect(codeInput.props('placeholder')).toBe('Enter 6-digit code')
      expect(codeInput.props('maxlength')).toBe(6)
    })

    it('emits verificationSubmit with valid code', async () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app'
        }
      })
      
      // Move to verification step
      const emailInput = wrapper.findComponent({ name: 'TInputEmail' })
      await emailInput.vm.$emit('update:modelValue', 'test@example.com')
      const submitButton = wrapper.find('.login-form__submit-button')
      await submitButton.trigger('click')
      
      // Enter verification code
      const codeInput = wrapper.findComponent({ name: 'TInputText' })
      await codeInput.vm.$emit('update:modelValue', '123456')
      
      // Submit verification form by clicking the button
      const verifyButton = wrapper.findAll('.login-form__submit-button')[0]
      await verifyButton.trigger('click')
      
      expect(wrapper.emitted('verificationSubmit')).toBeTruthy()
      expect(wrapper.emitted('verificationSubmit')?.[0]).toEqual(['test@example.com', '123456'])
    })

    it('does not emit verificationSubmit with invalid code', async () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app'
        }
      })
      
      // Move to verification step
      const emailInput = wrapper.findComponent({ name: 'TInputEmail' })
      await emailInput.vm.$emit('update:modelValue', 'test@example.com')
      const submitButton = wrapper.find('.login-form__submit-button')
      await submitButton.trigger('click')
      
      // Enter invalid code
      const codeInput = wrapper.findComponent({ name: 'TInputText' })
      await codeInput.vm.$emit('update:modelValue', '12345') // Too short
      
      const verifyButton = wrapper.find('.login-form__submit-button')
      expect(verifyButton.attributes('disabled')).toBeDefined()
    })

    it('shows resend code button with cooldown', async () => {
      vi.useFakeTimers()
      
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app'
        }
      })
      
      // Move to verification step
      const emailInput = wrapper.findComponent({ name: 'TInputEmail' })
      await emailInput.vm.$emit('update:modelValue', 'test@example.com')
      const submitButton = wrapper.find('.login-form__submit-button')
      await submitButton.trigger('click')
      
      const resendButton = wrapper.findAll('.login-form__action-link')[0]
      expect(resendButton.text()).toContain('Resend in 60s')
      expect(resendButton.attributes('disabled')).toBeDefined()
      
      // Fast forward time
      vi.advanceTimersByTime(60000)
      await wrapper.vm.$nextTick()
      
      expect(resendButton.text()).toContain('Didn\'t receive code? Resend')
      expect(resendButton.attributes('disabled')).toBeUndefined()
      
      vi.useRealTimers()
    })

    it('emits resendCode when resend button is clicked', async () => {
      vi.useFakeTimers()
      
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app'
        }
      })
      
      // Move to verification step
      const emailInput = wrapper.findComponent({ name: 'TInputEmail' })
      await emailInput.vm.$emit('update:modelValue', 'test@example.com')
      const submitButton = wrapper.find('.login-form__submit-button')
      await submitButton.trigger('click')
      
      // Wait for cooldown
      vi.advanceTimersByTime(60000)
      await wrapper.vm.$nextTick()
      
      const resendButton = wrapper.findAll('.login-form__action-link')[0]
      await resendButton.trigger('click')
      
      expect(wrapper.emitted('resendCode')).toBeTruthy()
      expect(wrapper.emitted('resendCode')?.[0]).toEqual(['test@example.com'])
      
      vi.useRealTimers()
    })

    it('allows going back to email step', async () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app'
        }
      })
      
      // Move to verification step
      const emailInput = wrapper.findComponent({ name: 'TInputEmail' })
      await emailInput.vm.$emit('update:modelValue', 'test@example.com')
      const submitButton = wrapper.find('.login-form__submit-button')
      await submitButton.trigger('click')
      
      const backButton = wrapper.findAll('.login-form__action-link')[1]
      expect(backButton.text()).toContain('Use different email')
      
      await backButton.trigger('click')
      
      expect(wrapper.text()).toContain('Login to your account')
    })
  })

  describe('Register Step', () => {
    it('shows register form when switching to register mode', async () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app'
        }
      })
      
      const registerLink = wrapper.find('.login-form__register-link')
      await registerLink.trigger('click')
      
      expect(wrapper.text()).toContain('Create your account')
      
      const emailInput = wrapper.findComponent({ name: 'TInputEmail' })
      expect(emailInput.exists()).toBe(true)
      
      const nameInput = wrapper.findComponent({ name: 'TInputText' })
      expect(nameInput.exists()).toBe(true)
      expect(nameInput.props('label')).toBe('Full Name (Optional)')
    })

    it('emits emailSubmit with fullName when registering', async () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app'
        }
      })
      
      // Switch to register mode
      const registerLink = wrapper.find('.login-form__register-link')
      await registerLink.trigger('click')
      
      // Fill form
      const emailInput = wrapper.findComponent({ name: 'TInputEmail' })
      await emailInput.vm.$emit('update:modelValue', 'newuser@example.com')
      
      const nameInput = wrapper.findComponent({ name: 'TInputText' })
      await nameInput.vm.$emit('update:modelValue', 'John Doe')
      
      const submitButton = wrapper.find('.login-form__submit-button')
      await submitButton.trigger('click')
      
      expect(wrapper.emitted('emailSubmit')).toBeTruthy()
      expect(wrapper.emitted('emailSubmit')?.[0]).toEqual(['newuser@example.com', 'John Doe'])
    })

    it('allows switching back to login mode', async () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app'
        }
      })
      
      // Switch to register mode
      let toggleLink = wrapper.find('.login-form__register-link')
      await toggleLink.trigger('click')
      
      expect(wrapper.text()).toContain('Create your account')
      
      // Switch back to login mode
      toggleLink = wrapper.find('.login-form__register-link')
      await toggleLink.trigger('click')
      
      expect(wrapper.text()).toContain('Login to your account')
    })
  })

  describe('Error Handling', () => {
    it('shows error message when error prop is provided', () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app',
          error: 'Invalid credentials'
        }
      })
      
      const errorDiv = wrapper.find('.login-form__error')
      expect(errorDiv.exists()).toBe(true)
      expect(errorDiv.text()).toContain('Invalid credentials')
    })

    it('shows error icon with error message', () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app',
          error: 'Something went wrong'
        }
      })
      
      const errorIcon = wrapper.find('.login-form__error-icon')
      expect(errorIcon.exists()).toBe(true)
      expect(errorIcon.text()).toContain('alert-circle')
    })

    it('shows try again button with error', () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app',
          error: 'Network error'
        }
      })
      
      const tryAgainButton = wrapper.find('.login-form__error-button')
      expect(tryAgainButton.exists()).toBe(true)
      expect(tryAgainButton.text()).toContain('Try Again')
    })

    it('emits clearError when try again is clicked', async () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app',
          error: 'Error occurred'
        }
      })
      
      const tryAgainButton = wrapper.find('.login-form__error-button')
      await tryAgainButton.trigger('click')
      
      expect(wrapper.emitted('clearError')).toBeTruthy()
    })
  })

  describe('Loading States', () => {
    it('shows loading state on submit button', () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app',
          isLoading: true
        }
      })
      
      const submitButton = wrapper.find('.login-form__submit-button')
      const buttonComponent = wrapper.findComponent({ name: 'TButton' })
      expect(buttonComponent.props('loading')).toBe(true)
      expect(buttonComponent.props('disabled')).toBe(true)
    })

    it('disables all interactive elements when loading', () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app',
          isLoading: true
        }
      })
      
      const emailInput = wrapper.findComponent({ name: 'TInputEmail' })
      expect(emailInput.props('disabled')).toBe(true)
      
      const appleButton = wrapper.find('.login-form__apple-button')
      expect(appleButton.attributes('disabled')).toBeDefined()
    })
  })

  describe('CSS Classes', () => {
    it('applies correct BEM classes', () => {
      const wrapper = mount(TLoginForm, {
        props: {
          appId: 'test-app'
        }
      })
      
      expect(wrapper.find('.login-form').exists()).toBe(true)
      expect(wrapper.find('.login-form__card').exists()).toBe(true)
      expect(wrapper.find('.login-form__header').exists()).toBe(true)
      expect(wrapper.find('.login-form__content').exists()).toBe(true)
      expect(wrapper.find('.login-form__divider').exists()).toBe(true)
    })
  })
})