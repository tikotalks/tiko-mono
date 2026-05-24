import { reactive } from 'vue'
import {
	type ClockLearningMode,
	type ClockTime,
	validateClockAnswer,
} from '../utils/clock-geometry'

export interface ClockModeDefinition {
	id: ClockLearningMode
	title: string
	description: string
	minutes: number[]
}

export interface ClockPrompt {
	mode: ClockLearningMode
	kind: 'set-clock'
	target: ClockTime
	spoken: string
}

export const clockModes: ClockModeDefinition[] = [
	{
		id: 'full-hours',
		title: 'Full hours',
		description: 'Put the long hand on 12 and choose the hour.',
		minutes: [0],
	},
	{
		id: 'half-hours',
		title: 'Half past',
		description: 'Learn how the short hand sits between numbers.',
		minutes: [0, 30],
	},
	{
		id: 'quarter-hours',
		title: 'Quarters',
		description: 'Practice quarter past and quarter to.',
		minutes: [0, 15, 30, 45],
	},
	{
		id: 'five-minutes',
		title: 'Five minutes',
		description: 'Read the clock in five-minute steps.',
		minutes: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
	},
]

export interface ClockLearningState {
	selectedMode: ClockLearningMode | null
	currentPrompt: ClockPrompt | null
	completedPrompts: number
	celebration: 'fireworks' | null
	feedback: string
}

function seededHour(seed: number, completedPrompts: number) {
	return ((((seed - 1 + completedPrompts * 5) % 12) + 12) % 12) + 1
}

function createPrompt(
	mode: ClockLearningMode,
	seed: number,
	completedPrompts: number
): ClockPrompt {
	const definition = clockModes.find(item => item.id === mode) ?? clockModes[0]
	const hour = seededHour(seed, completedPrompts)
	const minute = definition.minutes[(seed + completedPrompts) % definition.minutes.length]
	const target = { hour, minute }
	const spokenTime =
		minute === 0 ? `${hour} o’clock` : `${hour}:${minute.toString().padStart(2, '0')}`

	return {
		mode,
		kind: 'set-clock',
		target,
		spoken: `Set the clock to ${spokenTime}.`,
	}
}

export function createClockLearningSession(options: { seed?: number } = {}) {
	const seed = options.seed ?? new Date().getHours()
	const state = reactive<ClockLearningState>({
		selectedMode: null,
		currentPrompt: null,
		completedPrompts: 0,
		celebration: null,
		feedback: 'Choose a mode to start.',
	})

	function chooseMode(mode: ClockLearningMode) {
		state.selectedMode = mode
		state.completedPrompts = 0
		state.celebration = null
		state.feedback = 'Ready. Set the clock to match the prompt.'
	}

	function nextPrompt() {
		const mode = state.selectedMode ?? 'full-hours'
		state.currentPrompt = createPrompt(mode, seed, state.completedPrompts)
		state.celebration = null
		state.feedback = state.currentPrompt.spoken
		return state.currentPrompt
	}

	function submitAnswer(answer: ClockTime) {
		if (!state.currentPrompt) nextPrompt()
		const prompt = state.currentPrompt as ClockPrompt
		const result = validateClockAnswer({ target: prompt.target, answer, mode: prompt.mode })
		state.feedback = result.feedback
		state.celebration = result.celebrate ? 'fireworks' : null

		if (result.accepted) {
			state.completedPrompts += 1
		}

		return result
	}

	return { state, chooseMode, nextPrompt, submitAnswer }
}

export function useClockLearning(options: { seed?: number } = {}) {
	return createClockLearningSession(options)
}
