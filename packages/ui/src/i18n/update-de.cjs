#!/usr/bin/env node

// Quick script to add missing keys to de.ts
const fs = require('fs');
const path = require('path');

// Missing keys from the i18n check for de.ts
const missingKeys = [
  'cards.cardsSettings',
  'cards.closeModal', 
  'cards.done',
  'cards.selectCardsToOrganize',
  'cards.selected',
  'cards.tapCardsToSpeak',
  'cards.whatShouldBeSpoken',
  'parentMode.cannotDisableNoPopup',
  'parentMode.confirmYourPin',
  'parentMode.createPinDescription',
  'parentMode.disableConfirmMessage',
  'parentMode.disableParentMode',
  'parentMode.enableParentMode',
  'parentMode.enterParentPin',
  'parentMode.enterPinDescription',
  'parentMode.enterYourPin',
  'parentMode.failedToDisable',
  'parentMode.failedToEnable',
  'parentMode.hideNumbers',
  'parentMode.insufficientPermissions',
  'parentMode.parentModeDisabled',
  'parentMode.parentModeEnabled',
  'parentMode.parentModeUnlocked',
  'parentMode.pinMustBe4Digits',
  'parentMode.setUpParentMode',
  'parentMode.showNumbers',
  'parentMode.yesDisable',
  'radio.audioTrackTitle',
  'radio.clear',
  'radio.editAudioItem',
  'radio.noAudioSelected',
  'radio.play',
  'radio.playAllResults',
  'radio.plays',
  'radio.resultsFound',
  'radio.searchAudioPlaceholder',
  'radio.searchingCollection',
  'radio.searchingFor',
  'radio.sleepIn',
  'radio.tryAgain',
  'radio.tryDifferentKeywords',
  'type.copyToInput',
  'type.loadingVoices',
  'type.pause',
  'type.pitch',
  'type.recent',
  'type.saveToHistoryAutomatically',
  'type.selectAVoice',
  'type.showAllHistory',
  'type.speakThisText',
  'type.speechRate',
  'type.stop',
  'type.textToSpeak',
  'type.typeAndSpeak',
  'type.typeGameSettings',
  'type.typeTextAndHearItSpoken',
  'type.voice',
  'type.voiceSettings',
  'type.volume',
  'uiDocs.buttons',
  'uiDocs.buttonsDocumentation',
  'uiDocs.cards',
  'uiDocs.cardsDocumentation',
  'uiDocs.codeExamples',
  'uiDocs.colorPaletteThemes',
  'uiDocs.colorSystem',
  'uiDocs.colors',
  'uiDocs.colorsDocumentation',
  'uiDocs.comingSoon',
  'uiDocs.completeDocumentationAndTesting',
  'uiDocs.completeIconLibrary',
  'uiDocs.completePropAndUsage',
  'uiDocs.contentContainersAndLayouts',
  'uiDocs.documentation',
  'uiDocs.documentationAppShowcase',
  'uiDocs.documentationSettings',
  'uiDocs.exploreComponents',
  'uiDocs.formInputsSelectsTextareas',
  'uiDocs.icons',
  'uiDocs.iconsDocumentation',
  'uiDocs.inputComponents',
  'uiDocs.inputs',
  'uiDocs.inputsDocumentation',
  'uiDocs.interactiveButtonComponents',
  'uiDocs.interactiveComponentPreviews',
  'uiDocs.items',
  'uiDocs.livePreviews',
  'uiDocs.quickStart',
  'uiDocs.seeWorkingExamples',
  'uiDocs.tikoUIDocumentation',
  'uiDocs.welcomeToUIDocumentation',
  'validation.onlyOneNumberAllowed',
  'yesno.addToFavorites',
  'yesno.autoSpeakAnswers',
  'yesno.buttonSize',
  'yesno.deleteQuestion',
  'yesno.hapticFeedback',
  'yesno.large',
  'yesno.medium',
  'yesno.removeFromFavorites',
  'yesno.small',
  'yesno.typeYourQuestion',
  'yesno.typeYourQuestionOrSelect',
  'yesno.typeYourQuestionPlaceholder',
  'yesno.yesnoSettings'
];

