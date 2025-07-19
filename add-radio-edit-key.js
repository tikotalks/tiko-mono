const fs = require('fs');
const path = require('path');

const radioEditAudioTrack = {
  it: 'Modifica traccia audio',
  nl: 'Audiotrack bewerken',
  pl: 'Edytuj ścieżkę audio',
  pt: 'Editar faixa de áudio',
  ru: 'Редактировать аудиотрек',
  sv: 'Redigera ljudspår'
};

const locales = ['it', 'nl', 'pl', 'pt', 'ru', 'sv'];

locales.forEach(locale => {
  const filePath = path.join(__dirname, `packages/ui/src/i18n/locales/${locale}.ts`);
  let content = fs.readFileSync(filePath, 'utf8');

  // Find radio section and add editAudioTrack after editAudioItem
  const radioMatch = content.match(/  radio: \{([^}]+)\}/s);
  if (radioMatch) {
    let radioContent = radioMatch[1];
    
    // Add editAudioTrack after editAudioItem
    radioContent = radioContent.replace(
      /editAudioItem: '[^']*',/,
      `editAudioItem: $&\n    editAudioTrack: '${radioEditAudioTrack[locale]}',`
    );

    content = content.replace(radioMatch[0], `  radio: {${radioContent}}`);
  }

  fs.writeFileSync(filePath, content);
  console.log(`✅ Added editAudioTrack to ${locale}.ts`);
});

console.log('\nDone! Added radio.editAudioTrack to all locale files.');