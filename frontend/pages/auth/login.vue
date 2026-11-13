<template>
  <main class="relative flex min-h-screen items-center justify-center px-4 py-10">
    <div class="glass-panel w-full max-w-md p-6">
      <h1 class="mb-2 text-2xl font-semibold text-gray-dark-40 dark:text-white">{{ t('auth.signIn') }}</h1>
      <p class="mb-6 text-sm text-gray-dark-25 dark:text-gray-main">{{ t('auth.subtitle') }}</p>

      <div v-if="errorMessage" role="alert" class="mb-4 rounded-md border border-red-400/50 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">
        {{ errorMessage }}
      </div>

      <form class="flex flex-col gap-2" @submit.prevent="onSubmit">
        <VTextField v-model="username" :label="t('auth.login')" autocomplete="username" />
        <VTextField v-model="password" :label="t('auth.password')" type="password" autocomplete="current-password" />

        <VButton color="blue" block :disabled="isLoading" @click="onSubmit">
          {{ isLoading ? t('auth.signingIn') : t('auth.signIn') }}
        </VButton>
      </form>

      <p v-if="showDefaultCredentials" class="mt-4 text-xs text-gray-dark-25 dark:text-gray-main">{{ t('auth.defaultCredentials') }}</p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { withTrailingSlash } from '@/utils/path.ts';
import { VButton, VTextField } from 'vuesp-components/components';

import { login } from '@/utils/auth.ts';
import { api } from '@/utils/helpers.ts';

const route = useRoute();
const { t } = useI18n();

const username = ref('admin');
const password = ref('admin');
const isLoading = ref(false);
const errorMessage = ref('');
const showDefaultCredentials = ref(false);

onMounted(async () => {
  try {
    const status = await api.get<{ defaultCredentials: boolean }>('/auth/status');
    showDefaultCredentials.value = Boolean(status.defaultCredentials);
  } catch {
    showDefaultCredentials.value = false;
  }
});

const onSubmit = async (): Promise<void> => {
  if (isLoading.value) return;
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const session = await login(username.value, password.value);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    window.location.assign(session.user.mustChangePassword ? '/auth/change-password/' : withTrailingSlash(redirect));
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('auth.loginFailed');
  } finally {
    isLoading.value = false;
  }
};
</script>
