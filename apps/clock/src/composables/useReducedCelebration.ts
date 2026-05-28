import { computed, type Ref } from 'vue'
export function useReducedCelebration(localReduced: Ref<boolean>) {
	const systemReduced =
		typeof window !== 'undefined' && 'matchMedia' in window
			? window.matchMedia('(prefers-reduced-motion: reduce)').matches
			: false
	return computed(() => localReduced.value || systemReduced)
}
