import type { ClockStage, ValidationResult } from '../models/clock.model'
import { hourFromMinutes, minuteFromMinutes, normalizeMinutes, setClockTime } from './clock-time'
import { shortestMinuteDistance } from './clock-geometry'

function minuteDistance(a: number, b: number): number {
	const diff = Math.abs(a - b) % 60
	return Math.min(diff, 60 - diff)
}

function isStage(value: unknown): value is ClockStage {
	return value === 'anatomy' || value === 'full-hours' || value === 'half-past'
}

function isMinuteNumberLiteral(answer: number, target: number): boolean {
	const targetHour = hourFromMinutes(target)
	return minuteFromMinutes(answer) === (targetHour % 12) * 5
}

function isLikelyHandConfusion(answer: number, target: number): boolean {
	const targetHour = hourFromMinutes(target)
	const targetMinute = minuteFromMinutes(target)
	const swappedHour = targetMinute === 0 ? 12 : Math.round(targetMinute / 5)
	const swappedMinute = (targetHour % 12) * 5
	return shortestMinuteDistance(answer, setClockTime(swappedHour, swappedMinute)) <= 5
}

export function validateClockAnswer(
	a: ClockStage | number,
	b: number,
	c: ClockStage | number
): ValidationResult {
	const stage = isStage(a) ? a : (c as ClockStage)
	const answer = normalizeMinutes(isStage(a) ? b : a)
	const target = normalizeMinutes(isStage(a) ? (c as number) : b)
	const answerMinute = minuteFromMinutes(answer)
	const targetMinute = minuteFromMinutes(target)
	const answerHour = hourFromMinutes(answer)
	const targetHour = hourFromMinutes(target)
	const distance = minuteDistance(answerMinute, targetMinute)
	const totalDistance = shortestMinuteDistance(answer, target)

	if (stage === 'full-hours') {
		if (totalDistance <= 5)
			return {
				status: 'accepted',
				hint: "You set the clock to the right o'clock time.",
				misconception: 'none',
			}
		if (isLikelyHandConfusion(answer, target))
			return {
				status: 'needs-help',
				hint: 'The short hand tells the hour. The long hand tells the minutes.',
				misconception: 'hand-confusion',
			}
		if (isMinuteNumberLiteral(answer, target))
			return {
				status: 'close',
				hint: `The long hand on ${targetHour} means ${targetHour * 5} minutes. For ${targetHour} o'clock, the long hand points to 12.`,
				misconception: 'minute-number-literal',
			}
		if (distance <= 10 || answerHour === targetHour)
			return {
				status: 'close',
				hint: "For o'clock, the long hand points to 12.",
				misconception: 'minute-hand-position',
			}
		return {
			status: 'needs-help',
			hint: 'The short hand chooses the hour.',
			misconception: 'hour-hand-position',
		}
	}
	if (stage === 'half-past') {
		if (totalDistance <= 5)
			return {
				status: 'accepted',
				hint: 'You set half past with the short hand between numbers.',
				misconception: 'none',
			}
		if (answerMinute === 30 && answerHour !== targetHour)
			return {
				status: 'close',
				hint: `At half past ${targetHour}, the short hand is going toward the next number, but the hour is still ${targetHour}.`,
				misconception: 'next-hour-confusion',
			}
		if (isLikelyHandConfusion(answer, target))
			return {
				status: 'needs-help',
				hint: 'Check the hands: the long hand points to minutes, and the short hand shows the hour it has passed.',
				misconception: 'hand-confusion',
			}
		if (distance <= 10)
			return {
				status: 'close',
				hint: 'Half past means the long hand points to 6.',
				misconception: 'minute-hand-position',
			}
		return {
			status: 'needs-help',
			hint: 'At half past, the short hand is halfway to the next number.',
			misconception: 'hour-hand-between-numbers',
		}
	}
	return {
		status: 'accepted',
		hint: 'Tap a clock part to learn what it does.',
		misconception: 'none',
	}
}
