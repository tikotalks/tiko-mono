#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// List of all keys that should exist in all locale files (based on current en-US)
const requiredKeys = {
  common: {
    save: '',
    cancel: '',
    delete: '',
    edit: '',
    close: '',
    loading: '',
    error: '',
    success: '',
    warning: '',
    confirm: '',
    yes: '',
    no: '',
    settings: '',
    back: '',
    home: '',
    done: '',
    add: '',
    remove: '',
    reset: '',
    apply: '',
    search: '',
    filter: '',
    sort: '',
    refresh: '',
    upload: '',
    download: '',
    share: '',
    copy: '',
    paste: '',
    undo: '',
    redo: '',
    welcome: '',
    itemsSelected: '',
    enabled: '',
    disabled: '',
    comingSoon: '',
    required: '',
    optional: '',
    dragDropHere: '',
    increaseValue: '',
    decreaseValue: '',
    online: '',
    offline: '',
    expandGroup: '',
    collapseGroup: '',
    applicationLoading: '',
    day: '',
    month: '',
    searchIcons: '',
    backgroundImage: '',
    preview: '',
    justNow: '',
    minutesAgo: '',
    hoursAgo: '',
    daysAgo: '',
    more: '',
    dismiss: ''
  },
  auth: {
    login: '',
    logout: '',
    signUp: '',
    signIn: '',
    email: '',
    password: '',
    confirmPassword: '',
    forgotPassword: '',
    resetPassword: '',
    changePassword: '',
    currentPassword: '',
    newPassword: '',
    passwordRequired: '',
    emailRequired: '',
    invalidEmail: '',
    passwordTooShort: '',
    passwordMismatch: '',
    loginFailed: '',
    signUpFailed: '',
    userNotFound: '',
    wrongPassword: '',
    emailInUse: '',
    weakPassword: '',
    networkError: '',
    verifyEmail: '',
    emailSent: '',
    checkEmail: '',
    loginToAccount: '',
    emailAddress: '',
    enterEmail: '',
    sendCode: '',
    or: '',
    loginWithApple: '',
    dontHaveAccount: '',
    register: '',
    option1MagicLink: '',
    option2EnterCode: '',
    verificationCode: '',
    enterDigitCode: '',
    verifyCode: '',
    didntReceiveCode: '',
    resendCode: '',
    useDifferentEmail: '',
    createAccount: '',
    fullNameOptional: '',
    enterFullName: '',
    alreadyHaveAccount: '',
    tryAgain: '',
    pleaseEnterValidEmail: '',
    pleaseEnterValidCode: '',
    preparingApp: '',
    welcomeToTiko: '',
    signInToAccess: '',
    appleSignInFailed: '',
    failedToSendCode: '',
    invalidVerificationCode: '',
    failedToResendCode: ''
  },
  timer: {
    start: '',
    pause: '',
    stop: '',
    reset: '',
    setTime: '',
    minutes: '',
    seconds: '',
    countDown: '',
    countUp: '',
    quickTimes: '',
    timerDuration: '',
    soundNotification: '',
    vibrationNotification: '',
    timesUp: '',
    dismiss: ''
  },
  cards: {
    createCard: '',
    addCard: '',
    editCard: '',
    deleteCard: '',
    cardLabel: '',
    audioText: '',
    uploadImage: '',
    createCardGroup: '',
    groupName: '',
    selectedCards: '',
    tags: '',
    useUrl: '',
    imageUrl: '',
    basicInformation: '',
    image: '',
    styling: '',
    backgroundColor: '',
    customColor: '',
    preview: '',
    searchCards: '',
    gridView: '',
    groupsView: '',
    loadingCards: '',
    tryAgain: '',
    noCardsYet: '',
    createFirstCardPrompt: '',
    createFirstCard: '',
    noCardsFound: '',
    tryDifferentSearch: '',
    clearSearch: '',
    ungroupedCards: '',
    deleteThisCard: '',
    cardCreatedSuccessfully: '',
    groupCreatedSuccessfully: '',
    deleteSelectedCards: '',
    clear: '',
    done: '',
    selectCardsToOrganize: '',
    tapCardsToSpeak: '',
    cardsSettings: '',
    selected: '',
    closeModal: '',
    whatShouldBeSpoken: ''
  },
  type: {
    typeToSpeak: '',
    speak: '',
    clearText: '',
    characters: '',
    typeGameSettings: '',
    typeAndSpeak: '',
    typeTextAndHearItSpoken: '',
    textToSpeak: '',
    stop: '',
    pause: '',
    voice: '',
    loadingVoices: '',
    selectAVoice: '',
    recent: '',
    speakThisText: '',
    copyToInput: '',
    showAllHistory: '',
    voiceSettings: '',
    speechRate: '',
    pitch: '',
    volume: '',
    saveToHistoryAutomatically: ''
  },
  yesno: {
    setQuestion: '',
    saveQuestion: '',
    recentQuestions: '',
    editQuestion: '',
    yes: '',
    no: '',
    yesOrNo: '',
    yesnoSettings: '',
    typeYourQuestion: '',
    typeYourQuestionPlaceholder: '',
    typeYourQuestionOrSelect: '',
    removeFromFavorites: '',
    addToFavorites: '',
    deleteQuestion: '',
    buttonSize: '',
    small: '',
    medium: '',
    large: '',
    autoSpeakAnswers: '',
    hapticFeedback: ''
  },
  todo: {
    groups: '',
    items: '',
    createGroup: '',
    editGroup: '',
    deleteGroup: '',
    createItem: '',
    editItem: '',
    deleteItem: '',
    deleteItemQuestion: '',
    groupName: '',
    itemName: '',
    completed: '',
    pending: '',
    markAsDone: '',
    markAsPending: '',
    noGroups: '',
    noItems: '',
    resetItems: '',
    allItemsReset: '',
    createTodoList: '',
    editTodoList: '',
    addTodoItem: '',
    listName: '',
    itemTitle: '',
    iconOptional: '',
    colorOptional: '',
    imageOptional: '',
    whatNeedsDone: '',
    clickToAddImage: '',
    uploadImagePrompt: '',
    saveChanges: '',
    addItem: '',
    noTodoListsYet: '',
    askParentCreate: '',
    createFirstTodoList: '',
    noItemsYet: '',
    askParentAddItems: '',
    addFirstTodoItem: '',
    completedCount: '',
    deleteTodoList: '',
    deleteTodoListConfirm: '',
    deleteItemConfirm: '',
    todoListDeleted: '',
    itemDeleted: '',
    enterListName: ''
  },
  parentMode: {
    title: '',
    unlock: '',
    lock: '',
    enterPin: '',
    setPin: '',
    confirmPin: '',
    incorrectPin: '',
    pinMismatch: '',
    pinSet: '',
    unlocked: '',
    locked: '',
    permissionDenied: '',
    setupTitle: '',
    setupSuccess: '',
    enableParentMode: '',
    setUpParentMode: '',
    enterParentPin: '',
    createPinDescription: '',
    enterPinDescription: '',
    parentModeEnabled: '',
    failedToEnable: '',
    disableParentMode: '',
    disableConfirmMessage: '',
    yesDisable: '',
    parentModeDisabled: '',
    failedToDisable: '',
    cannotDisableNoPopup: '',
    insufficientPermissions: '',
    parentModeUnlocked: '',
    enterYourPin: '',
    confirmYourPin: '',
    pinMustBe4Digits: '',
    hideNumbers: '',
    showNumbers: ''
  },
  radio: {
    radioSettings: '',
    playback: '',
    autoplayNext: '',
    autoplayDescription: '',
    showTrackTitles: '',
    showTrackTitlesDescription: '',
    defaultVolume: '',
    repeatMode: '',
    noRepeat: '',
    repeatOne: '',
    repeatAll: '',
    shuffleMode: '',
    shuffleDescription: '',
    sleepTimer: '',
    defaultDuration: '',
    resetSettings: '',
    resetSettingsDescription: '',
    resetToDefaults: '',
    saveSettings: '',
    resetConfirm: '',
    failedToSaveSettings: '',
    addAudioTrack: '',
    editAudioTrack: '',
    videoUrl: '',
    videoUrlPlaceholder: '',
    pasteUrlPrompt: '',
    title: '',
    titlePlaceholder: '',
    description: '',
    descriptionPlaceholder: '',
    customThumbnailUrl: '',
    thumbnailPlaceholder: '',
    leaveEmptyThumbnail: '',
    addTag: '',
    removeTag: '',
    untitled: '',
    titleRequired: '',
    videoUrlRequired: '',
    pleaseEnterValidUrl: '',
    pleaseEnterValidThumbnailUrl: '',
    failedToAddAudioTrack: '',
    failedToSaveChanges: '',
    markAsFavorite: '',
    videoUrlReadonly: '',
    openUrl: '',
    videoUrlCannotChange: '',
    neverPlayed: '',
    onePlay: '',
    multiplePlays: '',
    searchAudio: '',
    parentModeEnable: '',
    addAudio: '',
    loadingAudioCollection: '',
    noAudioTracksYet: '',
    startBuildingCollection: '',
    addYourFirstAudio: '',
    noResultsFound: '',
    tryAdjustingSearch: '',
    clearAllFilters: '',
    all: '',
    favorites: '',
    recent: '',
    deleteTrackConfirm: '',
    favorite: '',
    tags: '',
    add: '',
    clear: '',
    tryAgain: '',
    editAudioItem: '',
    audioTrackTitle: '',
    plays: '',
    noAudioSelected: '',
    sleepIn: '',
    searchingFor: '',
    resultsFound: '',
    searchingCollection: '',
    tryDifferentKeywords: '',
    play: '',
    playAllResults: '',
    searchAudioPlaceholder: ''
  },
  uiDocs: {
    documentationSettings: '',
    buttons: '',
    buttonsDocumentation: '',
    cards: '',
    cardsDocumentation: '',
    colors: '',
    colorsDocumentation: '',
    icons: '',
    iconsDocumentation: '',
    inputs: '',
    inputsDocumentation: '',
    welcomeToUIDocumentation: '',
    exploreComponents: '',
    comingSoon: '',
    tikoUIDocumentation: '',
    completeDocumentationAndTesting: '',
    interactiveButtonComponents: '',
    completeIconLibrary: '',
    inputComponents: '',
    formInputsSelectsTextareas: '',
    contentContainersAndLayouts: '',
    colorSystem: '',
    colorPaletteThemes: '',
    quickStart: '',
    documentationAppShowcase: '',
    codeExamples: '',
    seeWorkingExamples: '',
    livePreviews: '',
    interactiveComponentPreviews: '',
    documentation: '',
    completePropAndUsage: '',
    items: ''
  },
  validation: {
    onlyOneNumberAllowed: ''
  }
};

