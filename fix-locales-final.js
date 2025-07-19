const fs = require('fs');
const path = require('path');

// Keys to add to locale files
const missingParentModeKeys = {
  enableParentMode: {
    it: 'Abilita modalità genitori',
    nl: 'Ouder modus inschakelen',
    pl: 'Włącz tryb rodzicielski',
    pt: 'Ativar modo parental',
    ru: 'Включить родительский режим',
    sv: 'Aktivera föräldraläge'
  },
  setUpParentMode: {
    it: 'Configura modalità genitori',
    nl: 'Ouder modus instellen',
    pl: 'Ustaw tryb rodzicielski',
    pt: 'Configurar modo parental',
    ru: 'Настроить родительский режим',
    sv: 'Ställ in föräldraläge'
  },
  enterParentPin: {
    it: 'Inserisci PIN genitori',
    nl: 'Voer ouder PIN in',
    pl: 'Wprowadź PIN rodzica',
    pt: 'Introduza PIN parental',
    ru: 'Введите родительский PIN',
    sv: 'Ange föräldra-PIN'
  },
  createPinDescription: {
    it: 'Crea un PIN di 4 cifre per proteggere le funzioni genitori',
    nl: 'Maak een 4-cijferige PIN om ouderfuncties te beschermen',
    pl: 'Utwórz 4-cyfrowy PIN, aby chronić funkcje rodzicielskie',
    pt: 'Crie um PIN de 4 dígitos para proteger as funções parentais',
    ru: 'Создайте 4-значный PIN для защиты родительских функций',
    sv: 'Skapa en 4-siffrig PIN för att skydda föräldrafunktioner'
  },
  enterPinDescription: {
    it: 'Inserisci il tuo PIN per accedere alle funzioni genitori',
    nl: 'Voer je PIN in om toegang te krijgen tot ouderfuncties',
    pl: 'Wprowadź swój PIN, aby uzyskać dostęp do funkcji rodzicielskich',
    pt: 'Introduza o seu PIN para aceder às funções parentais',
    ru: 'Введите PIN для доступа к родительским функциям',
    sv: 'Ange din PIN för att få tillgång till föräldrafunktioner'
  },
  parentModeEnabled: {
    it: 'Modalità genitori abilitata',
    nl: 'Ouder modus ingeschakeld',
    pl: 'Tryb rodzicielski włączony',
    pt: 'Modo parental ativado',
    ru: 'Родительский режим включен',
    sv: 'Föräldraläge aktiverat'
  },
  failedToEnable: {
    it: 'Impossibile abilitare la modalità genitori',
    nl: 'Kan ouder modus niet inschakelen',
    pl: 'Nie udało się włączyć trybu rodzicielskiego',
    pt: 'Falha ao ativar o modo parental',
    ru: 'Не удалось включить родительский режим',
    sv: 'Kunde inte aktivera föräldraläge'
  },
  disableParentMode: {
    it: 'Disabilita modalità genitori',
    nl: 'Ouder modus uitschakelen',
    pl: 'Wyłącz tryb rodzicielski',
    pt: 'Desativar modo parental',
    ru: 'Отключить родительский режим',
    sv: 'Inaktivera föräldraläge'
  },
  disableConfirmMessage: {
    it: 'Sei sicuro di voler disabilitare la modalità genitori?',
    nl: 'Weet je zeker dat je de ouder modus wilt uitschakelen?',
    pl: 'Czy na pewno chcesz wyłączyć tryb rodzicielski?',
    pt: 'Tem a certeza que deseja desativar o modo parental?',
    ru: 'Вы уверены, что хотите отключить родительский режим?',
    sv: 'Är du säker på att du vill inaktivera föräldraläge?'
  },
  yesDisable: {
    it: 'Sì, disabilita',
    nl: 'Ja, uitschakelen',
    pl: 'Tak, wyłącz',
    pt: 'Sim, desativar',
    ru: 'Да, отключить',
    sv: 'Ja, inaktivera'
  },
  parentModeDisabled: {
    it: 'Modalità genitori disabilitata',
    nl: 'Ouder modus uitgeschakeld',
    pl: 'Tryb rodzicielski wyłączony',
    pt: 'Modo parental desativado',
    ru: 'Родительский режим отключен',
    sv: 'Föräldraläge inaktiverat'
  },
  failedToDisable: {
    it: 'Impossibile disabilitare la modalità genitori',
    nl: 'Kan ouder modus niet uitschakelen',
    pl: 'Nie udało się wyłączyć trybu rodzicielskiego',
    pt: 'Falha ao desativar o modo parental',
    ru: 'Не удалось отключить родительский режим',
    sv: 'Kunde inte inaktivera föräldraläge'
  },
  cannotDisableNoPopup: {
    it: 'Impossibile disabilitare la modalità genitori senza popup',
    nl: 'Kan ouder modus niet uitschakelen zonder popup',
    pl: 'Nie można wyłączyć trybu rodzicielskiego bez okna dialogowego',
    pt: 'Não é possível desativar o modo parental sem popup',
    ru: 'Невозможно отключить родительский режим без всплывающего окна',
    sv: 'Kan inte inaktivera föräldraläge utan popup'
  },
  insufficientPermissions: {
    it: 'Permessi insufficienti',
    nl: 'Onvoldoende rechten',
    pl: 'Niewystarczające uprawnienia',
    pt: 'Permissões insuficientes',
    ru: 'Недостаточно прав',
    sv: 'Otillräckliga behörigheter'
  },
  parentModeUnlocked: {
    it: 'Modalità genitori sbloccata',
    nl: 'Ouder modus ontgrendeld',
    pl: 'Tryb rodzicielski odblokowany',
    pt: 'Modo parental desbloqueado',
    ru: 'Родительский режим разблокирован',
    sv: 'Föräldraläge upplåst'
  },
  enterYourPin: {
    it: 'Inserisci il tuo PIN',
    nl: 'Voer je PIN in',
    pl: 'Wprowadź swój PIN',
    pt: 'Introduza o seu PIN',
    ru: 'Введите ваш PIN',
    sv: 'Ange din PIN'
  },
  confirmYourPin: {
    it: 'Conferma il tuo PIN',
    nl: 'Bevestig je PIN',
    pl: 'Potwierdź swój PIN',
    pt: 'Confirme o seu PIN',
    ru: 'Подтвердите ваш PIN',
    sv: 'Bekräfta din PIN'
  },
  pinMustBe4Digits: {
    it: 'Il PIN deve essere di 4 cifre',
    nl: 'PIN moet 4 cijfers zijn',
    pl: 'PIN musi mieć 4 cyfry',
    pt: 'O PIN deve ter 4 dígitos',
    ru: 'PIN должен быть 4 цифры',
    sv: 'PIN måste vara 4 siffror'
  },
  hideNumbers: {
    it: 'Nascondi numeri',
    nl: 'Verberg nummers',
    pl: 'Ukryj numery',
    pt: 'Ocultar números',
    ru: 'Скрыть цифры',
    sv: 'Dölj siffror'
  },
  showNumbers: {
    it: 'Mostra numeri',
    nl: 'Toon nummers',
    pl: 'Pokaż numery',
    pt: 'Mostrar números',
    ru: 'Показать цифры',
    sv: 'Visa siffror'
  }
};

