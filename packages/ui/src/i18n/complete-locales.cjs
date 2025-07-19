#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load reference keys from en-US
const enUSContent = fs.readFileSync(path.join(__dirname, 'locales/en-US.ts'), 'utf8');

// List of files to complete
const incompleteFiles = ['fr', 'it', 'nl', 'pl', 'pt', 'ro', 'ru', 'sv'];

// Extract all sections from en-US as template
function extractEnUSKeys() {
  const keys = {};
  
  // Parse the en-US content to extract all key-value pairs
  const sections = enUSContent.match(/(\w+):\s*{[^}]*}/g) || [];
  
  // For simplicity, we'll use the known missing sections with English placeholders
  return {
    common: {
      required: 'Required',
      optional: 'Optional',
      dragDropHere: 'or drag and drop here',
      increaseValue: 'Increase value',
      decreaseValue: 'Decrease value',
      online: 'Online',
      offline: 'Offline',
      expandGroup: 'Expand group',
      collapseGroup: 'Collapse group',
      applicationLoading: 'Application loading screen',
      day: 'Day',
      month: 'Month',
      searchIcons: 'Search icons...',
      backgroundImage: 'Background Image',
      preview: 'Preview',
      justNow: 'Just now',
      minutesAgo: '{count}m ago',
      hoursAgo: '{count}h ago',
      daysAgo: '{count}d ago',
      more: 'more',
      dismiss: 'Dismiss'
    },
    auth: {
      loginToAccount: 'Login to your account',
      emailAddress: 'Email Address',
      enterEmail: 'Enter your email',
      sendCode: 'Send Code',
      or: 'or',
      loginWithApple: 'Login with Apple',
      dontHaveAccount: "Don't have an account?",
      register: 'Register',
      option1MagicLink: 'Option 1: Click the magic link in your email',
      option2EnterCode: 'Option 2: Enter the {codeLength}-digit code',
      verificationCode: 'Verification Code',
      enterDigitCode: 'Enter {codeLength}-digit code',
      verifyCode: 'Verify Code',
      didntReceiveCode: "Didn't receive code?",
      resendCode: 'Resend',
      useDifferentEmail: 'Use different email',
      createAccount: 'Create your account',
      fullNameOptional: 'Full Name (Optional)',
      enterFullName: 'Enter your full name',
      alreadyHaveAccount: 'Already have an account?',
      tryAgain: 'Try Again',
      pleaseEnterValidEmail: 'Please enter a valid email address',
      pleaseEnterValidCode: 'Please enter a valid {codeLength}-digit code',
      preparingApp: 'Preparing your app...',
      welcomeToTiko: 'Welcome to Tiko',
      signInToAccess: 'Sign in to access your communication apps',
      appleSignInFailed: 'Apple Sign-In failed',
      failedToSendCode: 'Failed to send verification code',
      invalidVerificationCode: 'Invalid verification code',
      failedToResendCode: 'Failed to resend code'
    },
    cards: {
      done: 'Done',
      selectCardsToOrganize: 'Select cards to organize or delete',
      tapCardsToSpeak: 'Tap cards to speak',
      cardsSettings: 'Cards Settings',
      selected: 'selected',
      closeModal: 'Close modal',
      whatShouldBeSpoken: 'What should be spoken when tapped'
    },
    type: {
      typeGameSettings: 'Type Game Settings',
      typeAndSpeak: 'Type & Speak',
      typeTextAndHearItSpoken: 'Type text and hear it spoken aloud',
      textToSpeak: 'Text to speak',
      stop: 'Stop',
      pause: 'Pause',
      voice: 'Voice',
      loadingVoices: 'Loading voices...',
      selectAVoice: 'Select a voice',
      recent: 'Recent',
      speakThisText: 'Speak this text',
      copyToInput: 'Copy to input',
      showAllHistory: 'Show All History',
      voiceSettings: 'Voice Settings',
      speechRate: 'Speech Rate',
      pitch: 'Pitch',
      volume: 'Volume',
      saveToHistoryAutomatically: 'Save to history automatically'
    },
    yesno: {
      yesnoSettings: 'Yes/No Settings',
      typeYourQuestion: 'Type your question here...',
      typeYourQuestionPlaceholder: 'Type your question here...',
      typeYourQuestionOrSelect: 'Type your question or select from recent questions',
      removeFromFavorites: 'Remove from favorites',
      addToFavorites: 'Add to favorites',
      deleteQuestion: 'Delete question',
      buttonSize: 'Button Size',
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
      autoSpeakAnswers: 'Auto-speak answers',
      hapticFeedback: 'Haptic feedback'
    },
    radio: {
      audioTrackTitle: 'Audio track title',
      clear: 'Clear',
      editAudioItem: 'Edit Audio Item',
      noAudioSelected: 'No audio selected',
      play: 'play',
      playAllResults: 'Play All Results',
      plays: 'plays',
      resultsFound: '{count, plural, =0 {No results found} =1 {1 result found} other {{count} results found}}',
      searchAudioPlaceholder: 'Search audio by title, description, or tags...',
      searchingCollection: 'Searching your audio collection...',
      searchingFor: 'Searching for',
      sleepIn: 'Sleep in {minutes}m',
      tryAgain: 'Try Again',
      tryDifferentKeywords: 'Try searching with different keywords or check your spelling.'
    },
    parentMode: {
      enableParentMode: 'Enable Parent Mode',
      setUpParentMode: 'Set Up Parent Mode',
      enterParentPin: 'Enter Parent PIN',
      createPinDescription: 'Create a 4-digit PIN to protect parental controls',
      enterPinDescription: 'Enter your 4-digit PIN to access parent controls',
      parentModeEnabled: 'Parent mode enabled successfully',
      failedToEnable: 'Failed to enable parent mode',
      disableParentMode: 'Disable Parent Mode',
      disableConfirmMessage: 'Are you sure you want to disable Parent Mode? This will remove all parental controls.',
      yesDisable: 'Yes, Disable',
      parentModeDisabled: 'Parent mode disabled',
      failedToDisable: 'Failed to disable parent mode',
      cannotDisableNoPopup: 'Cannot disable parent mode - no popup service available',
      insufficientPermissions: 'Insufficient permissions for this action',
      parentModeUnlocked: 'Parent mode unlocked',
      enterYourPin: 'Confirm your PIN',
      confirmYourPin: 'Confirm your PIN',
      pinMustBe4Digits: 'PIN must be exactly 4 digits',
      hideNumbers: 'Hide Numbers',
      showNumbers: 'Show Numbers'
    },
    validation: {
      onlyOneNumberAllowed: 'Only one number is allowed'
    },
    uiDocs: {
      documentationSettings: 'Documentation Settings',
      buttons: 'Buttons',
      buttonsDocumentation: 'Buttons Documentation',
      cards: 'Cards',
      cardsDocumentation: 'Cards Documentation',
      colors: 'Colors',
      colorsDocumentation: 'Colors Documentation',
      icons: 'Icons',
      iconsDocumentation: 'Icons Documentation',
      inputs: 'Inputs',
      inputsDocumentation: 'Inputs Documentation',
      welcomeToUIDocumentation: 'Welcome to UI Documentation',
      exploreComponents: 'Explore our components',
      comingSoon: 'Coming Soon',
      tikoUIDocumentation: 'Tiko UI Documentation',
      completeDocumentationAndTesting: 'Complete documentation and testing suite for all Tiko UI components',
      interactiveButtonComponents: 'Interactive button components with various styles and states',
      completeIconLibrary: 'Complete icon library with over 1000+ icons',
      inputComponents: 'Input Components',
      formInputsSelectsTextareas: 'Form inputs, selects, textareas and validation',
      contentContainersAndLayouts: 'Content containers and card layouts',
      colorSystem: 'Color System',
      colorPaletteThemes: 'Color palette, themes and semantic colors',
      quickStart: 'Quick Start',
      documentationAppShowcase: 'This documentation app showcases all available UI components in the Tiko design system. Each section demonstrates component usage, props, variants, and best practices.',
      codeExamples: 'Code Examples',
      seeWorkingExamples: 'See working examples with syntax highlighting',
      livePreviews: 'Live Previews',
      interactiveComponentPreviews: 'Interactive component previews',
      documentation: 'Documentation',
      completePropAndUsage: 'Complete prop and usage documentation',
      items: 'items'
    }
  };
}

