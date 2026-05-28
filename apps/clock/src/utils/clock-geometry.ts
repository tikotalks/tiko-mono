import {
	type ClockTime,
	type HandAngles,
	type LearningStage,
	type MistakeCategory,
	type ValidationResult,
	STAGE_MINUTES,
} from '../models/clock.model'

/** @deprecated Use LearningStage from models instead */
export type ClockLearningMode = LearningStage

// Re-export domain types for convenience
export type { ClockTime, LearningStage, HandAngles } from '../models/clock.model'

const MINUTES_ON_CLOCK = 12 * 60

export function normalizeClockTime(time: ClockTime) {
	const hour = ((Math.round(time.hour) - 1 + 12) % 12) + 1
	const minute = Math.max(0, Math.min(59, Math.round(time.minute)))
	const hourIndex = hour % 12
	const minutesSinceTwelve = hourIndex * 60 + minute

	return { hour, minute, minutesSinceTwelve }
}

export function getHandAngles(time: ClockTime): HandAngles {
	const normalized = normalizeClockTime(time)

	return {
		hour: (normalized.minutesSinceTwelve / MINUTES_ON_CLOCK) * 360,
		minute: normalized.minute * 6,
	}
}

export function getTimeFromAngles(angles: HandAngles, mode: LearningStage): ClockTime {
	const minuteStep =
		mode === 'full-hours' ? 60 : mode === 'half-past' ? 30 : mode === 'quarters' ? 15 : 5
	const minute = Math.round((((angles.minute % 360) + 360) % 360) / 6 / minuteStep) * minuteStep
	const normalizedMinute = minute === 60 ? 0 : minute
	const hourFromAngle = Math.round((((angles.hour % 360) + 360) % 360) / 30) || 12
	const hour = ((hourFromAngle - 1 + 12) % 12) + 1

	return { hour, minute: normalizedMinute }
}

function circularDistance(a: number, b: number, modulo: number) {
	const distance = Math.abs(a - b) % modulo
	return Math.min(distance, modulo - distance)
}

export function formatClockTime(time: ClockTime): string {
	const normalized = normalizeClockTime(time)
	if (normalized.minute === 0) return `${normalized.hour} o'clock`
	if (normalized.minute === 15) return `quarter past ${normalized.hour}`
	if (normalized.minute === 30) return `half past ${normalized.hour}`
	if (normalized.minute === 45) return `quarter to ${normalized.hour === 12 ? 1 : normalized.hour + 1}`
	if (normalized.minute < 10) return `${normalized.hour}:0${normalized.minute}`
	return `${normalized.hour}:${normalized.minute}`
}

export function formatDigitalTime(time: ClockTime): string {
	const normalized = normalizeClockTime(time)
	const m = normalized.minute.toString().padStart(2, '0')
	return `${normalized.hour}:${m}`
}

export function formatSpokenTime(time: ClockTime): string {
	return formatClockTime(time)
}

/**
 * Generate a deterministic but varied hour for a given seed and prompt index.
 */
export function seededHour(seed: number, index: number): number {
	return ((((seed - 1 + index * 5) % 12) + 12) % 12) + 1
}

/**
 * Generate a random-ish minute from a stage's available minutes.
 */
export function seededMinute(stage: LearningStage, seed: number, index: number): number {
	const available = STAGE_MINUTES[stage]
	return available[(seed + index) % available.length]
}

/**
 * Detect likely mistake category for wrong answers.
 */
