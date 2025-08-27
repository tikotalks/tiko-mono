/**
 * Formats bytes into human-readable string with appropriate unit
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "2.5 MB", "1.2 GB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Formats a date into a localized string
 * @param date - Date to format (null returns 'Never')
 * @param locale - Locale string (defaults to 'en-US')
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | null | undefined | string,
  opts?: {
    locale: string
    options: Intl.DateTimeFormatOptions
  }
): string {

  let d = date as Date;
  if(typeof date == 'string'){
    d = new Date(date);
  }

  const { locale, options } = {
    ...{
      locale: 'en-US',
      options: {
        dateStyle: 'medium' as 'medium',
        timeStyle: 'short' as 'short'
      }
    },
    ...opts
  };

  if (!d) return 'Never'

  return new Intl.DateTimeFormat(locale, options).format(d)
}

export function formatTime(date: Date): string {

  let d = date as Date;
  if(typeof date == 'string'){
    d = new Date(date);
  }

  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}


export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}


/**
 * Formats a number with thousand separators
 * @param num - Number to format
 * @param locale - Locale string (defaults to 'en-US')
 * @returns Formatted number string
 */
export function formatNumber(num: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(num)
}

/**
 * Formats a percentage value
 * @param value - Value between 0 and 100
 * @param decimals - Number of decimal places (defaults to 0)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Formats duration in seconds to human-readable format
 * @param seconds - Duration in seconds
 * @param format - Display format ('short' | 'long')
 * @returns Formatted duration string (e.g., "2m 30s" or "2 minutes 30 seconds")
 */
export function formatDuration(seconds: number, format: 'short' | 'long' = 'short'): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts: string[] = []

  if (format === 'short') {
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)
  } else {
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`)
    if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs} ${secs === 1 ? 'second' : 'seconds'}`)
  }

  return parts.join(' ')
}

/**
 * Formats a date relative to now (e.g., "Today", "Yesterday", "3 days ago")
 * @param date - Date to format
 * @param locale - Locale string (defaults to 'en-US')
 * @returns Relative date string
 */
export function formatRelativeDate(
  date: Date | string,
  locale: string = 'en-US'
): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - inputDate.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return formatDate(inputDate, {
      locale,
      options: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }
    })
  }
}



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
  return str.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
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
