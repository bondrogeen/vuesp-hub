<template>
  <div class="relative z-1 flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
    <!-- Centered Content -->
    <div class="mx-auto w-full max-w-[242px] text-center sm:max-w-[472px]">
      <h1 class="mb-8 text-6xl font-bold text-gray-dark-30 dark:text-white/90 xl:text-8xl">404</h1>

      <p class="mb-6 mt-10 text-base text-gray-dark-30 dark:text-gray-main sm:text-lg">{{ t('notFound.message') }}</p>

      <router-link
        to="/"
        class="inline-flex items-center justify-center rounded-md border border-gray-light-10/70 bg-white/60 px-5 py-3.5 text-sm font-medium text-gray-dark-30 backdrop-blur transition hover:border-[var(--color-blue-main)] hover:text-[var(--color-blue-main)] dark:border-white/15 dark:bg-white/[0.04] dark:text-gray-light-10 dark:hover:border-[var(--color-blue-main)] dark:hover:text-blue-300"
      >
        {{ t('notFound.backHome') }}
      </router-link>
    </div>
    <!-- Footer -->
    <p class="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm text-gray-dark-25 dark:text-gray-main">
      {{ t('notFound.footer', { year }) }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const year = new Date().getFullYear();
</script>
