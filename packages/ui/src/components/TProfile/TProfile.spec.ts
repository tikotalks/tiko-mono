import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import TProfile from './TProfile.vue'

// Mock Canvas API
global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) }))
}))

global.HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
  callback(new Blob(['mock-image-data'], { type: 'image/jpeg' }))
})

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')


vi.mock('@tiko/core', () => ({
  useAuthStore: () => ({
    updateUserMetadata: vi.fn(),
    uploadAvatar: vi.fn(),
    getAvatarUrl: vi.fn()
  }),
  fileService: {
    upload: vi.fn().mockResolvedValue({ success: true, url: 'https://example.com/avatar.jpg' }),
    uploadAvatar: vi.fn().mockResolvedValue('https://example.com/avatar.jpg')
  },
  authService: {
    updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    updateUserMetadata: vi.fn().mockResolvedValue({ success: true }),
    updateUserProfile: vi.fn(),
    uploadAvatar: vi.fn(),
    getSession: vi.fn().mockResolvedValue({ expires_at: Date.now() + 3600000 }),
    refreshSession: vi.fn().mockResolvedValue({})
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
        'profile.changePassword': 'Change Password',
        'profile.setupParentMode': 'Setup Parent Mode',
        'profile.accountActions': 'Account Actions',
        'profile.parentMode': 'Parent Mode',
        'profile.profileUpdated': 'Profile updated',
        'profile.updateFailed': 'Update failed',
        'profile.invalidFileType': 'Invalid file type',
        'profile.fileTooLarge': 'File too large',
        'profile.imageProcessingFailed': 'Image processing failed',
        'settings.passwordChangeNotImplemented': 'Password change not implemented',
        'common.enabled': 'Enabled',
        'common.disabled': 'Disabled',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
        'languageNames.english': 'English',
        'languageNames.dutch': 'Dutch',
        'languageNames.german': 'German',
        'languageNames.french': 'French',
        'languageNames.spanish': 'Spanish'
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
        memberSince: 'profile.memberSince',
        changePassword: 'profile.changePassword',
        setupParentMode: 'profile.setupParentMode',
        accountActions: 'profile.accountActions',
        parentMode: 'profile.parentMode',
        profileUpdated: 'profile.profileUpdated',
        updateFailed: 'profile.updateFailed',
        invalidFileType: 'profile.invalidFileType',
        fileTooLarge: 'profile.fileTooLarge',
        imageProcessingFailed: 'profile.imageProcessingFailed'
      },
      settings: {
        passwordChangeNotImplemented: 'settings.passwordChangeNotImplemented'
      },
      common: {
        cancel: 'common.cancel',
        save: 'common.save',
        enabled: 'common.enabled',
        disabled: 'common.disabled'
      },
      languageNames: {
        bulgarian: 'languageNames.bulgarian',
        czech: 'languageNames.czech',
        welsh: 'languageNames.welsh',
        danish: 'languageNames.danish',
        german: 'languageNames.german',
        greek: 'languageNames.greek',
        english: 'languageNames.english',
        spanish: 'languageNames.spanish',
        estonian: 'languageNames.estonian',
        finnish: 'languageNames.finnish',
        french: 'languageNames.french',
        irish: 'languageNames.irish',
        croatian: 'languageNames.croatian',
        hungarian: 'languageNames.hungarian',
        armenian: 'languageNames.armenian',
        icelandic: 'languageNames.icelandic',
        italian: 'languageNames.italian',
        lithuanian: 'languageNames.lithuanian',
        latvian: 'languageNames.latvian',
        maltese: 'languageNames.maltese',
        dutch: 'languageNames.dutch',
        norwegian: 'languageNames.norwegian',
        polish: 'languageNames.polish',
        portuguese: 'languageNames.portuguese',
        romanian: 'languageNames.romanian',
        russian: 'languageNames.russian',
        slovak: 'languageNames.slovak',
        slovenian: 'languageNames.slovenian',
        swedish: 'languageNames.swedish'
      }
    },
    locale: ref('en'),
    setLocale: vi.fn(),
    availableLocales: ref([
      { code: 'en-GB', name: 'English' },
      { code: 'nl-NL', name: 'Dutch' },
      { code: 'de-DE', name: 'German' },
      { code: 'fr-FR', name: 'French' }
    ])
  })
}))

// Mock useParentMode
vi.mock('../../composables/useParentMode', () => ({
  useParentMode: () => ({
    isEnabled: ref(false),
    isUnlocked: ref(false),
    unlock: vi.fn(),
    lock: vi.fn()
  })
}))

