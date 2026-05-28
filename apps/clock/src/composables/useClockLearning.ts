import { reactive } from 'vue'
import {
	type LearningMode,
	type LearningStage,
	type ClockTime,
	STAGE_MINUTES,
	LEARNING_MODES,
	LEARNING_STAGES,
} from '../models/clock.model'
import {
	type ClockPrompt,
	type ValidationResult,
} from '../models/clock.model'
import {
	validateClockAnswer,
	formatClockTime,
	formatSpokenTime,
	seededHour,
	seededMinute,
	generateDistractors,
	generateLearnSteps,
} from '../utils/clock-geometry'

// Re-export for backward compat
export type { LearningMode as ClockLearningMode, LearningStage as ClockLearningStage } from '../models/clock.model'

export interface ClockModeDefinition {
	id: LearningStage
	title: string
	description: string
	minutes: number[]
}

export interface ClockLearningState {
	selectedMode: LearningMode | null
	selectedStage: LearningStage | null
	currentPrompt: ClockPrompt | null
	completedPrompts: number
	celebration: 'fireworks' | null
	feedback: string
	/** Learn mode: current step index */
	learnStepIndex: number
	learnSteps: Array<{ description: string; time: ClockTime; highlight?: 'hour' | 'minute' | 'both' }>
	/** Match mode: current set of clocks to pair */
	matchItems: Array<{ time: ClockTime; label: string; matched: boolean }>
	matchSelected: number | null
}

/** Backward-compat mode definitions */
export const clockModes: ClockModeDefinition[] = LEARNING_STAGES.map(stage => ({
	id: stage,
	title: stage === 'full-hours' ? 'Full hours' : stage === 'half-past' ? 'Half past' : stage === 'quarters' ? 'Quarters' : 'Five minutes',
	description: stage === 'full-hours'
		? 'Put the long hand on 12 and choose the hour.'
		: stage === 'half-past'
			? 'Learn how the short hand sits between numbers.'
			: stage === 'quarters'
				? 'Practice quarter past and quarter to.'
				: 'Read the clock in five-minute steps.',
	minutes: STAGE_MINUTES[stage],
}))

function createPrompt(
	mode: LearningMode,
	stage: LearningStage,
	seed: number,
	completedPrompts: number,
): ClockPrompt {
	const hour = seededHour(seed, completedPrompts)
	const minute = seededMinute(stage, seed, completedPrompts)
	const target = { hour, minute }
	const spokenTime = formatSpokenTime(target)

	switch (mode) {
		case 'learn':
			return {
				mode,
				stage,
				kind: 'demo',
				target,
				spoken: `This is ${spokenTime}.`,
			}
		case 'set-clock':
			return {
				mode,
				stage,
				kind: 'set-clock',
				target,
				spoken: `Set the clock to ${spokenTime}.`,
			}
		case 'read-clock': {
			const distractors = generateDistractors(target, stage, 2, seed + completedPrompts)
			const options = [target, ...distractors]
			// Shuffle options deterministically
			const shuffled = options.map((opt, i) => ({ opt, sort: ((seed * 7 + completedPrompts * 13 + i * 37) % 100) }))
				.sort((a, b) => a.sort - b.sort)
				.map(item => item.opt)
			return {
				mode,
				stage,
				kind: 'read-clock',
				target,
				spoken: 'What time does this clock show?',
				options: shuffled,
			}
		}
		case 'match': {
			// Generate 3 pairs for matching
			const items: ClockPrompt['options'] = []
			for (let i = 0; i < 3; i++) {
				const h = seededHour(seed, completedPrompts + i)
				const m = seededMinute(stage, seed, completedPrompts + i)
				items.push({ hour: h, minute: m })
			}
			return {
				mode,
				stage,
				kind: 'match',
				target,
				spoken: 'Match each clock to the right time.',
				options: items,
			}
		}
		case 'explore':
			return {
				mode,
				stage,
				kind: 'explore',
				target: { hour: new Date().getHours() % 12 || 12, minute: new Date().getMinutes() },
				spoken: 'Move the hands to any time you like.',
			}
	}
}

function createMatchItems(times: ClockTime[], seed: number): ClockLearningState['matchItems'] {
	const labels = times.map(t => formatClockTime(t))
	// Create a shuffled label order for matching
	const shuffledIndices = labels
		.map((_, i) => i)
		.sort((a, b) => ((seed * 7 + a * 13) % 100) - ((seed * 7 + b * 13) % 100))

	return times.map((time, i) => ({
		time,
		label: labels[shuffledIndices[i]] ?? labels[i] ?? formatClockTime(time),
		matched: false,
	}))
}

