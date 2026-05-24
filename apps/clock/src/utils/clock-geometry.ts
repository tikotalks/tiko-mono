export type ClockLearningMode = 'full-hours' | 'half-hours' | 'quarter-hours' | 'five-minutes'

export interface ClockTime {
	hour: number
	minute: number
}

export interface HandAngles {
	hour: number
	minute: number
}

export interface ValidationResult {
	accepted: boolean
	celebrate: boolean
	feedback: string
	mistake?: 'minute-hand-not-twelve' | 'wrong-hour' | 'wrong-minute'
}

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

export function getTimeFromAngles(angles: HandAngles, mode: ClockLearningMode): ClockTime {
	const minuteStep =
		mode === 'full-hours' ? 60 : mode === 'half-hours' ? 30 : mode === 'quarter-hours' ? 15 : 5
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

export function formatClockTime(time: ClockTime) {
	const normalized = normalizeClockTime(time)
	if (normalized.minute === 0) return `${normalized.hour} o’clock`
	if (normalized.minute < 10) return `${normalized.hour}:0${normalized.minute}`
	return `${normalized.hour}:${normalized.minute}`
}

export function validateClockAnswer({
	target,
	answer,
	mode,
}: {
	target: ClockTime
	answer: ClockTime
	mode: ClockLearningMode
}): ValidationResult {
	const targetNormalized = normalizeClockTime(target)
	const answerNormalized = normalizeClockTime(answer)
	const minuteTolerance = mode === 'full-hours' ? 5 : mode === 'half-hours' ? 6 : 4
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
			feedback: 'Move the long hand to 12 for o’clock.',
		}
	}

	if (hourDistance > hourTolerance) {
		return {
			accepted: false,
			celebrate: false,
			mistake: 'wrong-hour',
			feedback: 'The short hand is pointing to a different hour.',
		}
	}

	if (minuteDistance > minuteTolerance) {
		return {
			accepted: false,
			celebrate: false,
			mistake: 'wrong-minute',
			feedback: 'Try moving the long hand closer to the minute mark.',
		}
	}

	return {
		accepted: true,
		celebrate: true,
		feedback: `Great! That is ${formatClockTime(targetNormalized)}.`,
	}
}
