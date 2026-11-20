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

    <VCard :title="t('system.update')" class="mt-4">
      <div class="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-dark-25 dark:text-gray-main">
        <span>{{ t('system.currentVersion') }}: <span class="font-mono text-gray-dark-40 dark:text-white">{{ updateStatus?.current ?? '—' }}</span></span>
        <span v-if="updateStatus?.state">{{ t('system.updateState') }}: <span class="uppercase">{{ updateStatus.state.status }}</span></span>
      </div>

      <p v-if="!updateStatus?.enabled" class="text-sm text-gray-dark-25 dark:text-gray-main">{{ t('system.updateNotConfigured') }}</p>
      <template v-else>
        <p class="text-sm text-gray-dark-25 dark:text-gray-main">
          {{ t('system.updateSource') }}: <span class="font-mono">{{ updateStatus.manifestSource }}</span>
        </p>
        <p v-if="updateStatus.releases.length" class="mt-2 text-xs text-gray-dark-25 dark:text-gray-main">
          {{ t('system.installedReleases') }}: <span class="font-mono">{{ updateStatus.releases.join(', ') }}</span>
        </p>
        <div class="mt-4 flex flex-wrap items-center gap-2">
          <VButton color="gray" variant="outline" :loading="isCheckingUpdate" @click="checkUpdate">{{ t('system.checkUpdate') }}</VButton>
          <VButton color="blue" :disabled="!updateStatus.selfUpdate || !updateCheck?.available" :loading="isUpdating" @click="applyUpdate">{{ t('system.applyUpdate') }}</VButton>
          <VButton color="gray" variant="outline" :disabled="!updateStatus.selfUpdate || updateStatus.releases.length < 2" :loading="isUpdating" @click="rollbackUpdate">{{ t('system.rollback') }}</VButton>
        </div>
        <p v-if="updateMessage" class="mt-4 text-sm text-gray-dark-25 dark:text-gray-main">{{ updateMessage }}</p>
        <p v-if="!updateStatus.selfUpdate" class="mt-2 text-xs text-gray-dark-25 dark:text-gray-main">{{ t('system.selfUpdateDisabled') }}</p>
      </template>
    </VCard>

    <VCard :title="t('system.adapters')" class="mt-4">
      <p v-if="!adapterStatus?.adapters.length" class="text-sm text-gray-dark-25 dark:text-gray-main">{{ t('system.noAdapters') }}</p>
      <template v-else>
        <ul class="divide-y divide-gray-light-10/60 dark:divide-white/5">
          <li v-for="adapter in adapterStatus.adapters" :key="adapter.id" class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
            <div class="min-w-0">
              <p class="truncate font-medium text-gray-dark-40 dark:text-white">{{ adapter.id }}</p>
              <p class="text-xs text-gray-dark-25 dark:text-gray-main">
                {{ adapter.protocol }} · {{ adapter.mode }} · {{ t('system.adapterDevices', { count: adapter.devices }) }}
              </p>
              <p v-if="adapter.health?.message" class="text-xs text-red-600 dark:text-red-300">{{ adapter.health.message }}</p>
            </div>
            <span class="rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide" :class="adapterHealthClass(adapter)">
              {{ adapter.health?.status ?? 'unknown' }}
            </span>
          </li>
        </ul>
        <p class="mt-3 text-xs text-gray-dark-25 dark:text-gray-main">
          {{ t('system.adapterQueue', {
            pending: adapterStatus.queue.pending,
            inFlight: adapterStatus.queue.inFlight,
            failed: adapterStatus.queue.failed,
            timedOut: adapterStatus.queue.timedOut,
            rejected: adapterStatus.queue.rejected,
          }) }}
        </p>
      </template>
    </VCard>

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
interface IUpdateStateInfo { status: string; fromVersion: string; toVersion: string; at: number; error?: string }
interface IUpdateStatusInfo {
  enabled: boolean;
  current: string | null;
  releases: string[];
  state: IUpdateStateInfo | null;
  manifestSource?: string;
  selfUpdate: boolean;
}
interface IAdapterHealthInfo { status: string; message?: string; updatedAt?: number }
interface IAdapterInfo {
  id: string;
  protocol: string;
  mode: string;
  health?: IAdapterHealthInfo;
  devices: number;
}
interface IAdapterStatusInfo {
  status: string;
  adapters: IAdapterInfo[];
  queue: { pending: number; inFlight: number; completed: number; failed: number; rejected: number; timedOut: number; maxPending: number };
}
interface IUpdateCheckInfo {
  available: boolean;
  reason?: string;
  manifest?: { appVersion: string };
  verification?: { ok: boolean; error?: string };
}

