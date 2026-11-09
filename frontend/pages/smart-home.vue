<template>
	<main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
		<VBreadcrumb :items="[{ name: t('common.home'), path: '/' }, { name: t('smartHome.title') }]" class="mb-6" />

		<div class="mb-6">
			<h1 class="text-2xl font-semibold text-gray-900 dark:text-white">{{ t('smartHome.title') }}</h1>
			<p class="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{{ t('smartHome.subtitle') }}</p>
		</div>

		<CardMain :title="t('smartHome.title')" :loading="false">
			<div class="flex flex-col items-center justify-center py-16 text-center">
				<div class="grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
					<IconHomeLine class="size-8" />
				</div>
				<h2 class="mt-5 text-lg font-semibold text-gray-900 dark:text-white">{{ t('smartHome.soonTitle') }}</h2>
				<p class="mt-2 max-w-md text-sm leading-relaxed text-gray-500 dark:text-gray-400">{{ t('smartHome.soonText') }}</p>
			</div>
		</CardMain>
	</main>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { BlockBreadcrumb as VBreadcrumb, CardMain } from 'vuesp-components/components';
import IconHomeLine from '~icons/ri/home-line';

const { t } = useI18n();
</script>
