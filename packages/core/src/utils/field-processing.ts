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
  
  // Special debug for all array-like fields
  if (['linked_items', 'items', 'list'].includes(fieldType)) {
    console.log(`🔗 [field-processing] ARRAY FIELD DETECTED: ${fieldType}`)
    console.log('🔗 [field-processing] Value type:', typeof value)
    console.log('🔗 [field-processing] Is Array:', Array.isArray(value))
    console.log('🔗 [field-processing] Raw value:', JSON.stringify(value))
  }
  
  // First, try to parse JSON strings for array-like fields
  if (typeof value === 'string' && ['items', 'linked_items', 'list'].includes(fieldType)) {
    try {
      const parsed = JSON.parse(value)
      console.log(`🔧 [field-processing] Successfully parsed JSON for ${fieldType}:`, parsed)
      value = parsed
    } catch (e) {
      console.log(`🔧 [field-processing] Value is not JSON for ${fieldType}, treating as string:`, value)
    }
  }
  
  switch (fieldType) {
    case 'list':
      // Convert list field from string format to processed arrays
      if (Array.isArray(value)) {
        // If already an array (from JSON parsing), return as-is
        return value
      } else if (typeof value === 'string' && value.trim()) {
        return processListFieldValue(value)
      }
      return []
    
    case 'repeater':
      // Repeater field should be an array of objects
      if (Array.isArray(value)) {
        console.log(`🔄 [field-processing] Repeater field is array with ${value.length} items:`, value)
        return value
      } else if (typeof value === 'string' && value.trim()) {
        // Try to parse JSON for repeater data
        try {
          const parsed = JSON.parse(value)
          if (Array.isArray(parsed)) {
            console.log(`🔄 [field-processing] Successfully parsed JSON array for repeater:`, parsed)
            return parsed
          }
        } catch (e) {
          console.warn(`🔄 [field-processing] Failed to parse JSON for repeater:`, e)
        }
      }
      console.log(`⚠️ [field-processing] Repeater field is not array, returning empty:`, value)
      return []
    
    case 'items':
      // Items field should be an array of item IDs
      if (Array.isArray(value)) {
        console.log(`🎯 [field-processing] Items field is array with ${value.length} items:`, value)
        return value
      }
      console.log(`⚠️ [field-processing] Items field is not array, returning empty:`, value)
      return []
    
    case 'boolean':
      return Boolean(value)
    
    case 'number':
      return typeof value === 'number' ? value : (parseFloat(value) || 0)
    
    case 'linked_items':
      // For linked_items, ensure it's an array of item IDs
      if (Array.isArray(value)) {
        console.log(`🔗 [field-processing] Linked items is array with ${value.length} items:`, value)
        return value // Array of item IDs
      } else if (typeof value === 'string' && value) {
        // Try to parse JSON first for array strings like ["id1","id2"]
        if (value.startsWith('[') && value.endsWith(']')) {
          try {
            const parsed = JSON.parse(value)
            if (Array.isArray(parsed)) {
              console.log(`🔗 [field-processing] Successfully parsed JSON array for linked_items:`, parsed)
              return parsed
            }
          } catch (e) {
            console.warn(`🔗 [field-processing] Failed to parse JSON array for linked_items:`, e)
          }
        }
        
        // Handle comma-separated IDs if needed (fallback)
        console.log(`🔗 [field-processing] Parsing comma-separated linked_items:`, value)
        return value.split(',').map(id => id.trim().replace(/^"(.*)"$/, '$1')).filter(id => id)
      }
      console.log(`⚠️ [field-processing] Linked items field is not array, returning empty:`, value)
      return []
    
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
 * @param resolveLinkedItems - Optional function to resolve linked items to full objects
 * @param language - Language code for linked items resolution
 * @returns Processed content object ready for frontend consumption
 */
export async function processContentFields(
  content: Record<string, any>, 
  fields: ContentField[],
  resolveLinkedItems?: (itemIds: string[], language: string) => Promise<any[]>,
  language: string = 'en'
): Promise<Record<string, any>> {
  console.log('🔧 [field-processing] processContentFields called with:', Object.keys(content), 'and fields:', fields.map(f => f.field_key))
  console.log('🔧 [field-processing] Raw content values:', content)
  const processed: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(content)) {
    const field = fields.find(f => f.field_key === key)
    
    // Debug logging for array-like fields
    if (['items', 'linked_items', 'list'].includes(key) || (field && ['items', 'linked_items', 'list'].includes(field.field_type))) {
      console.log(`🎯 [field-processing] Processing '${key}' field:`)
      console.log(`  - Field found:`, !!field)
      console.log(`  - Field type:`, field?.field_type)
      console.log(`  - Raw value type:`, typeof value)
      console.log(`  - Raw value:`, value)
      console.log(`  - resolveLinkedItems provided:`, !!resolveLinkedItems)
    }
    
    if (field) {
      let processedValue = processFieldValue(value, field.field_type)
      
      // Debug after processing
      if (['items', 'linked_items', 'list'].includes(field.field_type)) {
        console.log(`🔧 [field-processing] After processFieldValue for '${key}':`, processedValue)
      }
      
      // Special handling for linked_items - resolve to full objects if resolver provided
      if (field.field_type === 'linked_items' && resolveLinkedItems && Array.isArray(processedValue) && processedValue.length > 0) {
        console.log(`🔗 [field-processing] Resolving linked_items for field '${key}' with IDs:`, processedValue)
        // Ensure all values are strings before passing to resolveLinkedItems
        const stringIds = processedValue.map(id => {
          if (typeof id === 'string') return id
          if (typeof id === 'object' && id !== null && 'id' in id) return id.id
          console.warn(`🔗 [field-processing] Converting non-string ID to string:`, id)
          return String(id)
        }).filter(id => id && id !== 'null' && id !== 'undefined')
        
        try {
          processedValue = await resolveLinkedItems(stringIds, language)
          console.log(`✅ [field-processing] Resolved linked_items for '${key}':`, processedValue.length, 'items')
          if (processedValue.length > 0) {
            console.log(`🔍 [field-processing] Sample resolved item:`, processedValue[0])
          }
        } catch (error) {
          console.error(`❌ [field-processing] Failed to resolve linked items:`, error)
          // Keep the IDs if resolution fails
        }
      }
      
      // Special handling for items field - resolve to full objects if resolver provided
      if (field.field_type === 'items' && resolveLinkedItems && Array.isArray(processedValue) && processedValue.length > 0) {
        console.log(`🎯 [field-processing] Resolving items for field '${key}' with IDs:`, processedValue)
        try {
          processedValue = await resolveLinkedItems(processedValue, language)
          console.log(`✅ [field-processing] Resolved items for '${key}':`, processedValue.length, 'items')
          if (processedValue.length > 0) {
            console.log(`🔍 [field-processing] Sample resolved item:`, processedValue[0])
          }
        } catch (error) {
          console.error(`❌ [field-processing] Failed to resolve items:`, error)
          // Keep the IDs if resolution fails
        }
      }
      
      processed[key] = processedValue
    } else {
      // Keep untyped fields as-is
      processed[key] = value
    }
  }
  
  return processed
}