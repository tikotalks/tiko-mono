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
  date: Date | null | undefined,
  locale: string = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short'
  }
): string {
  if (!date) return 'Never'

  return new Intl.DateTimeFormat(locale, options).format(date)
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
