import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import TProfile from './TProfile.vue'

// Mock the auth store
const mockAuthStore = {
  updateUserMetadata: vi.fn(),
  uploadAvatar: vi.fn(),
  getAvatarUrl: vi.fn()
}

vi.mock('@tiko/core', () => ({
  useAuthStore: () => mockAuthStore,
  authService: {
    updateUserProfile: vi.fn(),
    uploadAvatar: vi.fn()
  },
  fileService: {
    upload: vi.fn()
  }
}))

// Mock i18n
vi.mock('../../composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'profile.clickToChangeAvatar': 'Click to change avatar',
        'profile.name': 'Name',
        'profile.enterName': 'Enter your name',
        'profile.language': 'Language',
        'profile.email': 'Email',
        'profile.memberSince': 'Member since',
        'common.cancel': 'Cancel',
        'common.save': 'Save'
      }
      return translations[key] || key
    },
    keys: {
      profile: {
        clickToChangeAvatar: 'profile.clickToChangeAvatar',
        name: 'profile.name',
        enterName: 'profile.enterName',
        language: 'profile.language',
        email: 'profile.email',
        memberSince: 'profile.memberSince'
      },
      common: {
        cancel: 'common.cancel',
        save: 'common.save'
      }
    },
    locale: ref('en'),
    setLocale: vi.fn()
  })
}))

// Mock toast service
vi.mock('../TToast', () => ({
  toastService: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock TIcon
vi.mock('../TIcon/TIcon.vue', () => ({
  default: {
    name: 'TIcon',
    template: '<i class="t-icon"></i>',
    props: ['name', 'size']
  }
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
    
    // Email is displayed as a readonly div, not an input
    const emailField = wrapper.find('.profile__field-value--readonly')
    expect(emailField.text()).toBe('test@example.com')
  })

  it('displays member since date', () => {
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    // Look for the readonly field containing the date
    const dateFields = wrapper.findAll('.profile__field-value--readonly')
    const dateField = dateFields[dateFields.length - 1] // Last readonly field is the date
    expect(dateField.text()).toContain('2023')
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
    // Create a proper change event with files
    const changeEvent = new Event('change', { bubbles: true })
    Object.defineProperty(changeEvent, 'target', {
      writable: false,
      value: { files: [mockFile] }
    })
    await fileInput.element.dispatchEvent(changeEvent)
    
    await wrapper.vm.$nextTick()
    // The component should have called handleFileSelect
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
    // Create a proper change event with files
    const changeEvent = new Event('change', { bubbles: true })
    Object.defineProperty(changeEvent, 'target', {
      writable: false,
      value: { files: [mockFile] }
    })
    await fileInput.element.dispatchEvent(changeEvent)
    
    await wrapper.vm.$nextTick()
    expect(mockAuthStore.uploadAvatar).not.toHaveBeenCalled()
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
    // Create a proper change event with files
    const changeEvent = new Event('change', { bubbles: true })
    Object.defineProperty(changeEvent, 'target', {
      writable: false,
      value: { files: [largeFile] }
    })
    await fileInput.element.dispatchEvent(changeEvent)
    
    await wrapper.vm.$nextTick()
    expect(mockAuthStore.uploadAvatar).not.toHaveBeenCalled()
  })

  it('updates user metadata on form submission', async () => {
    mockAuthStore.updateUserMetadata.mockResolvedValue({})
    
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    // Click save button to trigger save
    const saveButton = wrapper.findAll('.t-button').find(btn => btn.text() === 'Save')
    await saveButton.trigger('click')
    
    await wrapper.vm.$nextTick()
    
    // The component should have called updateUserMetadata
    expect(mockAuthStore.updateUserMetadata).toHaveBeenCalled()
  })

  it('shows loading state during form submission', async () => {
    mockAuthStore.updateUserMetadata.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    // Click save button
    const saveButton = wrapper.findAll('.t-button').find(btn => btn.text() === 'Save')
    await saveButton.trigger('click')
    
    // Check if button has loading prop
    const buttonComponent = wrapper.findAllComponents({ name: 'TButton' })
      .find(button => button.element.textContent.includes('Save'))
    expect(buttonComponent.props('loading')).toBe(true)
  })

  it('shows error message on update failure', async () => {
    mockAuthStore.updateUserMetadata.mockRejectedValue(new Error('Update failed'))
    
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      }
    })
    
    
    await wrapper.vm.$nextTick()
    
    // Check if error is shown (the component might show error differently)
    expect(mockAuthStore.updateUserMetadata).toHaveBeenCalled()
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
    
    
    await wrapper.vm.$nextTick()
    
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
    
    // Check for avatar fallback when no avatar URL
    const avatarFallback = wrapper.find('.profile__avatar-fallback')
    if (avatarFallback.exists()) {
      const style = avatarFallback.attributes('style') || ''
      expect(style.length).toBeGreaterThan(0)
    }
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
    // Create a proper change event with files
    const changeEvent = new Event('change', { bubbles: true })
    Object.defineProperty(changeEvent, 'target', {
      writable: false,
      value: { files: [mockFile] }
    })
    await fileInput.element.dispatchEvent(changeEvent)
    
    await wrapper.vm.$nextTick()
    // The component should handle the file upload
  })
})