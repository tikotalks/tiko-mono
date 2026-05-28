import { describe, expect, it } from 'vitest'
import { validateClockAnswer } from './clock-validation'

describe('clock-validation mode flows', () => {
	describe('set mode flow — full-hours', () => {
		it('accepts when child sets the correct hour', () => {
			const result = validateClockAnswer('full-hours', 60, 60)
			expect(result.status).toBe('accepted')
		})

		it('accepts with generous tolerance', () => {
			expect(validateClockAnswer('full-hours', 63, 60).status).toBe('accepted')
			expect(validateClockAnswer('full-hours', 57, 60).status).toBe('accepted')
		})

		it('detects hand confusion', () => {
			// Target is 4 o'clock (240), child sets hour hand to 4 and minute to 20
			const result = validateClockAnswer('full-hours', 20, 240)
			expect(result.misconception).toBe('hand-confusion')
			expect(result.status).toBe('needs-help')
		})
	})

	describe('set mode flow — half-past', () => {
		it('accepts when child sets half past correctly', () => {
			const result = validateClockAnswer('half-past', 90, 90)
			expect(result.status).toBe('accepted')
		})

		it('accepts with tolerance', () => {
			expect(validateClockAnswer('half-past', 93, 90).status).toBe('accepted')
			expect(validateClockAnswer('half-past', 87, 90).status).toBe('accepted')
		})

		it('detects next-hour confusion when minute is right but hour advanced', () => {
			const result = validateClockAnswer('half-past', 150, 90)
			expect(result.misconception).toBe('next-hour-confusion')
			expect(result.status).toBe('close')
		})
	})

	describe('read mode flow — full-hours', () => {
		it('accepts correct answer choice', () => {
			const result = validateClockAnswer('full-hours', 180, 180)
			expect(result.status).toBe('accepted')
		})

		it('rejects wrong answer choice', () => {
			const result = validateClockAnswer('full-hours', 60, 180)
			expect(result.status).not.toBe('accepted')
		})
	})

	describe('read mode flow — half-past', () => {
		it('accepts correct answer choice', () => {
			const result = validateClockAnswer('half-past', 150, 150)
			expect(result.status).toBe('accepted')
		})

		it('rejects wrong answer choice', () => {
			const result = validateClockAnswer('half-past', 30, 150)
			expect(result.status).not.toBe('accepted')
		})
	})

	describe('match mode — full-hours', () => {
		it('accepts matching the correct card', () => {
			const result = validateClockAnswer('full-hours', 300, 300)
			expect(result.status).toBe('accepted')
		})

		it('gives feedback for wrong card', () => {
			const result = validateClockAnswer('full-hours', 120, 300)
			expect(result.status).not.toBe('accepted')
			expect(result.hint).toBeTruthy()
		})
	})

	describe('match mode — half-past', () => {
		it('accepts matching the correct card', () => {
			const result = validateClockAnswer('half-past', 330, 330)
			expect(result.status).toBe('accepted')
		})

		it('gives feedback for wrong card', () => {
			const result = validateClockAnswer('half-past', 90, 330)
			expect(result.status).not.toBe('accepted')
		})
	})

	describe('all full-hour targets', () => {
		it('accepts every full-hour target against itself', () => {
			for (let h = 1; h <= 12; h++) {
				const target = h === 12 ? 0 : h * 60
				const result = validateClockAnswer('full-hours', target, target)
				expect(result.status).toBe('accepted')
			}
		})
	})

	describe('all half-past targets', () => {
		it('accepts every half-past target against itself', () => {
			for (let h = 1; h <= 12; h++) {
				const target = (h === 12 ? 0 : h * 60) + 30
				const result = validateClockAnswer('half-past', target, target)
				expect(result.status).toBe('accepted')
			}
		})
	})

	describe('feedback is child-friendly', () => {
		it('full-hours close hint mentions the long hand', () => {
			const result = validateClockAnswer('full-hours', 250, 240)
			if (result.status === 'close') {
				expect(result.hint.toLowerCase()).toContain('long hand')
			}
		})

		it('half-past close hint mentions the long hand or short hand', () => {
			const result = validateClockAnswer('half-past', 220, 210)
			if (result.status === 'close') {
				const lower = result.hint.toLowerCase()
				expect(lower.includes('long hand') || lower.includes('short hand')).toBe(true)
			}
		})

		it('needs-help hint never contains harsh words', () => {
			const harsh = ['wrong', 'fail', 'bad', 'incorrect', 'error']
			for (const stage of ['full-hours', 'half-past'] as const) {
				for (let target = 0; target < 720; target += 60) {
					for (let answer = 0; answer < 720; answer += 30) {
						const result = validateClockAnswer(stage, answer, target)
						if (result.status === 'needs-help') {
							const lower = result.hint.toLowerCase()
							for (const word of harsh) {
								expect(lower).not.toContain(word)
							}
						}
					}
				}
			}
		})
	})
})
