import type { ClockAngles, ClockHandKind, ClockStage } from '../models/clock.model'
import { coerceMinutesForStage, normalizeMinutes } from './clock-time'

function roundedHandMinutes(angle: number, increment = 1): number {
	const normalizedAngle = normalizeAngle(angle)
	const minute = Math.round((normalizedAngle / 360) * 60)
	const snapped = Math.round((minute === 60 ? 0 : minute) / increment) * increment
	return normalizeMinutes(snapped) % 60
}

export function timeToAngles(minutesSince12: number): ClockAngles {
	const minutes = normalizeMinutes(minutesSince12)
	return { hour: (minutes / 720) * 360, minute: ((minutes % 60) / 60) * 360 }
}

export function angleToMinutes(angle: number, stage: ClockStage = 'full-hours'): number {
	const raw = roundedHandMinutes(angle)
	return coerceMinutesForStage(raw, stage)
}

export function addMinutesForStage(minutes: number, delta: number, stage: ClockStage): number {
	return coerceMinutesForStage(normalizeMinutes(minutes + delta), stage)
}

export function shortestMinuteDistance(a: number, b: number): number {
	const diff = Math.abs(normalizeMinutes(a) - normalizeMinutes(b)) % 720
	return Math.min(diff, 720 - diff)
}

export function minuteAngleToClockTime(
	angle: number,
	currentMinutes: number,
	stage: ClockStage
): number {
	const hourBase = Math.floor(normalizeMinutes(currentMinutes) / 60) * 60
	const minute = roundedHandMinutes(angle, stage === 'anatomy' ? 1 : 5)
	return normalizeMinutes(hourBase + minute)
}

export function dragMinuteHandToAngle(
	angle: number,
	currentMinutes: number,
	stage: ClockStage
): number {
	const current = normalizeMinutes(currentMinutes)
	const currentMinute = current % 60
	const nextMinute = roundedHandMinutes(angle, stage === 'anatomy' ? 1 : 5)
	let delta = nextMinute - currentMinute
	if (delta > 30) delta -= 60
	if (delta < -30) delta += 60
	return normalizeMinutes(current + delta)
}

export function hourAngleToClockTime(
	angle: number,
	currentMinutes: number,
	stage: ClockStage
): number {
	const raw = normalizeMinutes((normalizeAngle(angle) / 360) * 720)
	const snapped = stage === 'anatomy' ? Math.round(raw) : Math.round(raw / 5) * 5
	const minute = normalizeMinutes(currentMinutes) % 60
	if (stage === 'full-hours' || stage === 'half-past') return normalizeMinutes(snapped)
	return normalizeMinutes(Math.floor(snapped / 60) * 60 + minute)
}

export function dragHandToClockTime(
	hand: ClockHandKind,
	angle: number,
	currentMinutes: number,
	stage: ClockStage
): number {
	return hand === 'minute'
		? dragMinuteHandToAngle(angle, currentMinutes, stage)
		: hourAngleToClockTime(angle, currentMinutes, stage)
}

export function normalizeAngle(angle: number): number {
	return ((angle % 360) + 360) % 360
}

export function pointerToAngle(
	clientX: number,
	clientY: number,
	rectOrPointerX: DOMRect | number,
	pointerY?: number
): number {
	if (typeof rectOrPointerX === 'number') {
		const radians = Math.atan2((pointerY ?? 0) - clientY, rectOrPointerX - clientX)
		return normalizeAngle((radians * 180) / Math.PI + 90)
	}
	const rect = rectOrPointerX
	const centerX = rect.left + rect.width / 2
	const centerY = rect.top + rect.height / 2
	const radians = Math.atan2(clientY - centerY, clientX - centerX)
	return normalizeAngle((radians * 180) / Math.PI + 90)
}