const missingYesNoKeys = {
  yesnoSettings: {
    it: 'Impostazioni Sì/No',
    nl: 'Ja/Nee instellingen',
    pl: 'Ustawienia Tak/Nie',
    pt: 'Definições Sim/Não',
    ru: 'Настройки Да/Нет',
    sv: 'Ja/Nej inställningar'
  },
  typeYourQuestion: {
    it: 'Scrivi la tua domanda',
    nl: 'Typ je vraag',
    pl: 'Wpisz swoje pytanie',
    pt: 'Escreva a sua pergunta',
    ru: 'Введите ваш вопрос',
    sv: 'Skriv din fråga'
  },
  typeYourQuestionPlaceholder: {
    it: 'Es. Vuoi giocare?',
    nl: 'Bijv. Wil je spelen?',
    pl: 'Np. Chcesz się bawić?',
    pt: 'Ex. Queres brincar?',
    ru: 'Напр. Хочешь играть?',
    sv: 'T.ex. Vill du leka?'
  },
  typeYourQuestionOrSelect: {
    it: 'Scrivi la tua domanda o seleziona dalle recenti',
    nl: 'Typ je vraag of selecteer uit recente',
    pl: 'Wpisz swoje pytanie lub wybierz z ostatnich',
    pt: 'Escreva a sua pergunta ou selecione das recentes',
    ru: 'Введите вопрос или выберите из недавних',
    sv: 'Skriv din fråga eller välj från senaste'
  },
  removeFromFavorites: {
    it: 'Rimuovi dai preferiti',
    nl: 'Verwijder uit favorieten',
    pl: 'Usuń z ulubionych',
    pt: 'Remover dos favoritos',
    ru: 'Удалить из избранного',
    sv: 'Ta bort från favoriter'
  },
  addToFavorites: {
    it: 'Aggiungi ai preferiti',
    nl: 'Toevoegen aan favorieten',
    pl: 'Dodaj do ulubionych',
    pt: 'Adicionar aos favoritos',
    ru: 'Добавить в избранное',
    sv: 'Lägg till i favoriter'
  },
  deleteQuestion: {
    it: 'Elimina domanda',
    nl: 'Verwijder vraag',
    pl: 'Usuń pytanie',
    pt: 'Eliminar pergunta',
    ru: 'Удалить вопрос',
    sv: 'Ta bort fråga'
  },
  buttonSize: {
    it: 'Dimensione pulsante',
    nl: 'Knopgrootte',
    pl: 'Rozmiar przycisku',
    pt: 'Tamanho do botão',
    ru: 'Размер кнопки',
    sv: 'Knappstorlek'
  },
  small: {
    it: 'Piccolo',
    nl: 'Klein',
    pl: 'Mały',
    pt: 'Pequeno',
    ru: 'Маленький',
    sv: 'Liten'
  },
  medium: {
    it: 'Medio',
    nl: 'Middel',
    pl: 'Średni',
    pt: 'Médio',
    ru: 'Средний',
    sv: 'Mellan'
  },
  large: {
    it: 'Grande',
    nl: 'Groot',
    pl: 'Duży',
    pt: 'Grande',
    ru: 'Большой',
    sv: 'Stor'
  },
  autoSpeakAnswers: {
    it: 'Pronuncia automatica risposte',
    nl: 'Automatisch antwoorden uitspreken',
    pl: 'Automatyczne mówienie odpowiedzi',
    pt: 'Falar respostas automaticamente',
    ru: 'Автоматически произносить ответы',
    sv: 'Tala svar automatiskt'
  },
  hapticFeedback: {
    it: 'Feedback aptico',
    nl: 'Haptische feedback',
    pl: 'Sprzężenie haptyczne',
    pt: 'Feedback háptico',
    ru: 'Тактильная обратная связь',
    sv: 'Haptisk återkoppling'
  }
};

