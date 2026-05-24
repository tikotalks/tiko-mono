import { describe, expect, it } from 'vitest'
import { createClockLearningSession } from './useClockLearning'

describe('clock learning session', () => {
	it('lets the child choose full-hours mode and receive a set-the-clock prompt', () => {
		const session = createClockLearningSession({ seed: 4 })

		session.chooseMode('full-hours')
		const prompt = session.nextPrompt()

		expect(prompt.mode).toBe('full-hours')
		expect(prompt.kind).toBe('set-clock')
		expect(prompt.target).toEqual({ hour: 4, minute: 0 })
		expect(prompt.spoken).toBe('Set the clock to 4 o’clock.')
	})

	it('celebrates and advances after a tolerant correct answer', () => {
		const session = createClockLearningSession({ seed: 4 })

		session.chooseMode('full-hours')
		session.nextPrompt()
		const result = session.submitAnswer({ hour: 4, minute: 2 })

		expect(result.accepted).toBe(true)
		expect(result.celebrate).toBe(true)
		expect(session.state.celebration).toBe('fireworks')
		expect(session.state.completedPrompts).toBe(1)
	})
})
