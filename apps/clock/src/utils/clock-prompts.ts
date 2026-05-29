import type { ClockMode, ClockPrompt, ClockPromptOption, ClockStage } from '../models/clock.model'
import { formatDigital, formatSpoken, setClockTime } from './clock-time'
export function targetsForStage(stage: ClockStage): number[] {
	if (stage === 'half-past')
		return Array.from({ length: 12 }, (_, index) => setClockTime(index + 1, 30))
	if (stage === 'full-hours')
		return Array.from({ length: 12 }, (_, index) => setClockTime(index + 1, 0))
	return [setClockTime(3, 0)]
}
export const getStageTargets = targetsForStage
export function createClockPrompt(stage: ClockStage, mode: ClockMode, seed = 3): ClockPrompt {
	const targets = targetsForStage(stage)
	const targetMinutes = targets[Math.abs(seed) % targets.length]
	const phrase = formatSpoken(targetMinutes, stage)
	return {
		id: `${stage}-${mode}-${targetMinutes}`,
		stage,
		mode,
		targetMinutes,
		phrase,
		label: promptLabel(stage, mode, targetMinutes),
		digital: formatDigital(targetMinutes),
		options: createPromptOptions(stage, targetMinutes),
	}
}
export function createPromptOptions(stage: ClockStage, targetMinutes: number): ClockPromptOption[] {
	const targets = targetsForStage(stage).filter(minutes => minutes !== targetMinutes)
	return Array.from(new Set([targetMinutes, ...targets]))
		.slice(0, 4)
		.map(minutes => ({
			label: formatSpoken(minutes, stage),
			minutesSince12: minutes,
			minutes,
			digital: formatDigital(minutes),
		}))
}
export const createReadOptions = createPromptOptions
export function createMatchCards(stage: ClockStage): ClockPromptOption[] {
	return targetsForStage(stage)
		.slice(0, 4)
		.map(minutes => ({
			label: `${formatDigital(minutes)} ${formatSpoken(minutes, stage)}`,
			minutesSince12: minutes,
			minutes,
			digital: formatDigital(minutes),
		}))
}
export function promptLabel(stage: ClockStage, mode: ClockMode, targetMinutes: number): string {
	if (stage === 'anatomy') return 'Tap the clock parts and learn what each one does.'
	const spoken = formatSpoken(targetMinutes, stage)
	if (mode === 'set') return `Set ${spoken}.`
	if (mode === 'read') return 'What time is this clock showing?'
	if (mode === 'match') return `Find the cards that mean ${spoken}.`
	if (mode === 'explore') return 'Move the hands and watch the time change.'
	if (stage === 'half-past') return 'Half past means the long hand points to 6.'
	return "When the long hand points to 12, it is o'clock."
}