// Load en-US to get the English values
const enUSContent = fs.readFileSync(path.join(__dirname, 'locales/en-US.ts'), 'utf8');
const deContent = fs.readFileSync(path.join(__dirname, 'locales/de.ts'), 'utf8');

console.log('Adding missing keys to de.ts...');

// Read the en-US file to extract key values
const enUSMatch = enUSContent.match(/export const enUS: TranslationSchema = ({[\s\S]*})\s*$/);
if (!enUSMatch) {
  console.error('Could not parse en-US file');
  process.exit(1);
}

// Use simple regex to extract values for missing keys
function getEnglishValue(key) {
  const keyParts = key.split('.');
  const lastPart = keyParts[keyParts.length - 1];
  
  // Simple extraction of the value
  const regex = new RegExp(`${lastPart}:\\s*'([^']*)'`);
  const match = enUSContent.match(regex);
  return match ? match[1] : key; // fallback to key name if not found
}

// Generate the missing keys with German TODO markers
let additions = '';

// Group by section
const sections = {
  cards: [],
  parentMode: [],
  radio: [],
  type: [],
  uiDocs: [],
  validation: [],
  yesno: []
};

missingKeys.forEach(key => {
  const section = key.split('.')[0];
  const keyName = key.split('.')[1];
  const englishValue = getEnglishValue(key);
  
  if (sections[section]) {
    sections[section].push(`    ${keyName}: '${englishValue} [TODO: Translate to German]'`);
  }
});

let updatedContent = deContent;

// Add missing cards keys
if (sections.cards.length > 0) {
  const cardsInsert = sections.cards.join(',\n') + ',';
  updatedContent = updatedContent.replace(
    /(clear: 'Löschen')\n  },/,
    `$1,\n${cardsInsert}\n  },`
  );
}

// Add missing type keys
if (sections.type.length > 0) {
  const typeInsert = sections.type.join(',\n') + ',';
  updatedContent = updatedContent.replace(
    /(characters: 'Zeichen')\n  },/,
    `$1,\n${typeInsert}\n  },`
  );
}

// Add missing yesno keys
if (sections.yesno.length > 0) {
  const yesnoInsert = sections.yesno.join(',\n') + ',';
  updatedContent = updatedContent.replace(
    /(yesOrNo: 'Ja oder Nein')\n  },/,
    `$1,\n${yesnoInsert}\n  },`
  );
}

// Add missing radio keys
if (sections.radio.length > 0) {
  const radioInsert = sections.radio.join(',\n') + ',';
  updatedContent = updatedContent.replace(
    /(add: 'Hinzufügen')\n  },/,
    `$1,\n${radioInsert}\n  },`
  );
}

// Add missing parentMode keys
if (sections.parentMode.length > 0) {
  const parentModeInsert = sections.parentMode.join(',\n') + ',';
  updatedContent = updatedContent.replace(
    /(setupSuccess: 'Elternmodus wurde erfolgreich eingerichtet')\n  },/,
    `$1,\n${parentModeInsert}\n  },`
  );
}

// Add validation and uiDocs sections at the end
let endAdditions = '';
if (sections.validation.length > 0) {
  endAdditions += `  validation: {\n${sections.validation.join(',\n')}\n  },\n`;
}
if (sections.uiDocs.length > 0) {
  endAdditions += `  uiDocs: {\n${sections.uiDocs.join(',\n')}\n  },\n`;
}

if (endAdditions) {
  updatedContent = updatedContent.replace(
    /(\n  sso: {[\s\S]*?}\n)(}\s*$)/,
    `$1  ${endAdditions.trim()}\n$2`
  );
}

// Write the updated file
fs.writeFileSync(path.join(__dirname, 'locales/de.ts'), updatedContent);
console.log('✅ Updated de.ts with missing keys');