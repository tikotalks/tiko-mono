import type { ClockModeDefinition, ClockStageDefinition } from '../models/clock.model'

export const clockStages: ClockStageDefinition[] = [
	{
		id: 'full-hours',
		title: "Full hours / o'clock",
		label: "O'clock",
		description: 'Learn times where the long hand points to 12.',
		defaultMinutes: 240,
	},
	{
		id: 'half-past',
		title: 'Half past',
		label: 'Half past',
		description: 'Learn when the long hand points to 6 and the short hand sits between numbers.',
		defaultMinutes: 210,
	},
	{
		id: 'anatomy',
		title: 'Clock parts',
		label: 'Parts',
		description: 'Learn the face, numbers, short hand, and long hand.',
		defaultMinutes: 0,
	},
]

export const clockModes: ClockModeDefinition[] = [
	{ id: 'learn', title: 'Learn', description: 'See one clock idea at a time.' },
	{ id: 'set', title: 'Set the clock', description: 'Move the hands to match a target time.' },
	{ id: 'read', title: 'Read the clock', description: 'Look at the clock and choose the time.' },
	{ id: 'match', title: 'Match', description: 'Pair analog, digital, and spoken times.' },
	{
		id: 'explore',
		title: 'Explore',
		description: 'Move the hands freely and watch the time change.',
	},
]
