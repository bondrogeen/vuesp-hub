<template>
  <main class="flex-auto w-full max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: t('common.home'), path: '/' }, { name: t('common.devices') }]" class="mb-6" />

    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-dark-40 dark:text-white">{{ t('devices.title') }}</h1>
        <p class="mt-2 max-w-2xl text-sm text-gray-dark-25 dark:text-gray-main">{{ t('devices.subtitle') }}</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span class="glass-inset inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-gray-dark-25 dark:text-gray-light-10">
          <span class="h-2 w-2 rounded-full" :class="serviceRunning ? 'bg-emerald-500' : 'bg-red-500'"></span>
          {{ serviceRunning ? t('common.serviceRunning') : t('common.serviceStopped') }}
        </span>

        <VButton
          type="icon"
          color="blue"
          :loading="isScanning"
          :disabled="isScanning"
          :title="isScanning ? t('devices.scanning') : t('devices.scanNetwork')"
          :aria-label="isScanning ? t('devices.scanning') : t('devices.scanNetwork')"
          @click="scanDevices"
        >
          <IconSearch class="size-4" />
        </VButton>

        <VButton
          type="icon"
          color="gray"
          :disabled="!serviceRunning"
          :title="t('devices.restartService')"
          :aria-label="t('devices.restartService')"
          @click="restartService"
        >
          <IconUpdate class="size-4" />
        </VButton>
      </div>
    </div>

    <div v-if="errorMessage" role="alert" class="mb-4 rounded-md border border-red-400/50 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" role="status" class="mb-4 rounded-md border border-emerald-400/50 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-200">
      {{ successMessage }}
    </div>

    <CardMain v-if="hasScanned" :title="t('devices.discovered')" :loading="isScanning" class="mb-6">
      <div v-if="!foundDevices.length" class="py-8 text-center text-sm text-gray-dark-25 dark:text-gray-main">
        {{ t('devices.noNewDevices') }}
      </div>

      <ul v-else class="divide-y divide-gray-light-10 dark:divide-gray-dark-30">
        <li v-for="found in foundDevices" :key="found.ip" class="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <p class="truncate font-medium text-gray-dark-40 dark:text-white">{{ found.name }}</p>
            <p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-dark-25 dark:text-gray-main">
              <span>{{ found.ip }}</span>
              <span class="text-gray-light-10 dark:text-gray-dark-30">·</span>
              <span>{{ t('devices.deviceId', { id: found.deviceId }) }}</span>
              <span class="text-gray-light-10 dark:text-gray-dark-30">·</span>
              <span>{{ t('devices.firmware', { version: formatFirmware(found.firmware) }) }}</span>
            </p>
            <p v-if="isLegacyIdRegistered(found)" class="mt-1 text-xs text-amber-700 dark:text-amber-300">
              {{ t('devices.legacyWarning') }}
            </p>
          </div>

          <VButton color="blue" class="shrink-0" @click="openAddDialog(found)">{{ t('devices.addToHub') }}</VButton>
        </li>
      </ul>
    </CardMain>

    <section class="space-y-3">
      <div class="flex justify-end">
        <span class="text-xs text-gray-dark-25 dark:text-gray-main">{{ t('devices.total', { count: registeredDevices.length }) }}</span>
      </div>

      <div v-if="isLoading" class="py-10 text-center text-sm text-gray-dark-25 dark:text-gray-main">
        {{ t('common.refreshing') }}
      </div>

      <div v-else-if="!registeredDevices.length" class="py-10 text-center">
        <p class="text-sm font-medium text-gray-dark-40 dark:text-white">{{ t('devices.emptyTitle') }}</p>
        <p class="mt-1 text-sm text-gray-dark-25 dark:text-gray-main">{{ t('devices.emptyHint') }}</p>
      </div>

      <template v-else>
        <div class="hidden md:block">
          <VTable :headers="headers" :items="registeredDevices">
            <template #status="{ item }">
              <div class="h-5 w-1 rounded-full" :class="getStatus(item, devices)"></div>
            </template>

            <template #name="{ item }">
              <span class="font-medium text-gray-dark-40 dark:text-white">{{ item.name }}</span>
            </template>

            <template #ip="{ item }">
              <router-link :to="`/device/${item.ip}/`" class="text-cyan-main hover:underline" @click.stop="">{{ item.ip }}</router-link>
            </template>

            <template #action="{ item }">
              <div class="flex justify-end">
                <VDropdown left="unset" right="0" top="0">
                  <template #activator="{ on }">
                    <VButton type="icon" color="gray" class="flex" @click.stop="on.click($event)">
                      <IconDots class="size-5" />
                    </VButton>
                  </template>

                  <VList :list="getListMenu()" @click="onMenu($event, item)" />
                </VDropdown>
              </div>
            </template>
          </VTable>
        </div>

        <ul class="divide-y divide-gray-light-10 md:hidden dark:divide-gray-dark-30">
          <li v-for="item in registeredDevices" :key="item.id" class="flex items-center gap-3 py-4">
            <span class="h-8 w-1 shrink-0 rounded-full" :class="getStatus(item, devices)"></span>

            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-gray-dark-40 dark:text-white">{{ item.name }}</p>
              <p class="mt-1 truncate text-sm text-gray-dark-25 dark:text-gray-main">{{ item.ip }} · {{ t('devices.shortId', { id: item.deviceId }) }}</p>
            </div>

            <router-link :to="`/device/${item.ip}/`" class="rounded-md px-2 py-1 text-sm font-medium text-cyan-main hover:bg-blue-50 dark:hover:bg-blue-950/40">{{ t('common.open') }}</router-link>
            <button type="button" :disabled="removingId === item.id" class="rounded-md px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/40" @click="confirmRemove(item)">
              {{ removingId === item.id ? t('common.removing') : t('common.remove') }}
            </button>
          </li>
        </ul>
      </template>
    </section>

    <AppDialog v-if="selectedDevice" :title="t('devices.addDialogTitle')" size="sm" @close="selectedDevice = null">
      <DialogAddDevice :device="selectedDevice" @add="addDevice" />
    </AppDialog>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { BlockBreadcrumb as VBreadcrumb, CardMain, VButton, VDropdown, VList, VTable } from 'vuesp-components/components';

