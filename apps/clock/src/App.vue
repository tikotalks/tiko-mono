<template>
	<div id="app" class="clock-app-shell">
		<router-view />
	</div>
</template>

<script setup lang="ts">
	// Clock is a local-first learning app: no auth wall, no parent setup, no runtime backend.
</script>

<style lang="scss">
	@use '@tiko/ui/styles/app.scss';

	.clock-app-shell {
		min-block-size: 100vh;
		background: var(--color-background);
		color: var(--color-foreground);
	}
</style>
