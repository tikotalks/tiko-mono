const fs = require('fs');
const path = require('path');

// Read the English US file as the reference
const enUSPath = path.join(__dirname, 'packages/ui/src/i18n/locales/en-US.ts');
const enUSContent = fs.readFileSync(enUSPath, 'utf8');

// Extract the translation object from en-US
const enUSMatch = enUSContent.match(/export const enUS: TranslationSchema = ({[\s\S]*});/);
if (!enUSMatch) {
  console.error('Could not parse en-US translations');
  process.exit(1);
}

// List of locale files to update
const localeFiles = [
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'sv', name: 'Swedish' }
];

// Additional keys to add to each section
const additionalKeys = {
  common: {
    required: '[TODO: Translate to {lang}]',
    optional: '[TODO: Translate to {lang}]',
    dragDropHere: '[TODO: Translate to {lang}]',
    increaseValue: '[TODO: Translate to {lang}]',
    decreaseValue: '[TODO: Translate to {lang}]',
    online: '[TODO: Translate to {lang}]',
    offline: '[TODO: Translate to {lang}]',
    expandGroup: '[TODO: Translate to {lang}]',
    collapseGroup: '[TODO: Translate to {lang}]'
  },
  auth: {
    loginToAccount: '[TODO: Translate to {lang}]',
    emailAddress: '[TODO: Translate to {lang}]',
    enterEmail: '[TODO: Translate to {lang}]',
    sendCode: '[TODO: Translate to {lang}]',
    or: '[TODO: Translate to {lang}]',
    loginWithApple: '[TODO: Translate to {lang}]',
    dontHaveAccount: '[TODO: Translate to {lang}]',
    register: '[TODO: Translate to {lang}]',
    option1MagicLink: '[TODO: Translate to {lang}]',
    option2EnterCode: '[TODO: Translate to {lang}]',
    verificationCode: '[TODO: Translate to {lang}]',
    enterDigitCode: '[TODO: Translate to {lang}]',
    verifyCode: '[TODO: Translate to {lang}]',
    didntReceiveCode: '[TODO: Translate to {lang}]',
    resendCode: '[TODO: Translate to {lang}]',
    useDifferentEmail: '[TODO: Translate to {lang}]',
    createAccount: '[TODO: Translate to {lang}]',
    fullNameOptional: '[TODO: Translate to {lang}]',
    enterFullName: '[TODO: Translate to {lang}]',
    alreadyHaveAccount: '[TODO: Translate to {lang}]',
    tryAgain: '[TODO: Translate to {lang}]',
    pleaseEnterValidEmail: '[TODO: Translate to {lang}]',
    pleaseEnterValidCode: '[TODO: Translate to {lang}]',
    preparingApp: '[TODO: Translate to {lang}]',
    welcomeToTiko: '[TODO: Translate to {lang}]',
    signInToAccess: '[TODO: Translate to {lang}]',
    appleSignInFailed: '[TODO: Translate to {lang}]',
    failedToSendCode: '[TODO: Translate to {lang}]',
    invalidVerificationCode: '[TODO: Translate to {lang}]',
    failedToResendCode: '[TODO: Translate to {lang}]'
  },
  cards: {
    done: '[TODO: Translate to {lang}]',
    selectCardsToOrganize: '[TODO: Translate to {lang}]',
    tapCardsToSpeak: '[TODO: Translate to {lang}]',
    cardsSettings: '[TODO: Translate to {lang}]',
    selected: '[TODO: Translate to {lang}]',
    closeModal: '[TODO: Translate to {lang}]',
    whatShouldBeSpoken: '[TODO: Translate to {lang}]',
    editAudioTrack: '[TODO: Translate to {lang}]'
  },
  type: {
    typeGameSettings: '[TODO: Translate to {lang}]',
    typeAndSpeak: '[TODO: Translate to {lang}]',
    typeTextAndHearItSpoken: '[TODO: Translate to {lang}]',
    textToSpeak: '[TODO: Translate to {lang}]',
    stop: '[TODO: Translate to {lang}]',
    pause: '[TODO: Translate to {lang}]',
    voice: '[TODO: Translate to {lang}]',
    loadingVoices: '[TODO: Translate to {lang}]',
    selectAVoice: '[TODO: Translate to {lang}]',
    recent: '[TODO: Translate to {lang}]',
    speakThisText: '[TODO: Translate to {lang}]',
    copyToInput: '[TODO: Translate to {lang}]',
    showAllHistory: '[TODO: Translate to {lang}]',
    voiceSettings: '[TODO: Translate to {lang}]',
    speechRate: '[TODO: Translate to {lang}]',
    pitch: '[TODO: Translate to {lang}]',
    volume: '[TODO: Translate to {lang}]',
    saveToHistoryAutomatically: '[TODO: Translate to {lang}]'
  },
  radio: {
    tryAgain: '[TODO: Translate to {lang}]',
    editAudioItem: '[TODO: Translate to {lang}]',
    audioTrackTitle: '[TODO: Translate to {lang}]',
    plays: '[TODO: Translate to {lang}]',
    noAudioSelected: '[TODO: Translate to {lang}]',
    sleepIn: '[TODO: Translate to {lang}]',
    searchingFor: '[TODO: Translate to {lang}]',
    resultsFound: '[TODO: Translate to {lang}]',
    searchingCollection: '[TODO: Translate to {lang}]',
    tryDifferentKeywords: '[TODO: Translate to {lang}]',
    play: '[TODO: Translate to {lang}]',
    playAllResults: '[TODO: Translate to {lang}]',
    searchAudioPlaceholder: '[TODO: Translate to {lang}]'
  },
  parentMode: {
    enterCode: '[TODO: Translate to {lang}]',
    createSecureCode: '[TODO: Translate to {lang}]',
    confirmCode: '[TODO: Translate to {lang}]',
    lockedContent: '[TODO: Translate to {lang}]',
    failedAttempts: '[TODO: Translate to {lang}]'
  },
  validation: {
    onlyOneNumberAllowed: '[TODO: Translate to {lang}]'
  },
  uiDocs: {
    documentationSettings: '[TODO: Translate to {lang}]',
    buttons: '[TODO: Translate to {lang}]',
    buttonsDocumentation: '[TODO: Translate to {lang}]',
    cards: '[TODO: Translate to {lang}]',
    cardsDocumentation: '[TODO: Translate to {lang}]',
    colors: '[TODO: Translate to {lang}]',
    colorsDocumentation: '[TODO: Translate to {lang}]',
    icons: '[TODO: Translate to {lang}]',
    iconsDocumentation: '[TODO: Translate to {lang}]',
    inputs: '[TODO: Translate to {lang}]',
    inputsDocumentation: '[TODO: Translate to {lang}]',
    welcomeToUIDocumentation: '[TODO: Translate to {lang}]',
    exploreComponents: '[TODO: Translate to {lang}]',
    comingSoon: '[TODO: Translate to {lang}]',
    tikoUIDocumentation: '[TODO: Translate to {lang}]',
    completeDocumentationAndTesting: '[TODO: Translate to {lang}]',
    interactiveButtonComponents: '[TODO: Translate to {lang}]',
    completeIconLibrary: '[TODO: Translate to {lang}]',
    inputComponents: '[TODO: Translate to {lang}]',
    formInputsSelectsTextareas: '[TODO: Translate to {lang}]',
    contentContainersAndLayouts: '[TODO: Translate to {lang}]',
    colorSystem: '[TODO: Translate to {lang}]',
    colorPaletteThemes: '[TODO: Translate to {lang}]',
    quickStart: '[TODO: Translate to {lang}]',
    documentationAppShowcase: '[TODO: Translate to {lang}]',
    codeExamples: '[TODO: Translate to {lang}]',
    seeWorkingExamples: '[TODO: Translate to {lang}]',
    livePreviews: '[TODO: Translate to {lang}]',
    interactiveComponentPreviews: '[TODO: Translate to {lang}]',
    documentation: '[TODO: Translate to {lang}]',
    completePropAndUsage: '[TODO: Translate to {lang}]',
    items: '[TODO: Translate to {lang}]'
  }
};

