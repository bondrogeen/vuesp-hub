<template>
  <main class="flex-auto w-full max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: t('common.home'), path: '/' }, { name: t('scripts.title') }]" class="mb-6" />

    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-dark-40 dark:text-white">{{ t('scripts.title') }}</h1>
      <p class="mt-2 max-w-2xl text-sm text-gray-dark-25 dark:text-gray-main">{{ t('scripts.subtitle') }}</p>
    </div>

    <VCard :title="t('scripts.create')" class="mb-6">
      <div class="space-y-3">
        <input v-model="name" :placeholder="t('scripts.name')" class="h-10 w-full rounded-md border border-gray-light-10 bg-white/70 px-3 text-sm text-gray-dark-40 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white" />
        <textarea v-model="code" :placeholder="t('scripts.code')" rows="6" class="w-full rounded-md border border-gray-light-10 bg-white/70 p-3 font-mono text-xs text-gray-dark-40 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"></textarea>
        <div class="flex justify-end">
          <VButton color="blue" :loading="isCreating" :disabled="!name.trim() || !code.trim()" @click="createScript">{{ t('scripts.create') }}</VButton>
        </div>
      </div>
    </VCard>

    <div v-if="errorMessage" role="alert" class="mb-4 rounded-md border border-red-400/50 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">
      {{ errorMessage }}
    </div>

    <div v-if="isLoading" class="py-12 text-center text-sm text-gray-dark-25 dark:text-gray-main">{{ t('common.refreshing') }}</div>

    <div v-else-if="!scripts.length" class="py-12 text-center">
      <p class="text-sm font-medium text-gray-dark-40 dark:text-white">{{ t('scripts.emptyTitle') }}</p>
      <p class="mt-1 text-sm text-gray-dark-25 dark:text-gray-main">{{ t('scripts.emptyHint') }}</p>
    </div>

    <section v-else class="space-y-4">
      <VCard v-for="script in scripts" :key="script.id" :title="script.name">
        <pre class="max-h-40 overflow-auto rounded-md bg-gray-light-20/50 p-3 font-mono text-xs text-gray-dark-30 dark:bg-black/20 dark:text-gray-light-10">{{ script.code }}</pre>
        <div v-if="results[script.id]" class="mt-3 rounded-md border border-gray-light-10 p-3 text-xs dark:border-white/10">
          <p class="font-medium text-gray-dark-40 dark:text-white">{{ t('scripts.output') }}</p>
          <pre class="mt-1 overflow-auto whitespace-pre-wrap text-gray-dark-25 dark:text-gray-main">{{ formatResult(results[script.id]) }}</pre>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <VButton color="blue" :loading="running === script.id" @click="runScript(script)">{{ t('scripts.run') }}</VButton>
            <VButton type="icon" color="gray" :title="t('scripts.remove')" :aria-label="t('scripts.remove')" @click="removeScript(script)">
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
import type { IScriptRecord } from '@/types';

interface IScriptRunResult {
  ok: boolean;
  output?: unknown;
  logs: Array<{ level: string; message: string }>;
  error?: { message: string };
}

const { t } = useI18n();
const scripts = ref<IScriptRecord[]>([]);
const results = ref<Record<number, IScriptRunResult>>({});
const name = ref('');
const code = ref('return 1 + 1;');
const isLoading = ref(true);
const isCreating = ref(false);
const running = ref<number | null>(null);
const errorMessage = ref('');

const load = async (): Promise<void> => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    scripts.value = (await api.get<{ scripts: IScriptRecord[] }>('/scripts')).scripts;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('scripts.loadError');
  } finally {
    isLoading.value = false;
  }
};

const createScript = async (): Promise<void> => {
  if (!name.value.trim() || !code.value.trim()) return;
  isCreating.value = true;
  try {
    await api.post('/scripts', { body: JSON.stringify({ name: name.value.trim(), code: code.value }) });
    name.value = '';
    await load();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('scripts.saveError');
  } finally {
    isCreating.value = false;
  }
};

const runScript = async (script: IScriptRecord): Promise<void> => {
  running.value = script.id;
  try {
    const response = await api.post<{ result: IScriptRunResult }>(`/scripts/${script.id}/run`);
    results.value[script.id] = response.result;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('scripts.loadError');
  } finally {
    running.value = null;
  }
};

const removeScript = async (script: IScriptRecord): Promise<void> => {
  if (!window.confirm(t('scripts.removeConfirm', { name: script.name }))) return;
  try {
    await api.delete(`/scripts/${script.id}`);
    await load();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('scripts.loadError');
  }
};

const formatResult = (result: IScriptRunResult): string =>
  result.ok ? JSON.stringify(result.output ?? null, null, 2) : `${result.error?.message ?? 'error'}\n${result.logs.map(log => log.message).join('\n')}`;

onMounted(() => void load());
</script>
