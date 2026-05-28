import { describe, expect, it } from 'vitest'
import {
	coerceMinutesForStage,
	formatDigital,
	formatSpoken,
	hourFromMinutes,
	minuteFromMinutes,
	normalizeMinutes,
	setClockTime,
} from './clock-time'

describe('clock-time', () => {
	describe('normalizeMinutes', () => {
		it('wraps negative values into 0-719', () => {
			expect(normalizeMinutes(-1)).toBe(719)
			expect(normalizeMinutes(-60)).toBe(660)
		})

		it('wraps 720 back to 0', () => {
			expect(normalizeMinutes(720)).toBe(0)
		})

		it('wraps values above 720', () => {
			expect(normalizeMinutes(721)).toBe(1)
			expect(normalizeMinutes(1440)).toBe(0)
		})

		it('keeps values in range unchanged', () => {
			expect(normalizeMinutes(0)).toBe(0)
			expect(normalizeMinutes(359)).toBe(359)
			expect(normalizeMinutes(719)).toBe(719)
		})
	})

	describe('hourFromMinutes', () => {
		it('returns 12 for midnight/noon (0 minutes)', () => {
			expect(hourFromMinutes(0)).toBe(12)
		})

		it('returns correct hours', () => {
			expect(hourFromMinutes(60)).toBe(1)
			expect(hourFromMinutes(120)).toBe(2)
			expect(hourFromMinutes(180)).toBe(3)
			expect(hourFromMinutes(660)).toBe(11)
		})
	})

	describe('minuteFromMinutes', () => {
		it('extracts minute component', () => {
			expect(minuteFromMinutes(0)).toBe(0)
			expect(minuteFromMinutes(30)).toBe(30)
			expect(minuteFromMinutes(63)).toBe(3)
			expect(minuteFromMinutes(617)).toBe(17)
		})
	})

	describe('setClockTime', () => {
		it('sets full hour times', () => {
			expect(setClockTime(3, 0)).toBe(180)
			expect(setClockTime(12, 0)).toBe(0)
		})

		it('sets half past times', () => {
			expect(setClockTime(3, 30)).toBe(210)
			expect(setClockTime(12, 30)).toBe(30)
		})
	})

	describe('formatDigital', () => {
		it('formats 12-hour digital', () => {
			expect(formatDigital(0)).toBe('12:00')
			expect(formatDigital(180)).toBe('3:00')
			expect(formatDigital(210)).toBe('3:30')
			expect(formatDigital(617)).toBe('10:17')
		})

		it('formats 24-hour digital', () => {
			expect(formatDigital(0, true)).toBe('00:00')
			expect(formatDigital(180, true)).toBe('03:00')
			expect(formatDigital(210, true)).toBe('03:30')
		})
	})

	describe('formatSpoken', () => {
		it("formats o'clock for zero minutes", () => {
			expect(formatSpoken(240, 'full-hours')).toBe("4 o'clock")
			expect(formatSpoken(0)).toBe("12 o'clock")
		})

		it('formats half past for 30 minutes', () => {
			expect(formatSpoken(210, 'half-past')).toBe('half past 3')
			expect(formatSpoken(30)).toBe('half past 12')
		})

		it('formats anatomy stage', () => {
			expect(formatSpoken(0, 'anatomy')).toBe('clock parts')
		})
	})

	describe('coerceMinutesForStage', () => {
		it('snaps to nearest full hour in full-hours stage', () => {
			expect(coerceMinutesForStage(200, 'full-hours')).toBe(180)
			expect(coerceMinutesForStage(220, 'full-hours')).toBe(240)
			expect(coerceMinutesForStage(0, 'full-hours')).toBe(0)
		})

		it('snaps to nearest half hour in half-past stage', () => {
			expect(coerceMinutesForStage(200, 'half-past')).toBe(210)
			expect(coerceMinutesForStage(220, 'half-past')).toBe(210)
			expect(coerceMinutesForStage(15, 'half-past')).toBe(30)
			expect(coerceMinutesForStage(45, 'half-past')).toBe(60)
		})

		it('leaves anatomy stage untouched', () => {
			expect(coerceMinutesForStage(123, 'anatomy')).toBe(123)
		})
	})
})
