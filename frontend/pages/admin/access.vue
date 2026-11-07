<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: t('common.home'), path: '/' }, { name: t('admin.access') }]" class="mb-6" />

    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">{{ t('access.title') }}</h1>
      <p class="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{{ t('access.hint') }}</p>
    </div>

    <p v-if="error" role="alert" class="mb-5 rounded-md border border-red-400/50 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">
      {{ error }}
    </p>
    <p v-if="saved" class="mb-5 rounded-md border border-emerald-400/50 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-200">
      {{ t('access.saved') }}
    </p>

    <CardMain :title="t('access.title')" :loading="isLoading">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr class="border-b border-gray-200/70 text-xs uppercase tracking-wide text-gray-500 dark:border-white/10 dark:text-gray-400">
              <th class="py-3 pr-4 font-medium">{{ t('access.page') }}</th>
              <th class="w-32 py-3 text-center font-medium">{{ t('access.roles.admin') }}</th>
              <th class="w-32 py-3 text-center font-medium">{{ t('access.roles.user') }}</th>
              <th class="w-32 py-3 text-center font-medium">{{ t('access.roles.viewer') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="page in pages" :key="page.key" class="border-b border-gray-100 last:border-0 dark:border-white/5">
              <td class="py-3 pr-4 font-medium text-gray-900 dark:text-white">{{ t(page.label) }}</td>
              <td class="py-3 text-center text-xs text-gray-400">{{ t('access.always') }}</td>
              <td class="py-3 text-center">
                <VCheckbox
                  :model-value="selected.user.includes(page.key)"
                  @update:model-value="toggle('user', page.key)"
                />
              </td>
              <td class="py-3 text-center">
                <VCheckbox
                  :model-value="selected.viewer.includes(page.key)"
                  @update:model-value="toggle('viewer', page.key)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-5 flex justify-end">
        <VButton color="blue" :loading="isSaving" :disabled="isSaving" @click="save">{{ t('access.save') }}</VButton>
      </div>
    </CardMain>
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { BlockBreadcrumb as VBreadcrumb, CardMain, VButton, VCheckbox } from 'vuesp-components/components';

import { ACCESS_PAGES, type AccessPage } from '@/utils/access.ts';
import { useAccessStore } from '@/stores/AccessStore.ts';

const { t } = useI18n();
const access = useAccessStore();

const pages = ACCESS_PAGES;
const isLoading = ref(false);
const isSaving = ref(false);
const saved = ref(false);
const error = ref('');
const selected = reactive<{ user: AccessPage[]; viewer: AccessPage[] }>({ user: [], viewer: [] });

const toggle = (role: 'user' | 'viewer', page: AccessPage) => {
  const current = selected[role];
  selected[role] = current.includes(page) ? current.filter(item => item !== page) : [...current, page];
  saved.value = false;
};

const save = async () => {
  isSaving.value = true;
  error.value = '';
  saved.value = false;
  try {
    await access.save({ user: [...selected.user], viewer: [...selected.viewer] });
    saved.value = true;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('access.saveFailed');
  } finally {
    isSaving.value = false;
  }
};

onMounted(async () => {
  isLoading.value = true;
  await access.load(true);
  selected.user = [...access.pages.user];
  selected.viewer = [...access.pages.viewer];
  isLoading.value = false;
});
</script>
