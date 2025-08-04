/**
 * Field Processing Utilities
 * 
 * Utilities for processing field values based on their types.
 * Used for converting database values to frontend-ready formats.
 */

/**
 * Processes a list field value from string format to array of items
 * @param value - The string value from the database
 * @returns Array of strings or {key, value} objects
 */
export function processListFieldValue(value: string): Array<string | { key: string; value: string }> {
  console.log('🔧 [field-processing] processListFieldValue called with:', value)
  if (!value?.trim()) return []
  
  const input = value.trim()
  const items: (string | { key: string; value: string })[] = []
  
  // Handle different input formats:
  // 1. Line-by-line format (preferred): "key : value\nkey2 : value2"
  // 2. Space-separated format on one line: "key : value key2 : value2"
  
  let entries: string[] = []
  
  if (input.includes('\n')) {
    // Multi-line format - split by newlines
    entries = input.split('\n').map(line => line.trim()).filter(line => line)
  } else {
    // Single line format - try to split by pattern matching
    // Look for pattern: "key : value key : value"
    // Use regex to split on pattern where a new key starts (letter+colon after a flag/value)
    const keyValuePattern = /\s+(?=[a-zA-Z-]+\s*:)/
    entries = input.split(keyValuePattern).map(entry => entry.trim()).filter(entry => entry)
  }
  
  for (const entry of entries) {
    if (!entry) continue
    
    // Check if it's a key:value pair
    const colonIndex = entry.indexOf(':')
    if (colonIndex > 0 && colonIndex < entry.length - 1) {
      const key = entry.substring(0, colonIndex).trim()
      const itemValue = entry.substring(colonIndex + 1).trim()
      
      if (key && itemValue) {
        items.push({ key, value: itemValue })
      } else {
        // If key or value is empty, treat as plain string
        items.push(entry)
      }
    } else {
      // Plain string
      items.push(entry)
    }
  }
  
  return items
}

/**
 * Processes a field value based on its type
 * @param value - The raw value from the database
 * @param fieldType - The field type (list, items, boolean, number, etc.)
 * @returns Processed value appropriate for frontend consumption
 */
export function processFieldValue(value: any, fieldType: string): any {
  console.log('🔧 [field-processing] processFieldValue called with type:', fieldType, 'value:', value)
  switch (fieldType) {
    case 'list':
      // Convert list field from string format to processed arrays
      if (typeof value === 'string' && value.trim()) {
        return processListFieldValue(value)
      } else if (Array.isArray(value)) {
        // Handle case where it might already be an array (backwards compatibility)
        return value
      }
      return []
    
    case 'items':
      // Items field should already be an array
      return Array.isArray(value) ? value : []
    
    case 'boolean':
      return Boolean(value)
    
    case 'number':
      return typeof value === 'number' ? value : (parseFloat(value) || 0)
    
    default:
      return value
  }
}

/**
 * Interface for field definitions
 */
export interface ContentField {
  field_key: string
  field_type: string
  id?: string
  [key: string]: any
}

/**
 * Processes all content fields based on their types
 * @param content - Raw content object from database
 * @param fields - Array of field definitions with types
 * @returns Processed content object ready for frontend consumption
 */
export function processContentFields(
  content: Record<string, any>, 
  fields: ContentField[]
): Record<string, any> {
  console.log('🔧 [field-processing] processContentFields called with:', Object.keys(content), 'and fields:', fields.map(f => f.field_key))
  console.log('🔧 [field-processing] Raw content values:', content)
  const processed: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(content)) {
    const field = fields.find(f => f.field_key === key)
    if (field) {
      processed[key] = processFieldValue(value, field.field_type)
    } else {
      // Keep untyped fields as-is
      processed[key] = value
    }
  }
  
  return processed
}