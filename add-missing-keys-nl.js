const fs = require('fs');
const path = require('path');

// Read the Dutch file
const nlPath = path.join(__dirname, 'packages/ui/src/i18n/locales/nl.ts');
let nlContent = fs.readFileSync(nlPath, 'utf8');

// Missing keys to add to Dutch locale
const missingKeys = {
  common: {
    applicationLoading: 'Applicatie laden',
    day: 'Dag',
    month: 'Maand', 
    searchIcons: 'Zoek iconen...',
    backgroundImage: 'Achtergrondafbeelding',
    preview: 'Voorbeeld',
    justNow: 'Zojuist',
    minutesAgo: '{count}m geleden',
    hoursAgo: '{count}u geleden',
    daysAgo: '{count}d geleden',
    more: 'meer',
    dismiss: 'Sluiten',
    required: 'Verplicht',
    optional: 'Optioneel',
    dragDropHere: 'of sleep en zet hier neer',
    increaseValue: 'Waarde verhogen',
    decreaseValue: 'Waarde verlagen',
    online: 'Online',
    offline: 'Offline',
    expandGroup: 'Groep uitvouwen',
    collapseGroup: 'Groep samenvouwen'
  },
  auth: {
    loginToAccount: 'Log in op je account',
    emailAddress: 'E-mailadres',
    enterEmail: 'Voer je e-mail in',
    sendCode: 'Code verzenden',
    or: 'of',
    loginWithApple: 'Inloggen met Apple',
    dontHaveAccount: 'Heb je geen account?',
    register: 'Registreren',
    option1MagicLink: 'Optie 1: Klik op de magische link in je e-mail',
    option2EnterCode: 'Optie 2: Voer de {codeLength}-cijferige code in',
    verificationCode: 'Verificatiecode',
    enterDigitCode: 'Voer de {codeLength}-cijferige code in',
    verifyCode: 'Code verifiëren',
    didntReceiveCode: 'Code niet ontvangen?',
    resendCode: 'Opnieuw versturen',
    useDifferentEmail: 'Gebruik een ander e-mailadres',
    createAccount: 'Maak je account aan',
    fullNameOptional: 'Volledige naam (Optioneel)',
    enterFullName: 'Voer je volledige naam in',
    alreadyHaveAccount: 'Heb je al een account?',
    tryAgain: 'Probeer opnieuw',
    pleaseEnterValidEmail: 'Voer een geldig e-mailadres in',
    pleaseEnterValidCode: 'Voer een geldige {codeLength}-cijferige code in',
    preparingApp: 'Je app wordt voorbereid...',
    welcomeToTiko: 'Welkom bij Tiko',
    signInToAccess: 'Log in om toegang te krijgen tot je communicatie-apps',
    appleSignInFailed: 'Inloggen met Apple mislukt',
    failedToSendCode: 'Verzenden van verificatiecode mislukt',
    invalidVerificationCode: 'Ongeldige verificatiecode',
    failedToResendCode: 'Opnieuw verzenden van code mislukt'
  },
  cards: {
    done: 'Klaar',
    selectCardsToOrganize: 'Selecteer kaarten om te organiseren of verwijderen',
    tapCardsToSpeak: 'Tik op kaarten om te spreken',
    cardsSettings: 'Kaarten instellingen',
    selected: 'geselecteerd',
    closeModal: 'Venster sluiten',
    whatShouldBeSpoken: 'Wat moet er gezegd worden wanneer aangetikt',
    editAudioTrack: 'Audiotrack bewerken'
  },
  type: {
    typeGameSettings: 'Type spel instellingen',
    typeAndSpeak: 'Typ en spreek',
    typeTextAndHearItSpoken: 'Typ tekst en hoor het hardop uitgesproken',
    textToSpeak: 'Tekst om uit te spreken',
    stop: 'Stop',
    pause: 'Pauze',
    voice: 'Stem',
    loadingVoices: 'Stemmen laden...',
    selectAVoice: 'Selecteer een stem',
    recent: 'Recent',
    speakThisText: 'Spreek deze tekst uit',
    copyToInput: 'Kopieer naar invoer',
    showAllHistory: 'Toon alle geschiedenis',
    voiceSettings: 'Steminstellingen',
    speechRate: 'Spreeksnelheid',
    pitch: 'Toonhoogte',
    volume: 'Volume',
    saveToHistoryAutomatically: 'Automatisch opslaan in geschiedenis'
  },
  radio: {
    tryAgain: 'Probeer opnieuw',
    editAudioItem: 'Audio-item bewerken',
    audioTrackTitle: 'Audiotrack titel',
    plays: 'afspelingen',
    noAudioSelected: 'Geen audio geselecteerd',
    sleepIn: 'Slaap over {minutes}m',
    searchingFor: 'Zoeken naar',
    resultsFound: '{count, plural, =0 {Geen resultaten gevonden} =1 {1 resultaat gevonden} other {{count} resultaten gevonden}}',
    searchingCollection: 'Je audiocollectie doorzoeken...',
    tryDifferentKeywords: 'Probeer te zoeken met andere trefwoorden of controleer je spelling.',
    play: 'afspelen',
    playAllResults: 'Alle resultaten afspelen',
    searchAudioPlaceholder: 'Zoek audio op titel, beschrijving of tags...'
  },
  parentMode: {
    enterCode: 'Voer je 4-cijferige PIN-code in',
    createSecureCode: 'Maak een veilige 4-cijferige PIN-code',
    confirmCode: 'Bevestig je PIN-code',
    lockedContent: 'Deze inhoud is vergrendeld',
    failedAttempts: 'Te veel mislukte pogingen. Probeer het opnieuw over {seconds} seconden.'
  }
};

// Function to add keys to a section
function addKeysToSection(content, sectionName, keys) {
  // Find the section
  const sectionRegex = new RegExp(`(${sectionName}:\\s*{)([^}]*)(})`, 's');
  const match = content.match(sectionRegex);
  
  if (match) {
    let sectionContent = match[2];
    let addedKeys = [];
    
    // Add each missing key
    Object.entries(keys).forEach(([key, value]) => {
      // Check if key already exists
      const keyRegex = new RegExp(`\\b${key}:`);
      if (!keyRegex.test(sectionContent)) {
        addedKeys.push(`    ${key}: '${value}'`);
      }
    });
    
    if (addedKeys.length > 0) {
      // Add comma to last existing item if needed
      sectionContent = sectionContent.trimEnd();
      if (!sectionContent.endsWith(',')) {
        sectionContent += ',';
      }
      
      // Add new keys
      sectionContent += '\\n' + addedKeys.join(',\\n') + '\\n  ';
      
      // Replace the section
      content = content.replace(match[0], match[1] + sectionContent + match[3]);
      console.log(`Added ${addedKeys.length} keys to ${sectionName}`);
    }
  }
  
  return content;
}

// Add missing keys to each section
Object.entries(missingKeys).forEach(([section, keys]) => {
  nlContent = addKeysToSection(nlContent, section, keys);
});

// Write the updated content
fs.writeFileSync(nlPath, nlContent);
console.log('✅ Updated nl.ts with all missing keys');