export function detectMistake(
	target: ClockTime,
	answer: ClockTime,
	stage: LearningStage,
): MistakeCategory | undefined {
	const targetNorm = normalizeClockTime(target)
	const answerNorm = normalizeClockTime(answer)

	// Hand confusion: swapped hour and minute values
	// Check this first as it's the most common conceptual error
	if (
		answerNorm.hour === targetNorm.minute &&
		answerNorm.minute === targetNorm.hour
	) {
		return 'hand-confusion'
	}

	// Minute literal: minute value read as position number (e.g. minute=30 read as "3")
	// Only flag this if it's NOT a hand-confusion case (hour and minute are not simply swapped)
	if (
		stage !== 'full-hours' &&
		answerNorm.minute !== targetNorm.minute &&
		Math.abs(answerNorm.minute - targetNorm.minute) > 10 &&
		!(answerNorm.hour === targetNorm.minute && answerNorm.minute === targetNorm.hour)
	) {
		return 'minute-literal'
	}

	// Quarter-to confusion
	if (
		stage === 'quarters' &&
		targetNorm.minute === 45 &&
		answerNorm.hour !== targetNorm.hour
	) {
		return 'quarter-to'
	}

	// Hour-between: wrong hour because hour hand is between numbers
	if (
		stage === 'half-past' &&
		answerNorm.hour !== targetNorm.hour &&
		Math.abs(answerNorm.hour - targetNorm.hour) <= 1
	) {
		return 'hour-between'
	}

	// Minute hand not on 12 for full hours
	if (stage === 'full-hours' && answerNorm.minute > 5) {
		return 'minute-hand-not-twelve'
	}

	// Generic wrong hour
	if (answerNorm.hour !== targetNorm.hour) {
		return 'wrong-hour'
	}

	// Generic wrong minute
	if (answerNorm.minute !== targetNorm.minute) {
		return 'wrong-minute'
	}

	return undefined
}

/**
 * Misconception-specific feedback messages (no emojis).
 */
export function misconceptionFeedback(mistake: MistakeCategory): string {
	switch (mistake) {
		case 'hand-confusion':
			return 'The short hand shows the hour and the long hand shows the minutes. Try swapping them.'
		case 'minute-literal':
			return 'The long hand points to minute marks, not hour numbers. Each mark is one minute.'
		case 'hour-between':
			return 'At half past, the short hand sits between two numbers. It is still in the earlier hour.'
		case 'quarter-to':
			return 'Quarter to means the next hour is coming. The short hand moves toward the next number.'
		case 'wrong-hour':
			return 'The short hand is pointing to a different hour. Look at where it points.'
		case 'wrong-minute':
			return 'Try moving the long hand closer to the right minute mark.'
		case 'minute-hand-not-twelve':
			return 'Move the long hand to 12 for o\'clock.'
	}
}

export function validateClockAnswer({
	target,
	answer,
	mode,
}: {
	target: ClockTime
	answer: ClockTime
	mode: LearningStage
}): ValidationResult {
	const targetNormalized = normalizeClockTime(target)
	const answerNormalized = normalizeClockTime(answer)
	const minuteTolerance = mode === 'full-hours' ? 5 : mode === 'half-past' ? 6 : 4
	const hourTolerance = mode === 'full-hours' ? 8 : 10

	const minuteDistance = circularDistance(answerNormalized.minute, targetNormalized.minute, 60)
	const answerAngles = getHandAngles(answerNormalized)
	const targetAngles = getHandAngles(targetNormalized)
	const hourDistance = circularDistance(answerAngles.hour, targetAngles.hour, 360)

	if (mode === 'full-hours' && minuteDistance > minuteTolerance) {
		return {
			accepted: false,
			celebrate: false,
			mistake: 'minute-hand-not-twelve',
			feedback: misconceptionFeedback('minute-hand-not-twelve'),
		}
	}

	if (hourDistance > hourTolerance) {
		const mistake = detectMistake(target, answer, mode) ?? 'wrong-hour'
		return {
			accepted: false,
			celebrate: false,
			mistake,
			feedback: misconceptionFeedback(mistake),
		}
	}

	if (minuteDistance > minuteTolerance) {
		const mistake = detectMistake(target, answer, mode) ?? 'wrong-minute'
		return {
			accepted: false,
			celebrate: false,
			mistake,
			feedback: misconceptionFeedback(mistake),
		}
	}

	return {
		accepted: true,
		celebrate: true,
		feedback: `Great! That is ${formatClockTime(targetNormalized)}.`,
	}
}

/**
 * Generate distractor options for read-clock and match modes.
 */
