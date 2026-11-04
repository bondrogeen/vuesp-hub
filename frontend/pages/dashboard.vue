<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: t('common.home'), path: '/' }, { name: t('common.dashboard') }]" class="mb-6" />

    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">{{ t('dashboard.title') }}</h1>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ t('dashboard.subtitle') }}</p>
    </div>

    <div v-if="devices.length" class="grid grid-cols-1 gap-4">
      <CardMain v-for="device in devices" :key="device.id ?? device.ip" :title="device.name || device.ip" :loading="false">
        <dl class="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <div>
            <dt class="text-sm text-gray-500 dark:text-gray-400">{{ t('dashboard.ipAddress') }}</dt>
            <dd class="font-medium">{{ device.ip }}</dd>
          </div>
          <div>
            <dt class="text-sm text-gray-500 dark:text-gray-400">{{ t('dashboard.status') }}</dt>
            <dd class="font-medium">
              {{ device.online === null ? t('common.waitingForStatus') : device.online ? t('common.online') : t('common.offline') }}
            </dd>
          </div>
          <template v-if="device.info">
            <div v-for="[key, value] in Object.entries(device.info)" :key="key">
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ key }}</dt>
              <dd class="break-words font-medium">{{ formatValue(value) }}</dd>
            </div>
          </template>
        </dl>
      </CardMain>
    </div>
    <CardMain v-else :title="t('dashboard.devices')" :loading="false">
      <p class="text-gray-500 dark:text-gray-400">{{ t('dashboard.empty') }}</p>
    </CardMain>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { BlockBreadcrumb as VBreadcrumb, CardMain } from 'vuesp-components/components';

import { useWebSocketStore } from '@/stores/WebSocketStore.ts';

const { t } = useI18n();
const webSocketStore = useWebSocketStore();
const { devices: deviceStates, list } = storeToRefs(webSocketStore);

const devices = computed(() => list.value.map(device => {
  const state = device.id == null ? undefined : deviceStates.value[String(device.id)];
  const info = state?.INFO;
  const ping = state?.PING;
  const delta = typeof ping === 'object' && ping !== null && 'delta' in ping && typeof ping.delta === 'number'
    ? ping.delta
    : null;

  return {
    ...device,
    info: typeof info === 'object' && info !== null ? info : null,
    online: delta === null ? null : delta <= 5000,
  };
}));

const formatValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value) ?? String(value);
};
</script>
