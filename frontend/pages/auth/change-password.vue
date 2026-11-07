<template>
  <main class="relative flex min-h-screen items-center justify-center px-4 py-10">
    <div class="glass-panel w-full max-w-md p-6">
      <h1 class="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">{{ t('auth.changePasswordTitle') }}</h1>
      <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">{{ t('auth.changePasswordSubtitle') }}</p>

      <div v-if="errorMessage" role="alert" class="mb-4 rounded-md border border-red-400/50 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">
        {{ errorMessage }}
      </div>

      <form class="flex flex-col gap-2" @submit.prevent="onSubmit">
        <VTextField v-model="currentPassword" :label="t('auth.currentPassword')" type="password" autocomplete="current-password" />
        <VTextField v-model="newPassword" :label="t('auth.newPassword')" type="password" autocomplete="new-password" />
        <VTextField v-model="confirmPassword" :label="t('auth.confirmPassword')" type="password" autocomplete="new-password" />

        <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('auth.passwordRule') }}</p>

        <VButton color="blue" block :disabled="isLoading" @click="onSubmit">
          {{ isLoading ? t('auth.savingPassword') : t('auth.savePassword') }}
        </VButton>
      </form>

      <button type="button" class="mt-4 text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white" @click="onLogout">
        {{ t('header.signOut') }}
      </button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { VButton, VTextField } from 'vuesp-components/components';

import { api } from '@/utils/helpers.ts';
import { logout, setToken, type AuthSession } from '@/utils/auth.ts';

const { t } = useI18n();

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

const onLogout = () => logout();

const onSubmit = async (): Promise<void> => {
  if (isLoading.value) return;
  errorMessage.value = '';

  if (currentPassword.value.length === 0 || newPassword.value.length < 6) {
    errorMessage.value = t('auth.passwordRule');
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = t('auth.passwordsDoNotMatch');
    return;
  }

  isLoading.value = true;
  try {
    const session = await api.post<AuthSession>('/auth/change-password', {
      body: JSON.stringify({ currentPassword: currentPassword.value, newPassword: newPassword.value }),
    });
    setToken(session.token);
    window.location.assign('/');
  } catch (cause) {
    errorMessage.value = cause instanceof Error ? cause.message : t('auth.changePasswordFailed');
  } finally {
    isLoading.value = false;
  }
};
</script>
