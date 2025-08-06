#!/usr/bin/env node

/**
 * Simple script to add missing admin content translation keys
 * This script uses the Supabase REST API directly with proper authentication
 */

import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.')
  process.exit(1)
}

const baseUrl = `${SUPABASE_URL}/rest/v1`

// Translation keys to add
const keysToAdd = [
  {
    key: 'admin.content.sections.fieldKeyPlaceholder',
    description: 'Placeholder text for field key input',
    values: {
      'en': 'Enter field key (e.g., title, description)',
      'nl': 'Voer veldsleutel in (bijv. titel, beschrijving)',
      'fr': 'Entrez la clé du champ (ex: titre, description)',
      'de': 'Feldschlüssel eingeben (z.B. Titel, Beschreibung)',
      'es': 'Ingrese la clave del campo (ej: título, descripción)'
    }
  },
  {
    key: 'admin.content.sections.fieldLabelPlaceholder',
    description: 'Placeholder text for field label input',
    values: {
      'en': 'Enter display label for this field',
      'nl': 'Voer weergavelabel voor dit veld in',
      'fr': 'Entrez l\'étiquette d\'affichage pour ce champ',
      'de': 'Anzeigelabel für dieses Feld eingeben',
      'es': 'Ingrese la etiqueta de visualización para este campo'
    }
  },
  {
    key: 'admin.content.sections.templateUpdateSuccess',
    description: 'Success message when template is updated',
    values: {
      'en': 'Template updated successfully',
      'nl': 'Sjabloon succesvol bijgewerkt',
      'fr': 'Modèle mis à jour avec succès',
      'de': 'Vorlage erfolgreich aktualisiert',
      'es': 'Plantilla actualizada con éxito'
    }
  },
  {
    key: 'admin.content.field.optionsHelp',
    description: 'Help text for field options',
    values: {
      'en': 'For select, radio, or checkbox fields, enter the available options',
      'nl': 'Voor selectie-, radio- of selectievakjesvelden, voer de beschikbare opties in',
      'fr': 'Pour les champs de sélection, radio ou case à cocher, entrez les options disponibles',
      'de': 'Für Auswahl-, Radio- oder Checkbox-Felder geben Sie die verfügbaren Optionen ein',
      'es': 'Para campos de selección, radio o casilla de verificación, ingrese las opciones disponibles'
    }
  },
  {
    key: 'admin.content.field.optionsHelpFormat',
    description: 'Help text for field options format',
    values: {
      'en': 'Format: JSON array of objects with "value" and "label" properties',
      'nl': 'Formaat: JSON-array van objecten met "value" en "label" eigenschappen',
      'fr': 'Format : tableau JSON d\'objets avec propriétés "value" et "label"',
      'de': 'Format: JSON-Array von Objekten mit "value" und "label" Eigenschaften',
      'es': 'Formato: matriz JSON de objetos con propiedades "value" y "label"'
    }
  },
  {
    key: 'admin.content.field.optionsHelpExample',
    description: 'Example for field options format',
    values: {
      'en': 'Example: [{"value": "option1", "label": "Option 1"}, {"value": "option2", "label": "Option 2"}]',
      'nl': 'Voorbeeld: [{"value": "optie1", "label": "Optie 1"}, {"value": "optie2", "label": "Optie 2"}]',
      'fr': 'Exemple : [{"value": "option1", "label": "Option 1"}, {"value": "option2", "label": "Option 2"}]',
      'de': 'Beispiel: [{"value": "option1", "label": "Option 1"}, {"value": "option2", "label": "Option 2"}]',
      'es': 'Ejemplo: [{"value": "opcion1", "label": "Opción 1"}, {"value": "opcion2", "label": "Opción 2"}]'
    }
  },
  {
    key: 'admin.content.field.preview',
    description: 'Label for field preview section',
    values: {
      'en': 'Preview',
      'nl': 'Voorbeeld',
      'fr': 'Aperçu',
      'de': 'Vorschau',
      'es': 'Vista previa'
    }
  },
  {
    key: 'admin.content.field.selectPreview',
    description: 'Label for select field preview',
    values: {
      'en': 'Select field preview:',
      'nl': 'Selectieveld voorbeeld:',
      'fr': 'Aperçu du champ de sélection :',
      'de': 'Auswahlfeld-Vorschau:',
      'es': 'Vista previa del campo de selección:'
    }
  }
]

async function makeRequest(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=representation',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
  }

  return response.json()
}

async function keyExists(key) {
  try {
    const result = await makeRequest(`/i18n_keys?key=eq.${encodeURIComponent(key)}&select=id`)
    return Array.isArray(result) ? result.length > 0 : !!result
  } catch (error) {
    console.error(`Error checking if key exists: ${key}`, error)
    return false
  }
}

async function createKey(keyData) {
  try {
    const result = await makeRequest('/i18n_keys', {
      method: 'POST',
      body: JSON.stringify(keyData)
    })
    return Array.isArray(result) ? result[0] : result
  } catch (error) {
    console.error(`Error creating key: ${keyData.key}`, error)
    throw error
  }
}

async function getKeyId(key) {
  try {
    const result = await makeRequest(`/i18n_keys?key=eq.${encodeURIComponent(key)}&select=id`)
    return result[0]?.id
  } catch (error) {
    console.error(`Error getting key ID for: ${key}`, error)
    return null
  }
}

async function createTranslation(keyId, languageCode, value) {
  try {
    // Check if translation already exists
    const existing = await makeRequest(
      `/i18n_translations?key_id=eq.${keyId}&language_code=eq.${languageCode}&order=version.desc&limit=1`
    )

    const version = existing.length > 0 ? existing[0].version + 1 : 1

    const result = await makeRequest('/i18n_translations', {
      method: 'POST',
      body: JSON.stringify({
        key_id: keyId,
        language_code: languageCode,
        value,
        version,
        is_published: true // Publish immediately
      })
    })
    
    return Array.isArray(result) ? result[0] : result
  } catch (error) {
    console.error(`Error creating translation for ${languageCode}:`, error)
    throw error
  }
}

async function main() {
  console.log('🚀 Adding admin content translation keys...')
  
  let successCount = 0
  let errorCount = 0

  for (const item of keysToAdd) {
    console.log(`\n📝 Processing key: ${item.key}`)
    
    try {
      // Check if key exists
      const exists = await keyExists(item.key)
      
      let keyId
      if (exists) {
        console.log(`  ℹ️  Key already exists, getting ID...`)
        keyId = await getKeyId(item.key)
      } else {
        console.log(`  ✨ Creating new key...`)
        const keyData = await createKey({
          key: item.key,
          description: item.description
        })
        keyId = keyData.id
      }

      if (!keyId) {
        console.log(`  ❌ Failed to get key ID`)
        errorCount++
        continue
      }

      // Add translations for each language
      for (const [langCode, value] of Object.entries(item.values)) {
        try {
          await createTranslation(keyId, langCode, value)
          console.log(`  ✅ ${langCode}: ${value}`)
        } catch (error) {
          console.log(`  ❌ ${langCode}: Failed to add translation`)
          errorCount++
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