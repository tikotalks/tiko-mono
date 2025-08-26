// Types for extended media field with source support

export type MediaSourceType = 'public' | 'assets' | 'personal' | 'url';

export interface MediaFieldValue {
  id: string;
  source: MediaSourceType;
  url?: string; // For external URLs or fallback
  metadata?: {
    alt?: string;
    caption?: string;
    [key: string]: any;
  };
}

export interface MediaFieldMultipleValue {
  items: MediaFieldValue[];
}

// Helper to ensure backward compatibility
export function normalizeMediaValue(value: any): MediaFieldValue | MediaFieldValue[] | null {
  if (!value) return null;
  
  // Handle array of values
  if (Array.isArray(value)) {
    return value.map(v => normalizeSingleValue(v)).filter(Boolean) as MediaFieldValue[];
  }
  
  // Handle single value
  return normalizeSingleValue(value);
}

function normalizeSingleValue(value: any): MediaFieldValue | null {
  if (!value) return null;
  
  // If it's already in the new format
  if (typeof value === 'object' && 'id' in value && 'source' in value) {
    return value as MediaFieldValue;
  }
  
  // If it's just a string ID (legacy format), default to 'public' as requested
  if (typeof value === 'string') {
    return {
      id: value,
      source: 'public' // Default to public when no source is specified
    };
  }
  
  return null;
}