const { t } = useI18n();
const health = ref<IHealth | null>(null);
const metrics = ref<IMetrics | null>(null);
const logs = ref<ILogEntry[]>([]);
const backups = ref<string[]>([]);
const audit = ref<IAuditEntry[]>([]);
const adapterStatus = ref<IAdapterStatusInfo | null>(null);
const updateStatus = ref<IUpdateStatusInfo | null>(null);
const updateCheck = ref<IUpdateCheckInfo | null>(null);
const updateMessage = ref('');
const isCheckingUpdate = ref(false);
const isUpdating = ref(false);
const errorMessage = ref('');
const isBackingUp = ref(false);

const loadBackups = async () => {
  backups.value = (await api.get<{ backups: string[] }>('/system/backups')).backups;
};

const loadSystem = async () => {
  const [healthResponse, metricsResponse, logsResponse, auditResponse, updateResponse, adaptersResponse] = await Promise.all([
    api.get<IHealth>('/system/health'),
    api.get<IMetrics>('/system/metrics'),
    api.get<{ items: ILogEntry[] }>('/system/logs?limit=100'),
    api.get<{ entries: IAuditEntry[] }>('/system/audit?limit=50'),
    api.get<IUpdateStatusInfo>('/system/update'),
    api.get<IAdapterStatusInfo>('/adapters'),
  ]);
  health.value = healthResponse;
  metrics.value = metricsResponse;
  logs.value = logsResponse.items;
  audit.value = auditResponse.entries;
  updateStatus.value = updateResponse;
  adapterStatus.value = adaptersResponse;
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

const adapterHealthClass = (adapter: IAdapterInfo): string => {
  if (adapter.health?.status === 'ready') return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
  if (adapter.health?.status === 'error' || adapter.health?.status === 'degraded') {
    return 'bg-red-500/15 text-red-600 dark:text-red-300';
  }
  return 'bg-gray-dark-25/15 text-gray-dark-25 dark:text-gray-main';
};

const checkUpdate = async () => {
  isCheckingUpdate.value = true;
  updateMessage.value = '';
  try {
    const result = await api.post<IUpdateCheckInfo>('/system/update/check');
    updateCheck.value = result;
    updateMessage.value = result.available
      ? t('system.updateAvailable', { version: result.manifest?.appVersion ?? '' })
      : result.reason ?? t('system.updateUpToDate');
  } catch (error) {
    updateMessage.value = error instanceof Error ? error.message : t('system.loadError');
  } finally {
    isCheckingUpdate.value = false;
  }
};

const applyUpdate = async () => {
  if (!window.confirm(t('system.updateApplyConfirm'))) return;
  isUpdating.value = true;
  updateMessage.value = '';
  try {
    await api.post('/system/update/apply');
    updateMessage.value = t('system.updateScheduled');
  } catch (error) {
    updateMessage.value = error instanceof Error ? error.message : t('system.loadError');
  } finally {
    isUpdating.value = false;
  }
};

const rollbackUpdate = async () => {
  if (!window.confirm(t('system.updateRollbackConfirm'))) return;
  isUpdating.value = true;
  updateMessage.value = '';
  try {
    const result = await api.post<{ from: string | null; to: string }>('/system/update/rollback');
    updateMessage.value = t('system.updateRolledBack', { to: result.to });
  } catch (error) {
    updateMessage.value = error instanceof Error ? error.message : t('system.loadError');
  } finally {
    isUpdating.value = false;
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
