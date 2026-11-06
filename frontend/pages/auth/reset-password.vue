<template>
  <main class="relative flex min-h-screen items-center justify-center px-4 py-10">
    <div class="glass-panel w-full max-w-md p-6">
      <router-link to="/auth/login" class="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
        {{ t('auth.backToDashboard') }}
      </router-link>

      <h1 class="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">{{ t('auth.forgotPasswordTitle') }}</h1>
      <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">{{ t('auth.forgotPasswordSubtitle') }}</p>

      <form class="flex flex-col gap-3" @submit.prevent>
        <VTextField v-model="email" :label="t('auth.email')" type="email" />

        <VButton color="blue" block>{{ t('auth.sendResetLink') }}</VButton>
      </form>

      <p class="mt-5 text-sm text-gray-500 dark:text-gray-400">
        {{ t('auth.rememberPassword') }}
        <router-link to="/auth/login" class="font-medium text-[var(--accent-blue)] hover:underline">{{ t('auth.clickHere') }}</router-link>
      </p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { VButton, VTextField } from 'vuesp-components/components';

const { t } = useI18n();

const email = ref('');
</script>
