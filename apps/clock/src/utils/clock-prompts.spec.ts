import { describe, expect, it } from 'vitest'
import { createClockPrompt, targetsForStage } from './clock-prompts'

describe('clock-prompts', () => {
	it('generates only full-hour targets for full hours', () => {
		expect(targetsForStage('full-hours').every(minutes => minutes % 60 === 0)).toBe(true)
	})

	it('generates only half-past targets for half past', () => {
		expect(targetsForStage('half-past').every(minutes => minutes % 60 === 30)).toBe(true)
	})

	it('keeps read options inside the selected stage', () => {
		const prompt = createClockPrompt('full-hours', 'read', 3)
		expect(prompt.options.every(option => option.minutes % 60 === 0)).toBe(true)
	})

	it('pairs match cards with analog, digital, and spoken values', () => {
		const prompt = createClockPrompt('half-past', 'match', 2)
		expect(prompt.options[0]).toMatchObject({ minutes: prompt.targetMinutes })
		expect(prompt.options[0].digital).toContain(':30')
		expect(prompt.options[0].label).toContain('half past')
	})
})
