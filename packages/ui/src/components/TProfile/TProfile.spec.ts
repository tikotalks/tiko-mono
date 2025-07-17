import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import TProfile from './TProfile.vue'

// Mock the auth store
const mockAuthStore = {
  updateUserMetadata: vi.fn(),
  uploadAvatar: vi.fn(),
  getAvatarUrl: vi.fn()
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
    props: ['modelValue', 'label', 'placeholder', 'required', 'disabled', 'error'],
    emits: ['update:modelValue']
  }
}))

vi.mock('../TForm/inputs/TInputSelect/TInputSelect.vue', () => ({
  default: {
    name: 'TInputSelect',
    template: '<select class="t-input-select"><option></option></select>',
    props: ['modelValue', 'label', 'options', 'required', 'disabled'],
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

vi.mock('../TButtonGroup/TButtonGroup.vue', () => ({
  default: {
    name: 'TButtonGroup',
    template: '<div class="t-button-group"><slot /></div>',
    props: ['align']
  }
}))

vi.mock('../TAlert/TAlert.vue', () => ({
  default: {
    name: 'TAlert',
    template: '<div class="t-alert"><slot /></div>',
    props: ['type', 'dismissible']
  }
}))

describe('TProfile.vue', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    created_at: '2023-01-01T00:00:00.000Z',
    user_metadata: {
      full_name: 'John Doe',
      avatar_url: 'https://example.com/avatar.jpg',
      settings: {
        language: 'en'
      }
    }
  }

  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly with user data', () => {
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    expect(wrapper.html()).toBeTruthy()
    expect(wrapper.find('.profile').exists()).toBe(true)
  })

  it('displays user avatar', () => {
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    const avatar = wrapper.find('.profile__avatar')
    expect(avatar.exists()).toBe(true)
    expect(avatar.find('img').attributes('src')).toBe('https://example.com/avatar.jpg')
  })

  it('shows user initials when no avatar is available', () => {
    const userWithoutAvatar = {
      ...mockUser,
      user_metadata: {
        ...mockUser.user_metadata,
        avatar_url: null
      }
    }
    
    const wrapper = mount(TProfile, {
      props: {
        user: userWithoutAvatar,
        onClose: mockOnClose
      }
    })
    
    const avatar = wrapper.find('.profile__avatar')
    expect(avatar.text()).toBe('JD') // John Doe initials
  })

  it('prefills form with user data', () => {
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    const nameInput = wrapper.findComponent({ name: 'TInputText' })
    expect(nameInput.props('modelValue')).toBe('John Doe')
    
    const languageSelect = wrapper.findComponent({ name: 'TInputSelect' })
    expect(languageSelect.props('modelValue')).toBe('en')
  })

  it('displays user email as readonly', () => {
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    const inputs = wrapper.findAllComponents({ name: 'TInputText' })
    const emailInput = inputs.find(input => input.props('label') === 'Email')
    expect(emailInput.props('modelValue')).toBe('test@example.com')
    expect(emailInput.props('disabled')).toBe(true)
  })

  it('displays member since date', () => {
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    expect(wrapper.text()).toContain('Member since')
    expect(wrapper.text()).toContain('January 1, 2023')
  })

  it('handles avatar upload', async () => {
    const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
    mockAuthStore.uploadAvatar.mockResolvedValue('https://example.com/new-avatar.jpg')
    
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    const fileInput = wrapper.find('input[type="file"]')
    await fileInput.trigger('change', { target: { files: [mockFile] } })
    
    expect(mockAuthStore.uploadAvatar).toHaveBeenCalledWith(mockFile)
  })

  it('validates image file types', async () => {
    const mockFile = new File(['doc'], 'document.pdf', { type: 'application/pdf' })
    
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    const fileInput = wrapper.find('input[type="file"]')
    await fileInput.trigger('change', { target: { files: [mockFile] } })
    
    expect(mockAuthStore.uploadAvatar).not.toHaveBeenCalled()
    expect(wrapper.find('.profile__error').exists()).toBe(true)
  })

  it('validates image file size', async () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
    
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    const fileInput = wrapper.find('input[type="file"]')
    await fileInput.trigger('change', { target: { files: [largeFile] } })
    
    expect(mockAuthStore.uploadAvatar).not.toHaveBeenCalled()
    expect(wrapper.find('.profile__error').exists()).toBe(true)
  })

  it('updates user metadata on form submission', async () => {
    mockAuthStore.updateUserMetadata.mockResolvedValue({})
    
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    // Update name
    const nameInput = wrapper.findComponent({ name: 'TInputText' })
    await nameInput.vm.$emit('update:modelValue', 'Jane Doe')
    
    // Update language
    const languageSelect = wrapper.findComponent({ name: 'TInputSelect' })
    await languageSelect.vm.$emit('update:modelValue', 'es')
    
    // Submit form
    const form = wrapper.findComponent({ name: 'TForm' })
    await form.vm.$emit('submit')
    
    expect(mockAuthStore.updateUserMetadata).toHaveBeenCalledWith({
      full_name: 'Jane Doe',
      settings: { language: 'es' }
    })
  })

  it('shows loading state during form submission', async () => {
    mockAuthStore.updateUserMetadata.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    const form = wrapper.findComponent({ name: 'TForm' })
    await form.vm.$emit('submit')
    
    const saveButton = wrapper.findAllComponents({ name: 'TButton' })
      .find(button => button.text() === 'Save')
    expect(saveButton.props('loading')).toBe(true)
  })

  it('shows error message on update failure', async () => {
    mockAuthStore.updateUserMetadata.mockRejectedValue(new Error('Update failed'))
    
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    const form = wrapper.findComponent({ name: 'TForm' })
    await form.vm.$emit('submit')
    
    expect(wrapper.findComponent({ name: 'TAlert' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'TAlert' }).props('type')).toBe('error')
  })

  it('calls onClose when cancel button is clicked', async () => {
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    const cancelButton = wrapper.findAllComponents({ name: 'TButton' })
      .find(button => button.text() === 'Cancel')
    await cancelButton.trigger('click')
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onClose after successful update', async () => {
    mockAuthStore.updateUserMetadata.mockResolvedValue({})
    
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    const form = wrapper.findComponent({ name: 'TForm' })
    await form.vm.$emit('submit')
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows avatar upload overlay on hover', () => {
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    const avatar = wrapper.find('.profile__avatar')
    expect(avatar.find('.profile__avatar-overlay').exists()).toBe(true)
  })

  it('generates consistent avatar color based on email', () => {
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    const avatar = wrapper.find('.profile__avatar')
    expect(avatar.attributes('style')).toContain('background-color')
  })

  it('provides language options', () => {
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    const languageSelect = wrapper.findComponent({ name: 'TInputSelect' })
    const options = languageSelect.props('options')
    expect(options).toBeInstanceOf(Array)
    expect(options.length).toBeGreaterThan(0)
    expect(options).toContainEqual(expect.objectContaining({ value: 'en', label: 'English' }))
  })

  it('handles user without metadata gracefully', () => {
    const userWithoutMetadata = {
      ...mockUser,
      user_metadata: null
    }
    
    const wrapper = mount(TProfile, {
      props: {
        user: userWithoutMetadata,
        onClose: mockOnClose
      }
    })
    
    expect(wrapper.find('.profile').exists()).toBe(true)
    
    const nameInput = wrapper.findComponent({ name: 'TInputText' })
    expect(nameInput.props('modelValue')).toBe('')
  })

  it('resizes uploaded images', async () => {
    const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
    mockAuthStore.uploadAvatar.mockResolvedValue('https://example.com/new-avatar.jpg')
    
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    const fileInput = wrapper.find('input[type="file"]')
    await fileInput.trigger('change', { target: { files: [mockFile] } })
    
    // Should resize image to 400x400 with 0.9 quality
    expect(mockAuthStore.uploadAvatar).toHaveBeenCalledWith(mockFile)
  })
})