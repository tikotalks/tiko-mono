import { describe, expect, it } from 'vitest'
import { addMinutesForStage, angleToMinutes, timeToAngles } from './clock-geometry'

describe('clock-geometry', () => {
	it('maps 3:00 to the expected hand angles', () => {
		expect(timeToAngles(180)).toEqual({ hour: 90, minute: 0 })
	})

	it('maps 3:30 to the expected geared hand angles', () => {
		expect(timeToAngles(210)).toEqual({ hour: 105, minute: 180 })
	})

	it('moves the hour hand proportionally when minutes move', () => {
		const start = timeToAngles(180)
		const moved = timeToAngles(addMinutesForStage(180, 30, 'half-past'))
		expect(moved.hour).toBeGreaterThan(start.hour)
		expect(moved.hour).toBe(105)
	})

	it('handles wraparound near 12 when converting an angle', () => {
		expect(angleToMinutes(359, 'full-hours')).toBe(0)
		expect(angleToMinutes(-1, 'full-hours')).toBe(0)
	})
})
