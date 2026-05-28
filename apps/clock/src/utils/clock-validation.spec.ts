import { describe, expect, it } from 'vitest'
import { validateClockAnswer } from './clock-validation'

describe('clock-validation', () => {
	it('accepts full-hour answers within tolerance', () => {
		expect(validateClockAnswer(244, 240, 'full-hours').status).toBe('accepted')
	})

	it('returns close for full-hour minute hand drift', () => {
		expect(validateClockAnswer(250, 240, 'full-hours').status).toBe('close')
	})

	it('accepts half-past answers within tolerance', () => {
		expect(validateClockAnswer(214, 210, 'half-past').status).toBe('accepted')
	})

	it('detects half-past next-hour confusion', () => {
		const result = validateClockAnswer(270, 210, 'half-past')
		expect(result.status).toBe('close')
		expect(result.misconception).toBe('next-hour-confusion')
	})
})