// Function to update a locale file
function updateLocaleFile(filePath, localeCode) {
  console.log(`\n📄 Processing ${localeCode}...`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract the variable name and existing translations
  const variableMatch = content.match(/export const (\w+):/);
  if (!variableMatch) {
    console.error(`❌ Could not find export statement in ${filePath}`);
    return;
  }
  
  const variableName = variableMatch[1];
  console.log(`   Variable name: ${variableName}`);
  
  // Read existing translations by importing
  const tempFile = filePath.replace('.ts', '.temp.mjs');
  const tempContent = content.replace(/import type.*\n/, '').replace(`export const ${variableName}:.*=`, 'export default');
  
  try {
    fs.writeFileSync(tempFile, tempContent);
    
    // Import to get existing translations
    const existingModule = await import(tempFile);
    const existing = existingModule.default;
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
    
    // Merge with required keys
    const merged = mergeDeep(requiredKeys, existing);
    
    // Generate new file content
    const newContent = generateLocaleFileContent(variableName, localeCode, merged);
    fs.writeFileSync(filePath, newContent);
    
    console.log(`   ✅ Updated ${filePath}`);
    
  } catch (error) {
    // Clean up temp file if it exists
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    console.error(`   ❌ Error processing ${filePath}:`, error.message);
  }
}

// Deep merge function that preserves existing values
function mergeDeep(template, existing) {
  const result = { ...template };
  
  for (const key in existing) {
    if (existing[key] && typeof existing[key] === 'object' && !Array.isArray(existing[key])) {
      result[key] = mergeDeep(template[key] || {}, existing[key]);
    } else if (existing[key] !== undefined && existing[key] !== '') {
      result[key] = existing[key];
    }
  }
  
  return result;
}

// Generate the content for a locale file
function generateLocaleFileContent(variableName, localeCode, translations) {
  const lines = [];
  lines.push(`import type { TranslationSchema } from '../types'`);
  lines.push('');
  
  if (localeCode !== 'en-US' && localeCode !== 'en-GB') {
    lines.push(`// ${localeCode.toUpperCase()} translations`);
    lines.push(`// Some keys may still need proper translation from English`);
  } else {
    lines.push(`// ${localeCode} translations`);
  }
  
  lines.push(`export const ${variableName}: TranslationSchema = ${formatObject(translations, 2)}`);
  lines.push('');
  
  return lines.join('\n');
}

// Format object as TypeScript code
function formatObject(obj, indent = 0) {
  const spaces = '  '.repeat(indent / 2);
  const entries = Object.entries(obj);
  
  if (entries.length === 0) return '{}';
  
  let result = '{\n';
  entries.forEach(([key, value], index) => {
    result += `${spaces}  ${key}: `;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result += formatObject(value, indent + 2);
    } else {
      // Escape single quotes and wrap in single quotes
      const escaped = String(value).replace(/'/g, "\\'");
      result += `'${escaped}'`;
    }
    if (index < entries.length - 1) result += ',';
    result += '\n';
  });
  result += `${spaces}}`;
  return result;
}

// Main execution
async function main() {
  console.log('🚀 Starting locale files update...\n');
  
  const localesDir = path.join(__dirname, 'locales');
  const files = fs.readdirSync(localesDir)
    .filter(file => file.endsWith('.ts') && file !== 'index.ts')
    .sort();
  
  console.log(`Found ${files.length} locale files:`);
  files.forEach(file => console.log(`   - ${file}`));
  
  for (const file of files) {
    const filePath = path.join(localesDir, file);
    const localeCode = file.replace('.ts', '');
    await updateLocaleFile(filePath, localeCode);
  }
  
  console.log('\n✅ All locale files updated successfully!');
  console.log('\n⚠️  Note: Files other than en-US and en-GB may contain English text that needs proper translation.');
}

main().catch(console.error);