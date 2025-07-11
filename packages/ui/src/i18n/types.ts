/**
 * Translation type definitions
 * This ensures all languages have the same structure
 */

export interface TranslationSchema {
  common: {
    save: string
    cancel: string
    delete: string
    edit: string
    close: string
    loading: string
    error: string
    success: string
    warning: string
    confirm: string
    yes: string
    no: string
    settings: string
    back: string
    home: string
    done: string
    add: string
    remove: string
    reset: string
    apply: string
    search: string
    filter: string
    sort: string
    refresh: string
    upload: string
    download: string
    share: string
    copy: string
    paste: string
    undo: string
    redo: string
    welcome: string
    itemsSelected: string
    enabled: string
    disabled: string
    comingSoon: string
  }
  auth: {
    login: string
    logout: string
    signUp: string
    signIn: string
    email: string
    password: string
    confirmPassword: string
    forgotPassword: string
    resetPassword: string
    changePassword: string
    currentPassword: string
    newPassword: string
    passwordRequired: string
    emailRequired: string
    invalidEmail: string
    passwordTooShort: string
    passwordMismatch: string
    loginFailed: string
    signUpFailed: string
    userNotFound: string
    wrongPassword: string
    emailInUse: string
    weakPassword: string
    networkError: string
    verifyEmail: string
    emailSent: string
    checkEmail: string
  }
  settings: {
    title: string
    userSettings: string
    appearance: string
    theme: string
    lightTheme: string
    darkTheme: string
    autoTheme: string
    language: string
    voiceAndSound: string
    voiceEnabled: string
    voice: string
    on: string
    off: string
    saveChanges: string
    settingsSaved: string
    failedToSave: string
    passwordChangeNotImplemented: string
  }
  timer: {
    start: string
    pause: string
    stop: string
    reset: string
    setTime: string
    minutes: string
    seconds: string
    countDown: string
    countUp: string
    quickTimes: string
    timerDuration: string
    soundNotification: string
    vibrationNotification: string
    timesUp: string
    dismiss: string
  }
  cards: {
    createCard: string
    createCardGroup: string
    addCard: string
    editCard: string
    deleteCard: string
    cardLabel: string
    audioText: string
    uploadImage: string
    groupName: string
    selectedCards: string
    tags: string
    useUrl: string
    imageUrl: string
    basicInformation: string
    image: string
    styling: string
    backgroundColor: string
    customColor: string
    preview: string
    searchCards: string
    gridView: string
    groupsView: string
    loadingCards: string
    tryAgain: string
    noCardsYet: string
    createFirstCardPrompt: string
    createFirstCard: string
    noCardsFound: string
    tryDifferentSearch: string
    clearSearch: string
    ungroupedCards: string
    deleteThisCard: string
    cardCreatedSuccessfully: string
    groupCreatedSuccessfully: string
    deleteSelectedCards: string
    clear: string
  }
  type: {
    typeToSpeak: string
    speak: string
    clearText: string
    characters: string
  }
  yesno: {
    setQuestion: string
    saveQuestion: string
    recentQuestions: string
    editQuestion: string
    yes: string
    no: string
    yesOrNo: string
  }
  todo: {
    groups: string
    items: string
    createGroup: string
    editGroup: string
    deleteGroup: string
    createItem: string
    editItem: string
    deleteItem: string
    deleteItemQuestion: string
    groupName: string
    itemName: string
    completed: string
    pending: string
    markAsDone: string
    markAsPending: string
    noGroups: string
    noItems: string
    resetItems: string
    allItemsReset: string
    createTodoList: string
    editTodoList: string
    addTodoItem: string
    listName: string
    itemTitle: string
    iconOptional: string
    colorOptional: string
    imageOptional: string
    whatNeedsDone: string
    clickToAddImage: string
    uploadImagePrompt: string
    saveChanges: string
    addItem: string
    noTodoListsYet: string
    askParentCreate: string
    createFirstTodoList: string
    noItemsYet: string
    askParentAddItems: string
    addFirstTodoItem: string
    completedCount: string
    deleteTodoList: string
    deleteTodoListConfirm: string
    deleteItemQuestion: string
    deleteItemConfirm: string
    todoListDeleted: string
    itemDeleted: string
    enterListName: string
  }
  radio: {
    radioSettings: string
    playback: string
    autoplayNext: string
    autoplayDescription: string
    showTrackTitles: string
    showTrackTitlesDescription: string
    defaultVolume: string
    repeatMode: string
    noRepeat: string
    repeatOne: string
    repeatAll: string
    shuffleMode: string
    shuffleDescription: string
    sleepTimer: string
    defaultDuration: string
    resetSettings: string
    resetSettingsDescription: string
    resetToDefaults: string
    saveSettings: string
    resetConfirm: string
    failedToSaveSettings: string
    addAudioTrack: string
    editAudioTrack: string
    videoUrl: string
    videoUrlPlaceholder: string
    pasteUrlPrompt: string
    title: string
    titlePlaceholder: string
    description: string
    descriptionPlaceholder: string
    customThumbnailUrl: string
    thumbnailPlaceholder: string
    leaveEmptyThumbnail: string
    addTag: string
    removeTag: string
    untitled: string
    titleRequired: string
    videoUrlRequired: string
    pleaseEnterValidUrl: string
    pleaseEnterValidThumbnailUrl: string
    failedToAddAudioTrack: string
    failedToSaveChanges: string
    markAsFavorite: string
    videoUrlReadonly: string
    openUrl: string
    videoUrlCannotChange: string
    neverPlayed: string
    onePlay: string
    multiplePlays: string
    searchAudio: string
    parentModeEnable: string
    addAudio: string
    loadingAudioCollection: string
    noAudioTracksYet: string
    startBuildingCollection: string
    addYourFirstAudio: string
    noResultsFound: string
    tryAdjustingSearch: string
    clearAllFilters: string
    all: string
    favorites: string
    recent: string
    deleteTrackConfirm: string
    favorite: string
    tags: string
    add: string
  }
  parentMode: {
    title: string
    unlock: string
    lock: string
    enterPin: string
    setPin: string
    confirmPin: string
    incorrectPin: string
    pinMismatch: string
    pinSet: string
    unlocked: string
    locked: string
    permissionDenied: string
    setupTitle: string
    setupSuccess: string
  }
  profile: {
    title: string
    memberSince: string
    accountDetails: string
    email: string
    phone: string
    language: string
    parentMode: string
    accountActions: string
    editProfile: string
    changePassword: string
    setupParentMode: string
    name: string
    enterName: string
    clickToChangeAvatar: string
    invalidFileType: string
    fileTooLarge: string
    imageProcessingFailed: string
    profileUpdated: string
    updateFailed: string
  }
  tiko: {
    welcome: string
    selectApp: string
    moreApps: string
    installFromStore: string
    appNotInstalled: string
    openApp: string
  }
}

// Available locales with regional variants
export type Locale = 
  | 'en-GB' 
  | 'en-US' 
  | 'es' 
  | 'fr' 
  | 'de' 
  | 'pt' 
  | 'it' 
  | 'nl' 
  | 'pl' 
  | 'ro' 
  | 'sv' 
  | 'el' 
  | 'ru'

// Type for translation functions with interpolation support
export type TranslationFunction = (key: TranslationKey, params?: Record<string, any> | string) => string

// Helper type to create a nested object of translation keys
type TranslationKeysObject<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? TranslationKeysObject<T[K], `${Prefix}${K}.`>
          : `${Prefix}${K}`
        : never
    }
  : never

// Type-safe translation keys object
export type TranslationKeys = TranslationKeysObject<TranslationSchema>

// Generate dot notation keys from nested object
type DotNotation<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? DotNotation<T[K], `${Prefix}${K}.`>
          : `${Prefix}${K}`
        : never
    }[keyof T]
  : never

// All possible translation keys
export type TranslationKey = DotNotation<TranslationSchema>

// Ensure all translations implement the schema
export type Translations = {
  [K in Locale]: TranslationSchema
}