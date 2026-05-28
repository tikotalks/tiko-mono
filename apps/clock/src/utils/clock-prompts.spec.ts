import { describe, expect, it } from 'vitest'
import {
	createClockPrompt,
	createMatchCards,
	createPromptOptions,
	promptLabel,
	targetsForStage,
} from './clock-prompts'

describe('targetsForStage', () => {
	it('full-hours targets are all multiples of 60', () => {
		const targets = targetsForStage('full-hours')
		expect(targets).toHaveLength(12)
		for (const t of targets) {
			expect(t % 60).toBe(0)
		}
	})

	it('half-past targets are all 30 minutes past the hour', () => {
		const targets = targetsForStage('half-past')
		expect(targets).toHaveLength(12)
		for (const t of targets) {
			expect(t % 60).toBe(30)
		}
	})

	it('anatomy returns a single default target', () => {
		const targets = targetsForStage('anatomy')
		expect(targets).toHaveLength(1)
	})
})

describe('createClockPrompt', () => {
	it('creates a set-mode prompt for full-hours', () => {
		const prompt = createClockPrompt('full-hours', 'set', 0)
		expect(prompt.stage).toBe('full-hours')
		expect(prompt.mode).toBe('set')
		expect(prompt.targetMinutes % 60).toBe(0)
		expect(prompt.label).toContain('Set')
	})

	it('creates a read-mode prompt for half-past', () => {
		const prompt = createClockPrompt('half-past', 'read', 2)
		expect(prompt.stage).toBe('half-past')
		expect(prompt.mode).toBe('read')
		expect(prompt.targetMinutes % 60).toBe(30)
		expect(prompt.label).toBe('What time is this clock showing?')
	})

	it('creates a match-mode prompt with options', () => {
		const prompt = createClockPrompt('full-hours', 'match', 5)
		expect(prompt.mode).toBe('match')
		expect(prompt.options.length).toBeGreaterThanOrEqual(1)
	})

	it('creates an explore-mode prompt with move-hands label', () => {
		const prompt = createClockPrompt('full-hours', 'explore', 1)
		expect(prompt.label).toContain('Move the hands')
	})

	it('creates an anatomy learn-mode prompt', () => {
		const prompt = createClockPrompt('anatomy', 'learn', 0)
		expect(prompt.stage).toBe('anatomy')
		expect(prompt.mode).toBe('learn')
		expect(prompt.label).toContain('Tap the clock parts')
	})

	it('rotates through targets with different seeds', () => {
		const p1 = createClockPrompt('full-hours', 'set', 0)
		const p2 = createClockPrompt('full-hours', 'set', 1)
		const p3 = createClockPrompt('full-hours', 'set', 12)
		expect(p3.targetMinutes).toBe(p1.targetMinutes)
		expect(p2.targetMinutes).not.toBe(p1.targetMinutes)
	})

	it('generates a unique id per stage-mode-target', () => {
		const p1 = createClockPrompt('full-hours', 'set', 3)
		const p2 = createClockPrompt('half-past', 'set', 3)
		expect(p1.id).not.toBe(p2.id)
	})
})

describe('createPromptOptions', () => {
	it('returns up to 4 options for full-hours', () => {
		const options = createPromptOptions('full-hours', 180)
		expect(options.length).toBeLessThanOrEqual(4)
		expect(options.length).toBeGreaterThanOrEqual(1)
	})

	it('all full-hour options have :00 digital format', () => {
		const options = createPromptOptions('full-hours', 60)
		for (const opt of options) {
			expect(opt.digital).toContain(':00')
		}
	})

	it('all half-past options have :30 digital format', () => {
		const options = createPromptOptions('half-past', 210)
		for (const opt of options) {
			expect(opt.digital).toContain(':30')
		}
	})

	it('target option is included in the list', () => {
		const options = createPromptOptions('full-hours', 120)
		const found = options.find(o => o.minutes === 120)
		expect(found).toBeDefined()
	})
})

describe('createMatchCards', () => {
	it('returns up to 4 cards with both digital and spoken', () => {
		const cards = createMatchCards('full-hours')
		expect(cards.length).toBeLessThanOrEqual(4)
		for (const card of cards) {
			expect(card.digital).toBeTruthy()
			expect(card.label).toContain(card.digital.split(':')[0])
		}
	})

	it('half-past match cards all contain :30', () => {
		const cards = createMatchCards('half-past')
		for (const card of cards) {
			expect(card.digital).toContain(':30')
		}
	})
})

describe('promptLabel', () => {
	it('set mode for full-hours contains Set and oclock', () => {
		expect(promptLabel('full-hours', 'set', 180)).toContain('Set')
		expect(promptLabel('full-hours', 'set', 180)).toContain("o'clock")
	})

	it('read mode contains What time', () => {
		expect(promptLabel('full-hours', 'read', 180)).toContain('What time')
	})

	it('match mode contains Find the cards', () => {
		expect(promptLabel('full-hours', 'match', 180)).toContain('Find the cards')
	})

	it('explore mode contains Move the hands', () => {
		expect(promptLabel('full-hours', 'explore', 180)).toContain('Move the hands')
	})

	it('learn mode for full-hours mentions oclock', () => {
		expect(promptLabel('full-hours', 'learn', 180)).toContain("o'clock")
	})

	it('set mode for half-past contains Set and half past', () => {
		const label = promptLabel('half-past', 'set', 90)
		expect(label).toContain('Set')
		expect(label).toContain('half past')
	})

	it('learn mode for half-past mentions half past', () => {
		expect(promptLabel('half-past', 'learn', 90).toLowerCase()).toContain('half past')
	})

	it('anatomy learn mode mentions Tap the clock parts', () => {
		expect(promptLabel('anatomy', 'learn', 0)).toContain('Tap the clock parts')
	})
})