export function generateDistractors(
	target: ClockTime,
	stage: LearningStage,
	count: number,
	seed: number,
): ClockTime[] {
	const distractors: ClockTime[] = []
	const targetNorm = normalizeClockTime(target)

	// Strategy 1: wrong hour, same minute
	const hourDelta = ((seed % 3) + 1)
	distractors.push({ hour: ((targetNorm.hour - 1 + hourDelta) % 12) + 1, minute: targetNorm.minute })

	// Strategy 2: same hour, different minute from stage
	if (STAGE_MINUTES[stage].length > 1) {
		const altMinutes = STAGE_MINUTES[stage].filter(m => m !== targetNorm.minute)
		const altMinute = altMinutes[seed % altMinutes.length]
		distractors.push({ hour: targetNorm.hour, minute: altMinute })
	} else {
		distractors.push({ hour: ((targetNorm.hour + 1) % 12) + 1, minute: targetNorm.minute })
	}

	// Strategy 3: wrong hour and minute
	if (distractors.length < count) {
		const h2 = ((targetNorm.hour + hourDelta + 1) % 12) + 1
		const availableMinutes = STAGE_MINUTES[stage]
		const m2 = availableMinutes[(seed + 2) % availableMinutes.length]
		distractors.push({ hour: h2, minute: m2 !== targetNorm.minute ? m2 : availableMinutes[(seed + 3) % availableMinutes.length] })
	}

	// Trim to requested count
	return distractors.slice(0, count)
}

/**
 * Learn mode: generate demonstration steps for a given concept.
 */
export function generateLearnSteps(stage: LearningStage, seed: number): Array<{
	description: string
	time: ClockTime
	highlight?: 'hour' | 'minute' | 'both'
}> {
	const hour = seededHour(seed, 0)

	switch (stage) {
		case 'full-hours':
			return [
				{ description: 'This is the clock face. It has numbers from 1 to 12.', time: { hour: 12, minute: 0 } },
				{ description: 'The short hand points to the hour. Right now it points to 12.', time: { hour: 12, minute: 0 }, highlight: 'hour' },
				{ description: `Now the short hand points to ${hour}. This is ${hour} o'clock.`, time: { hour, minute: 0 }, highlight: 'hour' },
				{ description: 'When the long hand points to 12, it is the start of the hour.', time: { hour, minute: 0 }, highlight: 'minute' },
			]
		case 'half-past':
			return [
				{ description: `This is ${hour} o'clock. The short hand is on ${hour}.`, time: { hour, minute: 0 }, highlight: 'hour' },
				{ description: 'Now the long hand moves to 6. That means 30 minutes.', time: { hour, minute: 30 }, highlight: 'minute' },
				{ description: 'See how the short hand moved halfway toward the next number?', time: { hour, minute: 30 }, highlight: 'both' },
				{ description: `This is half past ${hour}. It is still the ${hour} hour.`, time: { hour, minute: 30 }, highlight: 'both' },
			]
		case 'quarters':
			return [
				{ description: `Starting at ${hour} o'clock.`, time: { hour, minute: 0 } },
				{ description: 'The long hand moves a quarter of the way around. That is 15 minutes, or quarter past.', time: { hour, minute: 15 }, highlight: 'minute' },
				{ description: 'Now the long hand goes to the bottom. Half past.', time: { hour, minute: 30 }, highlight: 'minute' },
				{ description: 'The long hand is three quarters around. That is 45 minutes, or quarter to the next hour.', time: { hour, minute: 45 }, highlight: 'minute' },
			]
		case 'five-minutes':
			return [
				{ description: 'Each big number on the clock is also worth 5 minutes.', time: { hour: 12, minute: 0 } },
				{ description: 'The 1 means 5 minutes. The 2 means 10 minutes. Count by fives.', time: { hour: 12, minute: 5 }, highlight: 'minute' },
				{ description: `The long hand at ${hour} shows ${hour * 5} minutes past the hour.`, time: { hour, minute: 10 }, highlight: 'minute' },
			]
	}
}
