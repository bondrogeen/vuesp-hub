<template>
  <main class="flex-auto w-full max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: t('common.home'), path: '/' }, { name: t('system.title') }]" class="mb-6" />
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-dark-40 dark:text-white">{{ t('system.title') }}</h1>
      <p class="mt-2 max-w-2xl text-sm text-gray-dark-25 dark:text-gray-main">{{ t('system.subtitle') }}</p>
    </div>

    <div v-if="errorMessage" role="alert" class="mb-4 rounded-md border border-red-400/50 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">{{ errorMessage }}</div>

    <div class="grid gap-4 lg:grid-cols-2">
      <VCard :title="t('system.health')">
        <pre class="overflow-auto text-xs text-gray-dark-25 dark:text-gray-main">{{ JSON.stringify(health, null, 2) }}</pre>
      </VCard>
      <VCard :title="t('system.metrics')">
        <pre class="overflow-auto text-xs text-gray-dark-25 dark:text-gray-main">{{ JSON.stringify(metrics, null, 2) }}</pre>
      </VCard>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <VCard :title="t('system.backups')">
        <div class="mb-4 flex items-center gap-2">
          <VButton color="blue" :loading="isBackingUp" @click="createBackup">{{ t('system.createBackup') }}</VButton>
        </div>
        <p v-if="!backups.length" class="text-sm text-gray-dark-25 dark:text-gray-main">{{ t('system.noBackups') }}</p>
        <ul v-else class="space-y-1 font-mono text-xs text-gray-dark-25 dark:text-gray-main">
          <li v-for="name in backups" :key="name" class="border-b border-gray-light-10/60 py-1 dark:border-white/5">{{ name }}</li>
        </ul>
      </VCard>
      <VCard :title="t('system.audit')">
        <p v-if="!audit.length" class="text-sm text-gray-dark-25 dark:text-gray-main">{{ t('system.noAudit') }}</p>
        <div v-else class="max-h-64 overflow-auto font-mono text-xs">
          <p v-for="(entry, index) in audit" :key="`${entry.at}:${index}`" class="border-b border-gray-light-10/60 py-1 text-gray-dark-25 dark:border-white/5 dark:text-gray-main">
            <span>{{ new Date(entry.at).toLocaleString() }}</span>
            <span class="ml-2 uppercase">{{ entry.result }}</span>
            <span class="ml-2">{{ entry.actor }} → {{ entry.action }}{{ entry.target ? ` (${entry.target})` : '' }}</span>
          </p>
        </div>
      </VCard>
    </div>

    <VCard :title="t('system.logs')" class="mt-4">
      <div class="max-h-96 overflow-auto font-mono text-xs">
        <p v-for="entry in logs" :key="`${entry.timestamp}:${entry.message}`" class="border-b border-gray-light-10/60 py-1 text-gray-dark-25 dark:border-white/5 dark:text-gray-main">
          <span class="text-gray-main">{{ entry.timestamp }}</span>
          <span class="ml-2 uppercase">{{ entry.level }}</span>
          <span class="ml-2">{{ entry.context ? `[${entry.context}] ` : '' }}{{ entry.message }}</span>
        </p>
      </div>
    </VCard>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { BlockBreadcrumb as VBreadcrumb, VButton, VCard } from 'vuesp-components/components';

import { api } from '@/utils/helpers.ts';

interface ILogEntry { timestamp: string; level: string; message: string; context?: string }
interface IHealth { status: string; services: Record<string, unknown> }
interface IMetrics { startedAt: number; eventsEmitted: number; eventErrors: number; logsWritten: number; logsDropped: number; timersActive: number }
interface IAuditEntry { at: number; actor: string; role?: string; action: string; target?: string; result: string }

const { t } = useI18n();
const health = ref<IHealth | null>(null);
const metrics = ref<IMetrics | null>(null);
const logs = ref<ILogEntry[]>([]);
const backups = ref<string[]>([]);
const audit = ref<IAuditEntry[]>([]);
const errorMessage = ref('');
const isBackingUp = ref(false);

const loadBackups = async () => {
  backups.value = (await api.get<{ backups: string[] }>('/system/backups')).backups;
};

const loadSystem = async () => {
  const [healthResponse, metricsResponse, logsResponse, auditResponse] = await Promise.all([
    api.get<IHealth>('/system/health'),
    api.get<IMetrics>('/system/metrics'),
    api.get<{ items: ILogEntry[] }>('/system/logs?limit=100'),
    api.get<{ entries: IAuditEntry[] }>('/system/audit?limit=50'),
  ]);
  health.value = healthResponse;
  metrics.value = metricsResponse;
  logs.value = logsResponse.items;
  audit.value = auditResponse.entries;
  await loadBackups();
};

const createBackup = async () => {
  isBackingUp.value = true;
  try {
    await api.post('/system/backup');
    await loadBackups();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('system.loadError');
  } finally {
    isBackingUp.value = false;
  }
};

onMounted(async () => {
  try {
    await loadSystem();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('system.loadError');
  }
});
</script>
