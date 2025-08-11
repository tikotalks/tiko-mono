/**
 * Parse content data from the database, converting JSON strings back to their proper types
 */
export function parseContentData(data: Record<string, any>): Record<string, any> {
  const parsed: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(data)) {
    // Skip if already parsed or null/undefined
    if (value === null || value === undefined || typeof value !== 'string') {
      parsed[key] = value
      continue
    }
    
    // Try to parse JSON strings
    if (
      (value.startsWith('[') && value.endsWith(']')) ||
      (value.startsWith('{') && value.endsWith('}'))
    ) {
      try {
        parsed[key] = JSON.parse(value)
      } catch (e) {
        // If parsing fails, keep as string
        parsed[key] = value
      }
    } else {
      parsed[key] = value
    }
  }
  
  return parsed
}

/**
 * Process section data for frontend display
 */
export function processSectionDataForDisplay(
  sectionData: Record<string, any>,
  fields: Array<{ field_key: string; field_type: string }>
): Record<string, any> {
  const processed: Record<string, any> = {}
  
  for (const field of fields) {
    const value = sectionData[field.field_key]
    
    // Handle different field types
    switch (field.field_type) {
      case 'repeater':
      case 'items':
      case 'list':
        // These should be arrays
        if (typeof value === 'string') {
          try {
            processed[field.field_key] = JSON.parse(value)
          } catch (e) {
            processed[field.field_key] = field.field_type === 'list' ? [] : []
          }
        } else {
          processed[field.field_key] = value || []
        }
        break
        
      case 'media':
      case 'image':
        // These could be arrays or single values
        if (typeof value === 'string' && value.startsWith('[')) {
          try {
            const parsed = JSON.parse(value)
            // If it's an array with one item, return just the item
            processed[field.field_key] = parsed.length === 1 ? parsed[0] : parsed
          } catch (e) {
            processed[field.field_key] = value
          }
        } else {
          processed[field.field_key] = value
        }
        break
        
      case 'number':
        processed[field.field_key] = typeof value === 'string' ? parseFloat(value) || 0 : value
        break
        
      case 'boolean':
        processed[field.field_key] = value === 'true' || value === true
        break
        
      default:
        processed[field.field_key] = value || ''
    }
  }
  
  return processed
}