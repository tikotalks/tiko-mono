<template>
	<div id="app">
		<router-view v-if="isAuthCallbackRoute" />
		<TFramework v-else :config="frameworkConfig" :loading="loading">
			<router-view />
		</TFramework>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useRoute } from 'vue-router'
	import { TFramework, type FrameworkConfig } from '@tiko/ui'
	import tikoConfig from '../tiko.config'
	import { useI18n } from '@tiko/core'

	const route = useRoute()
	const loading = ref(false)
	const { t } = useI18n()
	const isAuthCallbackRoute = computed(() => route.path === '/auth/callback')

	const frameworkConfig = computed<FrameworkConfig>(
		() =>
			({
				...tikoConfig,
				auth: { ...tikoConfig.auth, skipAuth: true },
				settings: {
					enabled: true,
					sections: [
						{
							id: 'clock-settings',
							title: t('clock.settingsTitle') || 'Clock settings',
							icon: 'settings',
							order: 10,
						},
					],
				},
			}) as unknown as FrameworkConfig
	)
</script>

<style lang="scss">
	@use '@tiko/ui/styles/app.scss';
</style>
