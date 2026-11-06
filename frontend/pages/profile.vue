<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: t('common.home'), path: '/' }, { name: t('common.profile') }]" class="mb-6" />

    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">{{ t('profile.title') }}</h1>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ t('profile.subtitle') }}</p>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <CardMain :title="t('profile.account')" :loading="false" class="xl:col-span-1">
        <div class="flex items-center gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[var(--accent-blue)] text-lg font-semibold uppercase text-white shadow-sm">
            {{ initials }}
          </div>

          <div class="min-w-0">
            <p class="truncate text-base font-semibold text-gray-900 dark:text-white">{{ username }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('profile.localAdministrator') }}</p>
          </div>
        </div>

        <dl class="mt-6 space-y-4 text-sm">
          <div class="flex items-center justify-between gap-4">
            <dt class="text-gray-500 dark:text-gray-400">{{ t('profile.role') }}</dt>
            <dd class="font-medium text-gray-900 dark:text-white">{{ t('profile.administrator') }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-gray-500 dark:text-gray-400">{{ t('profile.scope') }}</dt>
            <dd class="font-medium text-gray-900 dark:text-white">{{ t('profile.thisHub') }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-gray-500 dark:text-gray-400">{{ t('profile.authentication') }}</dt>
            <dd class="font-medium text-gray-900 dark:text-white">JWT</dd>
          </div>
        </dl>
      </CardMain>

      <CardMain :title="t('profile.changePassword')" :loading="false" class="xl:col-span-2">
        <div class="mb-5 rounded-md border border-blue-400/40 bg-blue-50/80 px-4 py-3 text-sm text-blue-800 dark:border-blue-500/30 dark:bg-blue-950/30 dark:text-blue-200">
          {{ t('profile.passwordNotConnected') }}
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div class="md:col-span-2">
            <VTextField v-model="currentPassword" :label="t('profile.currentPassword')" type="password" autocomplete="current-password" />
          </div>
          <VTextField v-model="newPassword" :label="t('profile.newPassword')" type="password" autocomplete="new-password" />
          <VTextField v-model="confirmPassword" :label="t('profile.confirmPassword')" type="password" autocomplete="new-password" />
        </div>

        <div class="mt-2 flex justify-end">
          <VButton color="blue" disabled>{{ t('profile.saveChanges') }}</VButton>
        </div>
      </CardMain>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { BlockBreadcrumb as VBreadcrumb, CardMain, VButton, VTextField } from 'vuesp-components/components';

import { getUsername } from '@/utils/auth.ts';

const { t } = useI18n();
const username = computed(() => getUsername() || 'admin');
const initials = computed(() => username.value.slice(0, 2).toUpperCase());

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
</script>
