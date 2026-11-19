<template>
  <main class="flex-auto w-full max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: t('common.home'), path: '/' }, { name: t('areas.title') }]" class="mb-6" />

    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-dark-40 dark:text-white">{{ t('areas.title') }}</h1>
        <p class="mt-2 max-w-2xl text-sm text-gray-dark-25 dark:text-gray-main">{{ t('areas.subtitle') }}</p>
      </div>

      <form class="flex items-center gap-2" @submit.prevent="createArea">
        <input
          v-model="name"
          :placeholder="t('areas.name')"
          class="h-10 w-56 rounded-md border border-gray-light-10 bg-white/70 px-3 text-sm text-gray-dark-40 outline-none transition focus:border-cyan-main dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
        <VButton color="blue" :loading="isCreating" :disabled="!name.trim()" @click="createArea">{{ t('areas.create') }}</VButton>
      </form>
    </div>

    <div v-if="errorMessage" role="alert" class="mb-4 rounded-md border border-red-400/50 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">
      {{ errorMessage }}
    </div>

    <div v-if="isLoading" class="py-12 text-center text-sm text-gray-dark-25 dark:text-gray-main">{{ t('common.refreshing') }}</div>

    <div v-else-if="!areas.length" class="py-12 text-center">
      <p class="text-sm font-medium text-gray-dark-40 dark:text-white">{{ t('areas.emptyTitle') }}</p>
      <p class="mt-1 text-sm text-gray-dark-25 dark:text-gray-main">{{ t('areas.emptyHint') }}</p>
    </div>

    <section v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <VCard v-for="area in areas" :key="area.id" :title="area.name">
        <p class="text-sm text-gray-dark-25 dark:text-gray-main">#{{ area.order ?? 0 }}</p>
        <template #footer>
          <div class="flex justify-end">
            <VButton type="icon" color="gray" :title="t('areas.remove')" :aria-label="t('areas.remove')" @click="removeArea(area)">
              <VIcon name="trash" class="size-4" />
            </VButton>
          </div>
        </template>
      </VCard>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { BlockBreadcrumb as VBreadcrumb, VButton, VCard, VIcon } from 'vuesp-components/components';

import { api } from '@/utils/helpers.ts';
import type { IArea } from '@/types';

const { t } = useI18n();
const areas = ref<IArea[]>([]);
const name = ref('');
const isLoading = ref(false);
const isCreating = ref(false);
const errorMessage = ref('');

const load = async (): Promise<void> => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    areas.value = (await api.get<{ areas: IArea[] }>('/areas')).areas;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('areas.loadError');
  } finally {
    isLoading.value = false;
  }
};

const createArea = async (): Promise<void> => {
  if (!name.value.trim() || isCreating.value) return;
  isCreating.value = true;
  try {
    await api.post('/areas', { body: JSON.stringify({ name: name.value.trim() }) });
    name.value = '';
    await load();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('areas.saveError');
  } finally {
    isCreating.value = false;
  }
};

const removeArea = async (area: IArea): Promise<void> => {
  if (!window.confirm(t('areas.removeConfirm', { name: area.name }))) return;
  try {
    await api.delete(`/areas/${area.id}`);
    await load();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('areas.saveError');
  }
};

onMounted(() => void load());
</script>