const radioClearKey = {
  clear: {
    it: 'Cancella',
    nl: 'Wissen',
    pl: 'Wyczyść',
    pt: 'Limpar',
    ru: 'Очистить',
    sv: 'Rensa'
  }
};

// Keys to remove from locale files
const keysToRemove = [
  'cards.editAudioTrack',
  'parentMode.confirmCode',
  'parentMode.createSecureCode',
  'parentMode.enterCode',
  'parentMode.failedAttempts',
  'parentMode.lockedContent'
];

// Process each locale
const locales = ['it', 'nl', 'pl', 'pt', 'ru', 'sv'];

locales.forEach(locale => {
  const filePath = path.join(__dirname, `packages/ui/src/i18n/locales/${locale}.ts`);
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove extra keys
  keysToRemove.forEach(keyPath => {
    const [section, key] = keyPath.split('.');
    const keyRegex = new RegExp(`    ${key}: '[^']*',?\\n`, 'g');
    content = content.replace(keyRegex, '');
  });

  // Add missing parent mode keys
  const parentModeMatch = content.match(/  parentMode: \{([^}]+)\}/s);
  if (parentModeMatch) {
    let parentModeContent = parentModeMatch[1];
    
    Object.keys(missingParentModeKeys).forEach(key => {
      if (!parentModeContent.includes(`${key}:`)) {
        const lastCommaIndex = parentModeContent.lastIndexOf(',');
        if (lastCommaIndex > 0) {
          parentModeContent = parentModeContent.substring(0, lastCommaIndex + 1) + 
            `\n    ${key}: '${missingParentModeKeys[key][locale]}',` + 
            parentModeContent.substring(lastCommaIndex + 1);
        }
      }
    });

    content = content.replace(parentModeMatch[0], `  parentMode: {${parentModeContent}}`);
  }

  // Add missing yesno keys
  const yesnoMatch = content.match(/  yesno: \{([^}]+)\}/s);
  if (yesnoMatch) {
    let yesnoContent = yesnoMatch[1];
    
    Object.keys(missingYesNoKeys).forEach(key => {
      if (!yesnoContent.includes(`${key}:`)) {
        const lastCommaIndex = yesnoContent.lastIndexOf(',');
        if (lastCommaIndex > 0) {
          yesnoContent = yesnoContent.substring(0, lastCommaIndex + 1) + 
            `\n    ${key}: '${missingYesNoKeys[key][locale]}',` + 
            yesnoContent.substring(lastCommaIndex + 1);
        }
      }
    });

    content = content.replace(yesnoMatch[0], `  yesno: {${yesnoContent}}`);
  }

  // Add missing radio.clear key
  const radioMatch = content.match(/  radio: \{([^}]+)\}/s);
  if (radioMatch) {
    let radioContent = radioMatch[1];
    
    if (!radioContent.includes('clear:')) {
      const lastCommaIndex = radioContent.lastIndexOf(',');
      if (lastCommaIndex > 0) {
        radioContent = radioContent.substring(0, lastCommaIndex + 1) + 
          `\n    clear: '${radioClearKey.clear[locale]}',` + 
          radioContent.substring(lastCommaIndex + 1);
      }
    }

    content = content.replace(radioMatch[0], `  radio: {${radioContent}}`);
  }

  // Write back the file
  fs.writeFileSync(filePath, content);
  console.log(`✅ Fixed ${locale}.ts`);
});

console.log('\nDone! All locale files have been fixed.');