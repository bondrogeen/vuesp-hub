<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: t('common.home'), path: '/' }, { name: t('common.dashboard') }]" class="mb-6" />

    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">{{ t('dashboard.title') }}</h1>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ t('dashboard.subtitle') }}</p>
    </div>

    <CardMain v-if="!sections.length" :title="t('dashboard.devices')" :loading="isLoading">
      <p class="text-gray-500 dark:text-gray-400">{{ t('dashboard.empty') }}</p>
    </CardMain>

    <template v-else>
      <section v-for="device in sections" :key="device.ip" class="mb-8 last:mb-0">
        <header class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div class="flex min-w-0 items-center gap-3">
            <h2 class="truncate text-lg font-semibold text-gray-900 dark:text-white">{{ device.name || device.ip }}</h2>

            <span class="glass-inset inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
              <span class="h-2 w-2 rounded-full" :class="statusColor(device.online)"></span>
              {{ statusLabel(device.online) }}
            </span>
          </div>

          <span class="text-xs text-gray-500 dark:text-gray-400">{{ device.ip }}</span>
        </header>

        <div v-if="device.items.length" class="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-4">
          <component
            :is="getComponent(tile.type)"
            v-for="(tile, index) in device.items"
            :key="`${tile.id}:${index}`"
            v-bind="tileProps(tile)"
            @setState="onSetState(device, tile, $event)"
          >
            <template #icon="{ icon }">
              <DeviceTileIcon :name="icon" />
            </template>
          </component>
        </div>

        <p v-else class="text-sm text-gray-500 dark:text-gray-400">{{ t('dashboard.noTiles') }}</p>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

import { computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import {
  BlockBreadcrumb as VBreadcrumb,
  CardButton,
  CardDate,
  CardDimmer,
  CardInfo,
  CardInput,
  CardList,
  CardMain,
} from 'vuesp-components/components';
import type { DashboardItem, ResolvedDashboardItem } from 'vuesp-dashboard-core';

import DeviceTileIcon from '@/components/dashboard/DeviceTileIcon.vue';
import { useWebSocketStore } from '@/stores/WebSocketStore';
import type { DeviceMain } from '@/stores/WebSocketStore';
import type { DeviceListItem } from '@/types';
import { buildTileCommands, resolveTiles } from '../../shared/dashboardTiles.ts';
import { isRecordValue } from '../../shared/device.ts';

const { t } = useI18n();
const webSocketStore = useWebSocketStore();
const { list, mains, serviceRunning } = storeToRefs(webSocketStore);

const cards: Record<string, Component> = {
  button: CardButton,
  date: CardDate,
  dimmer: CardDimmer,
  info: CardInfo,
  input: CardInput,
  list: CardList,
};

const getComponent = (type?: string): Component => cards[type ?? 'info'] ?? CardInfo;

// The tile id is only a key; passing it through would duplicate DOM ids across devices.
const tileProps = (tile: ResolvedDashboardItem): Omit<ResolvedDashboardItem, 'id'> => {
  const { id: _id, ...rest } = tile;
  return rest;
};

const statusColor = (online: boolean | null): string => {
  if (online === null) return 'bg-gray-400';
  return online ? 'bg-emerald-500' : 'bg-red-500';
};

const statusLabel = (online: boolean | null): string => {
  if (online === null) return t('common.waitingForStatus');
  return online ? t('common.online') : t('common.offline');
};

const mainFor = (device: DeviceListItem): DeviceMain => mains.value[device.ip] ?? { ports: {}, dallas: {}, slots: {} };

const isOnline = (main: DeviceMain): boolean | null => {
  const ping = isRecordValue(main.ping) ? main.ping : undefined;
  const delta = typeof ping?.delta === 'number' ? ping.delta : null;
  return delta === null ? null : delta <= 5000;
};

const sections = computed(() =>
  list.value.map(device => {
    const main = mainFor(device);
    return {
      ip: device.ip,
      name: device.name,
      online: isOnline(main),
      items: resolveTiles(device.list ?? [], main),
    };
  }),
);

const isLoading = computed(() => serviceRunning.value && !list.value.length);

const onSetState = (device: DeviceListItem, item: DashboardItem, value: unknown): void => {
  for (const command of buildTileCommands(item, value, mainFor(device))) {
    webSocketStore.sendDevice({ ip: device.ip, comm: command.comm, data: command.data }, ack => {
      if (ack.status !== 'success') console.warn(`Device command ${command.comm} failed for ${device.ip}: ${ack.message ?? ack.status}`);
    });
  }
};

const hasTiles = (): boolean => list.value.some(device => (device.list?.length ?? 0) > 0);

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const refreshTiles = async (): Promise<void> => {
  if (!serviceRunning.value || hasTiles()) return;

  // Devices connect asynchronously, so the first device:list response may
  // arrive before their dashboard configurations are loaded.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      await webSocketStore.getList();
    } catch {
      // The store reports the error; the page still renders the empty state.
    }
    if (hasTiles()) return;
    if (attempt < 5) await delay(800);
  }
};

const requestState = (): void => {
  if (!serviceRunning.value) return;
  webSocketStore.sendDeviceAll({ comm: 'INFO' });
  webSocketStore.sendDeviceAll({ comm: 'DEVICE' });
  webSocketStore.sendDeviceAll({ comm: 'PORT', data: { gpio: 0, command: 3 } });
};

onMounted(() => {
  void refreshTiles();
  requestState();
});

watch(serviceRunning, running => {
  if (!running) return;
  void refreshTiles();
  requestState();
});
</script>