import AppDialog from '@/components/app/AppDialog.vue';
import DialogAddDevice from '@/components/device/DialogAddDevice.vue';
import legacyIcons from '@/components/app/legacyIcons.ts';
import { useAppStore } from '@/stores/AppStore';
import { useWebSocketStore } from '@/stores/WebSocketStore';
import { api } from '@/utils/helpers.ts';
import type { DeviceFormInput, DeviceRecord, DiscoveredDevice } from '@/types';
import type { DeviceListMenu, DeviceTableHeader } from './types.ts';
import { DeviceListAction } from './types.ts';

const webSocketStore = useWebSocketStore();
const appStore = useAppStore();
const router = useRouter();
const { t } = useI18n();
const { IconDots, IconSearch, IconUpdate } = legacyIcons;
const { devices, serviceRunning } = storeToRefs(webSocketStore);

const headers: DeviceTableHeader[] = [
  { key: 'status', name: '', className: 'w-8' },
  { key: 'name', name: t('devices.tableName'), className: '' },
  { key: 'ip', name: t('devices.tableIp'), className: '' },
  { key: 'deviceId', name: t('devices.tableId'), className: '' },
  { key: 'action', name: '', className: '' },
];

const registeredDevices = ref<DeviceRecord[]>([]);
const foundDevices = ref<DiscoveredDevice[]>([]);
const selectedDevice = ref<DiscoveredDevice | null>(null);
const isLoading = ref(false);
const isScanning = ref(false);
const hasScanned = ref(false);
const removingId = ref<number | null>(null);
const errorMessage = ref('');
const successMessage = ref('');

const formatFirmware = (version: number[]): string =>
  version.length && version.some(value => value !== 0) ? version.join('.') : t('common.unknown');

const isLegacyIdRegistered = (device: DiscoveredDevice): boolean =>
  registeredDevices.value.some(saved => saved.deviceId === device.deviceId);

const getStatus = (device: DeviceRecord, states: Record<string, unknown>): string => {
  const ping = (states[String(device.deviceId)] as { PING?: { delta?: number } } | undefined)?.PING;
  const delta = typeof ping?.delta === 'number' ? ping.delta : Number.POSITIVE_INFINITY;
  return delta > 5000 ? 'bg-red-500' : 'bg-emerald-500';
};

const getListMenu = (): DeviceListMenu[] => [
  { name: t('common.remove'), type: DeviceListAction.REMOVE },
  { name: t('common.view'), type: DeviceListAction.VIEW },
];

const loadRegistry = async (): Promise<void> => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    registeredDevices.value = await api.get<DeviceRecord[]>('/device/');
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('devices.errors.load');
  } finally {
    isLoading.value = false;
  }
};

const scanDevices = async (): Promise<void> => {
  isScanning.value = true;
  hasScanned.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  try {
    const scanned = await api.get<DiscoveredDevice[]>('/device/scan/');
    const registeredIps = new Set(registeredDevices.value.map(device => device.ip));
    foundDevices.value = scanned.filter(device => !registeredIps.has(device.ip));
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('devices.errors.scan');
  } finally {
    isScanning.value = false;
  }
};

const openAddDialog = (device: DiscoveredDevice): void => {
  selectedDevice.value = { ...device };
  errorMessage.value = '';
};

const restartService = async (): Promise<void> => {
  try {
    if (serviceRunning.value) await webSocketStore.stopService();
    await webSocketStore.startService();
  } catch (error) {
    errorMessage.value = t('devices.errors.restart', { error: error instanceof Error ? error.message : String(error) });
  }
};

const addDevice = async (device: DeviceFormInput): Promise<void> => {
  errorMessage.value = '';
  successMessage.value = '';
  try {
    const added = await api.post<DeviceRecord>('/device/', { body: JSON.stringify(device) });
    registeredDevices.value = [...registeredDevices.value, added];
    foundDevices.value = foundDevices.value.filter(found => found.ip !== added.ip);
    selectedDevice.value = null;
    successMessage.value = t('devices.messages.added', { name: added.name });
    await restartService();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('devices.errors.add');
  }
};

const removeDevice = async (device: DeviceRecord): Promise<void> => {
  removingId.value = device.id;
  errorMessage.value = '';
  successMessage.value = '';
  try {
    await api.delete(`/device/${device.id}/`);
    registeredDevices.value = registeredDevices.value.filter(item => item.id !== device.id);
    successMessage.value = t('devices.messages.removed', { name: device.name });
    await restartService();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('devices.errors.remove');
  } finally {
    removingId.value = null;
  }
};

const confirmRemove = (device: DeviceRecord): void => {
  appStore.setDialog({
    value: true,
    title: t('devices.removeDialog.title'),
    message: t('devices.removeDialog.message', { name: device.name }),
    button: t('common.remove'),
    callback: () => void removeDevice(device),
  });
};

const onMenu = (event: DeviceListMenu, device: DeviceRecord): void => {
  if (event.type === DeviceListAction.REMOVE) {
    if (removingId.value === null) confirmRemove(device);
    return;
  }
  if (event.type === DeviceListAction.VIEW) {
    void router.push(`/device/${device.ip}/`);
  }
};

onMounted(async () => {
  await loadRegistry();
  webSocketStore.sendDeviceAll({ comm: 'INFO' });
});
</script>
