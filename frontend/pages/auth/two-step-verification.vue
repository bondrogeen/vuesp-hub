<template>
  <main class="relative flex min-h-screen items-center justify-center px-4 py-10">
    <div class="glass-panel w-full max-w-md p-6">
      <router-link to="/auth/login/" class="mb-6 inline-flex items-center gap-2 text-sm text-gray-dark-25 transition hover:text-gray-dark-40 dark:text-gray-main dark:hover:text-white">
        {{ t('auth.backToDashboard') }}
      </router-link>

      <h1 class="mb-2 text-2xl font-semibold text-gray-dark-40 dark:text-white">{{ t('auth.twoStepTitle') }}</h1>
      <p class="mb-6 text-sm text-gray-dark-25 dark:text-gray-main">{{ t('auth.twoStepSubtitle') }}</p>

      <form class="flex flex-col gap-4" @submit.prevent>
        <label class="text-sm font-medium text-gray-dark-30 dark:text-gray-light-10">{{ t('auth.codeLabel') }}</label>

        <div class="flex gap-2 sm:gap-3">
          <input
            v-for="(_, index) in code"
            :key="index"
            v-model="code[index]"
            type="text"
            inputmode="numeric"
            maxlength="1"
            class="h-12 w-full rounded-md border border-gray-light-10/70 bg-white/40 text-center text-xl font-semibold text-gray-dark-40 transition focus:border-[var(--color-blue-main)] focus:ring-2 focus:ring-[var(--color-blue-main)]/20 dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
          />
        </div>

        <VButton color="blue" block>{{ t('auth.verifyAccount') }}</VButton>
      </form>

      <p class="mt-5 text-sm text-gray-dark-25 dark:text-gray-main">
        {{ t('auth.didntGetCode') }}
        <router-link to="/auth/login/" class="font-medium text-[var(--color-blue-main)] hover:underline">{{ t('auth.resend') }}</router-link>
      </p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { VButton } from 'vuesp-components/components';

const { t } = useI18n();

const code = ref<string[]>(['', '', '', '', '', '']);
</script>
