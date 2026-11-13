<template>
  <main class="flex-auto p-4 md:p-6">
    <div class="glass-panel mx-auto flex max-w-xl flex-col items-center rounded-[10px] px-6 py-16 text-center">
      <span class="text-5xl font-bold text-cyan-main">403</span>
      <h1 class="mt-4 text-xl font-semibold text-gray-dark-40 dark:text-white">{{ t('access.forbiddenTitle') }}</h1>
      <p class="mt-2 max-w-sm text-sm text-gray-dark-25 dark:text-gray-main">{{ t('access.forbiddenText') }}</p>
      <VButton color="blue" class="mt-6" to="/">{{ t('access.backHome') }}</VButton>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { VButton } from 'vuesp-components/components';

const { t } = useI18n();
</script>
