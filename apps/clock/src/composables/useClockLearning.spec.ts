import { describe, expect, it } from 'vitest'
import { createClockLearningSession } from './useClockLearning'
import { formatClockTime } from '../utils/clock-geometry'

describe('clock learning session', () => {
	describe('set-clock mode', () => {
		it('lets the child choose full-hours stage and set-clock mode with a prompt', () => {
			const session = createClockLearningSession({ seed: 4 })

			session.chooseMode('set-clock', 'full-hours')
			const prompt = session.nextPrompt()

			expect(prompt?.mode).toBe('set-clock')
			expect(prompt?.stage).toBe('full-hours')
			expect(prompt?.kind).toBe('set-clock')
			expect(prompt?.target).toEqual({ hour: 4, minute: 0 })
			expect(prompt?.spoken).toBe("Set the clock to 4 o'clock.")
		})

		it('celebrates and advances after a tolerant correct answer', () => {
			const session = createClockLearningSession({ seed: 4 })

			session.chooseMode('set-clock', 'full-hours')
			session.nextPrompt()
			const result = session.submitAnswer({ hour: 4, minute: 2 })

			expect(result.accepted).toBe(true)
			expect(result.celebrate).toBe(true)
			expect(session.state.celebration).toBe('fireworks')
			expect(session.state.completedPrompts).toBe(1)
		})

		it('provides specific feedback for minute-hand-not-twelve mistake', () => {
			const session = createClockLearningSession({ seed: 4 })

			session.chooseMode('set-clock', 'full-hours')
			session.nextPrompt()
			const result = session.submitAnswer({ hour: 4, minute: 20 })

			expect(result.accepted).toBe(false)
			expect(result.celebrate).toBe(false)
			expect(result.mistake).toBe('minute-hand-not-twelve')
		})
	})

	describe('half-past stage', () => {
		it('generates half-past prompts', () => {
			const session = createClockLearningSession({ seed: 3 })

			session.chooseMode('set-clock', 'half-past')
			const prompt = session.nextPrompt()

			expect(prompt?.stage).toBe('half-past')
			// Seed 3 + completedPrompts 0 → hour 3, minute 30 (second available minute for half-past)
			expect([0, 30]).toContain(prompt?.target.minute)
		})

		it('accepts half-past answers with tolerance', () => {
			const session = createClockLearningSession({ seed: 3 })

			session.chooseMode('set-clock', 'half-past')
			session.nextPrompt()
			const result = session.submitAnswer({ hour: 3, minute: 28 })

			expect(result.accepted).toBe(true)
			expect(result.celebrate).toBe(true)
		})
	})

	describe('learn mode', () => {
		it('generates demo steps for full-hours', () => {
			const session = createClockLearningSession({ seed: 4 })

			session.chooseMode('learn', 'full-hours')
			session.nextPrompt()

			expect(session.state.learnSteps.length).toBeGreaterThan(0)
			expect(session.state.learnStepIndex).toBe(0)
		})

		it('advances through learn steps', () => {
			const session = createClockLearningSession({ seed: 4 })

			session.chooseMode('learn', 'full-hours')
			session.nextPrompt()

			const hasMore = session.advanceLearnStep()
			expect(hasMore).toBe(true)
			expect(session.state.learnStepIndex).toBe(1)
		})

		it('celebrates when all learn steps are done', () => {
			const session = createClockLearningSession({ seed: 4 })

			session.chooseMode('learn', 'full-hours')
			session.nextPrompt()

			// Advance through all steps
			while (session.advanceLearnStep()) {
				// keep going
			}

			expect(session.state.celebration).toBe('fireworks')
		})
	})

	describe('read-clock mode', () => {
		it('generates a prompt with multiple choice options', () => {
			const session = createClockLearningSession({ seed: 7 })

			session.chooseMode('read-clock', 'full-hours')
			const prompt = session.nextPrompt()

			expect(prompt?.kind).toBe('read-clock')
			expect(prompt?.options).toBeDefined()
			expect(prompt?.options?.length).toBe(3)
			// Target should be one of the options
			const targetStr = formatClockTime(prompt!.target)
			const optionStrs = prompt!.options!.map(o => formatClockTime(o))
			expect(optionStrs).toContain(targetStr)
		})

		it('accepts correct read-clock answer', () => {
			const session = createClockLearningSession({ seed: 7 })

			session.chooseMode('read-clock', 'full-hours')
			const prompt = session.nextPrompt()

			const result = session.checkReadClockAnswer(prompt!.target)
			expect(result.accepted).toBe(true)
			expect(result.celebrate).toBe(true)
		})

		it('rejects wrong read-clock answer', () => {
			const session = createClockLearningSession({ seed: 7 })

			session.chooseMode('read-clock', 'full-hours')
			session.nextPrompt()

			const result = session.checkReadClockAnswer({ hour: 1, minute: 99 })
			expect(result.accepted).toBe(false)
		})
	})

	describe('match mode', () => {
		it('generates match items', () => {
			const session = createClockLearningSession({ seed: 5 })

			session.chooseMode('match', 'full-hours')
			session.nextPrompt()

			expect(session.state.matchItems.length).toBe(3)
		})

		it('detects correct match pairs', () => {
			const session = createClockLearningSession({ seed: 5 })

			session.chooseMode('match', 'full-hours')
			session.nextPrompt()

			// Find two items with the same label (a match)
			const items = session.state.matchItems
			let matched = false
			for (let i = 0; i < items.length; i++) {
				for (let j = 0; j < items.length; j++) {
					if (i !== j && formatClockTime(items[i].time) === items[j].label) {
						const result = session.checkMatchPair(i, j)
						expect(result).toBe(true)
						matched = true
						break
					}
				}
				if (matched) break
			}
		})
	})

	describe('explore mode', () => {
		it('starts without validation pressure', () => {
			const session = createClockLearningSession({ seed: 9 })

			session.chooseMode('explore', 'full-hours')
			session.nextPrompt()

			expect(session.state.currentPrompt?.kind).toBe('explore')
			expect(session.state.feedback).toBe('Move the hands to any time you like.')
		})
	})

	describe('goBackToModes', () => {
		it('resets session state', () => {
			const session = createClockLearningSession({ seed: 4 })

			session.chooseMode('set-clock', 'full-hours')
			session.nextPrompt()
			session.submitAnswer({ hour: 4, minute: 2 })

			session.goBackToModes()

			expect(session.state.currentPrompt).toBeNull()
			expect(session.state.celebration).toBeNull()
			expect(session.state.completedPrompts).toBe(1) // doesn't reset count
			expect(session.state.feedback).toBe('Choose a mode to start.')
		})
	})
})
