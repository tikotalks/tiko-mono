import { describe, expect, it } from 'vitest'
import { validateClockAnswer } from './clock-validation'

describe('clock-validation', () => {
	describe('full-hours', () => {
		it('accepts exact full-hour answer', () => {
			const result = validateClockAnswer(240, 240, 'full-hours')
			expect(result.status).toBe('accepted')
			expect(result.misconception).toBe('none')
		})

		it('accepts near full-hour within tolerance', () => {
			expect(validateClockAnswer(244, 240, 'full-hours').status).toBe('accepted')
			expect(validateClockAnswer(236, 240, 'full-hours').status).toBe('accepted')
		})

		it('accepts across the previous-hour boundary', () => {
			expect(validateClockAnswer(239, 240, 'full-hours').status).toBe('accepted')
		})

		it('does not accept nearly-next hour answers as previous full hour', () => {
			expect(validateClockAnswer(299, 240, 'full-hours').status).not.toBe('accepted')
		})

		it('detects minute-number literal reading', () => {
			const result = validateClockAnswer(260, 240, 'full-hours')
			expect(result.status).toBe('close')
			expect(result.misconception).toBe('minute-number-literal')
		})

		it('returns close for minute-hand drift', () => {
			expect(validateClockAnswer(250, 240, 'full-hours').status).toBe('close')
		})

		it('returns close when minute hand is correct but hour is wrong', () => {
			const result = validateClockAnswer(120, 240, 'full-hours')
			expect(result.status).toBe('close')
			expect(result.misconception).toBe('minute-hand-position')
		})

		it('detects hand confusion in full-hours', () => {
			const result = validateClockAnswer(20, 240, 'full-hours')
			expect(result.misconception).toBe('hand-confusion')
		})

		it('accepts 12 oclock exactly', () => {
			expect(validateClockAnswer(0, 0, 'full-hours').status).toBe('accepted')
			expect(validateClockAnswer(5, 0, 'full-hours').status).toBe('accepted')
		})
	})

	describe('half-past', () => {
		it('accepts exact half-past answer', () => {
			const result = validateClockAnswer(210, 210, 'half-past')
			expect(result.status).toBe('accepted')
			expect(result.misconception).toBe('none')
		})

		it('accepts near half-past within tolerance', () => {
			expect(validateClockAnswer(214, 210, 'half-past').status).toBe('accepted')
			expect(validateClockAnswer(206, 210, 'half-past').status).toBe('accepted')
		})

		it('detects next-hour confusion', () => {
			const result = validateClockAnswer(270, 210, 'half-past')
			expect(result.status).toBe('close')
			expect(result.misconception).toBe('next-hour-confusion')
		})

		it('detects hour-hand-between-numbers when minute is at 12', () => {
			const result = validateClockAnswer(180, 210, 'half-past')
			expect(result.status).toBe('needs-help')
			expect(result.misconception).toBe('hour-hand-between-numbers')
		})

		it('returns close for small minute drift', () => {
			const result = validateClockAnswer(220, 210, 'half-past')
			expect(result.status).toBe('close')
		})

		it('returns needs-help for far-off answers', () => {
			const result = validateClockAnswer(0, 210, 'half-past')
			expect(result.status).toBe('needs-help')
		})
	})

	describe('anatomy', () => {
		it('always accepts in anatomy stage', () => {
			const result = validateClockAnswer('anatomy', 0, 'anatomy')
			expect(result.status).toBe('accepted')
		})
	})

	describe('signature overloads', () => {
		it('supports the (stage, answer, target) overload', () => {
			const result = validateClockAnswer('full-hours', 240, 240)
			expect(result.status).toBe('accepted')
		})

		it('supports the (answer, target, stage) overload', () => {
			const result = validateClockAnswer(240, 240, 'full-hours')
			expect(result.status).toBe('accepted')
		})
	})
})
