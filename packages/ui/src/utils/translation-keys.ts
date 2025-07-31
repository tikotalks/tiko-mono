/**
 * Utility functions for parsing translation keys from bulk input
 */

export interface ParsedTranslationKey {
  key: string
  value: string
}

/**
 * Parses bulk translation key input with intelligent format detection
 * 
 * Supports two formats:
 * 1. Key:Value format (one per line):
 *    admin.title:Title
 *    admin.description:Description text
 * 
 * 2. Simple key format (can use multiple separators):
 *    admin.title, admin.description
 *    key1 key2 key3
 * 
 * @param input - The raw input string to parse
 * @returns Array of parsed translation keys with their values
 */
export function parseTranslationKeys(input: string): ParsedTranslationKey[] {
  if (!input || !input.trim()) {
    return []
  }

  // Check if input contains any key:value format
  const hasKeyValueFormat = input.includes(':')

  if (hasKeyValueFormat) {
    // Key:Value format - split only by newlines
    return parseKeyValueFormat(input)
  } else {
    // Simple key format - split by multiple separators
    return parseSimpleKeyFormat(input)
  }
}

/**
 * Parses key:value format input (one per line)
 */
function parseKeyValueFormat(input: string): ParsedTranslationKey[] {
  const lines = input
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  const results: ParsedTranslationKey[] = []
  const seenKeys = new Set<string>()

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    
    if (colonIndex > 0) {
      // Has key:value format
      const key = line.substring(0, colonIndex).trim()
      const value = line.substring(colonIndex + 1).trim()
      
      if (key && !seenKeys.has(key)) {
        seenKeys.add(key)
        results.push({ key, value })
      }
    } else if (colonIndex === -1) {
      // No colon - treat as key only
      const key = line.trim()
      if (key && !seenKeys.has(key)) {
        seenKeys.add(key)
        results.push({ key, value: '' })
      }
    }
    // Skip lines that start with colon (colonIndex === 0)
  }

  return results
}

/**
 * Parses simple key format with multiple possible separators
 */
function parseSimpleKeyFormat(input: string): ParsedTranslationKey[] {
  // Split by newlines, commas, semicolons, or multiple spaces
  const keys = input
    .split(/[\n,;]+|\s{2,}/)
    .map(key => key.trim())
    .filter(key => key.length > 0)

  // Remove duplicates while preserving order
  const uniqueKeys = Array.from(new Set(keys))

  return uniqueKeys.map(key => ({ key, value: '' }))
}

/**
 * Extracts just the keys from parsed translation data
 */
export function extractKeys(parsedData: ParsedTranslationKey[]): string[] {
  return parsedData.map(item => item.key)
}

/**
 * Creates a map of keys to values from parsed translation data
 */
export function createKeyValueMap(parsedData: ParsedTranslationKey[]): Map<string, string> {
  const map = new Map<string, string>()
  parsedData.forEach(item => {
    map.set(item.key, item.value)
  })
  return map
}