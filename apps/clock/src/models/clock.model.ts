/**
 * Clock app domain types and constants.
 *
 * Learning MODES are what the child picks from the home screen:
 *   - Learn       → watch a tiny demo of a concept
 *   - Set the Clock → child moves hands to match a target
 *   - Read the Clock → child reads hands and picks the time
 *   - Match       → pair analog clocks with digital/spoken labels
 *   - Explore     → free manipulative with optional scaffolds
 *
 * Learning STAGES control which time values are available:
 *   - full-hours, half-past, quarters, five-minutes
 */

// --- Learning modes ---

export const LEARNING_MODES = ['learn', 'set-clock', 'read-clock', 'match', 'explore'] as const
export type LearningMode = (typeof LEARNING_MODES)[number]

export const LEARNING_MODE_LABELS: Record<LearningMode, { title: string; description: string }> = {
	learn: {
		title: 'Learn',
		description: 'Watch how the clock shows a time.',
	},
	'set-clock': {
		title: 'Set the clock',
		description: 'Move the hands to match the time.',
	},
	'read-clock': {
		title: 'Read the clock',
		description: 'Look at the clock and pick the right time.',
	},
	match: {
		title: 'Match',
		description: 'Pair each clock with the right time.',
	},
	explore: {
		title: 'Explore',
		description: 'Play with the clock freely.',
	},
}

// --- Learning stages ---

export const LEARNING_STAGES = ['full-hours', 'half-past', 'quarters', 'five-minutes'] as const
export type LearningStage = (typeof LEARNING_STAGES)[number]

export const LEARNING_STAGE_LABELS: Record<LearningStage, { title: string; description: string }> = {
	'full-hours': {
		title: 'Full hours',
		description: 'Put the long hand on 12 and choose the hour.',
	},
	'half-past': {
		title: 'Half past',
		description: 'Learn how the short hand sits between numbers.',
	},
	quarters: {
		title: 'Quarters',
		description: 'Practice quarter past and quarter to.',
	},
	'five-minutes': {
		title: 'Five minutes',
		description: 'Read the clock in five-minute steps.',
	},
}

export const STAGE_MINUTES: Record<LearningStage, number[]> = {
	'full-hours': [0],
	'half-past': [0, 30],
	quarters: [0, 15, 30, 45],
	'five-minutes': [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
}

// --- Core time types ---

export interface ClockTime {
	hour: number
	minute: number
}

export interface HandAngles {
	hour: number
	minute: number
}

// --- Prompt types per learning mode ---

export type PromptKind = 'demo' | 'set-clock' | 'read-clock' | 'match' | 'explore'

export interface ClockPrompt {
	mode: LearningMode
	stage: LearningStage
	kind: PromptKind
	target: ClockTime
	spoken: string
	/** For match mode: the distractor options */
	options?: ClockTime[]
}

// --- Answer validation ---

export type MistakeCategory =
	| 'hand-confusion'
	| 'minute-literal'
	| 'hour-between'
	| 'quarter-to'
	| 'wrong-hour'
	| 'wrong-minute'
	| 'minute-hand-not-twelve'

export interface ValidationResult {
	accepted: boolean
	celebrate: boolean
	feedback: string
	mistake?: MistakeCategory
}

// --- Learning session state ---

export interface ClockLearningState {
	selectedMode: LearningMode | null
	selectedStage: LearningStage | null
	currentPrompt: ClockPrompt | null
	completedPrompts: number
	celebration: 'fireworks' | null
	feedback: string
}

export interface LearnStep {
	description: string
	time: ClockTime
	highlight?: 'hour' | 'minute' | 'both'
}
