#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Comprehensive translations for all UI strings
// Note: In production, you would use a translation API or service
const translations = {
  bg: { // Bulgarian
    // Common
    'Save': 'Запази',
    'Cancel': 'Отказ',
    'Delete': 'Изтрий',
    'Edit': 'Редактирай',
    'Close': 'Затвори',
    'Loading...': 'Зареждане...',
    'Error': 'Грешка',
    'Success': 'Успех',
    'Warning': 'Предупреждение',
    'Confirm': 'Потвърди',
    'Yes': 'Да',
    'No': 'Не',
    'Settings': 'Настройки',
    'Back': 'Назад',
    'Home': 'Начало',
    'Done': 'Готово',
    'Add': 'Добави',
    'Remove': 'Премахни',
    'Reset': 'Нулирай',
    'Apply': 'Приложи',
    'Search': 'Търси',
    'Filter': 'Филтър',
    'Sort': 'Сортирай',
    'Refresh': 'Опресни',
    'Upload': 'Качи',
    'Download': 'Изтегли',
    'Share': 'Сподели',
    'Copy': 'Копирай',
    'Paste': 'Постави',
    'Undo': 'Отмени',
    'Redo': 'Повтори',
    'Welcome {name}!': 'Добре дошъл {name}!',
    '{count} items selected': '{count} избрани елемента',
    'Enabled': 'Активирано',
    'Disabled': 'Деактивирано',
    'Coming soon': 'Очаквайте скоро',
    'Required': 'Задължително',
    'Optional': 'По избор',
    'or drag and drop here': 'или плъзнете и пуснете тук',
    'Increase value': 'Увеличи стойността',
    'Decrease value': 'Намали стойността',
    'Online': 'Онлайн',
    'Offline': 'Офлайн',
    'Expand group': 'Разгъни група',
    'Collapse group': 'Свий група',
    'Application loading screen': 'Екран за зареждане на приложението',
    'Day': 'Ден',
    'Month': 'Месец',
    'Search icons...': 'Търси икони...',
    'Background Image': 'Фоново изображение',
    'Preview': 'Преглед',
    'Just now': 'Току-що',
    '{count}m ago': 'преди {count}м',
    '{count}h ago': 'преди {count}ч',
    '{count}d ago': 'преди {count}д',
    'more': 'още',
    'Dismiss': 'Отхвърли',
    // Auth
    'Login': 'Вход',
    'Logout': 'Изход',
    'Sign up': 'Регистрация',
    'Sign in': 'Влизане',
    'Email': 'Имейл',
    'Password': 'Парола',
    'Confirm password': 'Потвърди парола',
    'Forgot password?': 'Забравена парола?',
    'Reset password': 'Нулиране на парола',
    'Change password': 'Смяна на парола',
    'Current password': 'Текуща парола',
    'New password': 'Нова парола',
    'Password is required': 'Паролата е задължителна',
    'Email is required': 'Имейлът е задължителен',
    'Invalid email': 'Невалиден имейл',
    'Password is too short': 'Паролата е твърде кратка',
    'Passwords do not match': 'Паролите не съвпадат',
    'Login failed': 'Неуспешен вход',
    'Sign up failed': 'Неуспешна регистрация',
    'User not found': 'Потребителят не е намерен',
    'Wrong password': 'Грешна парола',
    'Email already in use': 'Имейлът вече се използва',
    'Weak password': 'Слаба парола',
    'Network error': 'Мрежова грешка',
    'Verify email': 'Потвърдете имейл',
    'Email sent': 'Имейлът е изпратен',
    'Check your email': 'Проверете имейла си',
    // Timer
    'Start': 'Старт',
    'Pause': 'Пауза',
    'Stop': 'Стоп',
    'Minutes': 'Минути',
    'Seconds': 'Секунди',
    'Count down': 'Обратно броене',
    'Count up': 'Хронометър',
    'Quick times': 'Бързи времена',
    'Timer duration': 'Продължителност на таймера',
    'Sound notification': 'Звуково известие',
    'Vibration notification': 'Вибрационно известие',
    'Time\'s up!': 'Времето изтече!',
    // Continue with more translations...
  },
  cs: { // Czech
    // Common
    'Save': 'Uložit',
    'Cancel': 'Zrušit',
    'Delete': 'Smazat',
    'Edit': 'Upravit',
    'Close': 'Zavřít',
    'Loading...': 'Načítání...',
    'Error': 'Chyba',
    'Success': 'Úspěch',
    'Warning': 'Varování',
    'Confirm': 'Potvrdit',
    'Yes': 'Ano',
    'No': 'Ne',
    'Settings': 'Nastavení',
    'Back': 'Zpět',
    'Home': 'Domů',
    'Done': 'Hotovo',
    'Add': 'Přidat',
    'Remove': 'Odebrat',
    'Reset': 'Obnovit',
    'Apply': 'Použít',
    'Search': 'Hledat',
    'Filter': 'Filtr',
    'Sort': 'Seřadit',
    'Refresh': 'Obnovit',
    'Upload': 'Nahrát',
    'Download': 'Stáhnout',
    'Share': 'Sdílet',
    'Copy': 'Kopírovat',
    'Paste': 'Vložit',
    'Undo': 'Zpět',
    'Redo': 'Znovu',
    'Welcome {name}!': 'Vítejte {name}!',
    '{count} items selected': '{count} vybraných položek',
    'Enabled': 'Povoleno',
    'Disabled': 'Zakázáno',
    'Coming soon': 'Již brzy',
    // Continue with more translations...
  },
  // Add other languages...
}

function translateLanguageFile(languageCode, translations) {
  const filePath = path.join(__dirname, `../packages/ui/src/i18n/locales/base/${languageCode}.ts`)
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File ${filePath} does not exist`)
    return
  }
  
  let content = fs.readFileSync(filePath, 'utf8')
  let changeCount = 0
  
  // Replace English text with translations
  Object.entries(translations).forEach(([english, translated]) => {
    // Escape special regex characters in the English text
    const escapedEnglish = english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Match patterns like: key: 'English text',
    const regex = new RegExp(`(:\\s*)'${escapedEnglish}'(,?)`, 'g')
    const newContent = content.replace(regex, (match, before, after) => {
      changeCount++
      return `${before}'${translated}'${after}`
    })
    if (newContent !== content) {
      content = newContent
    }
  })
  
  // Update comment
  content = content.replace(
    /\/\/ .+ translations - TO BE COMPLETED/,
    `// ${languageCode.toUpperCase()} translations - PARTIAL MACHINE TRANSLATION`
  )
  
  fs.writeFileSync(filePath, content)
  console.log(`✅ Translated ${languageCode}: ${changeCount} strings`)
  
  return changeCount
}

// Process each language
console.log('Starting translation process...\n')

Object.entries(translations).forEach(([lang, trans]) => {
  translateLanguageFile(lang, trans)
})

console.log('\n⚠️  Note: These are basic machine translations.')
console.log('For production, use professional translation services.')