<template>
  <main class="flex-auto w-full max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: t('common.home'), path: '/' }, { name: t('panels.title') }]" class="mb-6" />

    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-dark-40 dark:text-white">{{ t('panels.title') }}</h1>
        <p class="mt-2 max-w-2xl text-sm text-gray-dark-25 dark:text-gray-main">{{ t('panels.subtitle') }}</p>
      </div>

      <form class="flex items-center gap-2" @submit.prevent="createPanel">
        <input
          v-model="name"
          :placeholder="t('panels.name')"
          class="h-10 w-56 rounded-md border border-gray-light-10 bg-white/70 px-3 text-sm text-gray-dark-40 outline-none transition focus:border-cyan-main dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
        <VButton color="blue" :loading="isCreating" :disabled="!name.trim()" @click="createPanel">
          {{ t('panels.create') }}
        </VButton>
      </form>
    </div>

    <div v-if="errorMessage" role="alert" class="mb-4 rounded-md border border-red-400/50 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">
      {{ errorMessage }}
    </div>

    <div v-if="isLoading" class="py-12 text-center text-sm text-gray-dark-25 dark:text-gray-main">
      {{ t('common.refreshing') }}
    </div>

    <div v-else-if="!panels.length" class="py-12 text-center">
      <p class="text-sm font-medium text-gray-dark-40 dark:text-white">{{ t('panels.emptyTitle') }}</p>
      <p class="mt-1 text-sm text-gray-dark-25 dark:text-gray-main">{{ t('panels.emptyHint') }}</p>
    </div>

    <section v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <VCard v-for="panel in panels" :key="panel.id" :title="panel.name">
        <p class="text-sm text-gray-dark-25 dark:text-gray-main">{{ t('panels.widgets', { count: panel.widgets.length }) }}</p>
        <p class="mt-1 text-xs text-gray-main">{{ panel.updatedAt }}</p>

        <template #footer>
          <div class="flex items-center justify-between gap-2">
            <router-link :to="`/panels/${panel.id}/`" class="rounded-md px-3 py-2 text-sm font-medium text-cyan-main hover:bg-blue-50 dark:hover:bg-blue-950/40">
              {{ t('panels.open') }}
            </router-link>
            <VButton type="icon" color="gray" :title="t('panels.remove')" :aria-label="t('panels.remove')" @click="removePanel(panel)">
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
import type { IPanel } from '@/types';

const { t } = useI18n();
const panels = ref<IPanel[]>([]);
const name = ref('');
const isLoading = ref(false);
const isCreating = ref(false);
const errorMessage = ref('');

const load = async (): Promise<void> => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    panels.value = (await api.get<{ panels: IPanel[] }>('/panels')).panels;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('panels.loadError');
  } finally {
    isLoading.value = false;
  }
};

const createPanel = async (): Promise<void> => {
  if (!name.value.trim() || isCreating.value) return;
  isCreating.value = true;
  errorMessage.value = '';
  try {
    const response = await api.post<{ panel: IPanel }>('/panels', {
      body: JSON.stringify({ name: name.value.trim(), widgets: [] }),
    });
    name.value = '';
    await load();
    window.location.assign(`/panels/${response.panel.id}/`);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('panels.saveError');
  } finally {
    isCreating.value = false;
  }
};

const removePanel = async (panel: IPanel): Promise<void> => {
  if (!window.confirm(t('panels.removeConfirm', { name: panel.name }))) return;
  try {
    await api.delete(`/panels/${panel.id}`);
    await load();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('panels.deleteError');
  }
};

onMounted(() => void load());
</script>
