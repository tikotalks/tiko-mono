#!/usr/bin/env node

import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const I18N_WORKER_URL = process.env.VITE_I18N_WORKER_URL || process.env.I18N_WORKER_URL

if (!I18N_WORKER_URL) {
  console.error('❌ Missing I18n Worker URL. Set VITE_I18N_WORKER_URL or I18N_WORKER_URL environment variable.')
  process.exit(1)
}

// Translation keys to add
const translationKeys = [
  {
    key: 'admin.content.sections.fieldKeyPlaceholder',
    translations: {
      'en': 'Enter field key (e.g., title, description)',
      'en-GB': 'Enter field key (e.g., title, description)',
      'en-US': 'Enter field key (e.g., title, description)',
      'nl': 'Voer veldsleutel in (bijv. titel, beschrijving)',
      'fr': 'Entrez la clé du champ (ex: titre, description)',
      'de': 'Feldschlüssel eingeben (z.B. Titel, Beschreibung)',
      'es': 'Ingrese la clave del campo (ej: título, descripción)',
      'it': 'Inserisci la chiave del campo (es: titolo, descrizione)',
      'pt': 'Digite a chave do campo (ex: título, descrição)',
      'pl': 'Wprowadź klucz pola (np. tytuł, opis)',
      'ro': 'Introduceți cheia câmpului (ex: titlu, descriere)',
      'ru': 'Введите ключ поля (например: заголовок, описание)',
      'sv': 'Ange fältnyckel (t.ex. titel, beskrivning)',
      'el': 'Εισαγάγετε το κλειδί πεδίου (π.χ. τίτλος, περιγραφή)'
    }
  },
  {
    key: 'admin.content.sections.fieldLabelPlaceholder',
    translations: {
      'en': 'Enter display label for this field',
      'en-GB': 'Enter display label for this field',
      'en-US': 'Enter display label for this field',
      'nl': 'Voer weergavelabel voor dit veld in',
      'fr': 'Entrez l\'étiquette d\'affichage pour ce champ',
      'de': 'Anzeigelabel für dieses Feld eingeben',
      'es': 'Ingrese la etiqueta de visualización para este campo',
      'it': 'Inserisci l\'etichetta di visualizzazione per questo campo',
      'pt': 'Digite o rótulo de exibição para este campo',
      'pl': 'Wprowadź etykietę wyświetlania dla tego pola',
      'ro': 'Introduceți eticheta de afișare pentru acest câmp',
      'ru': 'Введите отображаемую метку для этого поля',
      'sv': 'Ange visningsetikett för detta fält',
      'el': 'Εισαγάγετε την ετικέτα εμφάνισης για αυτό το πεδίο'
    }
  },
  {
    key: 'admin.content.sections.templateUpdateSuccess',
    translations: {
      'en': 'Template updated successfully',
      'en-GB': 'Template updated successfully',
      'en-US': 'Template updated successfully',
      'nl': 'Sjabloon succesvol bijgewerkt',
      'fr': 'Modèle mis à jour avec succès',
      'de': 'Vorlage erfolgreich aktualisiert',
      'es': 'Plantilla actualizada con éxito',
      'it': 'Modello aggiornato con successo',
      'pt': 'Modelo atualizado com sucesso',
      'pl': 'Szablon zaktualizowany pomyślnie',
      'ro': 'Șablon actualizat cu succes',
      'ru': 'Шаблон успешно обновлен',
      'sv': 'Mall uppdaterad framgångsrikt',
      'el': 'Το πρότυπο ενημερώθηκε επιτυχώς'
    }
  },
  {
    key: 'admin.content.field.optionsHelp',
    translations: {
      'en': 'For select, radio, or checkbox fields, enter the available options',
      'en-GB': 'For select, radio, or checkbox fields, enter the available options',
      'en-US': 'For select, radio, or checkbox fields, enter the available options',
      'nl': 'Voor selectie-, radio- of selectievakjesvelden, voer de beschikbare opties in',
      'fr': 'Pour les champs de sélection, radio ou case à cocher, entrez les options disponibles',
      'de': 'Für Auswahl-, Radio- oder Checkbox-Felder geben Sie die verfügbaren Optionen ein',
      'es': 'Para campos de selección, radio o casilla de verificación, ingrese las opciones disponibles',
      'it': 'Per i campi di selezione, radio o casella di controllo, inserisci le opzioni disponibili',
      'pt': 'Para campos de seleção, rádio ou caixa de seleção, digite as opções disponíveis',
      'pl': 'Dla pól wyboru, radio lub pól wyboru wprowadź dostępne opcje',
      'ro': 'Pentru câmpurile de selectare, radio sau casetă de bifat, introduceți opțiunile disponibile',
      'ru': 'Для полей выбора, радио или флажков введите доступные параметры',
      'sv': 'För val-, radio- eller kryssrutsfält, ange tillgängliga alternativ',
      'el': 'Για πεδία επιλογής, ραδιόφωνου ή πλαισίου ελέγχου, εισαγάγετε τις διαθέσιμες επιλογές'
    }
  },
  {
    key: 'admin.content.field.optionsHelpFormat',
    translations: {
      'en': 'Format: JSON array of objects with "value" and "label" properties',
      'en-GB': 'Format: JSON array of objects with "value" and "label" properties',
      'en-US': 'Format: JSON array of objects with "value" and "label" properties',
      'nl': 'Formaat: JSON-array van objecten met "value" en "label" eigenschappen',
      'fr': 'Format : tableau JSON d\'objets avec propriétés "value" et "label"',
      'de': 'Format: JSON-Array von Objekten mit "value" und "label" Eigenschaften',
      'es': 'Formato: matriz JSON de objetos con propiedades "value" y "label"',
      'it': 'Formato: array JSON di oggetti con proprietà "value" e "label"',
      'pt': 'Formato: array JSON de objetos com propriedades "value" e "label"',
      'pl': 'Format: tablica JSON obiektów z właściwościami "value" i "label"',
      'ro': 'Format: matrice JSON de obiecte cu proprietăți "value" și "label"',
      'ru': 'Формат: массив JSON объектов со свойствами "value" и "label"',
      'sv': 'Format: JSON-array av objekt med egenskaperna "value" och "label"',
      'el': 'Μορφή: πίνακας JSON αντικειμένων με ιδιότητες "value" και "label"'
    }
  },
  {
    key: 'admin.content.field.optionsHelpExample',
    translations: {
      'en': 'Example: [{"value": "option1", "label": "Option 1"}, {"value": "option2", "label": "Option 2"}]',
      'en-GB': 'Example: [{"value": "option1", "label": "Option 1"}, {"value": "option2", "label": "Option 2"}]',
      'en-US': 'Example: [{"value": "option1", "label": "Option 1"}, {"value": "option2", "label": "Option 2"}]',
      'nl': 'Voorbeeld: [{"value": "optie1", "label": "Optie 1"}, {"value": "optie2", "label": "Optie 2"}]',
      'fr': 'Exemple : [{"value": "option1", "label": "Option 1"}, {"value": "option2", "label": "Option 2"}]',
      'de': 'Beispiel: [{"value": "option1", "label": "Option 1"}, {"value": "option2", "label": "Option 2"}]',
      'es': 'Ejemplo: [{"value": "opcion1", "label": "Opción 1"}, {"value": "opcion2", "label": "Opción 2"}]',
      'it': 'Esempio: [{"value": "opzione1", "label": "Opzione 1"}, {"value": "opzione2", "label": "Opzione 2"}]',
      'pt': 'Exemplo: [{"value": "opcao1", "label": "Opção 1"}, {"value": "opcao2", "label": "Opção 2"}]',
      'pl': 'Przykład: [{"value": "opcja1", "label": "Opcja 1"}, {"value": "opcja2", "label": "Opcja 2"}]',
      'ro': 'Exemplu: [{"value": "optiune1", "label": "Opțiunea 1"}, {"value": "optiune2", "label": "Opțiunea 2"}]',
      'ru': 'Пример: [{"value": "option1", "label": "Вариант 1"}, {"value": "option2", "label": "Вариант 2"}]',
      'sv': 'Exempel: [{"value": "alternativ1", "label": "Alternativ 1"}, {"value": "alternativ2", "label": "Alternativ 2"}]',
      'el': 'Παράδειγμα: [{"value": "epilogi1", "label": "Επιλογή 1"}, {"value": "epilogi2", "label": "Επιλογή 2"}]'
    }
  },
  {
    key: 'admin.content.field.preview',
    translations: {
      'en': 'Preview',
      'en-GB': 'Preview',
      'en-US': 'Preview',
      'nl': 'Voorbeeld',
      'fr': 'Aperçu',
      'de': 'Vorschau',
      'es': 'Vista previa',
      'it': 'Anteprima',
      'pt': 'Pré-visualização',
      'pl': 'Podgląd',
      'ro': 'Previzualizare',
      'ru': 'Предпросмотр',
      'sv': 'Förhandsvisning',
      'el': 'Προεπισκόπηση'
    }
  },
  {
    key: 'admin.content.field.selectPreview',
    translations: {
      'en': 'Select field preview:',
      'en-GB': 'Select field preview:',
      'en-US': 'Select field preview:',
      'nl': 'Selectieveld voorbeeld:',
      'fr': 'Aperçu du champ de sélection :',
      'de': 'Auswahlfeld-Vorschau:',
      'es': 'Vista previa del campo de selección:',
      'it': 'Anteprima del campo di selezione:',
      'pt': 'Pré-visualização do campo de seleção:',
      'pl': 'Podgląd pola wyboru:',
      'ro': 'Previzualizare câmp de selectare:',
      'ru': 'Предпросмотр поля выбора:',
      'sv': 'Förhandsvisning av valfält:',
      'el': 'Προεπισκόπηση πεδίου επιλογής:'
    }
  }
]

