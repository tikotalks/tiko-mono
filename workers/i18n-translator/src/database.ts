import type { DatabaseLanguage, DatabaseKey, DatabaseTranslation } from './types'

export async function fetchActiveLanguages(supabaseUrl: string, supabaseKey: string): Promise<DatabaseLanguage[]> {
  const response = await fetch(`${supabaseUrl}/rest/v1/i18n_languages?is_active=eq.true&code=not.like.*-*&order=code`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch languages: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function fetchOrCreateKey(
  key: string,
  description: string | undefined,
  supabaseUrl: string,
  supabaseKey: string
): Promise<DatabaseKey> {
  // First, try to get existing key
  let response = await fetch(`${supabaseUrl}/rest/v1/i18n_keys?key=eq.${encodeURIComponent(key)}`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch key: ${response.status} ${response.statusText}`)
  }

  const existingKeys: DatabaseKey[] = await response.json()
  
  if (existingKeys.length > 0) {
    return existingKeys[0]
  }

  // Key doesn't exist, create it
  const category = key.includes('.') ? key.split('.')[0] : 'general'
  
  response = await fetch(`${supabaseUrl}/rest/v1/i18n_keys`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      key,
      description,
      category
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create key: ${response.status} ${errorText}`)
  }

  const createdKeys: DatabaseKey[] = await response.json()
  return createdKeys[0]
}

export async function insertTranslation(
  translation: DatabaseTranslation,
  supabaseUrl: string,
  supabaseKey: string
): Promise<void> {
  // Check if translation already exists
  const checkResponse = await fetch(
    `${supabaseUrl}/rest/v1/i18n_translations?key_id=eq.${translation.key_id}&language_code=eq.${translation.language_code}&is_published=eq.true`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    }
  )

  if (!checkResponse.ok) {
    throw new Error(`Failed to check existing translation: ${checkResponse.status}`)
  }

  const existingTranslations: any[] = await checkResponse.json()
  
  if (existingTranslations.length > 0) {
    // Update existing translation (increment version)
    const currentVersion = Math.max(...existingTranslations.map((t: any) => t.version || 1))
    
    const response = await fetch(`${supabaseUrl}/rest/v1/i18n_translations`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...translation,
        version: currentVersion + 1
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to update translation: ${response.status} ${errorText}`)
    }
  } else {
    // Insert new translation
    const response = await fetch(`${supabaseUrl}/rest/v1/i18n_translations`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(translation)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to insert translation: ${response.status} ${errorText}`)
    }
  }
}