function updateLocaleFile(locale) {
  const filePath = path.join(__dirname, 'locales', `${locale}.ts`);
  console.log(`\n📄 Processing ${locale}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File ${filePath} does not exist`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const templateKeys = extractEnUSKeys();
  
  // Add missing sections systematically
  Object.entries(templateKeys).forEach(([section, keys]) => {
    Object.entries(keys).forEach(([key, value]) => {
      const placeholder = `${value} [TODO: Translate to ${locale.toUpperCase()}]`;
      
      // Check if key exists in file
      const keyRegex = new RegExp(`${key}:\\s*'[^']*'`);
      if (!keyRegex.test(content)) {
        console.log(`   Adding ${section}.${key}`);
        
        // Find the section and add the key
        const sectionRegex = new RegExp(`(${section}:\\s*{[^}]*)(})`);
        const match = content.match(sectionRegex);
        
        if (match) {
          // Add key to existing section
          const beforeClosing = match[1];
          const lastKey = beforeClosing.match(/([^,\n}]+)$/);
          
          if (lastKey) {
            content = content.replace(
              sectionRegex,
              `${beforeClosing},\n    ${key}: '${placeholder}'\n  $2`
            );
          }
        } else {
          // Section doesn't exist - we'll add it at the end
          console.log(`   Section ${section} not found in ${locale}`);
        }
      }
    });
  });
  
  // Add missing sections entirely (validation, uiDocs)
  if (!content.includes('validation:')) {
    const validationSection = `  validation: {\n    onlyOneNumberAllowed: 'Only one number is allowed [TODO: Translate to ${locale.toUpperCase()}]'\n  },\n`;
    content = content.replace(
      /(\n  sso: {[\s\S]*?}\n)(}\s*$)/,
      `$1  ${validationSection}$2`
    );
  }
  
  if (!content.includes('uiDocs:')) {
    const uiDocsKeys = Object.entries(templateKeys.uiDocs)
      .map(([key, value]) => `    ${key}: '${value} [TODO: Translate to ${locale.toUpperCase()}]'`)
      .join(',\n');
    
    const uiDocsSection = `  uiDocs: {\n${uiDocsKeys}\n  },\n`;
    
    content = content.replace(
      /(\n  sso: {[\s\S]*?},?\n)(}\s*$)/,
      `$1  ${uiDocsSection}$2`
    );
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`   ✅ Updated ${locale}.ts`);
}

// Process all incomplete files
console.log('🚀 Starting batch locale completion...\n');

incompleteFiles.forEach(locale => {
  updateLocaleFile(locale);
});

console.log('\n✅ Batch processing complete!');
console.log('🔍 Run pnpm -w run check:i18n to verify results');