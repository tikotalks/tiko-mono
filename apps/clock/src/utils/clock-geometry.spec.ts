import { describe, expect, it } from 'vitest'
import {
	addMinutesForStage,
	angleToMinutes,
	dragHandToClockTime,
	dragMinuteHandToAngle,
	hourAngleToClockTime,
	timeToAngles,
} from './clock-geometry'

describe('clock-geometry', () => {
	describe('timeToAngles', () => {
		it('maps 12:00 to zero angles', () => {
			expect(timeToAngles(0)).toEqual({ hour: 0, minute: 0 })
		})

		it('maps 3:00 to expected angles', () => {
			expect(timeToAngles(180)).toEqual({ hour: 90, minute: 0 })
		})

		it('maps 6:00 to expected angles', () => {
			expect(timeToAngles(360)).toEqual({ hour: 180, minute: 0 })
		})

		it('maps 3:30 to geared hand angles', () => {
			expect(timeToAngles(210)).toEqual({ hour: 105, minute: 180 })
		})

		it('maps 12:30 to geared angles across the top', () => {
			expect(timeToAngles(30)).toEqual({ hour: 15, minute: 180 })
		})

		it('hour hand moves proportionally with minute hand', () => {
			const threeOclock = timeToAngles(180)
			const threeThirty = timeToAngles(210)
			expect(threeThirty.hour - threeOclock.hour).toBe(15)
		})
	})

	describe('addMinutesForStage', () => {
		it('steps by 60 in full-hours', () => {
			expect(addMinutesForStage(180, 60, 'full-hours')).toBe(240)
		})

		it('steps by 30 in half-past', () => {
			expect(addMinutesForStage(180, 30, 'half-past')).toBe(210)
		})

		it('wraps around at 12', () => {
			expect(addMinutesForStage(660, 60, 'full-hours')).toBe(0)
		})
	})

	describe('angleToMinutes', () => {
		it('converts angle to minute value for full-hours', () => {
			expect(angleToMinutes(0, 'full-hours')).toBe(0)
		})

		it('handles wraparound near 12', () => {
			expect(angleToMinutes(359, 'full-hours')).toBe(0)
			expect(angleToMinutes(-1, 'full-hours')).toBe(0)
		})
	})

	describe('dragMinuteHandToAngle', () => {
		it('gears the hour hand when minute hand is dragged to half past', () => {
			const next = dragHandToClockTime('minute', 180, 180, 'half-past')
			expect(next).toBe(210)
			expect(timeToAngles(next).hour).toBe(105)
		})

		it('drags the minute hand with geared hour movement across the top', () => {
			expect(dragMinuteHandToAngle(0, 55, 'full-hours')).toBe(60)
			expect(timeToAngles(60).hour).toBe(30)
		})

		it('keeps full-hours drag precise enough for misconception feedback', () => {
			expect(dragMinuteHandToAngle(120, 240, 'full-hours')).toBe(260)
			expect(hourAngleToClockTime(130, 240, 'full-hours')).toBe(260)
		})
	})

	describe('hourAngleToClockTime', () => {
		it('sets full hours from hour-hand dragging', () => {
			expect(dragHandToClockTime('hour', 120, 0, 'full-hours')).toBe(240)
		})

		it("sets hour from angle at 6 oclock position", () => {
			expect(dragHandToClockTime('hour', 180, 0, 'full-hours')).toBe(360)
		})
	})
})