// Get active languages
async function getActiveLanguages() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/i18n_languages?is_active=eq.true&select=code`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch languages: ${response.status} ${response.statusText}`)
    }

    const languages = await response.json()
    return languages.map(lang => lang.code)
  } catch (error) {
    console.error('Failed to fetch active languages:', error)
    // Return default languages if fetch fails
    return ['en', 'en-GB', 'en-US', 'nl', 'fr', 'de', 'es', 'it', 'pt', 'pl', 'ro', 'ru', 'sv', 'el']
  }
}

// Check if a translation key exists
async function keyExists(key) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/i18n_translation_keys?key=eq.${encodeURIComponent(key)}`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to check key: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.length > 0
  } catch (error) {
    console.error(`Failed to check if key exists: ${key}`, error)
    return false
  }
}

// Create a translation key
async function createTranslationKey(key) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/i18n_translation_keys`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ key })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create key: ${response.status} ${response.statusText} - ${error}`)
    }

    const data = await response.json()
    return data[0]
  } catch (error) {
    console.error(`Failed to create key: ${key}`, error)
    throw error
  }
}

// Create or update a translation
async function createOrUpdateTranslation(keyId, languageCode, value) {
  try {
    // First check if translation exists
    const checkResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/i18n_translations?key_id=eq.${keyId}&language_code=eq.${languageCode}`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    )

    if (!checkResponse.ok) {
      throw new Error(`Failed to check translation: ${checkResponse.status} ${checkResponse.statusText}`)
    }

    const existing = await checkResponse.json()

    let response
    if (existing.length > 0) {
      // Update existing translation
      response = await fetch(
        `${SUPABASE_URL}/rest/v1/i18n_translations?key_id=eq.${keyId}&language_code=eq.${languageCode}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ value })
        }
      )
    } else {
      // Create new translation
      response = await fetch(`${SUPABASE_URL}/rest/v1/i18n_translations`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          key_id: keyId,
          language_code: languageCode,
          value
        })
      })
    }

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to save translation: ${response.status} ${response.statusText} - ${error}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Failed to save translation for ${languageCode}:`, error)
    throw error
  }
}

