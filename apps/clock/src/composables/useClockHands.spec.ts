import { describe, expect, it } from 'vitest'
import { useClockHands } from './useClockHands'

describe('useClockHands', () => {
	it('keeps hour and minute hands geared from the shared time state', () => {
		const hands = useClockHands(180, 'half-past')

		hands.stepMinutes(30, 'half-past')

		expect(hands.minutesSince12.value).toBe(210)
		expect(hands.angles.value).toEqual({ hour: 105, minute: 180 })
	})

	it('lets the minute hand drag carry the hour hand across 12', () => {
		const hands = useClockHands(55, 'full-hours')

		hands.moveMinuteHandToAngle(0, 'full-hours')

		expect(hands.minutesSince12.value).toBe(60)
		expect(hands.angles.value.hour).toBe(30)
	})

	it('lets full-hours practice show minute-hand misconceptions instead of snapping them away', () => {
		const hands = useClockHands(240, 'full-hours')

		hands.moveMinuteHandToAngle(120, 'full-hours')

		expect(hands.minutesSince12.value).toBe(260)
		expect(hands.angles.value.minute).toBe(120)
	})
})
