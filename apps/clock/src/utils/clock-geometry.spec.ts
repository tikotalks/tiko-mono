import { describe, expect, it } from 'vitest'
import {
	getHandAngles,
	getTimeFromAngles,
	normalizeClockTime,
	validateClockAnswer,
} from './clock-geometry'

describe('clock geometry', () => {
	it('moves the hour hand proportionally at half past', () => {
		expect(getHandAngles({ hour: 3, minute: 30 })).toEqual({ hour: 105, minute: 180 })
	})

	it('normalizes twelve as zero minutes since twelve for analog math', () => {
		expect(normalizeClockTime({ hour: 12, minute: 0 }).minutesSinceTwelve).toBe(0)
		expect(normalizeClockTime({ hour: 4, minute: 0 }).minutesSinceTwelve).toBe(240)
	})

	it('converts hand angles back to staged full-hour time', () => {
		expect(getTimeFromAngles({ hour: 120, minute: 2 }, 'full-hours')).toEqual({
			hour: 4,
			minute: 0,
		})
	})

	it('accepts full-hour answers with generous tolerance', () => {
		const result = validateClockAnswer({
			target: { hour: 4, minute: 0 },
			answer: { hour: 4, minute: 3 },
			mode: 'full-hours',
		})

		expect(result.accepted).toBe(true)
		expect(result.celebrate).toBe(true)
		expect(result.feedback).toBe('Great! That is 4 o’clock.')
	})

	it('gives a specific hint when the minute hand is not on twelve for full hours', () => {
		const result = validateClockAnswer({
			target: { hour: 4, minute: 0 },
			answer: { hour: 4, minute: 20 },
			mode: 'full-hours',
		})

		expect(result.accepted).toBe(false)
		expect(result.mistake).toBe('minute-hand-not-twelve')
	})
})
