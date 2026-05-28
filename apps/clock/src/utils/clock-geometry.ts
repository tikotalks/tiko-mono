import type { ClockAngles, ClockStage } from '../models/clock.model'
import { coerceMinutesForStage, normalizeMinutes } from './clock-time'
export function timeToAngles(minutesSince12: number): ClockAngles {
	const minutes = normalizeMinutes(minutesSince12)
	return { hour: (minutes / 720) * 360, minute: ((minutes % 60) / 60) * 360 }
}
export function angleToMinutes(angle: number, stage: ClockStage = 'full-hours'): number {
	const normalizedAngle = ((angle % 360) + 360) % 360
	const raw = Math.round((normalizedAngle / 360) * 60)
	return coerceMinutesForStage(raw === 60 ? 0 : raw, stage)
}
export function addMinutesForStage(minutes: number, delta: number, stage: ClockStage): number {
	return coerceMinutesForStage(normalizeMinutes(minutes + delta), stage)
}
export function minuteAngleToClockTime(
	angle: number,
	currentMinutes: number,
	stage: ClockStage
): number {
	const hourBase = Math.floor(normalizeMinutes(currentMinutes) / 60) * 60
	return coerceMinutesForStage(hourBase + (angleToMinutes(angle, 'anatomy') % 60), stage)
}
export function hourAngleToClockTime(
	angle: number,
	currentMinutes: number,
	stage: ClockStage
): number {
	const raw = normalizeMinutes((angle / 360) * 720)
	const minute = normalizeMinutes(currentMinutes) % 60
	if (stage === 'full-hours' || stage === 'half-past') return coerceMinutesForStage(raw, stage)
	return normalizeMinutes(Math.floor(raw / 60) * 60 + minute)
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
