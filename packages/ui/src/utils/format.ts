/**
 * Format utility functions for the Tiko UI library
 * Provides common text formatting and transformation functions
 */

/**
 * Capitalizes the first letter of a string
 * @param str - String to capitalize
 * @returns String with first letter capitalized
 * @example
 * capitalize("hello world") // "Hello world"
 * capitalize("") // ""
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts string to title case (capitalizes each word)
 * @param str - String to convert to title case
 * @returns String in title case
 * @example
 * titleCase("hello world") // "Hello World"
 * titleCase("the quick brown fox") // "The Quick Brown Fox"
 */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Converts camelCase or PascalCase to kebab-case
 * @param str - String to convert
 * @returns String in kebab-case
 * @example
 * camelToKebab("myVariableName") // "my-variable-name"
 * camelToKebab("PascalCase") // "pascal-case"
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Converts kebab-case to camelCase
 * @param str - String to convert
 * @returns String in camelCase
 * @example
 * kebabToCamel("my-variable-name") // "myVariableName"
 * kebabToCamel("pascal-case") // "pascalCase"
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Truncates text to specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to append when truncated (default: "...")
 * @returns Truncated text with suffix if needed
 * @example
 * truncate("This is a long text", 10) // "This is a..."
 * truncate("Short", 10) // "Short"
 * truncate("Long text", 8, "…") // "Long te…"
 */
export function truncate(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Strips HTML tags from a string
 * @param html - HTML string to clean
 * @returns Plain text without HTML tags
 * @example
 * stripHtml("<p>Hello <strong>world</strong></p>") // "Hello world"
 * stripHtml("Plain text") // "Plain text"
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Formats a number with thousand separators
 * @param num - Number to format
 * @param separator - Separator character (default: ",")
 * @returns Formatted number string
 * @example
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(1234567, " ") // "1 234 567"
 */
export function formatNumber(num: number, separator: string = ','): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

/**
 * Formats file size in human-readable format
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string
 * @example
 * formatFileSize(1024) // "1.00 KB"
 * formatFileSize(1536, 1) // "1.5 KB"
 * formatFileSize(1048576) // "1.00 MB"
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Generates initials from a full name
 * @param name - Full name string
 * @param maxInitials - Maximum number of initials (default: 2)
 * @returns Initials string
 * @example
 * getInitials("John Doe") // "JD"
 * getInitials("John Michael Doe", 3) // "JMD"
 * getInitials("Madonna") // "M"
 */
export function getInitials(name: string, maxInitials: number = 2): string {
  return name
    .split(' ')
    .slice(0, maxInitials)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}

/**
 * Creates a URL-friendly slug from text
 * @param text - Text to convert to slug
 * @returns URL-friendly slug
 * @example
 * slugify("Hello World!") // "hello-world"
 * slugify("My Awesome Post #1") // "my-awesome-post-1"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}