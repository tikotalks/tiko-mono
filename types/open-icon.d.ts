/**
 * Type declaration to fix open-icon @1.1.0 TypeScript errors
 * 
 * This file resolves the TS7053 error where the library's searchIcon function
 * tries to access properties on an empty meta object.
 */

// Create a more comprehensive override
declare module 'open-icon/lib/icons/index' {
  // Re-export all types and functions but with better typing
  export * from 'open-icon/dist/icons/types';
  
  // Override the problematic searchIcon function with proper typing
  export function searchIcon(
    term: string, 
    searchIn?: 'name' | 'category' | 'tag' | 'description' | 'title'
  ): Array<{
    id: string;
    name: string;
    title?: string;
    category?: string[];
    tag?: string[];
    description?: string;
  }> | undefined;
}

declare module 'open-icon' {
  // Re-export from the lib version
  export * from 'open-icon/lib/icons/index';
  export * from 'open-icon/dist/icons/types';
  
  // Override the searchIcon function to resolve the typing issue
  export function searchIcon(
    term: string, 
    searchIn?: 'name' | 'category' | 'tag' | 'description' | 'title'
  ): Array<{
    id: string;
    name: string;
    title?: string;
    category?: string[];
    tag?: string[];
    description?: string;
  }> | undefined;
}