// Process each locale file
localeFiles.forEach(({ code, name }) => {
  const filePath = path.join(__dirname, `packages/ui/src/i18n/locales/${code}.ts`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // For each section and key, check if it exists and add if missing
    Object.entries(additionalKeys).forEach(([section, keys]) => {
      // Check if section exists
      const sectionRegex = new RegExp(`${section}:\\s*{[^}]*}`, 's');
      const sectionMatch = content.match(sectionRegex);
      
      if (sectionMatch) {
        let sectionContent = sectionMatch[0];
        
        // Add missing keys to the section
        Object.entries(keys).forEach(([key, value]) => {
          const keyRegex = new RegExp(`\\b${key}:`);
          if (!keyRegex.test(sectionContent)) {
            // Replace placeholder with language name
            const localizedValue = value.replace('{lang}', name);
            
            // Find the closing brace of the section and add the key before it
            const lastCommaOrBrace = sectionContent.lastIndexOf('}');
            const hasTrailingComma = sectionContent.substring(0, lastCommaOrBrace).trim().endsWith(',');
            
            if (!hasTrailingComma && sectionContent.substring(0, lastCommaOrBrace).trim().length > section.length + 3) {
              sectionContent = sectionContent.substring(0, lastCommaOrBrace) + ',\n    ' + key + ': \'' + localizedValue + '\'\n  }';
            } else {
              sectionContent = sectionContent.substring(0, lastCommaOrBrace) + '    ' + key + ': \'' + localizedValue + '\',\n  }';
            }
          }
        });
        
        // Replace the section in the content
        content = content.replace(sectionMatch[0], sectionContent);
      } else if (section === 'validation' || section === 'uiDocs') {
        // Add the entire section if it doesn't exist
        const ssoMatch = content.match(/sso:\s*{[^}]*}/s);
        if (ssoMatch) {
          const ssoEndIndex = content.indexOf(ssoMatch[0]) + ssoMatch[0].length;
          const sectionKeys = Object.entries(keys).map(([key, value]) => {
            const localizedValue = value.replace('{lang}', name);
            return `    ${key}: '${localizedValue}'`;
          }).join(',\n');
          
          const newSection = `,\n  ${section}: {\n${sectionKeys}\n  }`;
          content = content.substring(0, ssoEndIndex) + newSection + content.substring(ssoEndIndex);
        }
      }
    });
    
    // Write the updated content back
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${code}.ts (${name})`);
    
  } catch (error) {
    console.error(`❌ Error updating ${code}.ts:`, error.message);
  }
});

console.log('\\nDone! All locale files have been updated with missing keys.');