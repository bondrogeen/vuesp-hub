<template>
  <main class="flex-auto w-full max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: t('common.home'), path: '/' }, { name: t('automations.title') }]" class="mb-6" />

    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-dark-40 dark:text-white">{{ t('automations.title') }}</h1>
      <p class="mt-2 max-w-2xl text-sm text-gray-dark-25 dark:text-gray-main">{{ t('automations.subtitle') }}</p>
    </div>

    <div v-if="errorMessage" role="alert" class="mb-4 rounded-md border border-red-400/50 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">
      {{ errorMessage }}
    </div>

    <div v-if="isLoading" class="py-12 text-center text-sm text-gray-dark-25 dark:text-gray-main">{{ t('common.refreshing') }}</div>

    <div v-else-if="!rules.length" class="py-12 text-center">
      <p class="text-sm font-medium text-gray-dark-40 dark:text-white">{{ t('automations.emptyTitle') }}</p>
      <p class="mt-1 text-sm text-gray-dark-25 dark:text-gray-main">{{ t('automations.emptyHint') }}</p>
    </div>

    <section v-else class="space-y-4">
      <VCard v-for="rule in rules" :key="rule.id" :title="rule.name">
        <div class="flex flex-wrap items-center gap-2 text-xs text-gray-dark-25 dark:text-gray-main">
          <span class="rounded-full px-2 py-0.5" :class="rule.enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-gray-light-20 dark:bg-white/10'">
            {{ rule.enabled ? t('automations.enabled') : t('automations.disabled') }}
          </span>
          <span>#{{ rule.id }} · {{ rule.mode }} · {{ rule.trigger.type }}</span>
          <span>{{ t('automations.journal') }}: {{ lastEntry(rule.id) ?? '—' }}</span>
        </div>

        <template #footer>
          <div class="flex flex-wrap items-center justify-end gap-2">
            <VButton color="blue" @click="run(rule)">{{ t('automations.run') }}</VButton>
            <VButton color="gray" @click="dryRun(rule)">{{ t('automations.dryRun') }}</VButton>
            <VButton color="gray" @click="toggle(rule)">{{ rule.enabled ? 'Disable' : 'Enable' }}</VButton>
            <VButton type="icon" color="gray" :title="t('automations.remove')" :aria-label="t('automations.remove')" @click="remove(rule)">
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
import type { IAutomationRule } from '@/types';

const { t } = useI18n();
const rules = ref<IAutomationRule[]>([]);
const journal = ref<Array<{ ruleId: number; status: string; at: number }>>([]);
const isLoading = ref(true);
const errorMessage = ref('');

const lastEntry = (id: number): string | undefined => journal.value.find(entry => entry.ruleId === id)?.status;

const load = async (): Promise<void> => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const [rulesResponse, journalResponse] = await Promise.all([
      api.get<{ rules: IAutomationRule[] }>('/automations'),
      api.get<{ journal: Array<{ ruleId: number; status: string; at: number }> }>('/automations/journal'),
    ]);
    rules.value = rulesResponse.rules;
    journal.value = journalResponse.journal;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('automations.loadError');
  } finally {
    isLoading.value = false;
  }
};

const run = async (rule: IAutomationRule): Promise<void> => {
  try {
    await api.post(`/automations/${rule.id}/run`);
    await load();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('automations.loadError');
  }
};

const dryRun = async (rule: IAutomationRule): Promise<void> => {
  try {
    await api.post(`/automations/${rule.id}/dry-run`);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('automations.loadError');
  }
};

const toggle = async (rule: IAutomationRule): Promise<void> => {
  try {
    await api.patch(`/automations/${rule.id}`, { body: JSON.stringify({ ...rule, enabled: !rule.enabled }) });
    await load();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('automations.loadError');
  }
};

const remove = async (rule: IAutomationRule): Promise<void> => {
  if (!window.confirm(t('automations.removeConfirm', { name: rule.name }))) return;
  try {
    await api.delete(`/automations/${rule.id}`);
    await load();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('automations.loadError');
  }
};

onMounted(() => void load());
</script>
