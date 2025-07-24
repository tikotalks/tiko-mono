import { computed } from 'vue';
import { useBemm } from 'bemm';

type Breakpoints<T> = T | { mobile: T; tablet?: T; desktop: T };
type GroupProp = 'direction' | 'align' | 'wrap';
export type BemmInstance = ReturnType<typeof useBemm>;

type Normalized<T> = { mobile: T; tablet: T; desktop: T };

const normalizeBreakpoint = <T extends string>(input: Breakpoints<T> | undefined, fallback: T): Normalized<T> => {
	if (typeof input === 'string') {
		return { mobile: input, tablet: input, desktop: input };
	}

	const desktop = input?.desktop ?? fallback;
	const tablet = input?.tablet ?? desktop;
	const mobile = input?.mobile ?? fallback;

	return { mobile, tablet, desktop };
};

const generateModifiers = <T extends string>(
	prefix: string,
	values: Normalized<T>,
	allValues: readonly T[]
): Record<string, boolean> => {
	const modifiers: Record<string, boolean> = {};

	for (const val of allValues) {
		// base (desktop)
		modifiers[`${prefix}${val}`] = values.desktop === val;

		// tablet override
		if (values.tablet !== values.desktop) {
			modifiers[`${prefix}${val}-tablet`] = values.tablet === val;
		}

		// mobile override
		if (values.mobile !== values.tablet) {
			modifiers[`${prefix}${val}-mobile`] = values.mobile === val;
		}
	}

	return modifiers;
};

/**
 * useGroup
 * @param {string | BemmInstance} blockName
 * @param {Breakpoints<'row' | 'column'>} props.direction
 * @param {Breakpoints<'start' | 'center' | 'end'>}props.align
 * @param props.wrap
 * @returns {computed<string[]>}
 * @description
 * A composable that generates BEMM class names for a group of elements.
 * It allows for responsive design by accepting breakpoints for direction, alignment, and wrapping.
 */
export const useGroup = (
	blockName: string | BemmInstance,
	props: {
		direction?: Breakpoints<'row' | 'column'>;
		align?: Breakpoints<'start' | 'center' | 'end'>;
		wrap?: Breakpoints<'wrap' | 'nowrap'>;
	}
) => {
	const bemm = typeof blockName === 'string' ? useBemm(blockName) : blockName;

	return computed(() => {
		const direction = normalizeBreakpoint(props.direction, 'row');
		const align = normalizeBreakpoint(props.align, 'start');
		const wrap = normalizeBreakpoint(props.wrap, 'wrap');

		return bemm('', {
			...generateModifiers('', direction, ['row', 'column']),
			...generateModifiers('align-', align, ['start', 'center', 'end']),
			...generateModifiers('', wrap, ['wrap', 'nowrap']),
		}) as string[];
	});
};