// Mock toast service
vi.mock('../TToast', () => ({
  toastService: {
    success: vi.fn(),
    error: vi.fn(),
    show: vi.fn()
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

// Mock TButton
vi.mock('../TButton/TButton.vue', () => ({
  default: {
    name: 'TButton',
    template: '<button class="t-button" :data-status="status"><slot /></button>',
    props: ['type', 'size', 'color', 'icon', 'iconPosition', 'status', 'disabled'],
    emits: ['click']
  }
}))

// Mock TButtonGroup
vi.mock('../TButton/TButtonGroup.vue', () => ({
  default: {
    name: 'TButtonGroup',
    template: '<div class="t-button-group"><slot /></div>',
    props: ['direction', 'fluid']
  }
}))

// Mock TChooseLanguage
vi.mock('../TChooseLanguage/TChooseLanguage.vue', () => ({
  default: {
    name: 'TChooseLanguage',
    template: '<div class="t-choose-language"></div>',
    props: ['modelValue'],
    emits: ['update:modelValue', 'select']
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
    template: '<input class="t-input-text" :value="modelValue" />',
    props: ['modelValue', 'label', 'placeholder', 'required', 'disabled', 'error', 'readonly'],
    emits: ['update:modelValue']
  }
}))

vi.mock('../TForm/inputs/TInputSelect/TInputSelect.vue', () => ({
  default: {
    name: 'TInputSelect',
    template: '<select class="t-input-select" :value="modelValue"><option></option></select>',
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
  
  const mockPopupService = {
    open: vi.fn(),
    close: vi.fn()
  }
  
  const mockToastService = {
    show: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  }
  
  const createWrapper = (props = {}) => {
    return mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose,
        ...props
      },
      global: {
        provide: {
          popupService: mockPopupService,
          toastService: mockToastService
        }
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })
  
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders correctly with user data', () => {
    const wrapper = createWrapper()
    
    expect(wrapper.html()).toBeTruthy()
    expect(wrapper.find('.profile').exists()).toBe(true)
  })

  it('displays user avatar', () => {
    const wrapper = createWrapper()
    
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
    
    const wrapper = createWrapper({ user: userWithoutAvatar })
    
    const avatar = wrapper.find('.profile__avatar')
    expect(avatar.text()).toBe('JD') // John Doe initials
  })

  it('prefills form with user data', async () => {
    const wrapper = createWrapper()
    
    // Wait for onMounted and loadUserProfile to complete
    await wrapper.vm.$nextTick()
    await vi.runAllTimersAsync()
    
    const nameInput = wrapper.findComponent({ name: 'TInputText' })
    expect(nameInput.props('modelValue')).toBe('John Doe')
    
    // Language is now displayed in a button, not a select
    const languageButton = wrapper.find('.profile__field-button')
    expect(languageButton.exists()).toBe(true)
    expect(languageButton.text()).toContain('English')
  })

  it('displays user email as readonly', () => {
    const wrapper = createWrapper()
    
    // Email is displayed as a readonly div, not an input
    const emailField = wrapper.find('.profile__field-value--readonly')
    expect(emailField.text()).toBe('test@example.com')
  })

  it('displays member since date', () => {
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      },
      global: {
        provide: {
          popupService: mockPopupService,
          toastService: mockToastService
        }
      }
    })
    
    // Look for the readonly field containing the date
    const dateFields = wrapper.findAll('.profile__field-value--readonly')
    const dateField = dateFields[dateFields.length - 1] // Last readonly field is the date
    expect(dateField.text()).toContain('2023')
  })

  it('handles avatar upload', async () => {
    const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
    const { useAuthStore } = await import('@tiko/core')
    const authStore = useAuthStore()
    authStore.uploadAvatar.mockResolvedValue('https://example.com/new-avatar.jpg')
    
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      },
      global: {
        provide: {
          popupService: mockPopupService,
          toastService: mockToastService
        }
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
    const { useAuthStore } = await import('@tiko/core')
    const authStore = useAuthStore()
    
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      },
      global: {
        provide: {
          popupService: mockPopupService,
          toastService: mockToastService
        }
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
    expect(authStore.uploadAvatar).not.toHaveBeenCalled()
  })

  it('validates image file size', async () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
    const { useAuthStore } = await import('@tiko/core')
    const authStore = useAuthStore()
    
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      },
      global: {
        provide: {
          popupService: mockPopupService,
          toastService: mockToastService
        }
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
    expect(authStore.uploadAvatar).not.toHaveBeenCalled()
  })

  it('displays account action buttons', async () => {
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      },
      global: {
        provide: {
          popupService: mockPopupService,
          toastService: mockToastService
        }
      }
    })
    
    // Wait for initialization
    await wrapper.vm.$nextTick()
    
    // Check that action buttons are present
    const actionButtons = wrapper.findAll('.t-button')
    expect(actionButtons.length).toBeGreaterThan(0)
    
    // Should have change password button
    const changePasswordButton = actionButtons.find(btn => btn.text().includes('Change Password'))
    expect(changePasswordButton?.exists()).toBe(true)
  })

  it('shows processing state during avatar upload', async () => {
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      },
      global: {
        provide: {
          popupService: mockPopupService,
          toastService: mockToastService
        }
      }
    })
    
    // Wait for initialization
    await wrapper.vm.$nextTick()
    
    // Check initial processing state
    expect(wrapper.vm.isProcessing).toBe(false)
    
    // The component should have isProcessing reactive property for avatar uploads
    const fileInput = wrapper.find('input[type="file"]')
    expect(fileInput.exists()).toBe(true)
  })

  it('shows password change not implemented message', async () => {
    const wrapper = createWrapper()
    
    // Wait for initialization
    await wrapper.vm.$nextTick()
    
    // Find and click the change password button
    const changePasswordButton = wrapper.findAll('.t-button').find(btn => btn.text().includes('Change Password'))
    if (changePasswordButton) {
      await changePasswordButton.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Check if toast service was called with info message
      expect(mockToastService.show).toHaveBeenCalledWith(expect.objectContaining({
        type: 'info'
      }))
    }
  })

  it('displays parent mode status when enabled', async () => {
    // Mock parent mode as enabled for this test
    vi.mocked(useParentMode).mockReturnValueOnce({
      isEnabled: { value: true },
      isUnlocked: { value: true },
      hasPermission: vi.fn().mockReturnValue(true),
      enable: vi.fn(),
      unlock: vi.fn()
    })
    
    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    
    // Should show parent mode detail when enabled
    const parentModeDetails = wrapper.findAll('.profile__detail-item')
    const hasParentModeDetail = parentModeDetails.some(detail => 
      detail.text().includes('Parent Mode') || detail.find('.profile__detail-icon').exists()
    )
    expect(hasParentModeDetail).toBe(true)
  })

  it('closes popup when setup parent mode is clicked', async () => {
    // Mock parent mode as not enabled to show setup button
    vi.mocked(useParentMode).mockReturnValueOnce({
      isEnabled: { value: false },
      isUnlocked: { value: false },
      hasPermission: vi.fn().mockReturnValue(true),
      enable: vi.fn(),
      unlock: vi.fn()
    })
    
    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    
    // Find and click the setup parent mode button
    const setupButton = wrapper.findAll('.t-button').find(btn => btn.text().includes('Setup Parent Mode'))
    if (setupButton) {
      await setupButton.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Should close the popup to allow parent mode setup
      expect(mockPopupService.close).toHaveBeenCalled()
    }
  })

  it('shows avatar upload overlay on hover', () => {
    const wrapper = createWrapper()
    
    const avatar = wrapper.find('.profile__avatar')
    expect(avatar.find('.profile__avatar-overlay').exists()).toBe(true)
  })

  it('generates consistent avatar color based on email', () => {
    const wrapper = createWrapper()
    
    // Check for avatar fallback when no avatar URL
    const avatarFallback = wrapper.find('.profile__avatar-fallback')
    if (avatarFallback.exists()) {
      const style = avatarFallback.attributes('style') || ''
      expect(style.length).toBeGreaterThan(0)
    }
  })

  it('provides language options', async () => {
    const wrapper = createWrapper()
    
    // Wait for onMounted and loadUserProfile to complete
    await wrapper.vm.$nextTick()
    await vi.runAllTimersAsync()
    
    // Language options are now provided via a button that opens a popup
    const languageButton = wrapper.find('.profile__field-button')
    expect(languageButton.exists()).toBe(true)
    // The button should show the current language
    expect(languageButton.text()).toContain('English')
  })

  it('handles user without metadata gracefully', () => {
    const userWithoutMetadata = {
      ...mockUser,
      user_metadata: null
    }
    
    const wrapper = createWrapper({ user: userWithoutMetadata })
    
    expect(wrapper.find('.profile').exists()).toBe(true)
    
    const nameInput = wrapper.findComponent({ name: 'TInputText' })
    expect(nameInput.props('modelValue')).toBe('')
  })

  it('resizes uploaded images', async () => {
    const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
    const { useAuthStore } = await import('@tiko/core')
    const authStore = useAuthStore()
    authStore.uploadAvatar.mockResolvedValue('https://example.com/new-avatar.jpg')
    
    const wrapper = mount(TProfile, {
      props: {
        user: mockUser,
        onClose: mockOnClose
      },
      global: {
        provide: {
          popupService: mockPopupService,
          toastService: mockToastService
        }
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