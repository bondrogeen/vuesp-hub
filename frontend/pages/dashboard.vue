<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <div v-if="devices.length" class="grid grid-cols-1 gap-4">
      <VCardGray v-for="device in devices" :key="device.id ?? device.ip" :title="device.name || device.ip">
        <dl class="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <div>
            <dt class="text-sm text-gray-500 dark:text-gray-400">IP address</dt>
            <dd class="font-medium">{{ device.ip }}</dd>
          </div>
          <div>
            <dt class="text-sm text-gray-500 dark:text-gray-400">Status</dt>
            <dd class="font-medium">
              {{ device.online === null ? 'Waiting for status' : device.online ? 'Online' : 'Offline' }}
            </dd>
          </div>
          <template v-if="device.info">
            <div v-for="[key, value] in Object.entries(device.info)" :key="key">
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ key }}</dt>
              <dd class="break-words font-medium">{{ formatValue(value) }}</dd>
            </div>
          </template>
        </dl>
      </VCardGray>
    </div>
    <VCardGray v-else title="Devices">
      <p class="text-gray-500 dark:text-gray-400">No devices are connected to the hub.</p>
    </VCardGray>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import VCardGray from '@/components/app/VCardGray.vue';
import { useWebSocketStore } from '@/stores/WebSocketStore.ts';

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
