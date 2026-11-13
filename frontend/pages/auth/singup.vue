<template>
  <main class="relative flex min-h-screen items-center justify-center px-4 py-10">
    <div class="glass-panel w-full max-w-xl p-6">
      <router-link to="/auth/login/" class="mb-6 inline-flex items-center gap-2 text-sm text-gray-dark-25 transition hover:text-gray-dark-40 dark:text-gray-main dark:hover:text-white">
        {{ t('auth.backToDashboard') }}
      </router-link>

      <h1 class="mb-2 text-2xl font-semibold text-gray-dark-40 dark:text-white">{{ t('auth.signUp') }}</h1>
      <p class="mb-6 text-sm text-gray-dark-25 dark:text-gray-main">{{ t('auth.signUpSubtitle') }}</p>

      <form class="flex flex-col gap-3" @submit.prevent>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <VTextField v-model="firstName" :label="t('auth.firstName')" />
          <VTextField v-model="lastName" :label="t('auth.lastName')" />
        </div>

        <VTextField v-model="email" :label="t('auth.email')" type="email" />
        <VTextField v-model="password" :label="t('auth.password')" type="password" />

        <VButton color="blue" block>{{ t('auth.signUpButton') }}</VButton>
      </form>

      <p class="mt-5 text-xs leading-5 text-gray-dark-25 dark:text-gray-main">
        {{ t('auth.termsPrefix') }} {{ t('auth.terms') }} {{ t('auth.and') }} {{ t('auth.privacyPolicy') }}
      </p>

      <p class="mt-4 text-sm text-gray-dark-25 dark:text-gray-main">
        {{ t('auth.alreadyHaveAccount') }}
        <router-link to="/auth/login/" class="font-medium text-[var(--color-blue-main)] hover:underline">{{ t('auth.signInLink') }}</router-link>
      </p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { VButton, VTextField } from 'vuesp-components/components';

const { t } = useI18n();

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
</script>
