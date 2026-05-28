import type { ClockStage } from '../models/clock.model'

export function normalizeMinutes(minutes: number): number {
	return ((Math.round(minutes) % 720) + 720) % 720
}
export function hourFromMinutes(minutes: number): number {
	const h = Math.floor(normalizeMinutes(minutes) / 60)
	return h === 0 ? 12 : h
}
export function minuteFromMinutes(minutes: number): number {
	return normalizeMinutes(minutes) % 60
}
export const getHourValue = hourFromMinutes
export const getMinuteValue = minuteFromMinutes
export function setClockTime(hour: number, minute: number): number {
	const normalizedHour = hour === 12 ? 0 : hour % 12
	return normalizeMinutes(normalizedHour * 60 + minute)
}
export function formatDigital(minutes: number, use24Hour = false): string {
	const normalized = normalizeMinutes(minutes)
	const hour24 = Math.floor(normalized / 60)
	const minute = minuteFromMinutes(normalized)
	if (use24Hour)
		return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
	const hour12 = hour24 === 0 ? 12 : hour24
	return `${hour12}:${minute.toString().padStart(2, '0')}`
}
export const formatDigitalTime = formatDigital
export function formatSpoken(minutes: number, stage?: ClockStage): string {
	const hour = hourFromMinutes(minutes)
	const minute = minuteFromMinutes(minutes)
	if (stage === 'anatomy') return 'clock parts'
	if (minute === 0) return `${hour} o'clock`
	if (minute === 30) return `half past ${hour}`
	return `${formatDigital(minutes)} on the clock`
}
export const formatSpokenTime = formatSpoken
export function coerceMinutesForStage(minutes: number, stage: ClockStage): number {
	const normalized = normalizeMinutes(minutes)
	if (stage === 'half-past') return normalizeMinutes(Math.round(normalized / 30) * 30)
	if (stage === 'full-hours') return normalizeMinutes(Math.round(normalized / 60) * 60)
	return normalized
}
export function stageSnapMinutes(stage: ClockStage, minutesSince12: number): number {
	return coerceMinutesForStage(minutesSince12, stage)
}
