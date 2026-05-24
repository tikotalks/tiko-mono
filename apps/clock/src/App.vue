<template>
	<div id="app">
		<TFramework :config="frameworkConfig" :loading="loading">
			<router-view />
		</TFramework>
	</div>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import { initializeTranslations, useI18n } from '@tiko/core'
	import { TFramework, type FrameworkConfig } from '@tiko/ui'
	import tikoConfig from '../tiko.config'

	const loading = ref(true)
	const { t } = useI18n()

	onMounted(async () => {
		await initializeTranslations()
		loading.value = false
	})

	const frameworkConfig = computed<FrameworkConfig>(() => ({
		...tikoConfig,
		auth: {
			...tikoConfig.auth,
			skipAuth: true,
		},
		topBar: {
			showUser: true,
			showTitle: true,
			showSubtitle: true,
			showCurrentRoute: false,
			subtitle: t('clock.subtitle') || 'Learn to read analog clocks',
		},
		settings: {
			enabled: false,
			sections: [],
		},
	}))
</script>

<style lang="scss">
	@use '@tiko/ui/styles/app.scss';

	#app {
		min-height: 100vh;
	}
</style>
