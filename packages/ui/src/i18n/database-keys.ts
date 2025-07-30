/**
 * Database-driven translation keys
 * This dynamically loads all unique keys from the translation database
 */

import { useI18nDatabaseService } from '@tiko/core';

// Cache for translation keys
let cachedKeys: Set<string> | null = null;

/**
 * Get all unique translation keys from the database
 */
export async function getDatabaseKeys(): Promise<string[]> {
  try {
    if (!cachedKeys) {
      const translationService = useI18nDatabaseService();
      const keys = await translationService.getTranslationKeys();
      cachedKeys = new Set(keys.map(k => k.key));
    }
    return Array.from(cachedKeys);
  } catch (error) {
    console.error('Failed to load translation keys from database:', error);
    return [];
  }
}

/**
 * Create a nested object structure from flat keys
 * e.g., "admin.translations.title" -> { admin: { translations: { title: "admin.translations.title" } } }
 */
export function createKeyStructure(keys: string[]): any {
  const result: any = {};
  
  for (const key of keys) {
    const parts = key.split('.');
    let current = result;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (i === parts.length - 1) {
        // Last part - set the full key as value
        current[part] = key;
      } else {
        // Create nested structure
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }
  
  return result;
}

/**
 * Create a proxy that returns the key path for any property access
 * This allows us to use keys.admin.translations.title and get "admin.translations.title"
 */
function createKeyProxy(path: string[] = []): any {
  return new Proxy({}, {
    get(target, prop: string | symbol) {
      // Handle conversion to primitive - this is what makes String(proxy) work
      if (prop === Symbol.toPrimitive) {
        return (hint: string) => path.join('.');
      }
      
      // Handle valueOf and toString
      if (prop === 'valueOf' || prop === 'toString') {
        return () => path.join('.');
      }
      
      // Handle symbols and special methods
      if (typeof prop === 'symbol' || prop === 'toJSON') {
        return path.join('.');
      }
      
      // Ignore inspection properties
      if (prop === 'inspect' || prop === 'constructor' || prop === '__proto__') {
        return undefined;
      }
      
      const newPath = [...path, String(prop)];
      const keyString = newPath.join('.');
      
      // Always return a new proxy for nested access
      // The proxy itself will convert to the string when needed
      return createKeyProxy(newPath);
    }
  });
}

/**
 * Dynamic keys object that fetches from database
 * Usage: await initializeDatabaseKeys() first, then use keys.admin.translations.title
 */
export const databaseKeys = createKeyProxy();

/**
 * Initialize the translation keys from database
 * Call this on app startup
 */
export async function initializeDatabaseKeys(): Promise<void> {
  await getDatabaseKeys();
}

/**
 * Refresh the cached keys
 */
export function clearKeyCache(): void {
  cachedKeys = null;
}