import { describe, expect, it } from 'vitest'
import { formatDigital, formatSpoken, normalizeMinutes } from './clock-time'

describe('clock-time', () => {
	it('normalizes minutes into a 12-hour analog range', () => {
		expect(normalizeMinutes(-1)).toBe(719)
		expect(normalizeMinutes(720)).toBe(0)
		expect(normalizeMinutes(721)).toBe(1)
	})

	it('formats 12-hour and 24-hour digital mirrors', () => {
		expect(formatDigital(0)).toBe('12:00')
		expect(formatDigital(210)).toBe('3:30')
		expect(formatDigital(210, true)).toBe('03:30')
	})

	it('formats required spoken stage labels', () => {
		expect(formatSpoken(240, 'full-hours')).toBe("4 o'clock")
		expect(formatSpoken(210, 'half-past')).toBe('half past 3')
	})
})