// Main function
async function main() {
  console.log('🚀 Adding admin content translation keys...')
  
  const activeLanguages = await getActiveLanguages()
  console.log(`📋 Active languages: ${activeLanguages.join(', ')}`)

  let successCount = 0
  let errorCount = 0

  for (const item of translationKeys) {
    console.log(`\n📝 Processing key: ${item.key}`)
    
    try {
      // Check if key exists
      const exists = await keyExists(item.key)
      
      let keyId
      if (exists) {
        console.log(`  ℹ️  Key already exists, fetching ID...`)
        const response = await fetch(`${SUPABASE_URL}/rest/v1/i18n_translation_keys?key=eq.${encodeURIComponent(item.key)}`, {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          }
        })
        const data = await response.json()
        keyId = data[0].id
      } else {
        console.log(`  ✨ Creating new key...`)
        const keyData = await createTranslationKey(item.key)
        keyId = keyData.id
      }

      // Add translations for each active language
      for (const langCode of activeLanguages) {
        if (item.translations[langCode]) {
          try {
            await createOrUpdateTranslation(keyId, langCode, item.translations[langCode])
            console.log(`  ✅ ${langCode}: ${item.translations[langCode]}`)
          } catch (error) {
            console.log(`  ❌ ${langCode}: Failed to add translation`)
            errorCount++
          }
        } else {
          console.log(`  ⚠️  ${langCode}: No translation provided`)
        }
      }
      
      successCount++
    } catch (error) {
      console.error(`❌ Failed to process key ${item.key}:`, error.message)
      errorCount++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`✅ Successfully processed: ${successCount} keys`)
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount}`)
  }
  
  console.log('\n💡 Next steps:')
  console.log('1. Run "pnpm run generate:i18n" to regenerate the TypeScript files')
  console.log('2. The new translations will be available in your components')
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})