export function createClockLearningSession(options: { seed?: number } = {}) {
	const seed = options.seed ?? new Date().getHours()
	const state = reactive<ClockLearningState>({
		selectedMode: null,
		selectedStage: null,
		currentPrompt: null,
		completedPrompts: 0,
		celebration: null,
		feedback: 'Choose a mode to start.',
		learnStepIndex: 0,
		learnSteps: [],
		matchItems: [],
		matchSelected: null,
	})

	function chooseMode(mode: LearningMode, stage: LearningStage) {
		state.selectedMode = mode
		state.selectedStage = stage
		state.completedPrompts = 0
		state.celebration = null
		state.learnStepIndex = 0
		state.matchItems = []
		state.matchSelected = null

		if (mode === 'learn') {
			state.learnSteps = generateLearnSteps(stage, seed)
			state.feedback = 'Watch and learn!'
		} else if (mode === 'explore') {
			state.feedback = 'Move the hands to any time you like.'
		} else {
			state.feedback = 'Ready!'
		}
	}

	function nextPrompt() {
		const mode = state.selectedMode ?? 'set-clock'
		const stage = state.selectedStage ?? 'full-hours'

		if (mode === 'learn') {
			// Learn mode steps through demo, no random prompts
			if (state.learnStepIndex < state.learnSteps.length) {
				const step = state.learnSteps[state.learnStepIndex]
				state.currentPrompt = {
					mode,
					stage,
					kind: 'demo',
					target: step.time,
					spoken: step.description,
				}
				state.celebration = null
				state.feedback = step.description
			}
			return state.currentPrompt
		}

		state.currentPrompt = createPrompt(mode, stage, seed, state.completedPrompts)
		state.celebration = null
		state.feedback = state.currentPrompt.spoken

		// Set up match items if match mode
		if (mode === 'match' && state.currentPrompt.options) {
			state.matchItems = createMatchItems(state.currentPrompt.options, seed + state.completedPrompts)
			state.matchSelected = null
		}

		return state.currentPrompt
	}

	function submitAnswer(answer: ClockTime): ValidationResult {
		if (!state.currentPrompt) nextPrompt()
		const prompt = state.currentPrompt as ClockPrompt

		// Explore mode: no validation, always accept
		if (prompt.mode === 'explore') {
			return { accepted: true, celebrate: false, feedback: formatClockTime(answer) }
		}

		// Learn mode: no real validation, just advance
		if (prompt.mode === 'learn') {
			return { accepted: true, celebrate: false, feedback: prompt.spoken }
		}

		const result = validateClockAnswer({ target: prompt.target, answer, mode: prompt.stage })
		state.feedback = result.feedback
		state.celebration = result.celebrate ? 'fireworks' : null

		if (result.accepted) {
			state.completedPrompts += 1
		}

		return result
	}

	/** Learn mode: advance to next demo step */
	function advanceLearnStep(): boolean {
		state.learnStepIndex += 1
		if (state.learnStepIndex < state.learnSteps.length) {
			nextPrompt()
			return true
		}
		// Learn complete
		state.celebration = 'fireworks'
		state.feedback = 'Great watching! You learned the concept.'
		return false
	}

	/** Read-clock mode: check if chosen option matches target */
	function checkReadClockAnswer(chosenTime: ClockTime): ValidationResult {
		if (!state.currentPrompt) return { accepted: false, celebrate: false, feedback: 'No prompt.' }
		const target = state.currentPrompt.target
		const normalizedChosen = { hour: ((chosenTime.hour - 1 + 12) % 12) + 1, minute: chosenTime.minute }
		const normalizedTarget = { hour: ((target.hour - 1 + 12) % 12) + 1, minute: target.minute }

		if (normalizedChosen.hour === normalizedTarget.hour && normalizedChosen.minute === normalizedTarget.minute) {
			state.celebration = 'fireworks'
			state.feedback = `Correct! That is ${formatClockTime(target)}.`
			state.completedPrompts += 1
			return { accepted: true, celebrate: true, feedback: state.feedback }
		}

		state.feedback = `Not quite. The clock shows ${formatClockTime(target)}.`
		return { accepted: false, celebrate: false, feedback: state.feedback }
	}

	/** Match mode: try to pair a clock and label */
	function checkMatchPair(clockIndex: number, labelIndex: number): boolean {
		if (!state.matchItems[clockIndex] || !state.matchItems[labelIndex]) return false
		const clockTime = state.matchItems[clockIndex]?.time
		const labelText = state.matchItems[labelIndex]?.label
		if (!clockTime || !labelText) return false

		const isMatch = formatClockTime(clockTime) === labelText
		if (isMatch) {
			if (state.matchItems[clockIndex]) state.matchItems[clockIndex].matched = true
			if (state.matchItems[labelIndex]) state.matchItems[labelIndex].matched = true
		}
		return isMatch
	}

	/** Check if all match items are matched */
	function isMatchComplete(): boolean {
		return state.matchItems.length > 0 && state.matchItems.every(item => item.matched)
	}

	function goBackToModes() {
		state.currentPrompt = null
		state.feedback = 'Choose a mode to start.'
		state.celebration = null
		state.learnStepIndex = 0
		state.learnSteps = []
		state.matchItems = []
		state.matchSelected = null
	}

	return {
		state,
		chooseMode,
		nextPrompt,
		submitAnswer,
		advanceLearnStep,
		checkReadClockAnswer,
		checkMatchPair,
		isMatchComplete,
		goBackToModes,
	}
}

export function useClockLearning(options: { seed?: number } = {}) {
	return createClockLearningSession(options)
}
