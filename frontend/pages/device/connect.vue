<template>
  <main class="mx-auto w-full max-w-(--breakpoint-2xl) flex-auto p-4 md:p-6">
    <VBreadcrumb :items="[{ name: 'Home', path: '/' }, { name: 'Devices', path: '/device/list/' }, { name: 'Connect device' }]" class="mb-6" />

    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Connect a device</h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Scan your local network for Vuesp devices, then add selected devices to this hub's SQLite registry.
      </p>
    </div>

    <div v-if="errorMessage" role="alert" class="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" role="status" class="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
      {{ successMessage }}
    </div>

    <VCardGray title="Devices found on your network" :loading="isScanning">
      <template #header>
        <VButton color="blue" :disabled="isScanning" @click="scanDevices">
          {{ isScanning ? 'Scanning…' : 'Scan network' }}
        </VButton>
      </template>

      <div v-if="!foundDevices.length" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        {{ hasScanned ? 'No new Vuesp devices were found. Check that your device is powered on and connected to the same network.' : 'Start a scan to find devices on your local network.' }}
      </div>

      <ul v-else class="divide-y divide-gray-200 dark:divide-gray-800">
        <li v-for="device in foundDevices" :key="device.ip" class="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <p class="truncate font-medium text-gray-900 dark:text-white">{{ device.name }}</p>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {{ device.ip }} <span class="px-1">·</span> Device ID {{ device.deviceId }} <span class="px-1">·</span> Firmware {{ formatFirmware(device.firmware) }}
            </p>
            <p v-if="registeredDevices.some(saved => saved.deviceId === device.deviceId)" class="mt-1 text-xs text-amber-700 dark:text-amber-300">
              This legacy device ID is already registered. Verify that this is a different device before adding it.
            </p>
          </div>
          <VButton color="blue" class="shrink-0" @click="openAddDialog(device)">Add to hub</VButton>
        </li>
      </ul>
    </VCardGray>

    <VCardGray title="Registered devices" class="mt-6" :loading="isLoadingRegistry">
      <div v-if="!registeredDevices.length" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        No devices have been added to this hub yet.
      </div>
      <ul v-else class="divide-y divide-gray-200 dark:divide-gray-800">
        <li v-for="device in registeredDevices" :key="device.uuid" class="flex items-center justify-between gap-4 py-4">
          <div class="min-w-0">
            <p class="truncate font-medium text-gray-900 dark:text-white">{{ device.name }}</p>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{{ device.ip }} <span class="px-1">·</span> Device ID {{ device.deviceId }}</p>
          </div>
          <VButton color="gray" :disabled="removingId === device.id" @click="removeDevice(device)">
            {{ removingId === device.id ? 'Removing…' : 'Remove' }}
          </VButton>
        </li>
      </ul>
    </VCardGray>

    <AppDialog v-if="selectedDevice" title="Add device to hub" size="sm" @close="selectedDevice = null">
      <DialogAddDevice :device="selectedDevice" @add="addDevice" />
    </AppDialog>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { BlockBreadcrumb as VBreadcrumb } from 'vuesp-components/components';

import AppDialog from '@/components/app/AppDialog.vue';
import VCardGray from '@/components/app/VCardGray.vue';
import DialogAddDevice from '@/components/device/DialogAddDevice.vue';
import { useWebSocketStore } from '@/stores/WebSocketStore';
import { api } from '@/utils/helpers.ts';
import type { DeviceFormInput, RegisteredDevice } from '@/types.ts';

interface DiscoveredDevice {
  command: number;
  deviceId: number;
  firmware: number[];
  ip: string;
  name: string;
}

const foundDevices = ref<DiscoveredDevice[]>([]);
const registeredDevices = ref<RegisteredDevice[]>([]);
const selectedDevice = ref<DiscoveredDevice | null>(null);
const isScanning = ref(false);
const isLoadingRegistry = ref(false);
const removingId = ref<number | null>(null);
const hasScanned = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const webSocketStore = useWebSocketStore();

const formatFirmware = (version: number[]) => version.length ? version.join('.') : 'unknown';

const loadRegistry = async () => {
  isLoadingRegistry.value = true;
  try {
    registeredDevices.value = await api.get('/device/') as RegisteredDevice[];
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not load registered devices.';
  } finally {
    isLoadingRegistry.value = false;
  }
};

const scanDevices = async () => {
  isScanning.value = true;
  hasScanned.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  try {
    const scanned = await api.get('/device/scan/') as DiscoveredDevice[];
    const registeredIps = new Set(registeredDevices.value.map(device => device.ip));
    foundDevices.value = scanned.filter(device => !registeredIps.has(device.ip));
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Network scan failed.';
  } finally {
    isScanning.value = false;
  }
};

const openAddDialog = (device: DiscoveredDevice) => {
  selectedDevice.value = { ...device };
  errorMessage.value = '';
};

const addDevice = async (device: DeviceFormInput) => {
  errorMessage.value = '';
  successMessage.value = '';
  try {
    const added = await api.post('/device/', { body: JSON.stringify(device) }) as RegisteredDevice;
    registeredDevices.value = [...registeredDevices.value, added];
    foundDevices.value = foundDevices.value.filter(found => found.ip !== added.ip);
    selectedDevice.value = null;
    successMessage.value = `${added.name} was added to this hub.`;
    try {
      await webSocketStore.restartService();
    } catch (error) {
      errorMessage.value = `Device saved, but the live connection was not refreshed: ${error instanceof Error ? error.message : 'service restart failed'}`;
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not add this device.';
  }
};

const removeDevice = async (device: RegisteredDevice) => {
  if (!window.confirm(`Remove ${device.name} from this hub?`)) return;
  removingId.value = device.id;
  errorMessage.value = '';
  successMessage.value = '';
  try {
    await api.delete(`/device/${device.id}/`);
    registeredDevices.value = registeredDevices.value.filter(item => item.id !== device.id);
    successMessage.value = `${device.name} was removed from this hub.`;
    try {
      await webSocketStore.restartService();
    } catch (error) {
      errorMessage.value = `Device removed, but the live connections were not refreshed: ${error instanceof Error ? error.message : 'service restart failed'}`;
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not remove this device.';
  } finally {
    removingId.value = null;
  }
};

onMounted(loadRegistry);
</script>
