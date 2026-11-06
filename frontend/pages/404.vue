<template>
  <div class="relative z-1 flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
    <!-- Centered Content -->
    <div class="mx-auto w-full max-w-[242px] text-center sm:max-w-[472px]">
      <h1 class="mb-8 text-6xl font-bold text-gray-800 dark:text-white/90 xl:text-8xl">404</h1>

      <p class="mb-6 mt-10 text-base text-gray-700 dark:text-gray-400 sm:text-lg">{{ t('notFound.message') }}</p>

      <router-link
        to="/"
        class="inline-flex items-center justify-center rounded-md border border-gray-300/70 bg-white/60 px-5 py-3.5 text-sm font-medium text-gray-700 backdrop-blur transition hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] dark:border-white/15 dark:bg-white/[0.04] dark:text-gray-200 dark:hover:border-[var(--accent-blue)] dark:hover:text-blue-300"
      >
        {{ t('notFound.backHome') }}
      </router-link>
    </div>
    <!-- Footer -->
    <p class="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm text-gray-500 dark:text-gray-400">
      {{ t('notFound.footer', { year }) }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const year = new Date().getFullYear();
</script>
