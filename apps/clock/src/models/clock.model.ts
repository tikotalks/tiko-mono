export type ClockStage = 'anatomy' | 'full-hours' | 'half-past'
export type ClockMode = 'learn' | 'set' | 'read' | 'match' | 'explore'
export type ValidationStatus = 'accepted' | 'close' | 'needs-help'
export type MisconceptionKind =
	| 'minute-hand-position'
	| 'hour-hand-position'
	| 'next-hour-confusion'
	| 'half-past-hour-position'
	| 'hour-hand-between-numbers'
	| 'none'
export interface ClockAngles {
	hour: number
	minute: number
}
export interface ClockSettings {
	showDigital: boolean
	showMinuteLabels: boolean
	showQuarterSlices: boolean
	showHandLabels: boolean
	use24Hour: boolean
	narration: boolean
	reducedCelebration: boolean
}
export interface ClockPromptOption {
	label: string
	minutesSince12: number
	minutes: number
	digital: string
}
export interface ClockPrompt {
	id: string
	stage: ClockStage
	mode: ClockMode
	targetMinutes: number
	phrase: string
	label: string
	digital: string
	options: ClockPromptOption[]
}
export interface ValidationResult {
	status: ValidationStatus
	hint: string
	misconception: MisconceptionKind
}
export interface ClockStageDefinition {
	id: ClockStage
	title: string
	label: string
	shortTitle?: string
	description: string
	defaultMinutes: number
}
export interface ClockModeDefinition {
	id: ClockMode
	title: string
	description: string
}
