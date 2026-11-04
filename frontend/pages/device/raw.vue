<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: t('common.home'), path: '/' }, { name: t('common.devices'), path: '/device/list/' }, { name: t('common.rawData') }]" class="mb-6" />

    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">{{ t('raw.title') }}</h1>
        <p class="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-400">
          {{ t('raw.subtitle') }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <span class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
          <span class="h-2 w-2 rounded-full" :class="serviceRunning ? 'bg-green-500' : 'bg-red-500'"></span>
          {{ serviceRunning ? t('common.serviceRunning') : t('common.serviceStopped') }}
        </span>

        <VButton color="gray" :disabled="isLoading" @click="loadRegistry">
          {{ isLoading ? t('common.refreshing') : t('common.refresh') }}
        </VButton>
      </div>
    </div>

    <div v-if="errorMessage" role="alert" class="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
      {{ errorMessage }}
    </div>

    <CardMain v-if="!rows.length" :title="t('common.devices')" :loading="isLoading">
      <p class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        {{ t('raw.empty') }}
      </p>
    </CardMain>

    <div v-else class="flex flex-col gap-6">
      <CardMain v-for="row in rows" :key="row.id" :title="row.name" :loading="isLoading">
        <template #header>
          <span class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <span class="h-2 w-2 rounded-full" :class="statusColor(row.state)"></span>
            {{ statusLabel(row.state) }}
          </span>
        </template>

        <dl class="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('raw.ip') }}</dt>
            <dd class="font-medium text-gray-900 dark:text-white">{{ row.ip || t('common.unknown') }}</dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('raw.deviceId') }}</dt>
            <dd class="font-medium text-gray-900 dark:text-white">{{ row.deviceId }}</dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('raw.uuid') }}</dt>
            <dd class="truncate font-medium text-gray-900 dark:text-white">{{ row.uuid || t('common.notRegistered') }}</dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('raw.structKeys') }}</dt>
            <dd class="font-medium text-gray-900 dark:text-white">{{ Object.keys(row.state).length }}</dd>
          </div>
        </dl>

        <pre class="scrollbar mt-4 max-h-[32rem] overflow-auto rounded-xl bg-gray-950 p-4 text-xs leading-5 text-gray-100">{{ pretty(row.state) }}</pre>

        <div class="mt-5 flex items-center justify-between gap-3">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('raw.messages') }}</h3>
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ t('common.shown', { count: eventsFor(row.id).length }) }}</span>
            <VButton color="gray" size="sm" @click="webSocketStore.clearEvents">{{ t('common.clear') }}</VButton>
          </div>
        </div>

        <p v-if="!eventsFor(row.id).length" class="py-4 text-sm text-gray-500 dark:text-gray-400">{{ t('raw.noMessages') }}</p>
        <div v-else class="scrollbar mt-2 max-h-80 overflow-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table class="w-full text-left text-xs">
            <thead class="sticky top-0 bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th class="px-3 py-2 font-medium">{{ t('raw.time') }}</th>
                <th class="px-3 py-2 font-medium">{{ t('raw.event') }}</th>
                <th class="px-3 py-2 font-medium">{{ t('raw.key') }}</th>
                <th class="px-3 py-2 font-medium">{{ t('raw.data') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
              <tr v-for="(event, index) in eventsFor(row.id)" :key="`${event.at}-${index}`" class="align-top">
                <td class="whitespace-nowrap px-3 py-2 font-mono text-gray-500 dark:text-gray-400">{{ formatTime(event.at) }}</td>
                <td class="whitespace-nowrap px-3 py-2">{{ event.event }}</td>
                <td class="whitespace-nowrap px-3 py-2">{{ event.key || '—' }}</td>
                <td class="max-w-[32rem] truncate px-3 py-2 font-mono" :title="compact(event.data)">{{ compact(event.data) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardMain>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { BlockBreadcrumb as VBreadcrumb, CardMain, VButton } from 'vuesp-components/components';

import { useWebSocketStore } from '@/stores/WebSocketStore';
import { api } from '@/utils/helpers.ts';
import type { DeviceRecord } from '@/types';
import type { RawDeviceRow, RawEvent } from './raw.types.ts';

const { t } = useI18n();
const webSocketStore = useWebSocketStore();
const { devices, events, serviceRunning } = storeToRefs(webSocketStore);

const registry = ref<DeviceRecord[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');

const rows = computed<RawDeviceRow[]>(() => {
  const result: RawDeviceRow[] = [];
  const seen = new Set<string>();

  for (const device of registry.value) {
    const id = String(device.deviceId);
    seen.add(id);
    result.push({
      id,
      name: device.name,
      ip: device.ip,
      deviceId: device.deviceId,
      uuid: device.uuid,
      state: (devices.value[id] ?? {}) as Record<string, unknown>,
    });
  }

  for (const [id, state] of Object.entries(devices.value)) {
    if (seen.has(id)) continue;
    const info = state.INFO as { name?: unknown } | undefined;
    result.push({
      id,
      name: typeof info?.name === 'string' && info.name ? info.name : t('raw.deviceName', { id }),
      ip: '',
      deviceId: Number(id),
      uuid: '',
      state,
    });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
});

const pingDelta = (state: Record<string, unknown>): number | undefined => {
  const ping = state.PING as { delta?: unknown } | undefined;
  return typeof ping?.delta === 'number' && Number.isFinite(ping.delta) ? ping.delta : undefined;
};

const statusLabel = (state: Record<string, unknown>): string => {
  const delta = pingDelta(state);
  if (delta === undefined) return t('common.noData');
  return delta <= 5000 ? t('common.online') : t('common.offline');
};

const statusColor = (state: Record<string, unknown>): string => {
  const delta = pingDelta(state);
  if (delta === undefined) return 'bg-gray-500';
  return delta <= 5000 ? 'bg-green-500' : 'bg-red-500';
};

const pretty = (state: Record<string, unknown>): string => JSON.stringify(state, null, 2);

const eventsByDevice = computed<Record<string, RawEvent[]>>(() => {
  const map: Record<string, RawEvent[]> = {};
  for (const event of events.value) {
    const id = String(event.id);
    (map[id] ??= []).push(event);
  }
  return map;
});

const eventsFor = (id: string): RawEvent[] => (eventsByDevice.value[id] ?? []).slice(-30).reverse();

const formatTime = (at: number): string => new Date(at).toLocaleTimeString();

const compact = (value: unknown): string => {
  if (value === undefined) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const loadRegistry = async (): Promise<void> => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    registry.value = await api.get<DeviceRecord[]>('/device/');
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('raw.errors.load');
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadRegistry);
</script>
