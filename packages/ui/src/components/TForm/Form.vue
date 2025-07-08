<template>
	<form :class="bemm()">
		<slot />
	</form>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';

const { bemm } = useBemm('form');
</script>

<style lang="scss">
.form {
	display: flex;
	flex-direction: column;
	gap: var(--space);
	width: 100%;
}
</style>
