export async function fetchAllTranslationData(supabaseUrl, supabaseKey) {
    // Fetch all active languages
    const languages = await fetchActiveLanguages(supabaseUrl, supabaseKey);
    // Fetch all translation keys
    const keys = await fetchAllKeys(supabaseUrl, supabaseKey);
    // Fetch all published translations
    const allTranslations = await fetchAllTranslations(supabaseUrl, supabaseKey);
    // Organize translations by language and key
    const translations = {};
    // Initialize translation structure
    for (const language of languages) {
        translations[language.code] = {};
    }
    // Group translations by language
    for (const translation of allTranslations) {
        if (translation.key && translations[translation.language_code]) {
            translations[translation.language_code][translation.key] = translation.value;
        }
    }
    return {
        keys,
        languages,
        translations
    };
}
export async function fetchAppTranslationData(appName, supabaseUrl, supabaseKey) {
    // Fetch all active languages
    const languages = await fetchActiveLanguages(supabaseUrl, supabaseKey);
    // Fetch translation keys for specific app (keys starting with appName.)
    const keys = await fetchAppKeys(appName, supabaseUrl, supabaseKey);
    // Fetch published translations for these keys
    const allTranslations = await fetchAppTranslations(appName, supabaseUrl, supabaseKey);
    // Organize translations by language and key
    const translations = {};
    // Initialize translation structure
    for (const language of languages) {
        translations[language.code] = {};
    }
    // Group translations by language
    for (const translation of allTranslations) {
        if (translation.key && translations[translation.language_code]) {
            translations[translation.language_code][translation.key] = translation.value;
        }
    }
    return {
        keys,
        languages,
        translations
    };
}
export async function fetchActiveLanguages(supabaseUrl, supabaseKey) {
    const response = await fetch(`${supabaseUrl}/rest/v1/i18n_languages?is_active=eq.true&order=code.asc`, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch languages: ${response.status} ${response.statusText}`);
    }
    return response.json();
}
export async function fetchAllKeys(supabaseUrl, supabaseKey) {
    let allKeys = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    while (hasMore) {
        const response = await fetch(`${supabaseUrl}/rest/v1/i18n_keys?order=key.asc&limit=${limit}&offset=${offset}`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch keys: ${response.status} ${response.statusText}`);
        }
        const batch = await response.json();
        allKeys.push(...batch);
        // If we got less than the limit, we're done
        hasMore = batch.length === limit;
        offset += limit;
        // Safety break to avoid infinite loops
        if (offset > 10000) {
            console.warn('Stopping key pagination at 10,000 records');
            break;
        }
    }
    return allKeys;
}
async function fetchAppKeys(appName, supabaseUrl, supabaseKey) {
    // Fetch keys that start with the app name or are common keys (e.g., common.*, shared.*)
    const commonPrefixes = ['common', 'shared', 'global', 'auth', 'errors', 'validation'];
    let allKeys = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    while (hasMore) {
        const response = await fetch(`${supabaseUrl}/rest/v1/i18n_keys?or=(key.like.${appName}.%,${commonPrefixes.map(prefix => `key.like.${prefix}.%`).join(',')})&order=key.asc&limit=${limit}&offset=${offset}`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch app keys: ${response.status} ${response.statusText}`);
        }
        const batch = await response.json();
        allKeys.push(...batch);
        // If we got less than the limit, we're done
        hasMore = batch.length === limit;
        offset += limit;
        // Safety break to avoid infinite loops
        if (offset > 10000) {
            console.warn(`Stopping app keys pagination for ${appName} at 10,000 records`);
            break;
        }
    }
    return allKeys;
}
async function fetchAllTranslations(supabaseUrl, supabaseKey) {
    let allTranslations = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    while (hasMore) {
        const response = await fetch(`${supabaseUrl}/rest/v1/i18n_translations?select=*,i18n_keys(key)&is_published=eq.true&order=language_code.asc,key_id.asc&limit=${limit}&offset=${offset}`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch translations: ${response.status} ${response.statusText}`);
        }
        const batch = await response.json();
        allTranslations.push(...batch);
        // If we got less than the limit, we're done
        hasMore = batch.length === limit;
        offset += limit;
        // Safety break to avoid infinite loops
        if (offset > 50000) {
            console.warn('Stopping pagination at 50,000 records');
            break;
        }
    }
    // Transform the response to include the key field from the join
    return allTranslations.map((translation) => ({
        ...translation,
        key: translation.i18n_keys?.key
    }));
}
async function fetchAppTranslations(appName, supabaseUrl, supabaseKey) {
    // First get the key IDs for the app
    const keys = await fetchAppKeys(appName, supabaseUrl, supabaseKey);
    const keyIds = keys.map(key => key.id);
    if (keyIds.length === 0) {
        return [];
    }
    // Fetch translations for these keys
    const response = await fetch(`${supabaseUrl}/rest/v1/i18n_translations?select=*,i18n_keys(key)&key_id=in.(${keyIds.join(',')})&is_published=eq.true&order=language_code.asc,key_id.asc`, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch app translations: ${response.status} ${response.statusText}`);
    }
    const rawTranslations = await response.json();
    // Transform the response to include the key field from the join
    return rawTranslations.map((translation) => ({
        ...translation,
        key: translation.i18n_keys?.key
    }));
}
// New debug functions - with pagination
export async function fetchAllTranslationsRaw(supabaseUrl, supabaseKey) {
    let allTranslations = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    while (hasMore) {
        const response = await fetch(`${supabaseUrl}/rest/v1/i18n_translations?select=*,i18n_keys(key)&order=language_code.asc,key_id.asc&limit=${limit}&offset=${offset}`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch translations: ${response.status} ${response.statusText}`);
        }
        const batch = await response.json();
        allTranslations.push(...batch);
        // If we got less than the limit, we're done
        hasMore = batch.length === limit;
        offset += limit;
        // Safety break to avoid infinite loops
        if (offset > 50000) {
            console.warn('Stopping pagination at 50,000 records');
            break;
        }
    }
    // Transform the response to include the key field from the join
    return allTranslations.map((translation) => ({
        ...translation,
        key: translation.i18n_keys?.key
    }));
}
export async function fetchTranslationsForLanguage(languageCode, supabaseUrl, supabaseKey) {
    let allTranslations = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    while (hasMore) {
        const response = await fetch(`${supabaseUrl}/rest/v1/i18n_translations?select=*,i18n_keys(key)&language_code=eq.${languageCode}&is_published=eq.true&order=key_id.asc&limit=${limit}&offset=${offset}`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch translations for ${languageCode}: ${response.status} ${response.statusText}`);
        }
        const batch = await response.json();
        allTranslations.push(...batch);
        // If we got less than the limit, we're done
        hasMore = batch.length === limit;
        offset += limit;
        // Safety break to avoid infinite loops per language
        if (offset > 10000) {
            console.warn(`Stopping pagination for ${languageCode} at 10,000 records`);
            break;
        }
    }
    // Transform the response to include the key field from the join
    return allTranslations.map((translation) => ({
        ...translation,
        key: translation.i18n_keys?.key
    }));
}
