/**
 * Time utility functions for the Tiko UI library
 * Provides common time formatting and manipulation functions
 */

/**
 * Formats time duration into human-readable string
 * @param seconds - Time duration in seconds
 * @param format - Display format ('short' | 'long')
 * @returns Formatted time string (e.g., "2m 30s" or "2 minutes 30 seconds")
 * @example
 * formatDuration(150, 'short') // "2m 30s"
 * formatDuration(150, 'long') // "2 minutes 30 seconds"
 */
export function formatDuration(seconds: number, format: 'short' | 'long' = 'short'): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(format === 'short' ? `${hours}h` : `${hours} hour${hours !== 1 ? 's' : ''}`);
  }

  if (minutes > 0) {
    parts.push(format === 'short' ? `${minutes}m` : `${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }

  if (remainingSeconds > 0 || parts.length === 0) {
    parts.push(format === 'short' ? `${remainingSeconds}s` : `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`);
  }

  return parts.join(format === 'short' ? ' ' : ' ');
}

/**
 * Formats time as MM:SS display format
 * @param seconds - Time in seconds
 * @returns Formatted time string (e.g., "02:30")
 * @example
 * formatTimer(150) // "02:30"
 * formatTimer(75) // "01:15"
 */
export function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Formats time as HH:MM:SS display format
 * @param seconds - Time in seconds
 * @returns Formatted time string (e.g., "01:02:30")
 * @example
 * formatTimerWithHours(3750) // "01:02:30"
 * formatTimerWithHours(150) // "00:02:30"
 */
export function formatTimerWithHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Parses time string in MM:SS format to seconds
 * @param timeString - Time string in MM:SS format
 * @returns Time in seconds
 * @throws Error if format is invalid
 * @example
 * parseTimer("02:30") // 150
 * parseTimer("01:15") // 75
 */
export function parseTimer(timeString: string): number {
  const parts = timeString.split(':');
  
  if (parts.length !== 2) {
    throw new Error('Invalid time format. Expected MM:SS');
  }
  
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  
  if (isNaN(minutes) || isNaN(seconds) || seconds >= 60) {
    throw new Error('Invalid time values');
  }
  
  return minutes * 60 + seconds;
}

/**
 * Validates if a number represents valid seconds for timer input
 * @param value - Value to validate
 * @returns True if valid seconds (0-59)
 * @example
 * isValidSeconds(30) // true
 * isValidSeconds(60) // false
 * isValidSeconds(-5) // false
 */
export function isValidSeconds(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 59;
}

/**
 * Validates if a number represents valid minutes for timer input
 * @param value - Value to validate
 * @returns True if valid minutes (0 or positive)
 * @example
 * isValidMinutes(30) // true
 * isValidMinutes(-5) // false
 */
export function isValidMinutes(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/**
 * Converts minutes and seconds to total seconds
 * @param minutes - Minutes component
 * @param seconds - Seconds component
 * @returns Total time in seconds
 * @example
 * timeToSeconds(2, 30) // 150
 * timeToSeconds(0, 45) // 45
 */
export function timeToSeconds(minutes: number, seconds: number): number {
  return minutes * 60 + seconds;
}

/**
 * Converts total seconds to minutes and seconds components
 * @param totalSeconds - Total time in seconds
 * @returns Object with minutes and seconds properties
 * @example
 * secondsToTime(150) // { minutes: 2, seconds: 30 }
 * secondsToTime(75) // { minutes: 1, seconds: 15 }
 */
export function secondsToTime(totalSeconds: number): { minutes: number; seconds: number } {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return { minutes, seconds };
}